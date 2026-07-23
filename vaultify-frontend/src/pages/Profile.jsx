import React from 'react';
import { useFiles } from '../context/FileContext';
import { Mail, Calendar, HardDrive, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, storageStats } = useFiles();

  const formatDate = (isoString) => {
    if (!isoString) return 'June 16, 2026';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const used = storageStats?.used || 0;
  const total = storageStats?.totalCapacity || (500 * 1024 * 1024 * 1024);
  const percent = total > 0 ? Math.min(((used / total) * 100), 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-brand-sand rounded-3xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-32 bg-brand-sage-light/30 border-b border-brand-sand/50" />
        
        {/* Avatar */}
        <div className="relative mt-12 mb-4">
          <img
            src={user?.avatar}
            alt={user?.name || 'User Avatar'}
            className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover relative z-10 bg-white"
          />
        </div>

        {/* Profile Info */}
        <div className="space-y-1.5 z-10">
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal">{user?.name}</h2>
          
          <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5 text-brand-olive" />
            <span>{user?.email}</span>
          </div>

          {(user?.organization || user?.university) && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-700 font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-brand-olive" />
              <span>{user.organization || user.university}</span>
            </div>
          )}

          <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-brand-olive" />
            <span>Joined on {formatDate(user?.created_at)}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-sand/50 w-full flex justify-center items-center text-xs text-brand-olive font-semibold space-x-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Vaultify Secure Account</span>
        </div>
      </motion.div>

      {/* Storage usage */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-brand-sand rounded-3xl p-8 shadow-sm space-y-6"
      >
        <div className="flex items-center space-x-2.5">
          <HardDrive className="w-5 h-5 text-brand-olive" />
          <h3 className="font-serif text-lg font-bold text-brand-charcoal">Secure Vault Storage</h3>
        </div>

        <div>
          {/* Storage Bar */}
          <div className="w-full bg-brand-cream-dark h-3 rounded-full overflow-hidden mb-3.5">
            <div 
              style={{ width: `${percent}%` }} 
              className="bg-brand-olive h-full rounded-full transition-all duration-500 ease-out" 
            />
          </div>

          <div className="flex justify-between items-center text-xs text-brand-charcoal font-semibold">
            <span>{formatSize(used)} used</span>
            <span className="text-brand-olive bg-brand-sage-light/35 px-2.5 py-0.5 rounded-full text-[10px]">
              {percent.toFixed(2)}% Capacity Filled
            </span>
            <span>{formatSize(total)} limit</span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-brand-sand/40">
          <div className="p-3 bg-brand-cream border border-brand-sand/40 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Documents</span>
            <span className="text-sm font-bold text-brand-charcoal mt-1 font-mono">
              {formatSize(storageStats?.breakdown?.Documents)}
            </span>
          </div>

          <div className="p-3 bg-brand-cream border border-brand-sand/40 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Images</span>
            <span className="text-sm font-bold text-brand-charcoal mt-1 font-mono">
              {formatSize(storageStats?.breakdown?.Images)}
            </span>
          </div>

          <div className="p-3 bg-brand-cream border border-brand-sand/40 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Media Files</span>
            <span className="text-sm font-bold text-brand-charcoal mt-1 font-mono">
              {formatSize(storageStats?.breakdown?.Media)}
            </span>
          </div>

          <div className="p-3 bg-brand-cream border border-brand-sand/40 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Locker Plan</span>
            <span className="text-xs font-bold text-brand-olive mt-1 uppercase tracking-wide">
              {user?.storage_plan === 'pro' ? 'PRO SCHOLAR' : 'FREE SCHOLAR'}
            </span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
