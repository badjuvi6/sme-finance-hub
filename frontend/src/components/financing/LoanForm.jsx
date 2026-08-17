import { useState } from 'react';
import { BUSINESS_TYPES, FUNDING_TYPES } from '../../utils/constants';

const emptyForm = {
  businessName: '',
  businessType: BUSINESS_TYPES[0],
  yearsInOperation: '',
  monthlyRevenue: '',
  requestedAmount: '',
  fundingType: FUNDING_TYPES[0],
  purpose: '',
};

export default function LoanForm({ onSubmit, onCancel, submitting, defaultBusinessName }) {
  const [form, setForm] = useState({ ...emptyForm, businessName: defaultBusinessName || '' });
  const [errors, setErrors] = useState({});

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.businessName.trim()) nextErrors.businessName = 'Business name is required';
    if (form.yearsInOperation === '' || Number(form.yearsInOperation) < 0)
      nextErrors.yearsInOperation = 'Enter a valid number of years';
    if (form.monthlyRevenue === '' || Number(form.monthlyRevenue) < 0)
      nextErrors.monthlyRevenue = 'Enter your average monthly revenue';
    if (!form.requestedAmount || Number(form.requestedAmount) <= 0)
      nextErrors.requestedAmount = 'Enter an amount greater than 0';
    if (!form.purpose.trim()) nextErrors.purpose = 'Tell us what the financing will be used for';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      yearsInOperation: Number(form.yearsInOperation),
      monthlyRevenue: Number(form.monthlyRevenue),
      requestedAmount: Number(form.requestedAmount),
    });
  };

  const fieldClass = (hasError) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:ring-1 ${
      hasError
        ? 'border-brick-400 focus:border-brick-500 focus:ring-brick-500'
        : 'border-ink-100 focus:border-emerald-500 focus:ring-emerald-500'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="businessName" className="mb-1 block text-sm font-medium text-ink-600">
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={form.businessName}
            onChange={(e) => update('businessName', e.target.value)}
            className={fieldClass(errors.businessName)}
          />
          {errors.businessName && <p className="mt-1 text-xs text-brick-600">{errors.businessName}</p>}
        </div>
        <div>
          <label htmlFor="businessType" className="mb-1 block text-sm font-medium text-ink-600">
            Business type
          </label>
          <select
            id="businessType"
            value={form.businessType}
            onChange={(e) => update('businessType', e.target.value)}
            className={fieldClass(false)}
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="yearsInOperation" className="mb-1 block text-sm font-medium text-ink-600">
            Years in operation
          </label>
          <input
            id="yearsInOperation"
            type="number"
            min="0"
            step="1"
            value={form.yearsInOperation}
            onChange={(e) => update('yearsInOperation', e.target.value)}
            className={`num ${fieldClass(errors.yearsInOperation)}`}
          />
          {errors.yearsInOperation && <p className="mt-1 text-xs text-brick-600">{errors.yearsInOperation}</p>}
        </div>
        <div>
          <label htmlFor="monthlyRevenue" className="mb-1 block text-sm font-medium text-ink-600">
            Avg. monthly revenue
          </label>
          <input
            id="monthlyRevenue"
            type="number"
            min="0"
            step="0.01"
            value={form.monthlyRevenue}
            onChange={(e) => update('monthlyRevenue', e.target.value)}
            className={`num ${fieldClass(errors.monthlyRevenue)}`}
          />
          {errors.monthlyRevenue && <p className="mt-1 text-xs text-brick-600">{errors.monthlyRevenue}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fundingType" className="mb-1 block text-sm font-medium text-ink-600">
            Funding type
          </label>
          <select
            id="fundingType"
            value={form.fundingType}
            onChange={(e) => update('fundingType', e.target.value)}
            className={fieldClass(false)}
          >
            {FUNDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="requestedAmount" className="mb-1 block text-sm font-medium text-ink-600">
            Requested amount
          </label>
          <input
            id="requestedAmount"
            type="number"
            min="0"
            step="0.01"
            value={form.requestedAmount}
            onChange={(e) => update('requestedAmount', e.target.value)}
            className={`num ${fieldClass(errors.requestedAmount)}`}
          />
          {errors.requestedAmount && <p className="mt-1 text-xs text-brick-600">{errors.requestedAmount}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="purpose" className="mb-1 block text-sm font-medium text-ink-600">
          Purpose of financing
        </label>
        <textarea
          id="purpose"
          rows={3}
          value={form.purpose}
          onChange={(e) => update('purpose', e.target.value)}
          placeholder="Describe what this financing will be used for and how it supports your business"
          className={fieldClass(errors.purpose)}
        />
        {errors.purpose && <p className="mt-1 text-xs text-brick-600">{errors.purpose}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
