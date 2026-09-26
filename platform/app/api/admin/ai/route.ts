import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { getActor } from '@/lib/authz';
import { fail, ok, validationFail } from '@/lib/api-response';

const promptSchema = z.object({
  prompt: z.string().trim().min(2).max(500),
});

type CountRow = { value: number };
type StockRow = { sku: string; product: string; available: number };
type ProductRow = { product: string; quantity: number; revenue: number };

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  if (!['admin', 'manager', 'staff'].includes(actor.role)) {
    return fail('FORBIDDEN', 'Bạn không có quyền dùng trợ lý vận hành.', 403);
  }

  const parsed = promptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const [orders, backlog, revenue, customers, activePromotions, stock, top] =
    await Promise.all([
      env.DB.prepare(
        "SELECT COUNT(*) AS value FROM customer_orders WHERE created_at >= unixepoch('now', '-30 day') * 1000",
      ).first<CountRow>(),
      env.DB.prepare(
        "SELECT COUNT(*) AS value FROM customer_orders WHERE status IN ('confirmed', 'processing', 'ready_to_ship')",
      ).first<CountRow>(),
      env.DB.prepare(
        "SELECT COALESCE(SUM(grand_total_cents), 0) AS value FROM customer_orders WHERE payment_status IN ('paid', 'cod_pending') AND created_at >= unixepoch('now', '-30 day') * 1000",
      ).first<CountRow>(),
      env.DB.prepare(
        "SELECT COUNT(*) AS value FROM users WHERE status = 'active'",
      ).first<CountRow>(),
      env.DB.prepare(
        "SELECT COUNT(*) AS value FROM promotions WHERE status = 'active' AND starts_at <= ? AND ends_at >= ?",
      )
        .bind(Date.now(), Date.now())
        .first<CountRow>(),
      env.DB.prepare(
        `SELECT pv.sku, p.name AS product,
                (ii.on_hand - ii.reserved) AS available
         FROM inventory_items ii
         INNER JOIN product_variants pv ON pv.id = ii.variant_id
         INNER JOIN products p ON p.id = pv.product_id
         WHERE (ii.on_hand - ii.reserved) <= ii.reorder_point
         ORDER BY available ASC LIMIT 5`,
      ).all<StockRow>(),
      env.DB.prepare(
        `SELECT product_name AS product, SUM(quantity) AS quantity,
                SUM(total_cents) AS revenue
         FROM order_items GROUP BY product_name
         ORDER BY quantity DESC LIMIT 3`,
      ).all<ProductRow>(),
    ]);

  const snapshot = {
    orders30d: Number(orders?.value ?? 0),
    backlog: Number(backlog?.value ?? 0),
    revenue30d: Number(revenue?.value ?? 0),
    customers: Number(customers?.value ?? 0),
    activePromotions: Number(activePromotions?.value ?? 0),
    lowStock: stock.results,
    topProducts: top.results,
  };
  const normalized = parsed.data.prompt.toLocaleLowerCase('vi');

  if (/tồn kho|sắp hết|hết hàng|sku|nhập hàng/.test(normalized)) {
    const critical = snapshot.lowStock[0];
    return ok({
      headline: 'Ưu tiên bổ sung tồn kho',
      answer: snapshot.lowStock.length
        ? `Có ${snapshot.lowStock.length} SKU đang ở hoặc dưới điểm đặt hàng. ${critical.product} (${critical.sku}) chỉ còn ${critical.available} sản phẩm khả dụng. Nên tạo đề xuất nhập cho nhóm này trước khi tăng ngân sách quảng cáo.`
        : 'Chưa có SKU nào xuống dưới điểm đặt hàng. Tồn kho hiện đủ an toàn cho nhịp bán hiện tại.',
      insights: snapshot.lowStock.slice(0, 3).map((item) => ({
        label: item.sku,
        value: `${item.available} khả dụng`,
        tone: item.available <= 2 ? 'critical' : 'warning',
      })),
      actions: [
        { label: 'Mở quản lý tồn kho', href: '/admin/ton-kho' },
        { label: 'Xem báo cáo bán hàng', href: '/admin/bao-cao' },
      ],
      confidence: 0.96,
      grounded: true,
      generatedAt: new Date().toISOString(),
    });
  }

  if (/đơn|giao|đóng gói|xử lý|sla/.test(normalized)) {
    return ok({
      headline: 'Tình trạng xử lý đơn',
      answer: snapshot.backlog
        ? `Hiện có ${snapshot.backlog} đơn đang trong hàng đợi xác nhận, xử lý hoặc chờ lấy hàng. Tôi đề xuất ưu tiên đơn lâu nhất trước, sau đó gom theo trạng thái để giảm thời gian chuyển ngữ cảnh của đội vận hành.`
        : 'Không có đơn nào đang tồn trong hàng đợi vận hành. Đội có thể chuyển sang kiểm kê và chuẩn bị đóng gói cho đợt bán tiếp theo.',
      insights: [
        {
          label: 'Đơn 30 ngày',
          value: String(snapshot.orders30d),
          tone: 'neutral',
        },
        {
          label: 'Đang chờ xử lý',
          value: String(snapshot.backlog),
          tone: snapshot.backlog > 10 ? 'warning' : 'good',
        },
        {
          label: 'Tỷ lệ backlog',
          value: snapshot.orders30d
            ? `${Math.round((snapshot.backlog / snapshot.orders30d) * 100)}%`
            : '0%',
          tone: 'neutral',
        },
      ],
      actions: [
        { label: 'Mở hàng đợi đơn', href: '/admin/don-hang' },
        { label: 'Kiểm tra tồn kho', href: '/admin/ton-kho' },
      ],
      confidence: 0.94,
      grounded: true,
      generatedAt: new Date().toISOString(),
    });
  }

  if (/doanh thu|bán chạy|bán hàng|sản phẩm tốt/.test(normalized)) {
    const leader = snapshot.topProducts[0];
    return ok({
      headline: 'Hiệu suất bán hàng 30 ngày',
      answer: leader
        ? `Doanh thu ghi nhận là ${formatMoney(snapshot.revenue30d)}. ${leader.product} đang dẫn đầu với ${leader.quantity} sản phẩm và ${formatMoney(leader.revenue)} doanh thu. Có thể đặt sản phẩm này ở vị trí nổi bật nhưng cần kiểm tra tồn kho trước.`
        : `Doanh thu ghi nhận là ${formatMoney(snapshot.revenue30d)}. Chưa có đủ dữ liệu mặt hàng để xác định sản phẩm dẫn đầu.`,
      insights: snapshot.topProducts.map((item) => ({
        label: item.product,
        value: `${item.quantity} sp · ${formatMoney(item.revenue)}`,
        tone: 'good',
      })),
      actions: [
        { label: 'Mở báo cáo doanh thu', href: '/admin/bao-cao' },
        { label: 'Quản lý sản phẩm', href: '/admin/san-pham' },
      ],
      confidence: 0.92,
      grounded: true,
      generatedAt: new Date().toISOString(),
    });
  }

  if (/khuyến mãi|voucher|mã giảm|ưu đãi/.test(normalized)) {
    return ok({
      headline: 'Gợi ý vận hành khuyến mãi',
      answer: `Hiện có ${snapshot.activePromotions} chương trình đang hoạt động. Nên dùng FREESHIP để giảm rào cản ở đơn nhỏ, CHAONET cho khách mới và NET20 cho giỏ từ 1,5 triệu. Tránh chạy đồng thời ưu đãi sâu cho SKU tồn thấp.`,
      insights: [
        {
          label: 'Đang hoạt động',
          value: `${snapshot.activePromotions} chương trình`,
          tone: 'good',
        },
        {
          label: 'Khách hàng',
          value: String(snapshot.customers),
          tone: 'neutral',
        },
        {
          label: 'SKU tồn thấp',
          value: String(snapshot.lowStock.length),
          tone: snapshot.lowStock.length ? 'warning' : 'good',
        },
      ],
      actions: [
        { label: 'Mở trung tâm khuyến mãi', href: '/admin/khuyen-mai' },
        { label: 'Kiểm tra tồn kho trước', href: '/admin/ton-kho' },
      ],
      confidence: 0.9,
      grounded: true,
      generatedAt: new Date().toISOString(),
    });
  }

  return ok({
    headline: 'Tóm tắt điều hành',
    answer: `Trong 30 ngày gần nhất, cửa hàng ghi nhận ${snapshot.orders30d} đơn và ${formatMoney(snapshot.revenue30d)} doanh thu. Hiện có ${snapshot.backlog} đơn cần xử lý, ${snapshot.lowStock.length} SKU ở mức cảnh báo và ${snapshot.activePromotions} chương trình khuyến mãi đang chạy. Ưu tiên hôm nay là xử lý backlog trước SLA rồi bổ sung các SKU sắp hết.`,
    insights: [
      {
        label: 'Doanh thu 30 ngày',
        value: formatMoney(snapshot.revenue30d),
        tone: 'good',
      },
      {
        label: 'Đơn cần xử lý',
        value: String(snapshot.backlog),
        tone: snapshot.backlog > 10 ? 'warning' : 'neutral',
      },
      {
        label: 'SKU cảnh báo',
        value: String(snapshot.lowStock.length),
        tone: snapshot.lowStock.length ? 'warning' : 'good',
      },
    ],
    actions: [
      { label: 'Xem dashboard', href: '/admin' },
      { label: 'Mở hàng đợi đơn', href: '/admin/don-hang' },
      { label: 'Mở tồn kho', href: '/admin/ton-kho' },
    ],
    confidence: 0.93,
    grounded: true,
    generatedAt: new Date().toISOString(),
  });
}
