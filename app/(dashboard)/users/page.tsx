'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { mockUsers } from '@/lib/mock-data';
import { UserPlus, Edit2, Trash2, Shield } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);

  const handleAddUser = () => {
    alert('Add User modal will open here.');
  };

  const handleEditUser = (name: string) => {
    alert(`Edit User modal for ${name} will open here.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage employee accounts and roles</p>
        </div>
        <button onClick={handleAddUser} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium">
          <UserPlus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Direct Manager</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const manager = mockUsers.find(u => u.id === user.managerId);
                  
                  return (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize flex items-center w-max space-x-1 ${
                          user.role === 'admin' ? 'bg-primary-100 text-primary-700' :
                          user.role === 'manager' ? 'bg-warning-100 text-warning-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role === 'admin' && <Shield className="w-3 h-3"/>}
                          <span>{user.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {manager ? (
                          <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{manager.name}</span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">None assigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleEditUser(user.name)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-2 text-slate-400 hover:text-danger-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}