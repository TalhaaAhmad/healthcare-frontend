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

interface NavbarProps {
  items: NavItem[];
  portalName: string;
}

export function Navbar({ items, portalName }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px]">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Zan Center"
                width={48}
                height={48}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-wide" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif", color: '#E500BB' }}>
                  ZAN CENTER
                </span>
                <span className="text-[10px] uppercase tracking-[3px] text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                  {portalName}
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            {user && (
              <span className="text-sm text-[#6C7087] hidden sm:inline mr-4" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                {user.full_name}
              </span>
            )}
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname === item.href
                    ? 'text-[#E500BB]'
                    : 'text-[#000000] hover:text-[#E500BB]'
                }`}
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", fontSize: '14px' }}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="ml-3 px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-white bg-[#001E42] hover:bg-[#002a5c] transition-colors"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
