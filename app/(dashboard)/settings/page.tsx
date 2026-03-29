'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Save, Building, User } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useDashboardUser } from '@/components/layout/DashboardLayout';

type ProfileState = {
  fullName: string;
  email: string;
};

type CompanyState = {
  id: string;
  name: string;
  currency: string;
};

export default function SettingsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { role } = useDashboardUser();
  const [profile, setProfile] = useState<ProfileState>({ fullName: '', email: '' });
  const [company, setCompany] = useState<CompanyState>({ id: '', name: '', currency: 'USD' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
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
        .select('id, full_name, email, company_id')
        .eq('id', user.id)
        .single();

      if (meError || !me) {
        setError('Could not load your profile.');
        setLoading(false);
        return;
      }

      setProfile({
        fullName: me.full_name,
        email: me.email,
      });

      const { data: companyRow } = await supabase
        .from('companies')
        .select('id, name, currency')
        .eq('id', me.company_id)
        .single();

      if (companyRow) {
        setCompany({
          id: companyRow.id,
          name: companyRow.name,
          currency: companyRow.currency,
        });
      }

      setLoading(false);
    };

    loadSettings();
  }, [supabase]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setMessage('');
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You are not logged in.');
      setSavingProfile(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: profile.fullName })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSavingProfile(false);
      return;
    }

    setMessage('Personal profile updated successfully.');
    setSavingProfile(false);
  };

  const handleSaveCompany = async () => {
    if (role !== 'admin') {
      setError('Only admins can update company settings.');
      return;
    }

    setSavingCompany(true);
    setMessage('');
    setError('');

    const { error: updateError } = await supabase
      .from('companies')
      .update({ name: company.name, currency: company.currency })
      .eq('id', company.id);

    if (updateError) {
      setError(updateError.message);
      setSavingCompany(false);
      return;
    }

    setMessage('Company configuration updated successfully.');
    setSavingCompany(false);
  };

  if (loading) {
    return <p className="text-slate-600">Loading settings...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your personal profile and company preferences</p>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {message ? <p className="text-green-600">{message}</p> : null}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary-500" />
            <span>Personal Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input 
                type="text" 
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <input 
                type="email" 
                value={profile.email}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 text-slate-500"
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium disabled:opacity-60">
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary-500" />
            <span>Company Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Company Name</label>
              <input 
                type="text" 
                value={company.name}
                onChange={(e) => setCompany((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={role !== 'admin'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Base Currency</label>
              <select 
                value={company.currency}
                onChange={(e) => setCompany((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={role !== 'admin'}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleSaveCompany} disabled={savingCompany || role !== 'admin'} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium disabled:opacity-60">
              <Save className="w-4 h-4" />
              <span>{savingCompany ? 'Saving...' : 'Update Company Info'}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}