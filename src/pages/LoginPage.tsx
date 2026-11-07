import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, KeyRound, AlertOctagon } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Safe local relative redirect validator protecting against open redirects (CWE-601 / CVE-2025-68470)
function getSafeRedirectPath(rawPath?: string | null, fallback: string = '/'): string {
  if (!rawPath || typeof rawPath !== 'string') return fallback;
  const clean = rawPath.trim();
  if (
    clean.startsWith('/') &&
    !clean.startsWith('//') &&
    !clean.startsWith('/\\') &&
    !clean.includes('\\') &&
    !clean.includes(':')
  ) {
    return clean;
  }
  return fallback;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, requestPasswordReset } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const res = await login(normalizedEmail, password);
    setLoading(false);

    if (res.success) {
      const rawFrom = (location.state as { from?: string } | null)?.from;
      const safeFrom = getSafeRedirectPath(rawFrom, '/');

      // Role-based automatic redirection
      if (res.role === 'superadmin' || res.role === 'admin') {
        if (safeFrom.startsWith('/admin')) {
          navigate(safeFrom, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        // Ordinary Customer destination (blocked from admin routes)
        if (safeFrom && !safeFrom.startsWith('/admin')) {
          navigate(safeFrom, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } else {
      setError(res.message || 'Login failed. Please check credentials.');
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail(email.trim().toLowerCase());
    setResetSuccessMsg('');
    setResetModalOpen(true);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Validation Error', 'Please enter your email address.', 'error');
      return;
    }
    setResetLoading(true);
    const res = await requestPasswordReset(resetEmail.trim().toLowerCase());
    setResetLoading(false);
    if (res.success) {
      setResetSuccessMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-16 text-content-primary">
      <Header title="Sign In" showBack={true} showSearch={false} />

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/assets/brand-emblem.png"
              alt="ZaDa Foods Emblem"
              className="w-16 h-16 object-contain drop-shadow"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold text-content-primary">
            Welcome to ZaDa Foods
          </h1>
          <p className="text-xs text-content-secondary">
            Sign in with your email and password to access your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-content-primary block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-content-primary block">Password</label>
              <button
                type="button"
                onClick={handleOpenResetModal}
                className="text-[11px] text-brand-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-btn bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <div className="pt-2 text-center text-xs text-content-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-primary hover:underline">
              Create Account
            </Link>
          </div>
        </form>
      </main>

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-brand-primary">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold font-serif text-content-primary">Reset Password</h3>
            </div>
            <p className="text-xs text-content-muted">
              Enter the email address registered with your account to receive a secure password reset link.
            </p>

            {resetSuccessMsg ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg">
                  {resetSuccessMsg}
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-btn"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-content-secondary border border-border rounded-btn hover:bg-canvas-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-btn hover:bg-brand-primary-hover disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
