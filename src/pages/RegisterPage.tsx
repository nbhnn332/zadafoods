import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(fullName, email, password, phone);
    setLoading(false);

    if (res.success) {
      navigate('/account');
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-16 text-content-primary">
      <Header title="Create Account" showBack={true} showSearch={false} />

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
            Join the ZaDa Family
          </h1>
          <p className="text-xs text-content-secondary">
            Get 10% off your first order and track shipments easily.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-content-primary block">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Numan Sidique"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

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
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-content-primary block">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-content-primary block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-btn bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <div className="pt-2 text-center text-xs text-content-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-primary hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
