import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import VideoPlayer from '../../components/video/VideoPlayer';
import SaasNotification from '../../components/SaasNotification';
import {
  Users,
  FolderKanban,
  HardDrive,
  UploadCloud,
  RefreshCw,
  Eye,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Share2,
  Download,
  Check
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  const handleOpenLink = (file) => {
    const link = file.publicUrl || file.url || `${window.location.origin}/share/${file.id}`;
    window.open(link, '_blank');
  };

  const handleCopyShareLink = (file) => {
    const link = file.publicUrl || file.url || `${window.location.origin}/share/${file.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (file) => {
    const link = file.publicUrl || file.url || '';
    if (link) window.open(link, '_blank');
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getStats();
      if (res && res.stats) {
        setStats(res.stats);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const safeStats = (stats && typeof stats === 'object') ? stats : {};
  const totalMonitoredStudents = safeStats.totalMonitoredStudents || 0;
  const totalTeams = safeStats.totalTeams || 0;
  const totalUploads = safeStats.totalUploads || 0;
  const totalStorageUsed = safeStats.totalStorageUsed || 0;
  const todayUploads = safeStats.todayUploads || 0;
  const recentUploads = Array.isArray(safeStats.recentUploads) ? safeStats.recentUploads : [];

  const handleOpenPreview = async (file) => {
    try {
      const url = await adminService.getPreviewUrl(file.id, file.fileType);
      setSelectedFileForPreview({
        name: file.fileName,
        size: file.size,
        mimeType: file.fileType === 'video' ? 'video/mp4' : file.fileType === 'image' ? 'image/png' : 'application/pdf',
        ...file
      });
      setPlaybackUrl(url);
    } catch (err) {
      setToast({ message: err.message || 'Failed to retrieve preview.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-brand-sand/60 rounded-2xl p-5 flex flex-col justify-between">
              <div className="h-4 bg-brand-sand/50 rounded w-1/2"></div>
              <div className="h-8 bg-brand-sand/60 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="h-80 bg-white border border-brand-sand/60 rounded-3xl animate-pulse p-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-serif font-bold text-lg text-rose-800">Connection Error</h3>
        <p className="text-xs text-gray-500">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-brand-olive text-white text-xs font-semibold rounded-xl hover:bg-brand-olive-dark transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const metricCards = [
    { title: 'Total Monitored Students', value: totalMonitoredStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/settings' },
    { title: 'Total Teams', value: totalTeams, icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/teams' },
    { title: 'Total Uploads', value: totalUploads, icon: UploadCloud, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/uploads' },
    { title: 'Total Storage Used', value: formatSize(totalStorageUsed), icon: HardDrive, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/admin/uploads' },
    { title: "Today's Uploads", value: todayUploads, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/uploads' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Admin Monitoring Dashboard</h2>
          <p className="text-xs text-gray-500 font-medium">Real-time oversight of monitored student training uploads and team storage.</p>
        </div>
        <button
          onClick={fetchStats}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 bg-white border border-brand-sand rounded-xl text-xs font-semibold text-gray-700 hover:bg-brand-sand/40 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-olive" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5 Simple Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.link}>
              <div className="bg-white border border-brand-sand/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group h-full cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
                  <h3 className="font-serif font-bold text-xl text-brand-charcoal tracking-tight group-hover:text-brand-olive transition-colors">
                    {card.value}
                  </h3>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0 ml-2`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-white border border-brand-sand/70 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-brand-sand/40 pb-3">
          <h3 className="font-serif font-bold text-base text-brand-charcoal">Recent Uploads</h3>
          <Link to="/admin/uploads" className="text-xs text-brand-olive font-semibold hover:underline">
            View All Uploads →
          </Link>
        </div>

        {recentUploads.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-brand-sage" />
            <p className="font-serif font-bold text-sm text-brand-charcoal">No uploads available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-sand/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">File Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Upload Status</th>
                  <th className="py-3 px-4">Uploaded Time</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sand/40 text-xs">
                {recentUploads.map((file) => (
                  <tr key={file.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-charcoal">{file.student}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">{file.team}</td>
                    <td className="py-3.5 px-4 font-semibold text-brand-charcoal max-w-[200px] truncate">
                      {file.fileName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-brand-cream text-brand-olive border border-brand-sand/60">
                        {file.fileType || 'file'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">{formatSize(file.size)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium">{formatDate(file.uploadDate)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenPreview(file)}
                          className="p-1.5 rounded-xl bg-brand-olive text-white hover:bg-brand-olive-dark transition-colors cursor-pointer"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenLink(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 text-brand-charcoal border border-brand-sand/80 transition-colors cursor-pointer"
                          title="Open Link in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-brand-olive" />
                        </button>
                        <button
                          onClick={() => handleCopyShareLink(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 text-brand-charcoal border border-brand-sand/80 transition-colors cursor-pointer"
                          title="Copy Share Link"
                        >
                          {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-brand-olive" />}
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-xl bg-brand-cream hover:bg-brand-sand/60 text-brand-charcoal border border-brand-sand/80 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-brand-olive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
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

      {/* Notification Toast */}
      <AnimatePresence>
        {toast && (
          <SaasNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
