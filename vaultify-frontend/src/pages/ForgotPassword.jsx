import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request password recovery. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!submitted ? (
        <div>
          {/* Recovery Form */}
          <div className="mb-6 text-left">
            <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Reset locker password</h3>
            <p className="text-xs text-gray-500 mt-1">Enter your registered email address and we'll send a recovery link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-sans">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                Student Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Send Recovery Link</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Success Confirmation */
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 text-emerald-600 p-3.5 rounded-full inline-block border border-emerald-100 mb-4"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Recovery Sent</h3>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            If an account is registered under <span className="font-semibold text-brand-charcoal">{email}</span>, a secure recovery link will arrive shortly.
          </p>

          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 text-xs font-semibold text-brand-olive hover:underline block mx-auto"
          >
            Resend recovery email
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
