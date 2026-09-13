'use client';

import dynamic from 'next/dynamic';

// next/dynamic with ssr:false MUST live inside a Client Component.
// AutoImport uses useStore (context) which must never run on the server.
const AutoImportClient = dynamic(
  () => import('@/components/AutoImport').then((m) => m.AutoImport),
  { ssr: false }
);

export function AutoImportWrapper() {
  return <AutoImportClient />;
}
