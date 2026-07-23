import React from 'react';
import { FileQuestion, FolderOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ 
  title = "No files found", 
  description = "Get started by uploading your first document, image, or video to this vault folder.",
  actionText = "", 
  onActionClick = null,
  icon: CustomIcon = null
}) {
  return (
    <motion.div 
      className="bg-white border border-brand-sand/80 border-dashed rounded-3xl p-8 py-12 text-center max-w-md mx-auto flex flex-col items-center justify-center shadow-sm"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-brand-cream text-brand-sage p-4 rounded-full border border-brand-sand mb-4">
        {CustomIcon ? (
          <CustomIcon className="w-10 h-10 stroke-[1.5]" />
        ) : (
          <FolderOpen className="w-10 h-10 stroke-[1.5]" />
        )}
      </div>

      <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">
        {title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed font-sans mb-6">
        {description}
      </p>

      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="bg-brand-olive hover:bg-brand-olive-dark text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
