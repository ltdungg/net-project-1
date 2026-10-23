import { TestData, withDatabase } from './data';
import { config } from '../config';

export default async function setup() {
  for (const [url, status] of [[`${config.apiUrl}/actuator/health`, 'UP'], [`${config.baseUrl}/api/health`, 'healthy']]) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) }).catch(() => null);
    if (!response?.ok) throw new Error(`BLOCKED: ứng dụng chưa sẵn sàng tại ${url}. Xem HƯỚNG_DẪN_CHẠY_TEST.md.`);
    const body = await response.json() as { status?: string; data?: { status?: string } };
    if ((body.status ?? body.data?.status) !== status) throw new Error(`BLOCKED: health không hợp lệ tại ${url}`);
  }
  await withDatabase(async db => {
    const migration = await db.query('select max(version::int) as version from flyway_schema_history where success=true');
    if (migration.rows[0].version < 7) throw new Error('BLOCKED: cần migration V7.');
  });
  const fixture = new TestData();
  try {
    const sentinel = await fixture.product();
    const response = await fetch(`${config.baseUrl}/api/commerce/products/${sentinel.slug}`);
    const body = await response.json() as { data?: { id?: string } };
    if (!response.ok || body.data?.id !== sentinel.id) throw new Error('BLOCKED: BFF không trỏ tới DB E2E vừa kiểm tra.');
  } finally { await fixture.cleanup(); }
}
