'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardUser } from '@/components/layout/DashboardLayout';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type RuleRow = {
  id: string;
  name: string;
  is_manager_approver: boolean;
  minimum_approval_percentage: number | null;
};

type RuleApproverRow = {
  id: string;
  rule_id: string;
  approver_id: string;
  sequence: number;
};

type UserOption = {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
};

export default function ApprovalRulesPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { role } = useDashboardUser();
  const [companyId, setCompanyId] = useState('');
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [ruleApprovers, setRuleApprovers] = useState<RuleApproverRow[]>([]);
  const [approverOptions, setApproverOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    isManagerApprover: true,
    minimumApprovalPercentage: '100',
    approverIds: [] as string[],
  });

  const loadRules = useCallback(async () => {
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

    setCompanyId(me.company_id);

    const { data: availableApprovers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('company_id', me.company_id)
      .in('role', ['admin', 'manager'])
      .order('full_name', { ascending: true });

    if (usersError) {
      setError(usersError.message);
      setLoading(false);
      return;
    }

    setApproverOptions((availableApprovers ?? []) as UserOption[]);

    const { data: ruleRows, error: rulesError } = await supabase
      .from('approval_rules')
      .select('id, name, is_manager_approver, minimum_approval_percentage')
      .eq('company_id', me.company_id)
      .order('created_at', { ascending: false });

    if (rulesError) {
      setError(rulesError.message);
      setLoading(false);
      return;
    }

    const { data: approverRows, error: approversError } = await supabase
      .from('approval_rule_approvers')
      .select('id, rule_id, approver_id, sequence')
      .order('sequence', { ascending: true });

    if (approversError) {
      setError(approversError.message);
      setLoading(false);
      return;
    }

    setRules((ruleRows ?? []) as RuleRow[]);
    setRuleApprovers((approverRows ?? []) as RuleApproverRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const toggleApprover = (userId: string) => {
    setForm((prev) => {
      if (prev.approverIds.includes(userId)) {
        return { ...prev, approverIds: prev.approverIds.filter((id) => id !== userId) };
      }
      return { ...prev, approverIds: [...prev.approverIds, userId] };
    });
  };

  const handleCreateRule = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name) {
      setError('Rule name is required.');
      return;
    }

    if (!form.isManagerApprover && form.approverIds.length === 0) {
      setError('Select at least one approver when manager approver is disabled.');
      return;
    }

    setSaving(true);

    const percentage = Number(form.minimumApprovalPercentage);
    const minimumApprovalPercentage = Number.isNaN(percentage) ? null : percentage;

    const { data: createdRule, error: createRuleError } = await supabase
      .from('approval_rules')
      .insert({
        company_id: companyId,
        name: form.name,
        is_manager_approver: form.isManagerApprover,
        minimum_approval_percentage: minimumApprovalPercentage,
      })
      .select('id')
      .single();

    if (createRuleError || !createdRule) {
      setError(createRuleError?.message ?? 'Failed to create rule.');
      setSaving(false);
      return;
    }

    if (form.approverIds.length > 0) {
      const inserts = form.approverIds.map((approverId, index) => ({
        rule_id: createdRule.id,
        approver_id: approverId,
        sequence: index + 1,
      }));

      const { error: approverInsertError } = await supabase
        .from('approval_rule_approvers')
        .insert(inserts);

      if (approverInsertError) {
        setError(approverInsertError.message);
        setSaving(false);
        return;
      }
    }

    setMessage('Approval rule created successfully.');
    setForm({
      name: '',
      isManagerApprover: true,
      minimumApprovalPercentage: '100',
      approverIds: [],
    });
    await loadRules();
    setSaving(false);
  };

  const handleDeleteRule = async (ruleId: string) => {
    setError('');
    setMessage('');

    const { error: deleteApproversError } = await supabase
      .from('approval_rule_approvers')
      .delete()
      .eq('rule_id', ruleId);

    if (deleteApproversError) {
      setError(deleteApproversError.message);
      return;
    }

    const { error: deleteRuleError } = await supabase
      .from('approval_rules')
      .delete()
      .eq('id', ruleId);

    if (deleteRuleError) {
      setError(deleteRuleError.message);
      return;
    }

    setMessage('Rule deleted successfully.');
    await loadRules();
  };

  const getApproverNames = (ruleId: string) => {
    const rows = ruleApprovers.filter((row) => row.rule_id === ruleId).sort((a, b) => a.sequence - b.sequence);
    return rows
      .map((row) => {
        const user = approverOptions.find((opt) => opt.id === row.approver_id);
        return user ? `${row.sequence}. ${user.full_name}` : `${row.sequence}. Unknown`;
      })
      .join(' -> ');
  };

  if (role !== 'admin') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Approval Rules</h1>
        <p className="text-slate-600">Only admins can configure approval rules.</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-slate-600">Loading approval rules...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Approval Rules</h1>
        <p className="text-slate-600 mt-1">Configure manager steps, sequence, and escalation rules.</p>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {message ? <p className="text-green-600">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Create New Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateRule}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rule Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Miscellaneous Expenses"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="manager-approver"
                type="checkbox"
                checked={form.isManagerApprover}
                onChange={(e) => setForm((prev) => ({ ...prev, isManagerApprover: e.target.checked }))}
              />
              <label htmlFor="manager-approver" className="text-sm text-slate-700">
                Include direct manager as approver
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Minimum Approval Percentage</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.minimumApprovalPercentage}
                onChange={(e) => setForm((prev) => ({ ...prev, minimumApprovalPercentage: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Additional Approvers (in selected order)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {approverOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700 border rounded px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.approverIds.includes(option.id)}
                      onChange={() => toggleApprover(option.id)}
                    />
                    <span>{option.full_name} ({option.role})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <p className="text-slate-600">No approval rules yet.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-slate-600">
                  Manager approver: {rule.is_manager_approver ? 'Yes' : 'No'} | Min %: {rule.minimum_approval_percentage ?? 'N/A'}
                </p>
                <p className="text-sm text-slate-700">Approvers: {getApproverNames(rule.id) || 'None'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
