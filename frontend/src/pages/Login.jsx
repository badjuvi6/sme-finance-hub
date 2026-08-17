import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-paper">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">SME Finance Hub</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to manage your business finances</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-50 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-600">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
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
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-ink-100 bg-white/60 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">Demo accounts</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <button
              type="button"
              onClick={() => fillDemo('owner@goldencrustbakery.com', 'Password123!')}
              className="text-left text-ink-500 hover:text-emerald-700"
            >
              <span className="font-medium text-ink-700">Business owner</span> — owner@goldencrustbakery.com / Password123!
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@smefinancehub.com', 'Admin123!')}
              className="text-left text-ink-500 hover:text-emerald-700"
            >
              <span className="font-medium text-ink-700">Financial officer</span> — admin@smefinancehub.com / Admin123!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
