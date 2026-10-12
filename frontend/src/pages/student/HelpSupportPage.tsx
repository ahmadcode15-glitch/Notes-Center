import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MessageCircle, Mail, Phone, HelpCircle, Shield, Smartphone } from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    support_whatsapp: '+1 (555) 234-5678',
    support_email: 'support@alnoteshub.com',
  });

  useEffect(() => {
    api.settings.public().then((res) => {
      if (res.success && res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Help & Student Support</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Have questions regarding subscriptions, device limit resets, or syllabus coverage? We are here to assist.
        </p>
      </div>

      {/* Direct Contact Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.support_whatsapp && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">WhatsApp Administration Support</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                Connect directly with our administration team for manual fee verification, device limit extensions, and immediate account unlocks.
              </p>
              <div className="mt-3 font-mono text-xs font-bold text-neutral-800">
                {settings.support_whatsapp}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100">
              <a
                href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {settings.support_email && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Official Support Email</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                For formal institutional inquiries, bulk university student licenses, or payment receipts submission.
              </p>
              <div className="mt-3 font-mono text-xs font-bold text-neutral-800">
                {settings.support_email}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100">
              <a
                href={`mailto:${settings.support_email}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#FACC15] font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#FACC15]" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-4 divide-y divide-neutral-100">
          <div className="pt-3">
            <h4 className="text-xs font-bold text-neutral-800">
              Why does my session expire after 24 hours?
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Notes Center operates a 24-hour secure session policy to protect proprietary educational material and prevent unauthorized access from shared computers.
            </p>
          </div>

          <div className="pt-3">
            <h4 className="text-xs font-bold text-neutral-800">
              What should I do if I see "Device Limit Reached"?
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              You can log out from another device via your Profile page or contact the administrator via WhatsApp with your username to reset your active sessions or increase your limit.
            </p>
          </div>

          <div className="pt-3">
            <h4 className="text-xs font-bold text-neutral-800">
              Can I download the notes as PDF?
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              To preserve copyright and intellectual property integrity, notes are provided exclusively through our authenticated online study reader equipped with font scaling and reading themes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

