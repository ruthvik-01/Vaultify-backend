import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SaasNotification from '../../components/SaasNotification';
import { 
  Lock, 
  User, 
  Download, 
  Trash2, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Users,
  X
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'security'
  const [toast, setToast] = useState(null);

  // Change Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Roster Management States
  const [roster, setRoster] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Monitored Student Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentTeam, setNewStudentTeam] = useState('Cloud');

  // Feedback Messages
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rosterMessage, setRosterMessage] = useState('');
  const [rosterError, setRosterError] = useState('');

  // Loading indicator states
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // Load Monitored Student Roster list from backend
  const loadRoster = useCallback(async () => {
    setLoadingRoster(true);
    setRosterError('');
    try {
      const res = await adminService.getStudents({
        search,
        page,
        limit: 10
      });
      if (res && res.students) {
        setRoster(res.students);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load student roster:', err);
      setRosterError(err.message || 'Failed to load roster from backend.');
    } finally {
      setLoadingRoster(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // Handle Add Student Action
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentTeam.trim()) {
      setRosterError('Please fill in all student details.');
      return;
    }
    setSubmittingStudent(true);
    setRosterError('');
    setRosterMessage('');

    try {
      await adminService.addMonitoredStudent({
        studentName: newStudentName.trim(),
        email: newStudentEmail.trim(),
        team: newStudentTeam.trim()
      });
      setRosterMessage(`Successfully added "${newStudentName}" to monitored roster.`);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentTeam('Cloud');
      setShowAddModal(false);
      loadRoster();
    } catch (err) {
      setRosterError(err.message || 'Failed to add student email to roster.');
    } finally {
      setSubmittingStudent(false);
    }
  };

  // Handle Delete Student Action
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the monitored roster?`)) {
      return;
    }
    setRosterError('');
    setRosterMessage('');
    try {
      await adminService.deleteMonitoredStudent(id);
      setRosterMessage(`Student "${name}" successfully removed.`);
      loadRoster();
    } catch (err) {
      setRosterError(err.message || 'Failed to delete student from roster.');
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await adminService.changePassword(oldPassword, newPassword);
      setPasswordMessage(res.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update admin password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Export Data Handler
  const handleExportData = async () => {
    try {
      await adminService.exportMonitoringData();
      setToast({ message: 'Monitoring data exported successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to export data.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Admin Portal Settings</h2>
          <p className="text-xs text-gray-500 font-medium">Manage monitored student emails, security credentials, and data exports.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-brand-sand rounded-xl text-xs font-semibold text-gray-700 hover:bg-brand-sand/40 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-olive" />
            <span>Export Roster CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-brand-sand/60 pb-1">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-brand-olive text-white shadow-sm'
              : 'text-gray-600 hover:text-brand-charcoal hover:bg-brand-sand/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Allowed Monitored Emails ({totalCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'bg-brand-olive text-white shadow-sm'
              : 'text-gray-600 hover:text-brand-charcoal hover:bg-brand-sand/40'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Admin Security</span>
        </button>
      </div>

      {/* Tab 1: Allowed Monitored Emails Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {rosterMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rosterMessage}</span>
            </div>
          )}

          {rosterError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{rosterError}</span>
            </div>
          )}

          <div className="bg-white border border-brand-sand/70 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, email, or team..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-brand-cream/40 border border-brand-sand/80 rounded-2xl text-xs text-brand-charcoal font-medium focus:outline-none focus:border-brand-olive transition-colors"
              />
            </div>

            {/* Roster Table (Student Name, Email, Team, Delete Button ONLY) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-sand/60 bg-brand-cream/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Team</th>
                    <th className="py-3 px-6 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sand/40 text-xs">
                  {loadingRoster ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-6"><div className="h-4 bg-brand-sand/50 rounded w-32"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-brand-sand/50 rounded w-48"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-brand-sand/50 rounded w-24"></div></td>
                        <td className="py-4 px-6"><div className="h-8 bg-brand-sand/50 rounded-xl w-12 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : (roster || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-gray-400 font-medium">
                        <User className="w-12 h-12 mx-auto mb-3 text-brand-sage" />
                        <p className="font-serif font-bold text-sm text-brand-charcoal">No monitored students found.</p>
                      </td>
                    </tr>
                  ) : (
                    (roster || []).map((student) => (
                      <tr key={student?.id || student?._id || student?.email} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-brand-charcoal">
                          {student?.studentName || student?.name || 'Monitored Student'}
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{student?.email || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-brand-olive bg-brand-olive/10 px-2.5 py-1 rounded-full text-[11px]">
                            {student?.team || 'General'} Team
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleDeleteStudent(student?.id || student?._id, student?.studentName || student?.name || 'Student')}
                            className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <span className="font-bold text-brand-charcoal">{totalPages}</span> ({totalCount} total students)
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-white border border-brand-sand/80 text-gray-600 hover:bg-brand-sand/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Change Password */}
      {activeTab === 'security' && (
        <div className="max-w-xl bg-white border border-brand-sand/70 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 border-b border-brand-sand/40 pb-3">
            <Lock className="w-5 h-5 text-brand-olive" />
            <h3 className="font-serif font-bold text-base text-brand-charcoal">Change Admin Password</h3>
          </div>

          {passwordMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-charcoal block mb-1">Current Password</label>
              <input
                type="password"
                placeholder="Enter current admin password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-charcoal block mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-charcoal block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submittingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Add Monitored Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-brand-sand rounded-3xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-sand/40 pb-3">
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">Add Monitored Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-brand-charcoal hover:bg-brand-sand/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-brand-charcoal block mb-1">Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-charcoal block mb-1">Student Email Address</label>
                <input
                  type="email"
                  placeholder="alex.johnson@student.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-charcoal block mb-1">Assigned Training Team</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud, Node JS, Python..."
                  value={newStudentTeam}
                  onChange={(e) => setNewStudentTeam(e.target.value)}
                  className="w-full px-3.5 py-2 bg-brand-cream/40 border border-brand-sand/80 rounded-xl text-xs text-brand-charcoal focus:outline-none focus:border-brand-olive"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="px-4 py-2 bg-brand-olive hover:bg-brand-olive-dark text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingStudent ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
