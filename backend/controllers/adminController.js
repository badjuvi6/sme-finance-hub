const User = require('../models/User');
const LoanApplication = require('../models/LoanApplication');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get platform-wide overview stats for the admin dashboard
// @route   GET /api/admin/overview
// @access  Private (admin)
const getPlatformOverview = asyncHandler(async (req, res) => {
  const [totalSMEs, statusCounts, amountAgg, totalPlatformRevenueAgg] = await Promise.all([
    User.countDocuments({ role: 'sme' }),
    LoanApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    LoanApplication.aggregate([
      {
        $group: {
          _id: null,
          totalRequested: { $sum: '$requestedAmount' },
          approvedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$requestedAmount', 0] },
          },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalLoanRequests = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const byStatus = { 'Under Review': 0, Approved: 0, Rejected: 0 };
  statusCounts.forEach((s) => {
    byStatus[s._id] = s.count;
  });

  res.json({
    totalSMEs,
    totalLoanRequests,
    applicationsUnderReview: byStatus['Under Review'],
    applicationsApproved: byStatus.Approved,
    applicationsRejected: byStatus.Rejected,
    totalRequestedAmount: amountAgg[0]?.totalRequested || 0,
    totalApprovedAmount: amountAgg[0]?.approvedAmount || 0,
    totalPlatformRevenue: totalPlatformRevenueAgg[0]?.total || 0,
  });
});

// @desc    List all registered SMEs (for the admin to browse)
// @route   GET /api/admin/smes
// @access  Private (admin)
const getAllSMEs = asyncHandler(async (req, res) => {
  const smes = await User.find({ role: 'sme' }).sort({ createdAt: -1 });
  res.json({ count: smes.length, smes: smes.map((u) => u.toSafeObject()) });
});

module.exports = { getPlatformOverview, getAllSMEs };
