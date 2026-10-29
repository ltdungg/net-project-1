'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  CircleHelp,
  LayoutDashboard,
  ScrollText,
  Menu,
  Megaphone,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const navigation = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, management: true },
  { href: '/admin/ai', label: 'NÉT AI Copilot', icon: Sparkles, badge: 'AI' },
  { href: '/admin/san-pham', label: 'Sản phẩm', icon: Package },
  {
    href: '/admin/don-hang',
    label: 'Đơn hàng',
    icon: ShoppingCart,
    badge: '12',
  },
  { href: '/admin/van-chuyen', label: 'Vận chuyển', icon: Truck },
  { href: '/admin/ton-kho', label: 'Tồn kho', icon: Boxes, badge: '3' },
  { href: '/admin/khach-hang', label: 'Khách hàng', icon: Users },
  { href: '/admin/khuyen-mai', label: 'Khuyến mãi', icon: Megaphone, management: true },
  { href: '/admin/bao-cao', label: 'Báo cáo', icon: BarChart3, management: true },
  { href: '/admin/tai-chinh', label: 'Tài chính', icon: CircleDollarSign, management: true },
  { href: '/admin/cai-dat', label: 'Cài đặt', icon: Settings, management: true },
  { href: '/admin/nhat-ky', label: 'Nhật ký backend', icon: ScrollText, adminOnly: true },
];

function SidebarContent({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const canManage = role === 'manager' || role === 'admin';
  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <span className="font-heading text-3xl font-semibold tracking-[-0.06em]">
          NÉT<span className="text-accent">.</span>
        </span>
        <Badge className="bg-white/10 text-white">Admin</Badge>
      </div>
      <div className="px-4 pt-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/35">
          Trung tâm vận hành
        </p>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-4 pt-3"
        aria-label="Quản trị"
      >
        {navigation.filter((item) => (!item.management || canManage) && (!item.adminOnly || role === 'admin')).map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-white/12 text-white shadow-sm' : 'text-primary-foreground/62 hover:bg-white/8 hover:text-white'}`}
            >
              <item.icon className={`size-4 ${active ? 'text-accent' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-accent text-accent-foreground' : 'bg-white/8'}`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-primary-foreground/70 hover:bg-white/8 hover:text-white"
        >
          <Store className="size-4 text-accent" />
          <span className="flex-1">Xem cửa hàng</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </>
  );
}

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-primary text-primary-foreground lg:flex lg:flex-col">
        <SidebarContent role={role} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Đóng menu quản trị"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-primary text-primary-foreground shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-5 z-10 text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
              aria-label="Đóng menu"
            >
              <X />
            </Button>
            <SidebarContent role={role} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/92 px-4 backdrop-blur-xl sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu />
          </Button>
          <div className="hidden min-w-0 flex-1 items-center sm:flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm đơn hàng, SKU hoặc khách hàng…"
                aria-label="Tìm kiếm trong trang quản trị"
                className="h-10 w-full rounded-full border border-border bg-[#f3f5f2] pl-10 pr-16 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘ K
              </kbd>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Trung tâm trợ giúp">
              <CircleHelp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Thông báo mới"
            >
              <Bell />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-accent" />
            </Button>
            <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-sm font-semibold">{email}</p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {role} · Đang hoạt động
              </p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </div>
        </header>
        <main className="px-4 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
