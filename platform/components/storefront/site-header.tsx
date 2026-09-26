'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { commerceRequest } from '@/lib/commerce-api-client';

const navItems = [
  { label: 'Nữ', href: '/san-pham?danh-muc=nu' },
  { label: 'Nam', href: '/san-pham?danh-muc=nam' },
  { label: 'Phụ kiện', href: '/san-pham?danh-muc=phu-kien' },
  { label: 'Hàng mới', href: '/san-pham?moi=true' },
  { label: 'Ưu đãi', href: '/san-pham?khuyen-mai=true', accent: true },
];

export function SiteHeader() {
  const { user, favoriteIds } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const favoriteCount = favoriteIds.length;

  useEffect(() => {
    function syncCart() {
      commerceRequest<{ itemCount?: number }>('/cart')
        .then((cart) => setCartCount(cart.itemCount ?? 0))
        .catch(() => setCartCount(0));
    }

    queueMicrotask(syncCart);
    window.addEventListener('net:cart-changed', syncCart);
    return () => {
      window.removeEventListener('net:cart-changed', syncCart);
    };
  }, [user]);

  return (
    <>
      <div className="bg-primary px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground sm:text-[11px] sm:tracking-[0.18em]">
        Miễn phí giao hàng từ 799.000đ
        <span className="mx-2 text-primary-foreground/35">•</span>
        Đổi size trong 30 ngày
        <span className="mx-2 hidden text-primary-foreground/35 sm:inline">
          •
        </span>
        <span className="hidden sm:inline">Hotline 1900 636 468</span>
      </div>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4 lg:gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label="Mở menu"
            >
              <Menu />
            </Button>
            <Link
              href="/"
              className="font-heading text-2xl font-semibold tracking-[-0.06em]"
              aria-label="NÉT Fashion - Trang chủ"
            >
              NÉT<span className="text-accent">.</span>
            </Link>
            <nav
              className="hidden items-center gap-6 text-sm font-medium lg:flex"
              aria-label="Điều hướng chính"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-6 transition-colors after:absolute after:inset-x-0 after:bottom-4 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100 ${item.accent ? 'text-accent' : 'hover:text-accent'}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="group relative py-6">
                <button className="flex items-center gap-1 hover:text-accent">
                  Khám phá <ChevronDown className="size-3.5" />
                </button>
                <div className="invisible absolute left-1/2 top-[64px] w-72 -translate-x-1/2 rounded-2xl border border-border bg-card p-3 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                  {[
                    ['Câu chuyện NÉT', '/cau-chuyen'],
                    ['Hướng dẫn chọn size', '/huong-dan-chon-size'],
                    ['Theo dõi đơn hàng', '/tai-khoan'],
                  ].map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      className="block rounded-xl px-4 py-3 hover:bg-secondary"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((value) => !value)}
              aria-expanded={searchOpen}
              aria-controls="site-search"
              aria-label="Tìm kiếm"
            >
              <Search />
            </Button>
            <Button
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="relative hidden sm:inline-flex"
              render={<Link href="/yeu-thich" />}
              aria-label={`Sản phẩm yêu thích: ${favoriteCount}`}
            >
              <Heart />
              {favoriteCount ? (
                <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {favoriteCount}
                </span>
              ) : null}
            </Button>
            <Button
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              render={<Link href="/tai-khoan" />}
              aria-label="Tài khoản"
            >
              <UserRound />
            </Button>
            <Link
              href={user ? '/tai-khoan' : '/dang-nhap'}
              className="ml-1 hidden rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/30 hover:bg-secondary xl:block"
            >
              {user ? user.fullName.split(' ').at(-1) : 'Thành viên'}
            </Link>
            <Button
              nativeButton={false}
              variant="ghost"
              size="icon"
              render={<Link href="/gio-hang" />}
              aria-label={`Giỏ hàng: ${cartCount} sản phẩm`}
              className="relative"
            >
              <ShoppingBag />
              {cartCount ? (
                <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {Math.min(cartCount, 9)}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
        {searchOpen ? (
          <div id="site-search" className="border-t border-border bg-card">
            <form
              action="/san-pham"
              className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8"
            >
              <Search className="size-5 text-muted-foreground" />
              <label htmlFor="global-search" className="sr-only">
                Tìm kiếm sản phẩm
              </label>
              <input
                id="global-search"
                name="q"
                placeholder="Tìm áo linen, đầm midi, phụ kiện…"
                className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" className="rounded-full px-5">
                Tìm kiếm
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(false)}
                aria-label="Đóng tìm kiếm"
              >
                <X />
              </Button>
            </form>
          </div>
        ) : null}
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Đóng menu"
          />
          <aside
            id="mobile-navigation"
            className="relative flex h-full w-[min(88vw,390px)] flex-col bg-background px-5 py-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-5">
              <Link
                href="/"
                className="font-heading text-3xl font-semibold tracking-[-0.06em]"
                onClick={() => setMenuOpen(false)}
              >
                NÉT<span className="text-accent">.</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <X />
              </Button>
            </div>
            <nav className="mt-5 flex flex-col" aria-label="Điều hướng mobile">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`border-b border-border/70 py-4 font-heading text-2xl font-semibold ${item.accent ? 'text-accent' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/cau-chuyen"
                onClick={() => setMenuOpen(false)}
                className="border-b border-border/70 py-4 font-heading text-2xl font-semibold"
              >
                Câu chuyện NÉT
              </Link>
            </nav>
            <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
              <Button
                nativeButton={false}
                variant="outline"
                className="h-11 rounded-full"
                render={<Link href="/yeu-thich" />}
              >
                <Heart /> Yêu thích
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                className="h-11 rounded-full"
                render={<Link href="/tai-khoan" />}
              >
                <UserRound /> Tài khoản
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Chưa có hồ sơ?{' '}
              <Link
                href="/dang-ky"
                onClick={() => setMenuOpen(false)}
                className="font-semibold text-accent"
              >
                Đăng ký thành viên
              </Link>
            </p>
          </aside>
        </div>
      ) : null}
    </>
  );
}
