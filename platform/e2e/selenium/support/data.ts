import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { config } from '../config.ts';
import { withDatabase } from '../../support/database.ts';
import scenarios from '../data/scenarios.json' with { type: 'json' };

export { withDatabase };
export const data = scenarios;

export async function clearCatalogCache() {
  const redis = createClient({ url: config.redisUrl, socket: { reconnectStrategy: false, connectTimeout: 5000 } });
  redis.on('error', () => {});
  await redis.connect();
  try { await redis.del('catalog::active'); } finally { await redis.quit(); }
}

export type Product = { id: string; slug: string; name: string; variant: string; inventory: string; price: number };
export type Account = { email: string; password: string; id: string; token: string };

// UUID namespace is recorded before any write, so partially failed setup is also removable.
export class TestData {
  readonly id: string;
  readonly password = config.password ?? `Qa1!${randomUUID().replaceAll('-', '')}`;
  readonly emails: string[] = [];
  readonly cartTokens = new Set<string>();
  private productIndex = 0;

  constructor(id = `sel${randomUUID().replaceAll('-', '')}`) {
    if (!/^sel[0-9a-f]{32}$/.test(id)) throw new Error('Namespace test không hợp lệ');
    this.id = id;
  }

  email() {
    const email = `${this.id}-${this.emails.length}@example.test`;
    this.emails.push(email);
    return email;
  }

  async api<T>(route: string, body: unknown): Promise<T> {
    const response = await fetch(`${config.apiUrl}/api${route}`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: config.baseUrl },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json() as { error?: { code?: string }; data: T };
    if (!response.ok) throw new Error(`Fixture ${route}: HTTP ${response.status} ${payload.error?.code ?? ''}`);
    return payload.data as T;
  }

  async account(options: { verified?: boolean; admin?: boolean } = {}): Promise<Account> {
    const email = this.email();
    const result = await this.api<{ userId: string; developmentVerificationToken: string }>('/auth/register', {
      email, password: this.password, fullName: data.customer.fullName,
      phone: data.customer.phone, acceptedTerms: true, marketingConsent: false,
    });
    if (!result.developmentVerificationToken) throw new Error('Cần APP_ENV=local; không có development token.');
    await withDatabase(async db => {
      // Fixture only: UI verification itself is covered separately, without bypassing it.
      if (options.verified !== false) await db.query(
        "update users set status='active',email_verified_at=now() where id=$1", [result.userId]);
      if (options.admin) await db.query(
        "insert into user_roles(user_id,role_id) select $1,id from roles where code in ('admin','manager','staff') on conflict do nothing", [result.userId]);
    });
    return { email, password: this.password, id: result.userId, token: result.developmentVerificationToken };
  }

  async product(options: { price?: number; stock?: number; status?: string } = {}): Promise<Product> {
    const id = `${this.id}p${this.productIndex++}`;
    const product = { id, slug: id, name: `Selenium ${id}`, variant: `${id}s`, inventory: `${id}is`, price: options.price ?? data.product.price };
    await withDatabase(async db => {
      await db.query('begin');
      try {
        await db.query(`insert into products(id,slug,name,description,material,status,published_at)
          values($1,$1,$2,'Sản phẩm kiểm thử tự động',$3,$4,now())`, [id, product.name, data.product.material, options.status ?? 'active']);
        await db.query(`insert into product_categories(product_id,category_id,is_primary)
          select $1,id,true from categories where name=$2 limit 1`, [id, data.product.category]);
        for (const [suffix, size, stock] of [['s','S', options.stock ?? data.product.stock], ['m','M',data.product.smallStock], ['l','L',0]] as const) {
          await db.query(`insert into product_variants(id,product_id,sku,size,color,color_hex,price_cents)
            values($1,$2,$1,$3,'Kem','#ead8bf',$4)`, [`${id}${suffix}`, id, size, product.price]);
          await db.query(`insert into inventory_items(id,warehouse_id,variant_id,on_hand)
            values($1,'wh-hcm',$2,$3)`, [`${id}i${suffix}`, `${id}${suffix}`, stock]);
        }
        await db.query('commit');
      } catch (error) { await db.query('rollback'); throw error; }
    });
    await clearCatalogCache();
    return product;
  }

