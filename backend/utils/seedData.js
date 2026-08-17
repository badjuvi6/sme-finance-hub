/**
 * Seeds the database with a demo admin, two demo SME accounts, and realistic
 * transactions / invoices / loan applications so the UI works out of the box.
 *
 * Usage:
 *   npm run seed            -> wipes and re-seeds demo data
 *   npm run seed:destroy    -> removes demo data only
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const LoanApplication = require('../models/LoanApplication');

const DEMO_EMAILS = [
  'admin@smefinancehub.com',
  'owner@goldencrustbakery.com',
  'owner@accratechrepairs.com',
];

const monthsAgo = (n, day = 15) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d;
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const buildTransactions = (userId) => {
  const income = [3200, 4100, 3800, 4600, 5200, 4900];
  const utilities = [220, 240, 210, 260, 250, 230];
  const payroll = [1400, 1400, 1500, 1500, 1500, 1600];
  const inventory = [900, 1100, 800, 1250, 1000, 1150];

  const transactions = [];
  for (let i = 5; i >= 0; i -= 1) {
    const monthIndex = 5 - i;
    transactions.push(
      {
        user: userId,
        type: 'income',
        category: 'Sales',
        amount: income[monthIndex],
        description: 'Monthly sales revenue',
        date: monthsAgo(i, 5),
      },
      {
        user: userId,
        type: 'expense',
        category: 'Utilities',
        amount: utilities[monthIndex],
        description: 'Electricity and water bill',
        date: monthsAgo(i, 8),
      },
      {
        user: userId,
        type: 'expense',
        category: 'Payroll',
        amount: payroll[monthIndex],
        description: 'Staff salaries',
        date: monthsAgo(i, 28),
      },
      {
        user: userId,
        type: 'expense',
        category: 'Inventory',
        amount: inventory[monthIndex],
        description: 'Raw materials and stock restock',
        date: monthsAgo(i, 12),
      }
    );
  }

  // A few one-off entries to make the ledger feel real
  transactions.push(
    { user: userId, type: 'expense', category: 'Rent', amount: 650, description: 'Shop rent', date: monthsAgo(0, 3) },
    { user: userId, type: 'expense', category: 'Marketing', amount: 180, description: 'Social media ads', date: monthsAgo(1, 20) },
    { user: userId, type: 'income', category: 'Sales', amount: 750, description: 'Bulk order - corporate client', date: monthsAgo(0, 9) },
    { user: userId, type: 'expense', category: 'Transport', amount: 95, description: 'Delivery and logistics', date: monthsAgo(0, 6) }
  );

  return transactions;
};

const buildInvoices = (userId, prefix) => [
  {
    user: userId,
    invoiceNumber: `${prefix}-2026-0001`,
    clientName: 'Nova Retail Ltd.',
    clientEmail: 'accounts@novaretail.com',
    items: [
      { description: 'Bulk product order - 200 units', quantity: 1, unitPrice: 1450 },
      { description: 'Delivery and handling', quantity: 1, unitPrice: 80 },
    ],
    totalAmount: 1530,
    status: 'Paid',
    issueDate: monthsAgo(2, 4),
    dueDate: monthsAgo(1, 4),
    notes: 'Paid via bank transfer.',
  },
  {
    user: userId,
    invoiceNumber: `${prefix}-2026-0002`,
    clientName: 'Kessben Enterprises',
    clientEmail: 'finance@kessben.com',
    items: [{ description: 'Monthly supply contract', quantity: 1, unitPrice: 980 }],
    totalAmount: 980,
    status: 'Pending',
    issueDate: monthsAgo(0, 10),
    dueDate: daysFromNow(12),
    notes: '',
  },
  {
    user: userId,
    invoiceNumber: `${prefix}-2026-0003`,
    clientName: 'Sunrise Hospitality Group',
    clientEmail: 'procurement@sunrisehg.com',
    items: [
      { description: 'Custom order - premium package', quantity: 3, unitPrice: 210 },
      { description: 'Installation and setup', quantity: 1, unitPrice: 120 },
    ],
    totalAmount: 750,
    status: 'Overdue',
    issueDate: monthsAgo(2, 1),
    dueDate: monthsAgo(0, 20),
    notes: 'Second reminder sent.',
  },
  {
    user: userId,
    invoiceNumber: `${prefix}-2026-0004`,
    clientName: 'Everline Traders',
    clientEmail: 'orders@everlinetraders.com',
    items: [{ description: 'Standard order - 50 units', quantity: 1, unitPrice: 415 }],
    totalAmount: 415,
    status: 'Pending',
    issueDate: monthsAgo(0, 6),
    dueDate: daysFromNow(20),
    notes: '',
  },
];

const buildLoanApplications = (userId, businessName, businessType) => [
  {
    user: userId,
    businessName,
    businessType,
    yearsInOperation: 4,
    monthlyRevenue: 4600,
    requestedAmount: 15000,
    fundingType: 'Business Loan',
    purpose: 'Purchase of a second delivery vehicle to expand distribution capacity.',
    status: 'Under Review',
  },
  {
    user: userId,
    businessName,
    businessType,
    yearsInOperation: 4,
    monthlyRevenue: 4600,
    requestedAmount: 5000,
    fundingType: 'Micro-loan',
    purpose: 'Bridge working capital gap for seasonal inventory purchase.',
    status: 'Approved',
    reviewNotes: 'Strong repayment history and healthy cash flow. Approved at requested amount.',
    reviewedAt: monthsAgo(1, 15),
  },
  {
    user: userId,
    businessName,
    businessType,
    yearsInOperation: 4,
    monthlyRevenue: 4600,
    requestedAmount: 40000,
    fundingType: 'Grant',
    purpose: 'Expansion into a second retail location in a neighboring district.',
    status: 'Rejected',
    reviewNotes: 'Requested amount exceeds grant program ceiling for this business category.',
    reviewedAt: monthsAgo(2, 22),
  },
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing demo data...');
  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } });
  const demoUserIds = demoUsers.map((u) => u._id);
  await Transaction.deleteMany({ user: { $in: demoUserIds } });
  await Invoice.deleteMany({ user: { $in: demoUserIds } });
  await LoanApplication.deleteMany({ user: { $in: demoUserIds } });
  await User.deleteMany({ email: { $in: DEMO_EMAILS } });

  if (process.argv.includes('--destroy')) {
    console.log('Demo data removed. Exiting without re-seeding.');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('Creating demo users...');
  const admin = await User.create({
    name: 'Nana Adjei',
    email: 'admin@smefinancehub.com',
    password: 'Admin123!',
    role: 'admin',
    businessName: 'SME Finance Hub',
    businessType: 'Other',
    phone: '+233-20-000-0000',
  });

  const bakeryOwner = await User.create({
    name: 'Abena Mensah',
    email: 'owner@goldencrustbakery.com',
    password: 'Password123!',
    role: 'sme',
    businessName: 'Golden Crust Bakery',
    businessType: 'Retail',
    phone: '+233-24-111-2222',
  });

  const techOwner = await User.create({
    name: 'Kwabena Owusu',
    email: 'owner@accratechrepairs.com',
    password: 'Password123!',
    role: 'sme',
    businessName: 'Accra Tech Repairs',
    businessType: 'Technology',
    phone: '+233-27-333-4444',
  });

  console.log('Creating transactions...');
  await Transaction.insertMany(buildTransactions(bakeryOwner._id));
  await Transaction.insertMany(buildTransactions(techOwner._id));

  console.log('Creating invoices...');
  await Invoice.insertMany(buildInvoices(bakeryOwner._id, 'GCB'));
  await Invoice.insertMany(buildInvoices(techOwner._id, 'ATR'));

  console.log('Creating loan applications...');
  await LoanApplication.insertMany(
    buildLoanApplications(bakeryOwner._id, 'Golden Crust Bakery', 'Retail')
  );
  await LoanApplication.insertMany(
    buildLoanApplications(techOwner._id, 'Accra Tech Repairs', 'Technology')
  );
  // Mark the admin as reviewer on the already-decided applications for realism
  await LoanApplication.updateMany(
    { status: { $in: ['Approved', 'Rejected'] }, user: { $in: [bakeryOwner._id, techOwner._id] } },
    { $set: { reviewedBy: admin._id } }
  );

  console.log('\nSeed complete! Demo accounts:');
  console.log('  Admin  -> admin@smefinancehub.com / Admin123!');
  console.log('  SME 1  -> owner@goldencrustbakery.com / Password123!  (Golden Crust Bakery)');
  console.log('  SME 2  -> owner@accratechrepairs.com / Password123!  (Accra Tech Repairs)');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
