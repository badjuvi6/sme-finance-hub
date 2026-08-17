const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, 'Business type is required'],
      trim: true,
    },
    yearsInOperation: {
      type: Number,
      required: [true, 'Years in operation is required'],
      min: 0,
    },
    monthlyRevenue: {
      type: Number,
      required: [true, 'Average monthly revenue is required'],
      min: 0,
    },
    requestedAmount: {
      type: Number,
      required: [true, 'Requested amount is required'],
      min: [1, 'Requested amount must be greater than 0'],
    },
    fundingType: {
      type: String,
      enum: ['Micro-loan', 'Business Loan', 'Grant'],
      required: [true, 'Funding type is required'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of financing is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Under Review', 'Approved', 'Rejected'],
      default: 'Under Review',
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

loanApplicationSchema.index({ user: 1, createdAt: -1 });
loanApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
