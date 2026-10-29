import Link from 'next/link';
import {
  ArrowUpRight,
  Camera,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';

const columns = [
  {
    title: 'Mua sắm',
    items: [
      ['Hàng mới', '/san-pham?moi=true'],
      ['Thời trang nữ', '/san-pham?danh-muc=nu'],
      ['Thời trang nam', '/san-pham?danh-muc=nam'],
      ['Phụ kiện', '/san-pham?danh-muc=phu-kien'],
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      ['Hướng dẫn chọn size', '/huong-dan-chon-size'],
      ['Giao hàng & đổi trả', '/cau-chuyen#cam-ket'],
      ['Theo dõi đơn hàng', '/tai-khoan'],
      ['Sản phẩm yêu thích', '/yeu-thich'],
      ['Đăng nhập / Đăng ký', '/dang-nhap'],
    ],
  },
  {
    title: 'Về NÉT',
    items: [
      ['Câu chuyện thương hiệu', '/cau-chuyen'],
      ['Cam kết chất liệu', '/cau-chuyen#chat-lieu'],
      ['Quản trị cửa hàng', '/admin'],
      ['Liên hệ', 'mailto:hello@netfashion.vn'],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-5 py-7 text-sm sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-12">
          <div className="flex items-center gap-3">
            <MapPin className="size-4 text-accent" />
            <span>42 Nguyễn Huệ, Quận 1, TP.HCM</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="size-4 text-accent" />
            <span>1900 636 468 · 09:00–21:00</span>
          </div>
          <Link
            href="mailto:hello@netfashion.vn"
            className="flex items-center gap-3 hover:text-white lg:justify-end"
          >
            hello@netfashion.vn <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_2fr] lg:px-12">
        <div>
          <p className="font-heading text-5xl font-semibold tracking-[-0.06em]">
            NÉT<span className="text-accent">.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/70">
            Thiết kế có chủ đích cho nhịp sống hiện đại — vừa vặn với người
            Việt, bền qua nhiều mùa và minh bạch từ chất liệu đến giá.
          </p>
          <div className="mt-7 flex gap-2">
            <Link
              href="#"
              className="flex size-10 items-center justify-center rounded-full border border-white/15 hover:bg-white/10"
              aria-label="Instagram"
            >
              <Camera className="size-4" />
            </Link>
            <Link
              href="#"
              className="flex size-10 items-center justify-center rounded-full border border-white/15 hover:bg-white/10"
              aria-label="Facebook"
            >
              <MessageCircle className="size-4" />
            </Link>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-primary-foreground/68">
                {column.items.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 text-xs text-primary-foreground/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>© 2026 NÉT Fashion. Bảo lưu mọi quyền.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white">
              Điều khoản
            </Link>
            <Link href="#" className="hover:text-white">
              Bảo mật
            </Link>
            <Link href="#" className="hover:text-white">
              Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
