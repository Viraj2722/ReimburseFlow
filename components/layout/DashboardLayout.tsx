'use client';
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
 
type DashboardUser = { name: string; role: 'admin' | 'manager' | 'employee' };

const DashboardUserContext = React.createContext<DashboardUser | null>(null);

export function useDashboardUser() {
  const context = React.useContext(DashboardUserContext);
  if (!context) {
    throw new Error('useDashboardUser must be used within DashboardLayout');
  }
  return context;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: DashboardUser;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardUserContext.Provider value={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={user.role} />
        
        <div className="lg:ml-64">
          <Header onMenuClick={() => setSidebarOpen(true)} user={user} />
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardUserContext.Provider>
  );
};
