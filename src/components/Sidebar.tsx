'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { href: '/trade/', label: 'Trade', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { href: '/market/', label: 'Market', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/portfolio/', label: 'Portfolio', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { href: '/history/', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`${collapsed ? 'w-16' : 'w-52'} bg-terminal-panel border-r border-terminal-border flex flex-col transition-all duration-200`}>
      <div className="h-14 flex items-center justify-between px-3 border-b border-terminal-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terminal-accent rounded flex items-center justify-center text-white font-bold text-xs">M5</div>
            <span className="font-bold text-sm">MT5 Terminal</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded hover:bg-terminal-hover text-terminal-muted hover:text-terminal-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
        </button>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname === item.href.replace(/\/$/, '');
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-terminal-accent/20 text-terminal-accent border-l-2 border-terminal-accent'
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
              }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-terminal-border p-3">
        {!collapsed && (
          <div className="text-xs text-terminal-muted">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </div>
            <div className="mt-1 opacity-60">v1.0.0</div>
          </div>
        )}
      </div>
    </div>
  );
}
