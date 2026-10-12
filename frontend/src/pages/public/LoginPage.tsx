import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { api } from '../../services/api';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../../components/common/SocialIcons';
import { Modal } from '../../components/common/Modal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Device limit reached state
  const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
  const [deviceLimitInfo, setDeviceLimitInfo] = useState<{ max: number; count: number } | null>(null);

  // Social links & public settings
  const [socialLinks, setSocialLinks] = useState<any[]>([
    { id: 'wa-default', platform: 'WHATSAPP', title: 'WhatsApp Support', url: 'https://wa.me/15552345678' }
  ]);
  const [settings, setSettings] = useState<any>({
    support_whatsapp: '+1 (555) 234-5678',
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    // Fetch enabled social links from DB
    api.socialLinks.public().then((res) => {
      if (res.success) setSocialLinks(res.links);
    }).catch(() => {});

    // Fetch public platform settings
    api.settings.public().then((res) => {
      if (res.success) setSettings(res.settings);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(username.trim(), password);
      if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'DEVICE_LIMIT_REACHED') {
        setDeviceLimitInfo({
          max: err.data?.maxDevices || 1,
          count: err.data?.activeDevicesCount || 1,
        });
        setDeviceLimitModalOpen(true);
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'WHATSAPP':
        return <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />;
      case 'FACEBOOK':
        return <FacebookIcon className="w-4 h-4 text-[#1877F2]" />;
      case 'INSTAGRAM':
        return <InstagramIcon className="w-4 h-4 text-[#E4405F]" />;
      default:
        return <HelpCircle className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Column: Brand & Security Overview */}
          <div className="lg:col-span-5 bg-[#111111] text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-800">
            <div>
              {/* Logo */}
              <Logo variant="full" size="lg" theme="dark" showTagline={false} />

              <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Notes Center
                </h2>
                <p className="mt-1.5 text-xs text-[#FACC15] font-semibold tracking-wide">
                  “Your Notes. Your Preparation. Your Success.”
                </p>
              </div>

              {/* 24-Hour Secure Session Notice */}
              <div className="mt-8 bg-neutral-900/90 rounded-xl p-4 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FACC15]">
                  <Clock className="w-4 h-4 text-[#FACC15]" />
                  <span>24-Hour Secure Session</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Your login session remains active for up to 24 hours. For your security and intellectual property protection, you may be asked to log in again after the session expires.
                </p>
              </div>

            </div>

            <div className="pt-6 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Notes Center Academic System</span>
              <span className="font-mono text-[#FACC15]">v1.0 Pro</span>
            </div>
          </div>

          {/* Right Column: Login Card & Social Links */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div className="max-w-md w-full mx-auto">
              <div>
                <h1 className="text-2xl font-black text-neutral-950 tracking-tight">
                  Student & Staff Login
                </h1>
                <p className="mt-1 text-xs text-neutral-500">
                  Enter your credentials to access your protected study notes.
                </p>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-black transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="block w-full pl-10 pr-10 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-black transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 text-sm font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] active:bg-amber-500 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Verifying Session...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Support Channel - ONLY WhatsApp */}
            {socialLinks.filter((l) => l.platform === 'WHATSAPP').length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-200 max-w-md w-full mx-auto text-center">
                <div className="text-xs font-bold text-neutral-700 tracking-wider uppercase mb-3">
                  Support & Inquiries
                </div>
                <div className="flex items-center justify-center">
                  {socialLinks
                    .filter((l) => l.platform === 'WHATSAPP')
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-800 transition-colors shadow-2xs"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                        <span>{link.title}</span>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Device Limit Reached Modal (#7 requirement) */}
      <Modal
        isOpen={deviceLimitModalOpen}
        onClose={() => setDeviceLimitModalOpen(false)}
        title="Device Limit Reached"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Maximum Allowed Devices Reached</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                You have reached the maximum number of devices allowed for your account ({deviceLimitInfo?.count} of {deviceLimitInfo?.max}).
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            For academic integrity and intellectual property protection, each student account is restricted to authorized devices.
          </p>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
            <div className="text-xs font-bold text-neutral-800">What to do:</div>
            <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
              <li>Log out from one of your other active devices (phone, laptop, tablet).</li>
              <li>Or contact our administration support team to request a device limit upgrade or reset.</li>
            </ul>
          </div>

          {settings.support_whatsapp && (
            <a
              href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Admin,%20my%20account%20username%20is%20${username}.%20Please%20assist%20with%20my%20device%20limit.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Contact Administration on WhatsApp
            </a>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setDeviceLimitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
