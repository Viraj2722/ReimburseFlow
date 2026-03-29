'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { mockExpenses } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/api';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = mockExpenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Expenses</h1>
          <p className="text-slate-600 mt-1">Manage and track your reimbursement claims</p>
        </div>
        <button onClick={() => router.push('/expenses/new')} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium">
          <Plus className="w-5 h-5" />
          <span>New Expense</span>
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
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
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
                      <td className="py-4 px-6"><p className="text-slate-600">{new Date(expense.date).toLocaleDateString()}</p></td>
                      <td className="py-4 px-6"><p className="font-medium text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p></td>
                      <td className="py-4 px-6"><StatusBadge status={expense.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No expenses found matching your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}