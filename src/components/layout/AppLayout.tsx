'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { StoreProvider, useStore } from '@/lib/store';
import { canAccessRoute, getDefaultRouteForRole } from '@/lib/permissions';

const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole } = useStore();

  const isPublicForm =
    pathname === '/survey' ||
    pathname.startsWith('/survey/') ||
    pathname === '/graduate-survey' ||
    pathname.startsWith('/graduate-survey/') ||
    pathname === '/absentees-form' ||
    pathname.startsWith('/absentees-form/');

  // Comprehensive RBAC Route Guard: ensure user only accesses routes permitted for their role
  useEffect(() => {
    if (isPublicForm) return; // Public student forms are accessible to anyone in any browser
    if (currentRole && !canAccessRoute(currentRole, pathname)) {
      const fallback = getDefaultRouteForRole(currentRole);
      router.replace(fallback);
    }
  }, [currentRole, pathname, router, isPublicForm]);

  // Standalone layout for public student forms (openable in any browser without login)
  if (isPublicForm) {
    const formTitle = pathname.includes('absentees') ? 'ABSENTEES FORM' : 'CAREER SURVEY';
    
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        {/* Background Ambient Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        {/* Branded Public Survey Header */}
        <header className="sticky top-0 z-30 w-full h-16 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 shadow-lg shadow-blue-500/20 shrink-0 ring-2 ring-blue-500/20">
              <img
                src="/logo-badge.jpg"
                alt="TIC360 Training Centre"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">TIC360</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {formTitle}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Unicom TIC Training Centre &amp; Blossom Trust Educational Foundation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Direct Student Access
            </span>
          </div>
        </header>

        {/* Public Main Content (centered, responsive, no admin sidebar offset) */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-4xl w-full mx-auto relative z-10 space-y-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 relative z-10 min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1850px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </StoreProvider>
  );
};

