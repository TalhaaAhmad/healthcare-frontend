'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Healthcare V2
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-600">{portalName}</span>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-500 hidden sm:inline">
                {user.full_name}
              </span>
            )}
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
