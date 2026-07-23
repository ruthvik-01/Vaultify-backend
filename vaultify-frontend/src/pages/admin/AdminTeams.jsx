import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import SaasNotification from '../../components/SaasNotification';
import { 
  FolderKanban, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Cloud,
  Code,
  Terminal,
  Database,
  Trash2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTeams();
      if (res && res.teams) {
        setTeams(res.teams);
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setToast({ message: err.message || 'Failed to load teams.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handlePurgeTeamUploads = async (teamName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to purge ALL uploads for Team "${teamName}"? This will permanently delete all files and videos for all students in this team.`)) {
      return;
    }
    try {
      const res = await adminService.deleteTeamUploads(teamName);
      setToast({ message: res.message || `Uploads for team "${teamName}" purged successfully.`, type: 'success' });
      fetchTeams();
    } catch (err) {
      setToast({ message: err.message || 'Failed to purge team uploads.', type: 'error' });
    }
  };

  const getTeamIcon = (name) => {
    const safeName = (name || '').toLowerCase();
    switch (safeName) {
      case 'cloud':
        return <Cloud className="w-7 h-7 text-blue-600" />;
      case 'node js':
      case 'node':
        return <Code className="w-7 h-7 text-emerald-600" />;
      case 'python':
        return <Terminal className="w-7 h-7 text-amber-600" />;
      case 'salesforce':
        return <Database className="w-7 h-7 text-purple-600" />;
      default:
        return <FolderKanban className="w-7 h-7 text-brand-olive" />;
    }
  };

  const toggleExpandTeam = (teamId) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-brand-sand/60 rounded-3xl p-6"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-serif font-bold text-lg text-rose-800">Teams Loading Error</h3>
        <p className="text-xs text-gray-500">{error}</p>
        <button
          onClick={fetchTeams}
          className="px-4 py-2 bg-brand-olive text-white text-xs font-semibold rounded-xl hover:bg-brand-olive-dark transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const safeTeams = Array.isArray(teams) ? teams : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Monitored Teams</h2>
          <p className="text-xs text-gray-500 font-medium">Real team oversight across student training programs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-olive/10 text-brand-olive border border-brand-olive/20">
            Total Teams: {safeTeams.length}
          </span>
        </div>
      </div>

      {/* Teams Grid / List */}
      {safeTeams.length === 0 ? (
        <div className="bg-white border border-brand-sand/70 rounded-3xl p-16 text-center text-gray-400 font-medium space-y-2">
          <FolderKanban className="w-12 h-12 mx-auto text-brand-sage mb-2" />
          <p className="font-serif font-bold text-base text-brand-charcoal">No teams available.</p>
          <p className="text-xs text-gray-400">Add monitored student emails in Settings to organize teams.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeTeams.map((team) => {
            const teamId = team.id || team.name;
            const isExpanded = expandedTeamId === teamId;

            return (
              <div 
                key={teamId}
                className="bg-white border border-brand-sand/70 rounded-3xl overflow-hidden shadow-sm transition-all"
              >
                {/* Team Card Header */}
                <div 
                  onClick={() => toggleExpandTeam(teamId)}
                  className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-cream/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-brand-cream border border-brand-sand/60 rounded-2xl shrink-0">
                      {getTeamIcon(team.name)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-serif font-bold text-xl text-brand-charcoal">{team.name} Team</h3>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-olive/10 text-brand-olive">
                          {team.studentCount || (team.students ? team.students.length : 0)} Students
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Storage Used: <span className="font-semibold text-gray-700">{formatSize(team.storageUsed)}</span> • Uploads: <span className="font-semibold text-brand-olive">{team.totalUploads || 0} files</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="text-right text-xs text-gray-400 font-medium hidden md:block">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-brand-olive" />
                        <span>Latest: {team.latestUpload ? formatDate(team.latestUpload) : 'No uploads'}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handlePurgeTeamUploads(team.name, e)}
                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                      title={`Purge all uploads for ${team.name} Team`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl bg-brand-cream text-brand-charcoal hover:bg-brand-sand/50 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Student Roster List */}
                {isExpanded && (
                  <div className="border-t border-brand-sand/60 bg-brand-cream/30 p-6 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Students in {team.name} Team
                    </h4>

                    {team.students && team.students.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.students.map((student) => (
                          <div
                            key={student.id || student.email}
                            className="p-4 bg-white border border-brand-sand/70 rounded-2xl flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-brand-olive/10 text-brand-olive font-bold flex items-center justify-center text-xs shrink-0">
                                {student.studentName ? student.studentName.charAt(0) : 'S'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-brand-charcoal truncate">
                                  {student.studentName}
                                </h5>
                                <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-brand-sand/40">
                              <div>
                                <span className="text-gray-500 font-medium block">Uploads: <strong className="text-brand-olive">{student.totalUploads || 0}</strong></span>
                                <span className="text-gray-400 block text-[10px]">Storage: {formatSize(student.storageUsed)}</span>
                              </div>
                              <Link
                                to={`/admin/uploads?student=${encodeURIComponent(student.studentName)}`}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-brand-cream hover:bg-brand-olive/10 border border-brand-sand/70 text-brand-olive text-[10px] font-bold transition-colors cursor-pointer"
                                title="View Upload History"
                              >
                                <span>History</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No monitored students in this team.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {toast && (
          <SaasNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
