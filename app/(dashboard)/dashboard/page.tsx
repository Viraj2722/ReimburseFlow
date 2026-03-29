'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/api';
import { isThisMonth, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/components/layout/DashboardLayout';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type DashboardExpense = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  amount_in_company_currency: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'partially_approved';
  expense_date: string;
  created_at: string;
  employee: {
    full_name: string;
  } | null;
};

type DashboardExpenseRow = Omit<DashboardExpense, 'employee'> & {
  employee: { full_name: string }[] | { full_name: string } | null;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const { role } = useDashboardUser();
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const [expenses, setExpenses] = useState<DashboardExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You are not logged in.');
        setLoading(false);
        return;
      }

      const { data: me, error: meError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (meError || !me) {
        setError('Could not load your profile.');
        setLoading(false);
        return;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('currency')
        .eq('id', me.company_id)
        .single();

      if (company?.currency) {
        setCompanyCurrency(company.currency);
      }

      const { data, error: expensesError } = await supabase
        .from('expenses')
        .select('id, description, amount, currency, amount_in_company_currency, status, expense_date, created_at, employee:users!expenses_employee_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (expensesError) {
        setError(expensesError.message);
        setLoading(false);
        return;
      }

      const normalized = ((data ?? []) as DashboardExpenseRow[]).map((row) => ({
        ...row,
        employee: Array.isArray(row.employee) ? (row.employee[0] ?? null) : row.employee,
      }));

      setExpenses(normalized);
      setLoading(false);
    };

    loadDashboardData();
  }, [supabase]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount_in_company_currency, 0);
  const pendingApprovals = expenses.filter(exp => exp.status === 'pending').length;
  const approvedThisMonth = expenses.filter(
    exp => exp.status === 'approved' && isThisMonth(new Date(exp.expense_date)),
  ).length;
  const rejectedCount = expenses.filter(exp => exp.status === 'rejected').length;

  const stats = [
    { title: 'Total Expenses', value: formatCurrency(totalExpenses, companyCurrency), change: `${expenses.length} total`, icon: DollarSign, color: 'from-primary-500 to-primary-600' },
    { title: 'Pending Approvals', value: pendingApprovals.toString(), change: 'Awaiting review', icon: Clock, color: 'from-warning-500 to-warning-600' },
    { title: 'Approved This Month', value: approvedThisMonth.toString(), change: 'Current month', icon: CheckCircle, color: 'from-success-500 to-success-600' },
    { title: 'Rejected', value: rejectedCount.toString(), change: 'Needs rework', icon: XCircle, color: 'from-danger-500 to-danger-600' },
  ];

  const recentExpenses = expenses.slice(0, 6);

  if (loading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load dashboard: {error}</p>;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here&apos;s your expense overview</p>
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
              <p className="text-slate-400">Trend chart can be added here after analytics API integration.</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {role === 'admin' ? 'Admin Actions' : role === 'manager' ? 'Manager Actions' : 'Employee Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button onClick={() => router.push('/expenses/new')} className="w-full btn-primary flex items-center justify-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>{role === 'admin' ? 'Create Expense' : 'Submit Expense'}</span>
            </button>

            {role !== 'employee' ? (
              <button onClick={() => router.push('/approvals')} className="w-full btn-secondary flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{role === 'admin' ? 'Override / Review Approvals' : 'Approve / Reject Expenses'}</span>
              </button>
            ) : null}

            {role === 'admin' ? (
              <button onClick={() => router.push('/users')} className="w-full btn-ghost flex items-center justify-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Manage Users & Roles</span>
              </button>
            ) : null}

            {role === 'admin' ? (
              <button onClick={() => router.push('/approval-rules')} className="w-full btn-ghost flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Configure Approval Rules</span>
              </button>
            ) : null}

            {role === 'employee' ? (
              <button onClick={() => router.push('/expenses')} className="w-full btn-secondary flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Track Approval Status</span>
              </button>
            ) : null}
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
                      <p className="text-sm text-slate-600">{expense.employee?.full_name ?? 'Unknown'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}</p>
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
