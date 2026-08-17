import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const emptyItem = () => ({ description: '', quantity: 1, unitPrice: '' });

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

export default function InvoiceForm({ onSubmit, onCancel, submitting }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }
    if (items.some((item) => !item.description.trim() || !item.unitPrice)) {
      setError('Every line item needs a description and unit price');
      return;
    }

    onSubmit({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      dueDate,
      notes: notes.trim(),
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="mb-1 block text-sm font-medium text-ink-600">
            Client name
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Nova Retail Ltd."
            className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="clientEmail" className="mb-1 block text-sm font-medium text-ink-600">
            Client email <span className="text-ink-300">(optional)</span>
          </label>
          <input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="accounts@client.com"
            className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-600">Line items</span>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-start gap-2 rounded-lg border border-ink-50 bg-paper-dark/30 p-2.5">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Item or service description"
                className="min-w-[10rem] flex-1 rounded-md border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                placeholder="Qty"
                className="num w-20 rounded-md border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                placeholder="Unit price"
                className="num w-28 rounded-md border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="rounded-md p-2 text-ink-300 hover:bg-brick-50 hover:text-brick-600 disabled:opacity-30"
                aria-label="Remove line item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-ink-600">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-end justify-between rounded-lg bg-paper-dark/50 px-3 py-2.5">
          <span className="text-sm font-medium text-ink-500">Total</span>
          <span className="num text-lg font-semibold text-ink-800">{formatCurrency(total)}</span>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-ink-600">
          Notes <span className="text-ink-300">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, bank details, etc."
          className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {error && <p className="text-sm text-brick-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
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
          {submitting ? 'Creating…' : 'Create invoice'}
        </button>
      </div>
    </form>
  );
}
