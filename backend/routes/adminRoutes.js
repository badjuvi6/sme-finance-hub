const express = require('express');
const { getPlatformOverview, getAllSMEs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', getPlatformOverview);
router.get('/smes', getAllSMEs);

module.exports = router;
