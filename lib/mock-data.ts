import { User, Expense, Company, ApprovalRule } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@company.com',
    name: 'Admin User',
    role: 'admin',
    companyId: 'company-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'manager@company.com',
    name: 'Manager User',
    role: 'manager',
    companyId: 'company-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-3',
    email: 'employee@company.com',
    name: 'Employee User',
    role: 'employee',
    managerId: 'user-2',
    companyId: 'company-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const currentUser: User = mockUsers[0];

export const mockCompany: Company = {
  id: 'company-1',
  name: 'Acme Corporation',
  currency: 'USD',
  countryCode: 'US',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    amount: 1250.50,
    currency: 'USD',
    amountInCompanyCurrency: 1250.50,
    category: 'travel',
    description: 'Flight to client meeting in NYC',
    date: new Date('2024-03-15'),
    status: 'pending',
    employeeId: 'user-3',
    companyId: 'company-1',
    approvals: [],
    comments: [],
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-16'),
  },
  {
    id: 'exp-2',
    amount: 75.00,
    currency: 'USD',
    amountInCompanyCurrency: 75.00,
    category: 'meals',
    description: 'Team lunch',
    date: new Date('2024-03-18'),
    status: 'approved',
    employeeId: 'user-3',
    companyId: 'company-1',
    approvals: [],
    comments: [],
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-19'),
  },
  {
    id: 'exp-3',
    amount: 200.00,
    currency: 'EUR',
    amountInCompanyCurrency: 218.00,
    category: 'accommodation',
    description: 'Hotel for conference',
    date: new Date('2024-04-01'),
    status: 'rejected',
    employeeId: 'user-3',
    companyId: 'company-1',
    approvals: [],
    comments: [
      {
        id: 'comment-1',
        expenseId: 'exp-3',
        userId: 'user-2',
        content: 'This expense is outside the approved budget for the conference.',
        createdAt: new Date('2024-04-02'),
      }
    ],
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-02'),
  },
  {
    id: 'exp-4',
    amount: 55.50,
    currency: 'USD',
    amountInCompanyCurrency: 55.50,
    category: 'transport',
    description: 'Taxi from airport',
    date: new Date('2024-03-15'),
    status: 'draft',
    employeeId: 'user-3',
    companyId: 'company-1',
    approvals: [],
    comments: [],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
];

export const mockApprovalRule: ApprovalRule = {
  id: 'rule-1',
  name: 'Standard Global Reimbursement Policy',
  companyId: 'company-1',
  isManagerApprover: true, // Step 1: Direct Manager
  approvers: [
    { userId: 'user-1', sequence: 2 }, // Step 2: Admin / Finance
  ],
  conditionalRules: {
    type: 'hybrid',
    percentageThreshold: 100,
    specificApproverId: 'user-1', // CFO auto-approval rule
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
