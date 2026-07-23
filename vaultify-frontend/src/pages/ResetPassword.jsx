import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { KeyRound, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('input'); // input | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Recovery token is missing. Please check your recovery email.');
      setStatus('error');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your entries.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.resetPassword(token, password);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset locker password. Token may have expired or is invalid.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {status === 'input' && (
        <div>
          <div className="mb-6 text-left">
            <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Enter new password</h3>
            <p className="text-xs text-gray-500 mt-1">Configure your secure access credentials for Vaultify locker.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-sans">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                New Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>Update password</span>
              )}
            </button>
          </form>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 text-emerald-600 p-3.5 rounded-full inline-block border border-emerald-100 mb-4"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Password Updated!</h3>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Your locker password has been reset successfully. You can now access your credentials.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm"
          >
            <span>Proceed to Sign In</span>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-rose-50 text-rose-600 p-3.5 rounded-full inline-block border border-rose-100 mb-4"
          >
            <XCircle className="w-10 h-10" />
          </motion.div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Reset Failed</h3>
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl max-w-sm mx-auto leading-relaxed font-sans">
            {errorMsg}
          </p>

          <button
            onClick={() => setStatus('input')}
            className="mt-6 text-xs font-semibold text-brand-olive hover:underline block mx-auto"
          >
            Try again
          </button>
        </div>
      )}

      {/* Footer Back Link */}
      <div className="mt-8 pt-4 border-t border-brand-sand text-center">
        <Link
          to="/login"
          className="text-xs font-semibold text-gray-500 hover:text-brand-charcoal inline-flex items-center space-x-1 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
