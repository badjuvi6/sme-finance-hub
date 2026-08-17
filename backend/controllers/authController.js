const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Register a new user (SME owner by default)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, businessName, businessType, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with that email already exists');
  }

  // Only allow the "admin" role to be set through a trusted internal flow, never from public signup.
  const safeRole = role === 'admin' ? 'sme' : 'sme';

  const user = await User.create({
    name,
    email,
    password,
    businessName,
    businessType,
    phone,
    role: safeRole,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    user: user.toSafeObject(),
    token,
  });
});

// @desc    Authenticate user and return a token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id);

  res.json({
    user: user.toSafeObject(),
    token,
  });
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// @desc    Update the currently authenticated user's profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, businessName, businessType, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name !== undefined) user.name = name;
  if (businessName !== undefined) user.businessName = businessName;
  if (businessType !== undefined) user.businessType = businessType;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.json({ user: user.toSafeObject() });
});

module.exports = { registerUser, loginUser, getMe, updateMe };
