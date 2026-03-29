'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/api';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useDashboardUser } from '@/components/layout/DashboardLayout';

type ExpenseRow = {
  id: string;
  description: string;
  category: 'travel' | 'meals' | 'accommodation' | 'transport' | 'office_supplies' | 'entertainment' | 'other';
  expense_date: string;
  amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'partially_approved';
  employee: {
    full_name: string;
  } | null;
};

type ExpenseDataRow = Omit<ExpenseRow, 'employee'> & {
  employee: { full_name: string }[] | { full_name: string } | null;
};

export default function ExpensesPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const { role } = useDashboardUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('expenses')
        .select('id, description, category, expense_date, amount, currency, status, employee:users!expenses_employee_id_fkey(full_name)')
        .order('expense_date', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const normalized = ((data ?? []) as ExpenseDataRow[]).map((row) => ({
        ...row,
        employee: Array.isArray(row.employee) ? (row.employee[0] ?? null) : row.employee,
      }));

      setExpenses(normalized);
      setLoading(false);
    };

    loadExpenses();
  }, [supabase]);

  const filteredExpenses = expenses.filter(exp => {
    const term = searchTerm.toLowerCase();
    return (
      exp.description.toLowerCase().includes(term) ||
      exp.category.toLowerCase().includes(term) ||
      (exp.employee?.full_name ?? '').toLowerCase().includes(term)
    );
  });

  const pageTitle = role === 'admin' ? 'All Expenses' : role === 'manager' ? 'Team Expenses' : 'My Expenses';
  const subtitle =
    role === 'admin'
      ? 'Review all company expense claims'
      : role === 'manager'
        ? 'Review your team expense claims'
        : 'Manage and track your reimbursement claims';

  if (loading) {
    return <p className="text-slate-600">Loading expenses...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load expenses: {error}</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-slate-600 mt-1">{subtitle}</p>
        </div>
        <button onClick={() => router.push('/expenses/new')} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium">
          <Plus className="w-5 h-5" />
          <span>{role === 'employee' ? 'New Expense' : 'Create Expense'}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search expenses by description or category..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="button" className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Local Filter</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Description</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Category</th>
                  {role !== 'employee' ? (
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Employee</th>
                  ) : null}
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="font-medium text-slate-900">{expense.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6"><span className="capitalize text-slate-600">{expense.category.replace('_', ' ')}</span></td>
                      {role !== 'employee' ? (
                        <td className="py-4 px-6"><p className="text-slate-600">{expense.employee?.full_name ?? 'Unknown'}</p></td>
                      ) : null}
                      <td className="py-4 px-6"><p className="text-slate-600">{new Date(expense.expense_date).toLocaleDateString()}</p></td>
                      <td className="py-4 px-6"><p className="font-medium text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p></td>
                      <td className="py-4 px-6"><StatusBadge status={expense.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={role !== 'employee' ? 6 : 5} className="py-8 text-center text-slate-500">No expenses found matching your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}