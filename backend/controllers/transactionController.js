const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get the logged-in user's transactions (optionally filtered)
// @route   GET /api/transactions?type=&category=&from=&to=
// @access  Private (sme)
const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, from, to } = req.query;

  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ count: transactions.length, transactions });
});

// @desc    Get a single transaction by id
// @route   GET /api/transactions/:id
// @access  Private (sme, owner only)
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ transaction });
});

// @desc    Log a new income or expense transaction
// @route   POST /api/transactions
// @access  Private (sme)
const createTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, description, date } = req.body;

  if (!type || !category || amount === undefined) {
    res.status(400);
    throw new Error('Type, category and amount are required');
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    category,
    amount,
    description,
    date: date || Date.now(),
  });

  res.status(201).json({ transaction });
});

// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
// @access  Private (sme, owner only)
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  const { type, category, amount, description, date } = req.body;

  if (type !== undefined) transaction.type = type;
  if (category !== undefined) transaction.category = category;
  if (amount !== undefined) transaction.amount = amount;
  if (description !== undefined) transaction.description = description;
  if (date !== undefined) transaction.date = date;

  await transaction.save();

  res.json({ transaction });
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private (sme, owner only)
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.json({ message: 'Transaction deleted', id: req.params.id });
});

// @desc    Get aggregated financial summary for the dashboard cards + cash flow chart
// @route   GET /api/transactions/summary
// @access  Private (sme)
const getTransactionSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const totals = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const totalRevenue = totals.find((t) => t._id === 'income')?.total || 0;
  const totalExpenses = totals.find((t) => t._id === 'expense')?.total || 0;

  const categoryBreakdown = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  // Last 6 months of income vs expense, oldest first, for the cash flow chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthly = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthlyMap.set(key, { month: monthNames[d.getMonth()], income: 0, expense: 0 });
  }
  monthly.forEach((entry) => {
    const key = `${entry._id.year}-${entry._id.month}`;
    if (monthlyMap.has(key)) {
      monthlyMap.get(key)[entry._id.type] = entry.total;
    }
  });

  res.json({
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    categoryBreakdown,
    monthlyCashFlow: Array.from(monthlyMap.values()),
  });
});

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
};
