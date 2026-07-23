import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../context/FileContext';
import { FolderClosed, FolderOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FolderCard({ category }) {
  const { files } = useFiles();
  const navigate = useNavigate();

  // Filter active files matching this category
  const activeCategoryFiles = files.filter(f => f.category === category && !f.inTrash);
  const fileCount = activeCategoryFiles.length;
  
  // Calculate folder size
  const totalSize = activeCategoryFiles.reduce((acc, curr) => acc + curr.size, 0);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Assign distinct styles based on category names
  const getCategoryTheme = () => {
    switch (category) {
      case 'Resumes':
        return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100' };
      case 'Certificates':
        return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-100' };
      case 'Projects':
        return { bg: 'bg-brand-olive/10 border-brand-olive/20', text: 'text-brand-olive-dark', iconBg: 'bg-brand-olive/20' };
      case 'Notes':
        return { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-100' };
      case 'Assignments':
        return { bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-100' };
      case 'Placement Documents':
        return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-100' };
      default:
        return { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-700', iconBg: 'bg-gray-100' };
    }
  };

  const theme = getCategoryTheme();

  const handleFolderClick = () => {
    navigate(`/my-files?category=${encodeURIComponent(category)}`);
  };

  return (
    <motion.div
      onClick={handleFolderClick}
      className={`border rounded-2xl p-4 cursor-pointer flex flex-col justify-between h-40 transition-all ${theme.bg}`}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${theme.iconBg} ${theme.text}`}>
          <FolderClosed className="w-6 h-6 stroke-[1.8]" />
        </div>
        <span className="text-[10px] font-mono text-gray-400 font-medium">
          {formatSize(totalSize)}
        </span>
      </div>

      <div className="mt-4">
        <h4 className={`font-serif text-sm font-bold truncate ${theme.text}`}>
          {category}
        </h4>
        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
          <span>{fileCount} item{fileCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center space-x-1 hover:underline group-hover:translate-x-0.5 transition-all text-xs font-semibold">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
