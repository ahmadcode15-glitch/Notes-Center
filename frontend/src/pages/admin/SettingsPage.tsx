import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Settings as SettingsIcon, Save, ShieldAlert, Smartphone, Clock, AlertTriangle, MessageCircle, Mail } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.settings.all().then((res) => {
      if (res.success) setSettings(res.settings);
    }).catch((err) => error(err.message || 'Failed to load settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.settings.updateBulk(settings);
      if (res.success) {
        success('Platform configuration saved successfully.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">System & Security Settings</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Configure global platform variables, 24-hr session policies, watermark opacity, and emergency maintenance mode.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Branding Settings */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
            General Branding
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platform_name || 'Notes Center'}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Official Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || 'Your Notes. Your Preparation. Your Success.'}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FACC15]" />
            <span>Security & Session Policies (#7 & #8)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Session Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={settings.session_duration_hours || '24'}
                onChange={(e) => handleChange('session_duration_hours', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Standard: 24 hours. Users will receive "Your session has expired" after this duration.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Default Maximum Allowed Devices
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.default_max_devices || '2'}
                onChange={(e) => handleChange('default_max_devices', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Default allowed simultaneous devices for newly created student accounts.
              </span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Dynamic Watermark Safeguard (#14)
              </label>
              <select
                value={settings.watermark_enabled || 'true'}
                onChange={(e) => handleChange('watermark_enabled', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="true">Enabled (Renders username & session stamp)</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Watermark Opacity (0.05 to 0.40)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.4"
                value={settings.watermark_opacity || '0.15'}
                onChange={(e) => handleChange('watermark_opacity', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode (#38 requirement) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Emergency Maintenance Mode (#38)</span>
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            When enabled, normal student users receive a maintenance banner ("AL Notes Hub is temporarily under maintenance. Please try again later."). Administrators maintain continuous access to this panel.
          </p>

          <div>
            <label className="flex items-center gap-3 text-xs font-bold text-neutral-900 cursor-pointer p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <input
                type="checkbox"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Enable Platform Maintenance Mode</span>
            </label>
          </div>
        </div>

        {/* Support & Contact Settings (#39 requirement) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
            Support & Billing Contacts (#39)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Support WhatsApp Number
              </label>
              <input
                type="text"
                value={settings.support_whatsapp || ''}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                placeholder="support@alnoteshub.com"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Instructions for Device Limit Reset / Subscriptions
            </label>
            <textarea
              rows={2}
              value={settings.support_instructions || ''}
              onChange={(e) => handleChange('support_instructions', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

