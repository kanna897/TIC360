import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import dynamic from 'next/dynamic';

// AutoImport uses useStore (client-only context) — must be dynamically imported
// with ssr:false to prevent "useStore must be used within StoreProvider" during
// Next.js static prerendering of /_not-found and other shell pages.
const AutoImport = dynamic(
  () => import('@/components/AutoImport').then((m) => m.AutoImport),
  { ssr: false }
);


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TIC360 - Training Centre & Blossom Trust MIS',
  description:
    'Student Lifecycle, Attendance Compliance, Assessments, and Post-Graduation Outcome Platform for Unicom TIC Training Centre & Blossom Trust.',
  icons: {
    icon: '/logo-badge.jpg',
    shortcut: '/logo-badge.jpg',
    apple: '/logo-badge.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AppLayout>{children}</AppLayout>
        <AutoImport />
      </body>
    </html>
  );
}
