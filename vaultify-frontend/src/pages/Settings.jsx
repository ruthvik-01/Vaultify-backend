import React, { useState, useEffect } from 'react';
import { useFiles } from '../context/FileContext';
import { 
  User, Bell, Palette, Save, ShieldCheck, 
  CheckCircle2, Monitor, GraduationCap, Moon, Sun, Type
} from 'lucide-react';

export default function Settings() {
  const { user, notifications, updateProfile, updateNotifications, showNotification } = useFiles();
  const [activeSubTab, setActiveSubTab] = useState('account'); // account | notifications | preferences
  const [isSaving, setIsSaving] = useState(false);

  // Account Form states
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [university, setUniversity] = useState(user.organization || user.university || '');
  
  // Notification states
  const [emailOnShare, setEmailOnShare] = useState(notifications.emailOnShare);
  const [emailOnDownload, setEmailOnDownload] = useState(notifications.emailOnDownload);
  const [placementAlerts, setPlacementAlerts] = useState(notifications.placementAlerts);
  const [weeklyReport, setWeeklyReport] = useState(notifications.weeklyReport);

  // Preference / Styling states (initialized from active user settings)
  const [themeColor, setThemeColor] = useState(user.theme_color || 'grid');
  const [darkMode, setDarkMode] = useState(user.dark_mode || 'light');
  const [sidebarColor, setSidebarColor] = useState(user.sidebar_color || 'expanded');
  const [accentColor, setAccentColor] = useState(user.accent_color || 'green');
  const [fontSize, setFontSize] = useState(user.font_size || 'medium');

  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email || '');
    setUniversity(user.organization || user.university || '');
    setThemeColor(user.theme_color || 'grid');
    setDarkMode(user.dark_mode || 'light');
    setSidebarColor(user.sidebar_color || 'expanded');
    setAccentColor(user.accent_color || 'green');
    setFontSize(user.font_size || 'medium');
  }, [user]);

  useEffect(() => {
    setEmailOnShare(notifications.emailOnShare);
    setEmailOnDownload(notifications.emailOnDownload);
    setPlacementAlerts(notifications.placementAlerts);
    setWeeklyReport(notifications.weeklyReport);
  }, [notifications]);

  const handleAccountSave = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    updateProfile({
      name,
      university,
      organization: university
    }).then(() => {
      showNotification('Account credentials saved successfully!', 'success');
    }).catch(err => {
      showNotification('Failed to save credentials: ' + (err?.message || 'Error updating credentials'), 'error');
    }).finally(() => {
      setIsSaving(false);
    });
  };

  const updateNotificationPreference = (key, value) => {
    // Immediate state change
    if (key === 'emailOnShare') setEmailOnShare(value);
    if (key === 'emailOnDownload') setEmailOnDownload(value);
    if (key === 'placementAlerts') setPlacementAlerts(value);
    if (key === 'weeklyReport') setWeeklyReport(value);

    updateNotifications({ [key]: value });
    showNotification('Notification preference auto-saved!', 'success');
  };

  const updatePreference = (key, value) => {
    // Immediate state change
    if (key === 'theme_color') setThemeColor(value);
    if (key === 'dark_mode') setDarkMode(value);
    if (key === 'sidebar_color') setSidebarColor(value);
    if (key === 'accent_color') setAccentColor(value);
    if (key === 'font_size') setFontSize(value);

    updateProfile({ [key]: value })
      .then(() => {
        showNotification('Styling preference updated immediately!', 'success');
      })
      .catch(err => {
        showNotification('Failed to auto-save styling preference: ' + err.message, 'error');
      });
  };

  return (
    <div className="bg-white border border-brand-sand rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[550px]">
      
      {/* Settings Navigation Column */}
      <div className="w-full md:w-64 bg-brand-cream border-r border-brand-sand/70 p-4 space-y-1 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-3 mb-3">Locker Settings</span>
        
        <button
          onClick={() => setActiveSubTab('account')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'account'
              ? 'bg-brand-olive text-white'
              : 'text-gray-600 hover:bg-brand-sand/50 hover:text-brand-charcoal'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Credentials</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'bg-brand-olive text-white'
              : 'text-gray-600 hover:bg-brand-sand/50 hover:text-brand-charcoal'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Display & Styling</span>
        </button>
      </div>

      {/* Settings Action Content Body */}
      <div className="flex-1 p-6 sm:p-8">
        
        {/* Sub-tab: Account details form */}
        {activeSubTab === 'account' && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Account Credentials</h3>
              <p className="text-xs text-gray-500 mt-1">Configure your personal credentials and locker registries.</p>
            </div>

            <form onSubmit={handleAccountSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-olive"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  placeholder="Email cannot be changed."
                  className="w-full px-3 py-2.5 bg-gray-100/70 border border-brand-sand rounded-xl text-xs text-gray-500 cursor-not-allowed opacity-75 focus:outline-none select-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                  Organization / University
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Andhra University, JNTU, Stanford"
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-sand rounded-xl text-xs text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-olive"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`bg-brand-olive hover:bg-brand-olive-dark text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer pt-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Credentials'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Sub-tab: Preferences */}
        {activeSubTab === 'preferences' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Display & Styling</h3>
              <p className="text-xs text-gray-500 mt-1">Customize your Vaultify workspace looks, themes, and layouts.</p>
            </div>

            <div className="space-y-5">
              
              {/* Display View Layout Preference */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Display View Layout
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {[
                    { id: 'grid', name: 'Card View' },
                    { id: 'list', name: 'List View' }
                  ].map((viewOpt) => (
                    <button
                      key={viewOpt.id}
                      type="button"
                      onClick={() => updatePreference('theme_color', viewOpt.id)}
                      className={`p-3 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                        themeColor === viewOpt.id
                          ? 'border-brand-olive bg-brand-olive/10 text-brand-olive'
                          : 'border-brand-sand text-gray-500 hover:bg-brand-cream'
                      }`}
                    >
                      {viewOpt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Options */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Theme Options
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { id: 'light', name: 'Light Mode', icon: Sun, iconColor: 'text-amber-500' },
                    { id: 'dark', name: 'Dark Mode', icon: Moon, iconColor: 'text-indigo-400' },
                    { id: 'system', name: 'System Mode', icon: Monitor, iconColor: 'text-gray-500' }
                  ].map((themeOpt) => {
                    const Icon = themeOpt.icon;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => updatePreference('dark_mode', themeOpt.id)}
                        className={`flex flex-col items-center justify-center p-3 border rounded-xl text-xs font-bold transition-all cursor-pointer space-y-1.5 ${
                          darkMode === themeOpt.id
                            ? 'border-brand-olive bg-brand-olive/10 text-brand-olive'
                            : 'border-brand-sand text-gray-500 hover:bg-brand-cream'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${themeOpt.iconColor}`} />
                        <span>{themeOpt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Customization */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Sidebar Customization
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {[
                    { id: 'compact', name: 'Compact Sidebar' },
                    { id: 'expanded', name: 'Expanded Sidebar' }
                  ].map((sidebarOpt) => (
                    <button
                      key={sidebarOpt.id}
                      type="button"
                      onClick={() => updatePreference('sidebar_color', sidebarOpt.id)}
                      className={`p-3 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                        sidebarColor === sidebarOpt.id
                          ? 'border-brand-olive bg-brand-olive/10 text-brand-olive'
                          : 'border-brand-sand text-gray-500 hover:bg-brand-cream'
                      }`}
                    >
                      {sidebarOpt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Colors */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'green', name: 'Green (Default)', color: 'bg-emerald-600' },
                    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
                    { id: 'purple', name: 'Purple', color: 'bg-purple-500' },
                    { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
                    { id: 'red', name: 'Red', color: 'bg-red-500' }
                  ].map((accentOpt) => (
                    <button
                      key={accentOpt.id}
                      type="button"
                      onClick={() => updatePreference('accent_color', accentOpt.id)}
                      className={`flex items-center space-x-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        accentColor === accentOpt.id
                          ? 'border-brand-olive bg-brand-olive/10 text-brand-olive'
                          : 'border-brand-sand text-gray-500 hover:bg-brand-cream'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${accentOpt.color}`} />
                      <span>{accentOpt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-sm">
                  {[
                    { id: 'small', name: 'Small' },
                    { id: 'medium', name: 'Medium' },
                    { id: 'large', name: 'Large' }
                  ].map((fontOpt) => (
                    <button
                      key={fontOpt.id}
                      type="button"
                      onClick={() => updatePreference('font_size', fontOpt.id)}
                      className={`p-2.5 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        fontSize === fontOpt.id
                          ? 'border-brand-olive bg-brand-olive/10 text-brand-olive'
                          : 'border-brand-sand text-gray-500 hover:bg-brand-cream'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5 text-gray-400" />
                      <span>{fontOpt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-medium italic flex items-center pt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                <span>Preferences auto-save instantly</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
