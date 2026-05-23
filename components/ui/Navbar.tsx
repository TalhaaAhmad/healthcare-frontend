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
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Zan Center"
                width={180}
                height={50}
                className="object-contain h-[50px] w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            {user && (
              <span className="text-sm text-[#6C7087] hidden sm:inline mr-4" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
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
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", fontSize: '14px' }}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="ml-3 px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-white bg-[#E500BB] hover:bg-[#c400a0] transition-colors"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
