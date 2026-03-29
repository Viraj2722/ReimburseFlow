'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardUser } from '@/components/layout/DashboardLayout';

export default function ApprovalRulesPage() {
  const { role } = useDashboardUser();

  if (role !== 'admin') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Approval Rules</h1>
        <p className="text-slate-600">Only admins can configure approval rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Approval Rules</h1>
        <p className="text-slate-600 mt-1">Configure manager steps, sequence, and escalation rules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Rule (Default)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-700">
          <p>1. Direct manager approval (mandatory)</p>
          <p>2. Additional approvers in sequence (optional)</p>
          <p>3. Escalation threshold and specific approver support</p>
          <p className="text-sm text-slate-500">Connect this page to `approval_rules` and `approval_rule_approvers` tables for full CRUD.</p>
        </CardContent>
      </Card>
    </div>
  );
}
