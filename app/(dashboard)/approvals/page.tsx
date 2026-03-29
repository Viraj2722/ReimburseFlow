'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { mockCompany, mockExpenses, mockUsers } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/api';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useDashboardUser } from '@/components/layout/DashboardLayout';

export default function ApprovalsPage() {
  const { role } = useDashboardUser();

  // Load only pending expenses into state
  const [pendingApprovals, setPendingApprovals] = useState(() => 
    mockExpenses.filter(exp => exp.status === 'pending')
  );

  if (role === 'employee') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Approvals</h1>
        <p className="text-slate-600">Employees can track approval status from the Expenses page.</p>
      </div>
    );
  }

  // Functional approve/reject action
  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    // Find the original expense in the main mock data and update its status
    const expenseInDb = mockExpenses.find(e => e.id === id);
    if (expenseInDb) {
      expenseInDb.status = action;
    }
    
    // Remove the item from the local state to update the UI instantly
    setPendingApprovals(prev => prev.filter(e => e.id !== id));
    alert(`Expense has been ${action}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-600 mt-1">Review and manage expense requests from your team.</p>
      </div>

      {/* List content */}
      {pendingApprovals.length === 0 ? (
        <Card className="bg-success-50 border-success-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h2>
            <p className="text-slate-600">You have no pending expense approvals to review right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingApprovals.map(expense => {
            const employee = mockUsers.find(u => u.id === expense.employeeId);
            
            return (
              <Card key={expense.id} className="overflow-hidden border-l-4 border-l-warning-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* Request info */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                        {employee?.name.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{expense.description}</h3>
                        <p className="text-slate-600 flex items-center space-x-2">
                          <span>{employee?.name || 'Unknown Employee'}</span>
                          <span>•</span>
                          <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions & Currency Display */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
                      <div className="text-left lg:text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider text-right">Company Base ({mockCompany.currency})</p>
                        <p className="text-2xl font-bold text-primary-700">{formatCurrency(expense.amountInCompanyCurrency, mockCompany.currency)}</p>
                        {expense.currency !== mockCompany.currency && (
                            <p className="text-xs text-slate-500 mt-1 text-right flex items-center justify-end space-x-1"><AlertCircle className="w-3 h-3"/> <span>Submitted as {formatCurrency(expense.amount, expense.currency)}</span></p>
                        )}
                      </div>
                      <div className="flex space-x-3 w-full sm:w-auto">
                        <button onClick={() => handleAction(expense.id, 'rejected')} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 border border-danger-200 text-danger-700 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors font-medium">
                          <XCircle className="w-5 h-5" /><span>Reject</span>
                        </button>
                        <button onClick={() => handleAction(expense.id, 'approved')} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors shadow-sm font-medium">
                          <CheckCircle className="w-5 h-5" /><span>Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}