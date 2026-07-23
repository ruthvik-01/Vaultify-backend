import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiles } from '../context/FileContext';
import { firebaseAuthService } from '../services/firebaseAuthService';

export default function Register() {
  const { register, googleLogin, showNotification } = useFiles();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const userData = {
      name,
      email,
      password
    };

    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      showNotification('Account created successfully! Welcome to Vaultify.', 'success');
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const idToken = await firebaseAuthService.signInWithGoogle();
      const result = await googleLogin(idToken);
      if (result.success) {
        showNotification('Signed up with Google successfully!', 'success');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Google authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-left">
        <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Create account</h3>
        <p className="text-xs text-gray-500 mt-1">Get 500 GB of free secure cloud storage on Vaultify</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-left">
          {error}
        </div>
      )}

      {/* Google Sign up Trigger */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full bg-white border border-brand-sand hover:bg-brand-cream text-brand-charcoal font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer mb-2 disabled:opacity-50"
      >
        {googleLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-brand-charcoal border-t-transparent animate-spin mr-2" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        )}
        <span>{googleLoading ? 'Signing in with Google...' : 'Sign Up with Google'}</span>
      </button>

      <div className="relative flex py-4 items-center justify-center">
        <div className="flex-grow border-t border-brand-sand"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-[9px] uppercase font-bold tracking-widest">Or register with email</span>
        <div className="flex-grow border-t border-brand-sand"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal"
              placeholder="Vraj Raju"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Choose Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

        {/* Accept Terms */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="w-4 h-4 rounded text-brand-olive focus:ring-brand-olive border-brand-sand bg-brand-cream mt-0.5"
          />
          <label htmlFor="terms" className="ml-2 text-[11px] text-gray-500 leading-normal cursor-pointer">
            I certify that I agree to the Terms of Service and Privacy Policy.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="mt-8 pt-4 border-t border-brand-sand text-center text-xs text-gray-500">
        <span>Already have an account? </span>
        <Link to="/login" className="text-brand-olive font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
