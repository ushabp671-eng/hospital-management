import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import type { AdminUser } from '../types/hospital';
import { apiFetch, ApiError, setStoredToken } from '../utils/apiClient';

interface LoginScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both administrator username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiFetch<{ user: AdminUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      setStoredToken(result.token);
      onLoginSuccess(result.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the hospital server. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {/* Left Login Column */}
      <div className="flex flex-col justify-between overflow-y-auto px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            MercyCare HMS
          </span>
          <span className="text-xs font-medium text-slate-500">Clinical Administration</span>
        </div>

        <div className="mx-auto my-10 w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Administrator Sign In
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Sign in to manage physicians, patient records, clinical staff, appointment schedules, and billing invoices.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-slate-700">
                Username or Email
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or admin@mercycare.org"
                className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="block w-full rounded-md border border-slate-300 bg-white py-2.5 pl-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Fill Demo Admin Credentials
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700" />
              <span>
                Demo Account: <span className="font-mono text-slate-700">admin</span> /{' '}
                <span className="font-mono text-slate-700">Admin@123</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          MercyCare Clinical Operations · Inpatient &amp; Outpatient Administration
        </p>
      </div>

      {/* Right Architectural Image Column */}
      <div className="relative hidden h-full overflow-hidden lg:block">
        <img
          src="/src/assets/images/hospital_login_atrium_1794580481385.jpg"
          alt="MercyCare Hospital central glass atrium and clinical reception wing"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs font-medium tracking-wide text-teal-300">
            Hospital Management System · Java Spring Boot &amp; MySQL Architecture
          </p>
          <h2 className="mt-2 max-w-lg text-2xl font-semibold leading-snug text-balance">
            Unified clinical registry for physicians, patients, appointments, and billing.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200">
            Includes live persistent operations and complete exportable Spring Boot 3 + MySQL 8 source code for IntelliJ IDEA and Eclipse.
          </p>
        </div>
      </div>
    </div>
  );
}
