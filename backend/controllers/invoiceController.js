const Invoice = require('../models/Invoice');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Generates a human-friendly, sequential-looking invoice number, e.g. INV-2026-0007
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({ invoiceNumber: new RegExp(`^INV-${year}-`) });
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}-${sequence}`;
};

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

// Marks any Pending invoice whose due date has passed as Overdue. Cheap to run on every read.
const autoFlagOverdue = async (userId) => {
  await Invoice.updateMany(
    { user: userId, status: 'Pending', dueDate: { $lt: new Date() } },
    { $set: { status: 'Overdue' } }
  );
};

// @desc    Get the logged-in user's invoices (optionally filtered by status)
// @route   GET /api/invoices?status=
// @access  Private (sme)
const getInvoices = asyncHandler(async (req, res) => {
  await autoFlagOverdue(req.user._id);

  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
  res.json({ count: invoices.length, invoices });
});

// @desc    Get a single invoice
// @route   GET /api/invoices/:id
// @access  Private (sme, owner only)
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json({ invoice });
});

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private (sme)
const createInvoice = asyncHandler(async (req, res) => {
  const { clientName, clientEmail, items, dueDate, notes, status } = req.body;

  if (!clientName || !items || !Array.isArray(items) || items.length === 0 || !dueDate) {
    res.status(400);
    throw new Error('Client name, at least one line item, and a due date are required');
  }

  for (const item of items) {
    if (!item.description || item.quantity === undefined || item.unitPrice === undefined) {
      res.status(400);
      throw new Error('Every line item needs a description, quantity and unit price');
    }
  }

  const invoiceNumber = await generateInvoiceNumber();
  const totalAmount = computeTotal(items);

  const invoice = await Invoice.create({
    user: req.user._id,
    invoiceNumber,
    clientName,
    clientEmail,
    items,
    totalAmount,
    dueDate,
    notes,
    status: status || 'Pending',
  });

  res.status(201).json({ invoice });
});

// @desc    Update an invoice (details or payment status)
// @route   PUT /api/invoices/:id
// @access  Private (sme, owner only)
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const { clientName, clientEmail, items, dueDate, notes, status } = req.body;

  if (clientName !== undefined) invoice.clientName = clientName;
  if (clientEmail !== undefined) invoice.clientEmail = clientEmail;
  if (dueDate !== undefined) invoice.dueDate = dueDate;
  if (notes !== undefined) invoice.notes = notes;
  if (status !== undefined) invoice.status = status;
  if (items !== undefined && Array.isArray(items) && items.length > 0) {
    invoice.items = items;
    invoice.totalAmount = computeTotal(items);
  }

  await invoice.save();

  res.json({ invoice });
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private (sme, owner only)
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  res.json({ message: 'Invoice deleted', id: req.params.id });
});

// @desc    Get invoice summary (counts + amounts by status) for the dashboard cards
// @route   GET /api/invoices/summary
// @access  Private (sme)
const getInvoiceSummary = asyncHandler(async (req, res) => {
  await autoFlagOverdue(req.user._id);

  const summary = await Invoice.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
  ]);

  const byStatus = { Paid: { count: 0, total: 0 }, Pending: { count: 0, total: 0 }, Overdue: { count: 0, total: 0 } };
  summary.forEach((entry) => {
    byStatus[entry._id] = { count: entry.count, total: entry.total };
  });

  res.json({
    byStatus,
    pendingInvoicesCount: byStatus.Pending.count + byStatus.Overdue.count,
    pendingInvoicesAmount: byStatus.Pending.total + byStatus.Overdue.total,
  });
});

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceSummary,
};
