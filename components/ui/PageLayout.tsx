'use client';

import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useState } from 'react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">
      <Sidebar sections={sections} portalName={portalName} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Left: Hamburger (mobile) + Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-[#E500BB] text-white shrink-0"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h1
              className="text-lg font-semibold text-[#333333]"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            >
              {pageTitle}
            </h1>
          </div>

          {/* Right Side: Book + User */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/patient/appointments/book"
              className="px-3 sm:px-4 py-2 bg-[#E500BB] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-[2px] hover:bg-[#c400a0] transition-colors whitespace-nowrap"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            >
              <span className="hidden sm:inline">Book Appointment</span>
              <span className="sm:hidden">Book</span>
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
