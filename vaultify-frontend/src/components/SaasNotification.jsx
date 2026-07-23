import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function SaasNotification({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'success', title } = toast;

  const typeConfig = {
    success: {
      title: title || 'Success',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      Icon: CheckCircle2
    },
    error: {
      title: title || 'Error',
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      Icon: XCircle
    },
    warning: {
      title: title || 'Warning',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      Icon: AlertTriangle
    },
    info: {
      title: title || 'Information',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      Icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.success;
  const { Icon } = config;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto select-none px-4 w-full max-w-[420px] flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] bg-white/75 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative flex items-start space-x-3.5"
      >
        {/* Modern Icon Badge */}
        <div className={`p-2 rounded-xl border ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5 shadow-sm`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Text Body */}
        <div className="flex-1 min-w-0 pr-5 text-left">
          <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            {config.title}
          </h4>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 font-normal leading-snug mt-0.5">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
