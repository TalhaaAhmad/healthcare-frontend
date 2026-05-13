'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  portalName: string;
}

export function Sidebar({ items, portalName }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-100 flex flex-col z-50">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Zan Center"
            width={40}
            height={40}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span
              className="text-base font-semibold tracking-wide"
              style={{
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif",
                color: '#E500BB',
              }}
            >
              ZAN CENTER
            </span>
            <span
              className="text-[9px] uppercase tracking-[3px] text-[#6C7087]"
              style={{
                fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
              }}
            >
              {portalName}
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p
            className="text-xs uppercase tracking-[2px] text-[#6C7087] mb-1"
            style={{
              fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
            }}
          >
            Signed in as
          </p>
          <p
            className="text-sm font-semibold text-[#333333] truncate"
            style={{
              fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
            }}
          >
            {user.full_name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#FCE7EC] text-[#E500BB]'
                      : 'text-[#333333] hover:bg-[#F4F7FA] hover:text-[#E500BB]'
                  }`}
                  style={{
                    fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full px-4 py-3 text-xs font-bold uppercase tracking-[2px] text-white bg-[#001E42] hover:bg-[#002a5c] transition-colors"
          style={{
            fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
