'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
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

interface SidebarProps {
  sections: NavSection[];
  portalName: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ sections, portalName, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="h-[60px] px-5 flex items-center justify-center border-b border-gray-200 shrink-0">
          <Link href="/" className="flex items-center justify-center h-full" onClick={() => setIsOpen(false)}>
            <Image
              src="/logo.png"
              alt="Zan Center"
              width={180}
              height={48}
              className="object-contain w-auto h-[48px]"
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sections.map((group) => (
            <div key={group.section} className="mb-4">
              {/* Section Label */}
              <div className="px-5 py-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6C7087]"
                  style={{
                    fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif",
                  }}
                >
                  {group.section}
                </span>
              </div>
              {/* Section Items */}
              <ul className="space-y-0">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${
                          isActive
                            ? 'text-[#E500BB] font-semibold'
                            : 'text-[#333333] hover:bg-[#F4F7FA] hover:text-[#E500BB]'
                        }`}
                        style={{
                          fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif",
                        }}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#E500BB]" />
                        )}
                        <span className="text-[#6C7087]">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-[2px] text-white bg-[#E500BB] hover:bg-[#c400a0] transition-colors"
            style={{
              fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif",
            }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
