import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Your email address has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email address. The link may have expired or is invalid.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="text-center py-6">
      {status === 'verifying' && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-olive animate-spin" />
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Verifying your locker...</h3>
          <p className="text-xs text-gray-500 max-w-sm">Please wait while we verify your registered email address.</p>
        </div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full inline-block border border-emerald-100 mb-2">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Email Verified!</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            {message} You can now log into your **Vaultify** digital locker and securely store your credentials.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center space-x-2 bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-rose-50 text-rose-600 p-4 rounded-full inline-block border border-rose-100 mb-2">
            <XCircle className="w-12 h-12" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Verification Failed</h3>
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl max-w-sm mx-auto leading-relaxed font-sans">
            {message}
          </p>

          <Link
            to="/register"
            className="mt-6 inline-flex w-full items-center justify-center space-x-2 bg-brand-cream border border-brand-sand hover:bg-brand-sand/30 text-brand-charcoal font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <span>Register a new account</span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
