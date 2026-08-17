export const TRANSACTION_CATEGORIES = [
  'Sales',
  'Utilities',
  'Payroll',
  'Inventory',
  'Rent',
  'Marketing',
  'Transport',
  'Other',
];

export const INCOME_CATEGORIES = ['Sales', 'Other'];
export const EXPENSE_CATEGORIES = ['Utilities', 'Payroll', 'Inventory', 'Rent', 'Marketing', 'Transport', 'Other'];

export const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue'];

export const BUSINESS_TYPES = [
  'Retail',
  'Services',
  'Manufacturing',
  'Agriculture',
  'Technology',
  'Hospitality',
  'Other',
];

export const FUNDING_TYPES = ['Micro-loan', 'Business Loan', 'Grant'];

export const LOAN_STATUSES = ['Under Review', 'Approved', 'Rejected'];

export const STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Overdue: 'bg-brick-50 text-brick-700 ring-1 ring-inset ring-brick-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Rejected: 'bg-brick-50 text-brick-700 ring-1 ring-inset ring-brick-200',
  'Under Review': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
};
