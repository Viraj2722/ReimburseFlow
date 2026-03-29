'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Mock user - replace with real auth
const currentUser = {
  name: 'Admin User',
  role: 'admin'
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout user={currentUser}>
      {children}
    </DashboardLayout>
  );
}