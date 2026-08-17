const LoanApplication = require('../models/LoanApplication');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Submit a new loan / grant application
// @route   POST /api/loans
// @access  Private (sme)
const createLoanApplication = asyncHandler(async (req, res) => {
  const {
    businessName,
    businessType,
    yearsInOperation,
    monthlyRevenue,
    requestedAmount,
    fundingType,
    purpose,
  } = req.body;

  if (
    !businessName ||
    !businessType ||
    yearsInOperation === undefined ||
    monthlyRevenue === undefined ||
    !requestedAmount ||
    !fundingType ||
    !purpose
  ) {
    res.status(400);
    throw new Error('All financing application fields are required');
  }

  const application = await LoanApplication.create({
    user: req.user._id,
    businessName,
    businessType,
    yearsInOperation,
    monthlyRevenue,
    requestedAmount,
    fundingType,
    purpose,
  });

  res.status(201).json({ application });
});

// @desc    Get the logged-in SME's own loan applications
// @route   GET /api/loans/mine
// @access  Private (sme)
const getMyLoanApplications = asyncHandler(async (req, res) => {
  const applications = await LoanApplication.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ count: applications.length, applications });
});

// @desc    Get a single loan application (owner or admin)
// @route   GET /api/loans/:id
// @access  Private
const getLoanApplicationById = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findById(req.params.id).populate(
    'user',
    'name email businessName businessType'
  );

  if (!application) {
    res.status(404);
    throw new Error('Loan application not found');
  }

  const isOwner = application.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden: you do not have access to this application');
  }

  res.json({ application });
});

// @desc    Get all loan applications, optionally filtered by status (for admin review queue)
// @route   GET /api/loans?status=
// @access  Private (admin)
const getAllLoanApplications = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const applications = await LoanApplication.find(filter)
    .populate('user', 'name email businessName businessType')
    .sort({ createdAt: -1 });

  res.json({ count: applications.length, applications });
});

// @desc    Update a loan application's status (Approve / Reject / Under Review) with optional notes
// @route   PUT /api/loans/:id/status
// @access  Private (admin)
const updateLoanStatus = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body;

  const validStatuses = ['Under Review', 'Approved', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const application = await LoanApplication.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Loan application not found');
  }

  application.status = status;
  if (reviewNotes !== undefined) application.reviewNotes = reviewNotes;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();

  await application.save();
  await application.populate('user', 'name email businessName businessType');

  res.json({ application });
});

module.exports = {
  createLoanApplication,
  getMyLoanApplications,
  getLoanApplicationById,
  getAllLoanApplications,
  updateLoanStatus,
};
