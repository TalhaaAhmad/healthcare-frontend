'use client';

import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

interface PageLayoutProps {
  children: React.ReactNode;
  sections: NavSection[];
  portalName: string;
}

function getPageTitle(sections: NavSection[], pathname: string): string {
  for (const group of sections) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return item.label;
      }
    }
  }
  return 'Dashboard';
}

function getUserInitials(fullName?: string): string {
  if (!fullName) return 'U';
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PageLayout({ children, sections, portalName }: PageLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageTitle = getPageTitle(sections, pathname);

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">
      <Sidebar sections={sections} portalName={portalName} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Page Title */}
          <h1
            className="text-lg font-semibold text-[#333333]"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
          >
            {pageTitle}
          </h1>

          {/* Right Side: Book + User */}
          <div className="flex items-center gap-4">
            <Link
              href="/patient/appointments/book"
              className="px-4 py-2 bg-[#E500BB] text-white text-[11px] font-bold uppercase tracking-[2px] hover:bg-[#c400a0] transition-colors"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            >
              Book Appointment
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#E500BB] flex items-center justify-center text-white text-xs font-semibold">
                {getUserInitials(user?.full_name)}
              </div>
              {/* Name */}
              <span
                className="text-sm text-[#333333] hidden sm:block"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                {user?.full_name || 'Guest'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
