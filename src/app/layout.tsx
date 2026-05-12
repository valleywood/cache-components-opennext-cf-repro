import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Nav } from '@/components/Nav';

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
              ...
            </nav>
          }
        >
          <Nav />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}
