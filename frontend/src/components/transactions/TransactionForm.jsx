import { useState } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/constants';

const emptyForm = {
  type: 'income',
  category: 'Sales',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionForm({ onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type) => {
    const nextCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm((prev) => ({ ...prev, type, category: nextCategories[0] }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.amount || Number(form.amount) <= 0) {
      nextErrors.amount = 'Enter an amount greater than 0';
    }
    if (!form.date) {
      nextErrors.date = 'Select a date';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
            form.type === 'income'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-ink-100 text-ink-400 hover:border-ink-200'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
            form.type === 'expense'
              ? 'border-brick-600 bg-brick-50 text-brick-800'
              : 'border-ink-100 text-ink-400 hover:border-ink-200'
          }`}
        >
          Expense
        </button>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-ink-600">
          Category
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-ink-600">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          placeholder="0.00"
          className={`num w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:ring-1 ${
            errors.amount
              ? 'border-brick-400 focus:border-brick-500 focus:ring-brick-500'
              : 'border-ink-100 focus:border-emerald-500 focus:ring-emerald-500'
          }`}
        />
        {errors.amount && <p className="mt-1 text-xs text-brick-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium text-ink-600">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={form.date}
          onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:ring-1 ${
            errors.date
              ? 'border-brick-400 focus:border-brick-500 focus:ring-brick-500'
              : 'border-ink-100 focus:border-emerald-500 focus:ring-emerald-500'
          }`}
        />
        {errors.date && <p className="mt-1 text-xs text-brick-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink-600">
          Description <span className="text-ink-300">(optional)</span>
        </label>
        <input
          id="description"
          type="text"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="e.g. Weekly stock restock"
          className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save transaction'}
        </button>
      </div>
    </form>
  );
}
