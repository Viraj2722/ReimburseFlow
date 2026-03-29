'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/api';
import { mockCompany, mockExpenses, mockUsers } from '@/lib/mock-data';
import { isThisMonth, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  // --- Dynamically calculate stats from mock data ---
  const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amountInCompanyCurrency, 0);
  const pendingApprovals = mockExpenses.filter(exp => exp.status === 'pending').length;
  const approvedThisMonth = mockExpenses.filter(exp => exp.status === 'approved' && isThisMonth(exp.date)).length;
  const rejectedCount = mockExpenses.filter(exp => exp.status === 'rejected').length;

  const stats = [
    { title: 'Total Expenses', value: formatCurrency(totalExpenses, mockCompany.currency), change: '+12.5%', icon: DollarSign, color: 'from-primary-500 to-primary-600' },
    { title: 'Pending Approvals', value: pendingApprovals.toString(), change: '-3', icon: Clock, color: 'from-warning-500 to-warning-600' },
    { title: 'Approved This Month', value: approvedThisMonth.toString(), change: '+8', icon: CheckCircle, color: 'from-success-500 to-success-600' },
    { title: 'Rejected', value: rejectedCount.toString(), change: '+1', icon: XCircle, color: 'from-danger-500 to-danger-600' },
  ];

  // --- Get recent expenses from mock data ---
  const recentExpenses = mockExpenses
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4)
    .map(expense => {
        const employee = mockUsers.find(u => u.id === expense.employeeId);
        return {
            ...expense,
            employeeName: employee?.name || 'Unknown',
        };
    });

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's your expense overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
              <CardContent className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">{stat.title}</span>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <span>Expense Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <p className="text-slate-400">Chart component goes here</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button onClick={() => router.push('/expenses/new')} className="w-full btn-primary flex items-center justify-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Submit Expense</span>
            </button>
            <button onClick={() => router.push('/approvals')} className="w-full btn-secondary flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Review Approvals</span>
            </button>
            <button onClick={() => router.push('/reports')} className="w-full btn-ghost flex items-center justify-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>View Reports</span>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <button onClick={() => router.push('/expenses')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{expense.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{expense.employeeName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{formatDistanceToNow(expense.date, { addSuffix: true })}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={expense.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
