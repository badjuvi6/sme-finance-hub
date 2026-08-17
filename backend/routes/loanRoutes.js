const express = require('express');
const {
  createLoanApplication,
  getMyLoanApplications,
  getLoanApplicationById,
  getAllLoanApplications,
  updateLoanStatus,
} = require('../controllers/loanController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// SME routes
router.post('/', authorize('sme'), createLoanApplication);
router.get('/mine', authorize('sme'), getMyLoanApplications);

// Admin routes
router.get('/', authorize('admin'), getAllLoanApplications);
router.put('/:id/status', authorize('admin'), updateLoanStatus);

// Shared (owner or admin - enforced inside the controller)
router.get('/:id', getLoanApplicationById);

module.exports = router;
