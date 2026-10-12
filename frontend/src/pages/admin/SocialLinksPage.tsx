import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Share2, Plus, Trash2, Edit, Save, CheckCircle } from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../../components/common/SocialIcons';

export const SocialLinksPage: React.FC = () => {
  const { success, error } = useToast();

  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLinks = async () => {
    setIsLoading(true);
    try {
      const res = await api.socialLinks.list();
      if (res.success) setLinks(res.links);
    } catch (err: any) {
      error(err.message || 'Failed to fetch social links');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleUpdate = async (link: any) => {
    try {
      const res = await api.socialLinks.update(link.id, {
        url: link.url,
        isEnabled: link.isEnabled,
        title: link.title,
        displayOrder: Number(link.displayOrder),
      });
      if (res.success) {
        success(`${link.platform} link updated!`);
        loadLinks();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update link');
    }
  };

  const getIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'WHATSAPP':
        return <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />;
      case 'FACEBOOK':
        return <FacebookIcon className="w-5 h-5 text-[#1877F2]" />;
      case 'INSTAGRAM':
        return <InstagramIcon className="w-5 h-5 text-[#E4405F]" />;
      default:
        return <Share2 className="w-5 h-5 text-neutral-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Social Media Settings</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Configure external community and WhatsApp support channels. Enabled links automatically appear under "Connect with us" on the student login page (#6 & #24 requirements).
        </p>
      </div>

      <div className="space-y-4">
        {links.map((link, idx) => (
          <div
            key={link.id}
            className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  {getIcon(link.platform)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{link.platform}</h3>
                  <div className="text-[11px] text-neutral-500">
                    Display Order: {link.displayOrder}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={link.isEnabled}
                    onChange={(e) => {
                      const updated = [...links];
                      updated[idx].isEnabled = e.target.checked;
                      setLinks(updated);
                    }}
                    className="rounded border-neutral-300 text-[#FACC15] focus:ring-[#FACC15]"
                  />
                  <span>Show on Login Page</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[idx].title = e.target.value;
                    setLinks(updated);
                  }}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                />
              </div>

              <div className="sm:col-span-8">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[idx].url = e.target.value;
                    setLinks(updated);
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => handleUpdate(link)}
                className="px-4 py-1.5 bg-[#111111] hover:bg-black text-[#FACC15] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Setting</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
