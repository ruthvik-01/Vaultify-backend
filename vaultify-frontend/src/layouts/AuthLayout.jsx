import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Sparkles, FolderLock, Database, Share2 } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-brand-cream">
      {/* Visual Left Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-olive-dark text-brand-cream flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background ambient graphic elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-olive/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-sage-light/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="bg-brand-cream text-brand-olive-dark p-2 rounded-xl">
            <FolderLock className="w-6 h-6" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight">Vaultify</span>
        </div>

        {/* Content Showcase */}
        <div className="z-10 my-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span className="text-xs uppercase tracking-widest text-brand-sage font-medium bg-brand-cream/10 px-3 py-1 rounded-full border border-brand-cream/10">
              Cloud Storage & Sharing
            </span>
            <h1 className="text-5xl xl:text-6xl font-serif text-brand-cream font-bold mt-4 leading-tight">
              Organize your digital assets in one secure vault.
            </h1>
            <p className="mt-6 text-brand-sage-light max-w-md text-lg leading-relaxed font-sans">
              Designed for premium security. Store personal credentials, verify academic logs, catalog projects, and share files instantly under your terms.
            </p>
          </motion.div>

          {/* Premium UI Mockup Showcase */}
          <motion.div
            className="mt-12 bg-brand-cream/5 border border-brand-cream/10 rounded-2xl p-6 glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="flex justify-between items-center pb-4 border-b border-brand-cream/10">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-brand-sage font-mono">vaultify.co/vrajraju</span>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-brand-cream/5 border border-brand-cream/10 p-4 rounded-xl flex items-center space-x-3">
                <div className="bg-orange-500/20 text-orange-300 p-2 rounded-lg text-sm">PDF</div>
                <div>
                  <h4 className="text-xs font-semibold text-brand-cream font-sans">Vraj_Raju_Resume.pdf</h4>
                  <p className="text-[10px] text-brand-sage">1.2 MB • Verified</p>
                </div>
              </div>
              <div className="bg-brand-cream/5 border border-brand-cream/10 p-4 rounded-xl flex items-center space-x-3">
                <div className="bg-brand-sage/20 text-brand-sage-light p-2 rounded-lg text-sm">ZIP</div>
                <div>
                  <h4 className="text-xs font-semibold text-brand-cream font-sans">E-Commerce_App.zip</h4>
                  <p className="text-[10px] text-brand-sage">37.0 MB • Starred</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-brand-cream/5 border border-brand-cream/10 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-sage" />
                <span className="text-xs text-brand-cream font-sans">Verification Hub Status</span>
              </div>
              <span className="bg-brand-sage/20 text-brand-sage-light px-2 py-0.5 rounded text-[10px]">
                3 Badges Verified
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-brand-sage z-10">
          <p>© {new Date().getFullYear()} Vaultify. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>

      {/* Auth Form Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <motion.div
          className="w-full max-w-md bg-white border border-brand-sand rounded-3xl p-8 sm:p-10 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center lg:hidden mb-8">
            <div className="inline-flex bg-brand-olive text-brand-cream p-3 rounded-2xl mb-3">
              <FolderLock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Vaultify</h2>
            <p className="text-sm text-gray-500 mt-1">Cloud digital asset vault</p>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
