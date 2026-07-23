import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../context/FileContext';
import { Search, FileText, Award, FolderGit, FileQuestion, ArrowRight, CornerDownLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SearchBar() {
  const { files } = useFiles();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Debounce query input by 300ms to reduce per-keystroke filtering
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Listen for Ctrl+K/Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter files that are NOT in trash, using debounced query
  const filteredFiles = debouncedQuery.trim() === '' 
    ? [] 
    : files
        .filter(f => !f.inTrash)
        .filter(f => 
          f.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .slice(0, 5); // limit to top 5 results

  const getIcon = (category) => {
    return <FileText className="w-4 h-4 text-emerald-600" />;
  };

  const handleResultClick = (file) => {
    setQuery('');
    setIsOpen(false);
    // Navigate to My Files containing folder and highlight the item
    const path = `/my-files` + (file.folder_id ? `?folder=${encodeURIComponent(file.folder_id)}&highlight=${encodeURIComponent(file.id)}` : `?highlight=${encodeURIComponent(file.id)}`);
    navigate(path);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search files... (Ctrl + K)"
          className="w-full pl-10 pr-16 py-2 bg-brand-cream border border-brand-sand rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive transition-all text-brand-charcoal"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
          <kbd className="hidden sm:inline-block bg-white px-1.5 py-0.5 border border-brand-sand rounded text-[10px] font-mono text-gray-400 shadow-sm">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Autocomplete Results Panel */}
      <AnimatePresence>
        {isOpen && debouncedQuery.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-white border border-brand-sand rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {filteredFiles.length > 0 ? (
              <div>
                <div className="px-4 py-2 border-b border-brand-sand bg-brand-cream/40 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Matching Items</span>
                  <span className="text-[10px] text-gray-400 flex items-center">
                    Enter <CornerDownLeft className="w-3 h-3 ml-1" />
                  </span>
                </div>
                <ul className="divide-y divide-brand-sand/65">
                  {filteredFiles.map((file) => (
                    <li key={file.id}>
                      <button
                        onClick={() => handleResultClick(file)}
                        className="w-full px-4 py-3 hover:bg-brand-cream/80 flex items-center justify-between text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="bg-brand-cream-dark p-2 rounded-lg group-hover:bg-white transition-all">
                            {getIcon(file.category)}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-brand-charcoal block truncate group-hover:text-brand-olive transition-all">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-olive group-hover:translate-x-1 transition-all" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">
                No matching files found for "<span className="font-semibold">{debouncedQuery}</span>"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
