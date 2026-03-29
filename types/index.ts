export type UserRole = 'admin' | 'manager' | 'employee';

export type ExpenseStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'partially_approved';

export type ExpenseCategory = 
  | 'travel' 
  | 'meals' 
  | 'accommodation' 
  | 'transport' 
  | 'office_supplies' 
  | 'entertainment' 
  | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managerId?: string;
  manager?: User;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  amountInCompanyCurrency: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  status: ExpenseStatus;
  employeeId: string;
  employee?: User;
  companyId: string;
  receiptUrl?: string;
  ocrData?: OCRData;
  approvals: Approval[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OCRData {
  merchantName?: string;
  amount?: number;
  date?: string;
  description?: string;
  expenseLines?: string[];
  expenseType?: string;
  currency?: string;
  rawText?: string;
}

export interface Approval {
  id: string;
  expenseId: string;
  approverId: string;
  approver?: User;
  status: 'pending' | 'approved' | 'rejected';
  sequence: number;
  comment?: string;
  decidedAt?: Date;
  createdAt: Date;
}

export interface Comment {
  id: string;
  expenseId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: Date;
}

export interface ApprovalRule {
  id: string;
  name: string;
  companyId: string;
  isManagerApprover: boolean;
  approvers: ApprovalRuleApprover[];
  conditionalRules?: ConditionalRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRuleApprover {
  userId: string;
  user?: User;
  sequence: number;
}

export type ConditionalRule =
  | {
      type: 'percentage';
      percentageThreshold: number;
    }
  | {
      type: 'specific_approver';
      specificApproverId: string;
      specificApprover?: User;
    }
  | {
      type: 'hybrid';
      percentageThreshold: number;
      specificApproverId: string;
      specificApprover?: User;
    };

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  name: string;
  code: string;
  currencies: Currency[];
}

export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface DashboardStats {
  totalExpenses: number;
  pendingApprovals: number;
  approvedAmount: number;
  rejectedCount: number;
  monthlyTrend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
}

export interface NotificationItem {
  id: string;
  type: 'approval_request' | 'expense_approved' | 'expense_rejected' | 'comment_added';
  title: string;
  message: string;
  expenseId?: string;
  read: boolean;
  createdAt: Date;
}