import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import VideoPlayer from '../../components/video/VideoPlayer';
import SaasNotification from '../../components/SaasNotification';
import { 
  Eye, 
  Search, 
  FileText, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  FileCode, 
  Music,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderClosed,
  FileCheck,
  Trash2,
  Share2,
  ExternalLink,
  Download,
  Check
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Search input debouncing
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Folder input debouncing
  const [folderInput, setFolderInput] = useState('');
  const [folder, setFolder] = useState('All');

  // Filter States
  const [team, setTeam] = useState('All');
  const [student, setStudent] = useState('All');
  const [fileType, setFileType] = useState('All');
  const [dateRange, setDateRange] = useState('All');
  
  // Custom Date range pickers
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sizeCategory, setSizeCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Dynamic Roster lists from backend
  const [studentsList, setStudentsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [searchParams] = useSearchParams();

  // Read URL search query params on load
  useEffect(() => {
    const studentParam = searchParams.get('student');
    if (studentParam) {
      setStudent(studentParam);
    }
  }, [searchParams]);

  const [copiedId, setCopiedId] = useState(null);

  const handleOpenLink = async (file) => {
    try {
      const type = file.fileType === 'video' ? 'video' : file.fileType === 'group' ? 'group' : 'file';
      const url = await adminService.getPreviewUrl(file.id, type, 'inline');
      if (url) {
        window.open(url, '_blank');
      } else {
        showNotification('Unable to open file: URL not found.', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to open file.', 'error');
    }
  };

  const handleCopyShareLink = async (file) => {
    try {
      const res = await adminService.createUploadShare(file.id, file.fileType);
      const link = res.shareUrl;
      if (link) {
        await navigator.clipboard.writeText(link);
        setCopiedId(file.id);
        setTimeout(() => setCopiedId(null), 2000);
        showNotification('Share link copied.', 'success');
      } else {
        showNotification('Unable to copy link.', 'error');
      }
    } catch (err) {
      showNotification('Unable to copy link.', 'error');
    }
  };

  const handleDownload = async (file) => {
    try {
      const type = file.fileType === 'video' ? 'video' : file.fileType === 'group' ? 'group' : 'file';
      const url = await adminService.getPreviewUrl(file.id, type, 'attachment');
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        showNotification('Download started successfully!', 'success');
      } else {
        showNotification('Unable to download file: URL not found.', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to download file.', 'error');
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Debounce folder input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFolder(folderInput.trim() || 'All');
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [folderInput]);

  // Fetch dynamic Team and Student lists from database
  useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const [studentsRes, teamsRes] = await Promise.all([
          adminService.getStudents({ limit: 1000 }).catch(() => ({ students: [] })),
          adminService.getTeams().catch(() => ({ teams: [] }))
        ]);
        if (studentsRes && studentsRes.students) {
          setStudentsList(studentsRes.students);
        }
        if (teamsRes && teamsRes.teams) {
          setTeamsList(teamsRes.teams);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadDynamicOptions();
  }, []);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUploads({
        search,
        team,
        student,
        folder,
        fileType,
        dateRange,
        dateFrom: dateRange === 'custom' ? dateFrom : '',
        dateTo: dateRange === 'custom' ? dateTo : '',
        sizeCategory,
        sortBy,
        page,
        limit
      });
      if (res && res.uploads) {
        setUploads(res.uploads);
        setPagination(res.pagination || { total: res.uploads.length, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load uploads:', err);
      setError(err.message || 'Failed to fetch uploads from backend.');
    } finally {
      setLoading(false);
    }
  }, [search, team, student, folder, fileType, dateRange, dateFrom, dateTo, sizeCategory, sortBy, page, limit]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleOpenPreview = async (file) => {
    try {
      const url = await adminService.getPreviewUrl(file.id, file.fileType);
      setSelectedFileForPreview({
        name: file.fileName,
        size: file.size,
        mimeType: file.mimeType || (file.fileType === 'video' ? 'video/mp4' : file.fileType === 'image' ? 'image/png' : 'application/pdf'),
        ...file
      });
      setPlaybackUrl(url);
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve preview.', 'error');
    }
  };

  const handleDeleteUpload = async (id, fileType, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // Optimistic delete: remove from UI state immediately
      setUploads(prev => prev.filter(item => item.id !== id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));

      const type = fileType === 'video' ? 'video' : fileType === 'group' ? 'group' : 'file';
      await adminService.deleteUpload(id, type);
      showNotification(`Upload "${fileName}" successfully deleted.`, 'success');
      fetchUploads();
    } catch (err) {
      showNotification(err.message || 'Failed to delete upload.', 'error');
      fetchUploads();
    }
  };

  const handlePurgeTeamUploads = async (targetTeam) => {
    const teamToPurge = targetTeam || team;
    if (!teamToPurge || teamToPurge === 'All') {
      showNotification('Please select a specific team to purge team uploads.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to purge ALL uploads for Team "${teamToPurge}"? This will permanently delete all files and videos for this team.`)) {
      return;
    }
    try {
      const res = await adminService.deleteTeamUploads(teamToPurge);
      showNotification(res.message || `Uploads for team "${teamToPurge}" purged.`, 'success');
      fetchUploads();
    } catch (err) {
      showNotification(err.message || 'Failed to purge team uploads.', 'error');
    }
  };

  const getFileIcon = (type) => {
    const safeType = (type || '').toLowerCase();
    switch (safeType) {
      case 'video':
        return <VideoIcon className="w-5 h-5 text-cyan-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'archive':
        return <FileCode className="w-5 h-5 text-purple-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-rose-600" />;
    }
  };

  const handleApplyCustomDates = () => {
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
    setPage(1);
  };

  const handleResetCustomDates = () => {
    setDateFromInput('');
    setDateToInput('');
    setDateFrom('');
    setDateTo('');
    setDateRange('All');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Monitored Student Uploads</h2>
          <p className="text-xs text-gray-500 font-medium">View and manage all real student file and video uploads across teams.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-olive/10 text-brand-olive border border-brand-olive/20">
            Total Uploads: {pagination.total || uploads.length}
          </span>
          {team !== 'All' && (
            <button
              onClick={() => handlePurgeTeamUploads(team)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title={`Purge all uploads for Team ${team}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge {team} Uploads</span>
            </button>
          )}
          <button
            onClick={fetchUploads}
            className="p-2 bg-white border border-brand-sand rounded-xl text-gray-600 hover:bg-brand-sand/40 transition-colors shadow-sm cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4 text-brand-olive" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-brand-sand/70 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Student Name, Email, Team, File Name, or Folder..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-brand-cream/40 border border-brand-sand/80 rounded-2xl text-xs text-brand-charcoal font-medium focus:outline-none focus:border-brand-olive transition-colors"
          />
        </div>

        {/* Multi-Select Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-1">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Team</label>
            <select
              value={team}
              onChange={(e) => { setTeam(e.target.value); setStudent('All'); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="All">All Teams</option>
              {(teamsList || []).map(t => (
                t && t.name ? <option key={t.name} value={t.name}>{t.name}</option> : null
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Student</label>
            <select
              value={student}
              onChange={(e) => { setStudent(e.target.value); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="All">All Students</option>
              {(studentsList || [])
                .filter(s => s && s.studentName && (team === 'All' || (s.team || '').toLowerCase() === team.toLowerCase()))
                .map(s => (
                  <option key={s.id || s._id || s.studentName} value={s.studentName}>{s.studentName}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Folder Name</label>
            <input
              type="text"
              placeholder="e.g. Labs"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">File Type</label>
            <select
              value={fileType}
              onChange={(e) => { setFileType(e.target.value); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="video">Videos</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="archive">Archives</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="All">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">File Size</label>
            <select
              value={sizeCategory}
              onChange={(e) => { setSizeCategory(e.target.value); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="All">All Sizes</option>
              <option value="small">&lt; 10 MB</option>
              <option value="medium">10 MB - 100 MB</option>
              <option value="large">&gt; 100 MB</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full bg-brand-cream/40 border border-brand-sand/70 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-olive cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="largest">Largest First</option>
              <option value="smallest">Smallest First</option>
              <option value="a-z">File Name (A-Z)</option>
              <option value="z-a">File Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Controls */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-cream/60 rounded-2xl border border-brand-sand/70">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-brand-charcoal">From:</span>
              <input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                className="bg-white border border-brand-sand/80 rounded-xl px-2.5 py-1 text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-brand-charcoal">To:</span>
              <input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                className="bg-white border border-brand-sand/80 rounded-xl px-2.5 py-1 text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
              />
            </div>
            <button
              onClick={handleApplyCustomDates}
              className="px-3 py-1 bg-brand-olive hover:bg-brand-olive-dark text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              onClick={handleResetCustomDates}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Uploads Data Table */}
      <div className="bg-white border border-brand-sand/70 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-sand/60 bg-brand-cream/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4">Folder</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">File Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Uploaded Time</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-sand/40 text-xs">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-28"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-14"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-brand-sand/50 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-8 bg-brand-sand/50 rounded-xl w-28 mx-auto"></div></td>
                  </tr>
                ))
              ) : (Array.isArray(uploads) ? uploads : []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400 font-medium">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 text-brand-sage" />
                    <p className="font-serif font-bold text-sm text-brand-charcoal">No uploads available.</p>
                  </td>
                </tr>
              ) : (
                (Array.isArray(uploads) ? uploads : []).map((file) => (
                  <tr key={file.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-charcoal truncate max-w-[140px]">
                      {file.student}
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-medium truncate max-w-[160px]">
                      {file.studentEmail || `${(file.student || 'student').toLowerCase().replace(/\s+/g, '.')}@student.edu`}
                    </td>
                    <td className="py-4 px-4 text-brand-olive font-semibold">{file.team}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      <span className="inline-flex items-center space-x-1 text-[11px] bg-brand-cream px-2 py-0.5 rounded border border-brand-sand/60">
                        <FolderClosed className="w-3 h-3 text-brand-tan" />
                        <span>{file.folder}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-brand-charcoal max-w-[180px] truncate">
                      {file.fileName}
                    </td>
                    <td className="py-4 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-brand-cream text-brand-olive border border-brand-sand/60">
                        {file.fileType || 'file'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-semibold">{formatSize(file.size)}</td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{formatDate(file.uploadDate)}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenPreview(file)}
                          className="p-1.5 rounded-xl bg-brand-olive text-white hover:bg-brand-olive-dark transition-colors cursor-pointer shadow-sm"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenLink(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 border border-brand-sand/80 text-brand-charcoal transition-colors cursor-pointer"
                          title="Open Link in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-brand-olive" />
                        </button>
                        <button
                          onClick={() => handleCopyShareLink(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 border border-brand-sand/80 text-brand-charcoal transition-colors cursor-pointer"
                          title="Copy Share Link"
                        >
                          {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-brand-olive" />}
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 border border-brand-sand/80 text-brand-charcoal transition-colors cursor-pointer"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-olive" />
                        </button>
                        <button
                          onClick={() => handleDeleteUpload(file.id, file.fileType, file.fileName)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Upload"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-brand-cream/40 border-t border-brand-sand/60 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Showing Page <span className="font-bold text-brand-charcoal">{page}</span> of{' '}
            <span className="font-bold text-brand-charcoal">{pagination.totalPages || 1}</span>
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white border border-brand-sand/80 text-gray-600 hover:bg-brand-sand/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={page >= (pagination.totalPages || 1)}
              className="p-2 rounded-xl bg-white border border-brand-sand/80 text-gray-600 hover:bg-brand-sand/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Player Preview Modal */}
      {selectedFileForPreview && (
        <VideoPlayer
          video={selectedFileForPreview}
          playbackUrl={playbackUrl}
          onClose={() => {
            setSelectedFileForPreview(null);
            setPlaybackUrl('');
          }}
        />
      )}

      <AnimatePresence>
        {toast && (
          <SaasNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
