'use client';

import './globals.css';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>MT5 Terminal</title>
        <meta name="description" content="Professional Multi-Asset Trading Terminal" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%231f6feb'/><text x='16' y='22' font-size='16' text-anchor='middle' fill='white' font-weight='bold'>M5</text></svg>" />
      </head>
      <body className="bg-terminal-bg text-terminal-text">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