  async voucher(kind: 'percentage' | 'free_shipping' | 'expired' | 'minimum' = 'percentage') {
    const id = `${this.id}v${randomUUID().slice(0, 6)}`;
    const code = id.toUpperCase();
    await withDatabase(async db => {
      await db.query(`insert into promotions(id,name,type,value,min_subtotal_cents,max_discount_cents,starts_at,ends_at,status)
        values($1,'Ưu đãi Selenium',$2,$3,$4,$5,now()-interval '2 days',
          now()+($6 * interval '1 day'),'active')`, [id, kind === 'free_shipping' ? kind : 'percentage',
        kind === 'free_shipping' ? 0 : data.voucher.percentage,
        kind === 'minimum' ? 1500000 : kind === 'free_shipping' ? data.voucher.shippingMinimum : data.voucher.minimum,
        data.voucher.maximum, kind === 'expired' ? -1 : 1]);
      await db.query('insert into coupons(id,promotion_id,code) values($1,$1,$2)', [id, code]);
    });
    return code;
  }

  async orders() {
    return withDatabase(async db => (await db.query(
      'select * from customer_orders where email=any($1::text[]) order by created_at', [this.emails])).rows);
  }

  async cleanup() {
    await withDatabase(async db => {
      await db.query('begin');
      try {
        const products = (await db.query('select id from products where slug like $1', [`${this.id}%`])).rows.map(r => r.id);
        const variants = (await db.query('select id from product_variants where product_id=any($1::text[])', [products])).rows.map(r => r.id);
        const inventories = (await db.query('select id from inventory_items where variant_id=any($1::text[])', [variants])).rows.map(r => r.id);
        const users = (await db.query('select id from users where email=any($1::text[])', [this.emails])).rows.map(r => r.id);
        const orders = (await db.query(`select distinct o.id from customer_orders o left join order_items i on i.order_id=o.id
          where o.email=any($1::text[]) or i.variant_id=any($2::text[])`, [this.emails, variants])).rows.map(r => r.id);
        const fulfillments = (await db.query('select id from fulfillments where order_id=any($1::text[])', [orders])).rows.map(r => r.id);
        const operations = (await db.query('select distinct operation_id as id from inventory_operation_items where variant_id=any($1::text[])', [variants])).rows.map(r => r.id);
        const payments = (await db.query('select id from payments where order_id=any($1::text[])', [orders])).rows.map(r => r.id);
        const aggregateIds = [...products, ...variants, ...inventories, ...users, ...orders, ...fulfillments, ...operations, ...payments];
        await db.query('delete from audit_logs where actor_user_id=any($1::text[]) or entity_id=any($2::text[])', [users, aggregateIds]);
        await db.query('delete from outbox_events where aggregate_id=any($1::text[])', [aggregateIds]);
        await db.query('delete from fulfillment_events where fulfillment_id=any($1::text[])', [fulfillments]);
        await db.query('delete from fulfillment_items where fulfillment_id=any($1::text[])', [fulfillments]);
        await db.query('delete from fulfillments where id=any($1::text[])', [fulfillments]);
        await db.query('delete from payment_events where payment_id=any($1::text[])', [payments]);
        await db.query('delete from payments where id=any($1::text[])', [payments]);
        // Private inventory is deleted below; shared seed stock is never modified by these tests.
        await db.query('delete from customer_orders where id=any($1::text[])', [orders]);
        await db.query(`delete from carts where guest_token=any($1::text[]) or user_id=any($2::text[])
          or id in (select cart_id from cart_items where variant_id=any($3::text[]))`, [[...this.cartTokens], users, variants]);
        await db.query('delete from inventory_movements where inventory_item_id=any($1::text[])', [inventories]);
        await db.query('delete from inventory_operations where id=any($1::text[])', [operations]);
        await db.query('delete from inventory_items where id=any($1::text[])', [inventories]);
        await db.query('delete from products where id=any($1::text[])', [products]);
        await db.query('delete from promotions where id like $1', [`${this.id}%`]);
        await db.query('delete from users where id=any($1::text[])', [users]);
        await db.query('commit');
      } catch (error) { await db.query('rollback'); throw error; }
    });
    await clearCatalogCache();
  }
}
