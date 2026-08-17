import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_TYPES } from '../utils/constants';

const initialForm = {
  name: '',
  email: '',
  password: '',
  businessName: '',
  businessType: BUSINESS_TYPES[0],
  phone: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-paper">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Create your account</h1>
          <p className="mt-1 text-sm text-ink-400">Start tracking your business finances in minutes</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-50 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink-600">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink-600">
                  Phone <span className="text-ink-300">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-600">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

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
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="businessType" className="mb-1 block text-sm font-medium text-ink-600">
                  Business type
                </label>
                <select
                  id="businessType"
                  value={form.businessType}
                  onChange={(e) => update('businessType', e.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-brick-50 px-3 py-2.5 text-sm text-brick-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
