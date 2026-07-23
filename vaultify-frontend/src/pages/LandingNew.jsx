import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderLock, Shield, Award, FolderGit, Search, Share2,
  ArrowRight, FileText, CheckCircle2, Star, Sparkles, HardDrive,
  HelpCircle, ChevronRight, Plus, Video, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Brand Icon component using simple SVG
const BrandIcon = ({ className }) => (
  <div className={`bg-brand-olive text-white p-2 rounded-xl flex items-center justify-center shrink-0 ${className}`}>
    <FolderLock className="w-5 h-5" />
  </div>
);

const Linkedin = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const Github = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

export default function Landing() {



  const features = [
    {
      title: 'Secure Cloud Locker',
      desc: '100% student-encrypted sandboxed storage. Your files are isolated and guarded by campus security keys.',
      icon: Shield,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Resume & CV Vault',
      desc: 'Keep multiple revisions of your CV organized. Track downloader stats to know exactly when recruiters read them.',
      icon: FileText,
      color: 'bg-rose-50 text-rose-700 border-rose-100',
    },
    {
      title: 'Certificate Verifier',
      desc: 'Store verified badges from AWS, Google, and Coursera. Includes metadata ID lookups so recruiters prove authenticity.',
      icon: Award,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: 'Project Showcase',
      desc: 'Link source repositories directly to your zip codes. Display live demo urls alongside your developer timeline.',
      icon: FolderGit,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },

    {
      title: 'Secret Share Links',
      desc: 'Generate temporary share links for placement drives. Revoke email permissions instantly from your dashboard.',
      icon: Share2,
      color: 'bg-purple-50 text-purple-700 border-purple-100',
    },
    {
      title: 'Video Upload & Secure Sharing',
      desc: 'Upload videos securely, generate protected share links, and allow authorized users to access them instantly.',
      icon: Video,
      color: 'bg-teal-50 text-teal-700 border-teal-100',
    }
  ];

  const steps = [
    { step: '01', title: 'Upload Carrier Files', desc: 'Drag-and-drop documents, images, videos, zip files, or certificates.' },
    { step: '02', title: 'Organize in Drawers', desc: 'Categorize files and tag them by course, placement drive, or skill.' },
    { step: '03', title: 'Create Verify Links', desc: 'Add credentials verification IDs and generate secure sharing links.' },
    { step: '04', title: 'Get Placed', desc: 'Share your unified student showcase with placement offices and recruiters.' }
  ];

  const benefits = [
    { title: 'Save Time', desc: 'Stop digging through emails or desktop folders during quick recruiter applications. Keep everything one click away.' },
    { title: 'Stay Organized', desc: 'Separate draft resumes, placement worksheets, verified credentials, and lecture briefs into clean, indexed vaults.' },
    { title: 'Placement Ready', desc: 'Stand out from standard applicants with a clean public student portfolio verifying your credentials.' }
  ];





  return (
    <div className="bg-brand-cream min-h-screen relative font-sansSelection">

      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-brand-sand/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BrandIcon />
            <span className="font-serif text-lg font-bold tracking-tight text-brand-charcoal">Vaultify</span>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex space-x-8 text-xs font-semibold text-gray-500">
            <a href="#" className="hover:text-brand-olive transition-all">Home</a>
            <a href="#about" className="hover:text-brand-olive transition-all">About</a>
            <a href="#features" className="hover:text-brand-olive transition-all">Features</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-xs font-semibold text-gray-600 hover:text-brand-charcoal transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-brand-olive hover:bg-brand-olive-dark text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 text-center space-y-8">
        <motion.div
          className="max-w-3xl mx-auto space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-widest text-brand-olive bg-brand-sage-light/25 border border-brand-sage-light/40 px-3.5 py-1.5 rounded-full font-bold inline-block">
            Secure Cloud Vault for Academia
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-brand-charcoal leading-tight">
            Your career credentials.<br />In one secure locker.
          </h1>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed font-sans max-w-xl mx-auto">
            Designed specifically for student recruitment. Store verified resumes, capstone codes, and college certificates. Share links instantly with hiring cells.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Link
            to="/register"
            className="w-full sm:w-auto bg-brand-olive hover:bg-brand-olive-dark text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Start Your Free Locker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white border border-brand-sand hover:bg-brand-cream text-brand-charcoal px-6 py-3 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Explore Dashboard Demo
          </Link>
        </motion.div>

        {/* Hero Interactive Dashboard Mockup Showcase */}
        <motion.div
          className="max-w-4xl mx-auto bg-white border border-brand-sand/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden mt-12"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
        >
          {/* Mock Browser Header */}
          <div className="flex justify-between items-center pb-4 border-b border-brand-sand mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <span className="text-[10px] text-gray-400 font-mono">vaultify.co/vrajraju/showcase</span>
            <div className="w-16" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Mock Sidebar Stats */}
            <div className="border border-brand-sand rounded-2xl p-4 bg-brand-cream/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-gray-400">Vault Capacity</span>
                <span className="text-[9px] text-brand-olive bg-brand-sage-light/20 px-2 py-0.5 rounded-full font-bold">Pro Vault</span>
              </div>
              <div className="w-full bg-brand-cream-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-olive h-full w-[24%]" />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                <span>2.4 GB Used</span>
                <span>500 GB Max</span>
              </div>

              {/* Stacked details */}
              <div className="space-y-2 pt-2 border-t border-brand-sand text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>Resumes</span>
                  <span className="font-mono font-bold">1.2 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects</span>
                  <span className="font-mono font-bold">37.0 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Certificates</span>
                  <span className="font-mono font-bold">4.6 MB</span>
                </div>
              </div>
            </div>

            {/* Mock Files grid */}
            <div className="md:col-span-2 space-y-4">
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Featured Placement Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Mock Card 1 */}
                <div className="bg-white border border-brand-sand rounded-xl p-3.5 flex items-center space-x-3 relative shadow-sm">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-brand-charcoal block truncate">Vraj_Raju_Resume_2026.pdf</span>
                    <span className="text-[9px] text-gray-400 font-sans block mt-0.5">Resumes ?????? Verified Main</span>
                  </div>
                  <span className="absolute top-2 right-2"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" /></span>
                </div>

                {/* Mock Card 2 */}
                <div className="bg-white border border-brand-sand rounded-xl p-3.5 flex items-center space-x-3 relative shadow-sm">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-brand-charcoal block truncate">AWS_Cloud_Practitioner.pdf</span>
                    <span className="text-[9px] text-gray-400 font-sans block mt-0.5">Certificates ?????? Verified Creds</span>
                  </div>
                  <span className="absolute top-2 right-2"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" /></span>
                </div>

                {/* Mock Card 3 */}
                <div className="bg-white border border-brand-sand rounded-xl p-3.5 flex items-center space-x-3 relative shadow-sm">
                  <div className="p-2 bg-brand-olive/10 text-brand-olive-dark rounded-lg">
                    <FolderGit className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-brand-charcoal block truncate">E-Commerce_App.zip</span>
                    <span className="text-[9px] text-gray-400 font-sans block mt-0.5">Projects ?????? Github Sync</span>
                  </div>
                  <span className="absolute top-2 right-2"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" /></span>
                </div>

                {/* Mock Card 4 */}
                <div className="bg-white border border-brand-sand rounded-xl p-3.5 flex items-center space-x-3 relative shadow-sm">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-brand-charcoal block truncate">Project_Demo.mp4</span>
                    <span className="text-[9px] text-gray-400 font-sans block mt-0.5">Videos ?????? Showcase</span>
                  </div>
                  <span className="absolute top-2 right-2"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" /></span>
                </div>

                {/* Mock Card 5 */}
                <div className="bg-brand-cream border border-brand-sand border-dashed rounded-xl p-3.5 flex items-center justify-center space-x-2 text-[10px] text-gray-400 hover:border-brand-olive transition-all cursor-pointer">
                  <Plus className="w-4 h-4 text-brand-olive" />
                  <span className="font-bold">Add Starred Show</span>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </section>



      {/* 4. Features Bento Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
            Features engineered for student recruitment.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-sans leading-relaxed">
            Everything you need to store, organize, verify, and share your scholastic assets professionally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56"
              >
                <div className={`p-3 rounded-xl border w-11 h-11 flex items-center justify-center ${feat.color}`}>
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="mt-4">
                  <h4 className="font-serif text-base font-bold text-brand-charcoal">{feat.title}</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-sans">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="bg-brand-cream-dark/40 border-y border-brand-sand py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Simple locker setups to get hired.
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-sans">
              Set up your public scholastic profile locker in 4 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {steps.map((item, idx) => (
              <div key={idx} className="bg-white border border-brand-sand rounded-3xl p-6 relative shadow-sm">
                <span className="font-serif text-4xl font-bold text-brand-olive/20 block mb-4">{item.step}</span>
                <h4 className="font-serif text-base font-bold text-brand-charcoal">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
            Locker benefits that drive results.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-sans">
            Make document sharing clean, verified, and professional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {benefits.map((item, idx) => (
            <div key={idx} className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm">
              <div className="bg-brand-sage-light/20 text-brand-olive p-2.5 rounded-xl border border-brand-sage-light/30 w-10 h-10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-charcoal">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed font-sans">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>      {/* About Section & Team Credits */}
      {/* Footer */}
      <footer
        id="footer"
        className="bg-gradient-to-b from-white to-brand-cream/30 border-t border-brand-sand py-14"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <BrandIcon className="w-10 h-10" />
            <div>
              <h3 className="text-2xl font-serif font-bold text-brand-charcoal">
                Vaultify
              </h3>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-olive font-semibold">
                Digital Locker
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-sm text-gray-500 leading-7">
            Vaultify is a secure cloud-based digital locker that enables users to
            safely store, organize, preview, and manage important documents and
            media files with enterprise-grade security and seamless accessibility.
          </p>

          {/* Divider */}
          <div className="w-24 h-px bg-brand-sand my-8" />

          {/* Bottom */}
          <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-brand-charcoal">
                Vaultify
              </span>
              . All Rights Reserved.
            </p>

            <p className="text-xs">
              Secure • Reliable • Cloud Powered
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}

