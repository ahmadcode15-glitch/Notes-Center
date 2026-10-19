import React, { useState, useEffect } from 'react';
import { Watermark } from '../common/Watermark';
import { resolveFileUrl } from '../../services/api';
import {
  ShieldAlert,
  Type,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  File,
} from 'lucide-react';
import { Note } from '../../types';

interface NoteReaderProps {
  note: Note;
  watermark: {
    enabled: boolean;
    opacity: number;
    studentUsername: string;
    sessionId: string;
    watermarkText: string;
  };
  onBack: () => void;
}

export const NoteReader: React.FC<NoteReaderProps> = ({ note, watermark, onBack }) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [readingTheme, setReadingTheme] = useState<'clean' | 'warm' | 'dark'>('clean');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeterrenceNotice, setShowDeterrenceNotice] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [securityNoticeText, setSecurityNoticeText] = useState(
    'Protected Content: Screen capture, recording, saving, and copying are disabled.'
  );

  // Advanced Anti-Screen Recording & Anti-Screenshot Defenses
  useEffect(() => {
    // 1. Monkey-patch navigator.mediaDevices.getDisplayMedia to block browser screen recording / tab sharing
    let originalGetDisplayMedia: any = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async () => {
        setSecurityNoticeText('Screen recording and screen sharing are strictly prohibited on protected study material.');
        setShowDeterrenceNotice(true);
        throw new DOMException('Screen recording is disabled for protected notes.', 'NotAllowedError');
      };
    }

    // 2. Window Blur & Visibility Shield (Blocks Snipping Tool, Win+Shift+S, Alt+Tab, Screen Recorders)
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    // 3. Screen Capture & Recording Key Listener
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // PrintScreen Key detection
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        try {
          navigator.clipboard?.writeText('⚠️ Protected Content: Screenshotting Notes Center material is prohibited.');
        } catch (_) {}
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2000);
        setSecurityNoticeText('Screenshots and screen captures are strictly blocked.');
        setShowDeterrenceNotice(true);
        setTimeout(() => setShowDeterrenceNotice(false), 4000);
      }

      // Block Ctrl/Cmd + (S, P, C, U, A, X)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (['s', 'p', 'c', 'u', 'a', 'x'].includes(key)) {
          e.preventDefault();
          setSecurityNoticeText(`Keyboard shortcut (Ctrl+${key.toUpperCase()}) is disabled on protected study notes.`);
          setShowDeterrenceNotice(true);
          setTimeout(() => setShowDeterrenceNotice(false), 3500);
        }

        // Win/Cmd/Ctrl + Shift + S (Snipping Tool) or DevTools (Ctrl+Shift+I/J/C)
        if (e.shiftKey && ['s', 'i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          setIsWindowBlurred(true);
          setTimeout(() => setIsWindowBlurred(false), 2500);
          setSecurityNoticeText('Screen capture shortcut detected and blocked.');
          setShowDeterrenceNotice(true);
          setTimeout(() => setShowDeterrenceNotice(false), 3500);
        }
      }

      // Block F12 Developer Tools
      if (e.key === 'F12' || e.code === 'F12') {
        e.preventDefault();
        setSecurityNoticeText('Developer inspection tools are disabled.');
        setShowDeterrenceNotice(true);
        setTimeout(() => setShowDeterrenceNotice(false), 3500);
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        try {
          navigator.clipboard?.writeText('⚠️ Protected Content: Screenshotting Notes Center material is prohibited.');
        } catch (_) {}
      }
    };

    // 4. Clipboard / Copy block
    const handleGlobalCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setSecurityNoticeText('Copying protected content is not allowed.');
      setShowDeterrenceNotice(true);
      setTimeout(() => setShowDeterrenceNotice(false), 3500);
    };

    // 5. Context menu block
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityNoticeText('Right-click context menu is disabled.');
      setShowDeterrenceNotice(true);
      setTimeout(() => setShowDeterrenceNotice(false), 3000);
    };

    // 6. Before Print
    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      setIsWindowBlurred(true);
      setSecurityNoticeText('Printing protected educational documents is prohibited.');
      setShowDeterrenceNotice(true);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('keyup', handleGlobalKeyUp, true);
    document.addEventListener('copy', handleGlobalCopy, true);
    document.addEventListener('cut', handleGlobalCopy, true);
    document.addEventListener('contextmenu', handleGlobalContextMenu, true);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('keyup', handleGlobalKeyUp, true);
      document.removeEventListener('copy', handleGlobalCopy, true);
      document.removeEventListener('cut', handleGlobalCopy, true);
      document.removeEventListener('contextmenu', handleGlobalContextMenu, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSecurityNoticeText('Right-click context menu is disabled on protected educational material.');
    setShowDeterrenceNotice(true);
    setTimeout(() => setShowDeterrenceNotice(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'PrintScreen' || ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'u', 'a', 'x'].includes(e.key.toLowerCase()))) {
      e.preventDefault();
      setIsWindowBlurred(true);
      setTimeout(() => setIsWindowBlurred(false), 2000);
      setSecurityNoticeText('Action blocked: Content is protected against copying and screen capture.');
      setShowDeterrenceNotice(true);
      setTimeout(() => setShowDeterrenceNotice(false), 3500);
    }
  };

  const fontSizes = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  };

  const themes = {
    clean: 'bg-white text-neutral-900 border-neutral-200',
    warm: 'bg-[#FCFBF7] text-[#2C2926] border-[#E8E6DF]',
    dark: 'bg-[#141414] text-[#E0E0E0] border-[#2E2E2E]',
  };

  // Enhanced Markdown & Visual Media Formatter
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${i}`} className="my-5 rounded-lg overflow-hidden border border-neutral-800 bg-[#0E0E0E]">
              {codeLanguage && (
                <div className="bg-[#1C1C1C] px-4 py-1.5 text-[11px] font-mono text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                  <span>{codeLanguage}</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Online Protected Code</span>
                </div>
              )}
              <pre className="p-4 text-xs sm:text-sm font-mono text-amber-100 overflow-x-auto leading-relaxed m-0">
                <code>{codeContent.join('\n')}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeContent = [];
          codeLanguage = '';
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          codeContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Image Markdown: ![alt](url)
      const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        const altText = imageMatch[1];
        const rawUrl = imageMatch[2];
        const imageUrl = resolveFileUrl(rawUrl);

        elements.push(
          <div key={`img-${i}`} className="my-6 flex flex-col items-center justify-center select-none">
            <div className="relative group max-w-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50/60 p-2">
              <img
                src={imageUrl}
                alt={altText || 'Study Material Diagram'}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-[550px] w-auto max-w-full rounded-xl object-contain pointer-events-none select-none bg-white"
                loading="lazy"
              />
            </div>
            {altText && (
              <span className="mt-2 text-xs font-mono text-neutral-500 text-center font-medium">
                📷 {altText}
              </span>
            )}
          </div>
        );
        continue;
      }

      // Document Link: [filename](url)
      const docLinkMatch = line.match(/^>\s*📄\s*\*\*Attached Document\*\*:\s*\[(.*?)\]\((.*?)\)$/);
      if (docLinkMatch) {
        const docName = docLinkMatch[1];
        const docUrl = resolveFileUrl(docLinkMatch[2]);
        elements.push(
          <div key={`doc-${i}`} className="my-5 p-4 rounded-xl border border-amber-300 bg-amber-50/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <div>
                <div className="font-bold text-neutral-900">{docName}</div>
                <div className="text-[11px] text-neutral-600">Attached Study Resource (Protected Access)</div>
              </div>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#111111] text-[#FACC15] font-bold rounded-lg hover:bg-neutral-800 transition-colors"
            >
              View Document
            </a>
          </div>
        );
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-8 mb-4 border-b pb-3 border-neutral-200">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl sm:text-2xl font-bold tracking-tight mt-6 mb-3 text-neutral-800">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-bold tracking-tight mt-5 mb-2 text-neutral-700">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-[#FACC15] bg-amber-50/70 p-3.5 my-4 rounded-r-lg text-sm text-neutral-800 italic">
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} className="my-6 border-neutral-200" />);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-5 list-disc my-1">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={i} className="ml-5 list-decimal my-1">
            {line.replace(/^\d+\.\s+/, '')}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-3" />);
      } else {
        elements.push(
          <p key={i} className="my-2">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="outline-none flex flex-col space-y-4 select-none"
    >
      {/* Deterrence Toast Notification */}
      {showDeterrenceNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#111111] text-white p-4 rounded-xl shadow-2xl border border-neutral-800 flex items-start gap-3 max-w-sm animate-bounce">
          <ShieldAlert className="w-5 h-5 text-[#FACC15] flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-[#FACC15]">Protected Study Environment</div>
            <div className="text-neutral-300 mt-1">
              Educational content is protected. Unauthorized sharing, reproduction, or redistribution is strictly prohibited.
            </div>
          </div>
        </div>
      )}

      {/* Reader Control Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </button>
          <div className="h-4 w-px bg-neutral-200" />
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium truncate max-w-xs sm:max-w-md">
            <BookOpen className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <span className="truncate">{note.course?.title || 'Course'}</span>
            <span>/</span>
            <span className="truncate font-semibold text-neutral-800">{note.subject?.title || 'Subject'}</span>
          </div>
        </div>

        {/* Reader Customization Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-1 text-xs font-bold rounded ${
                  fontSize === size ? 'bg-white text-black shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            <button
              onClick={() => setReadingTheme('clean')}
              title="Light Mode"
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                readingTheme === 'clean' ? 'bg-white text-black shadow-xs' : 'text-neutral-600'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setReadingTheme('warm')}
              title="Warm Sepia"
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                readingTheme === 'warm' ? 'bg-[#FCFBF7] text-[#2C2926] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Warm
            </button>
            <button
              onClick={() => setReadingTheme('dark')}
              title="Dark Mode"
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                readingTheme === 'dark' ? 'bg-[#111111] text-[#FACC15] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Dark
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-600 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Security Deterrence Alert Popup */}
      {showDeterrenceNotice && (
        <div className="p-3.5 bg-red-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-bold transition-all">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-white flex-shrink-0" />
            <span>{securityNoticeText}</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">Security Monitored</span>
        </div>
      )}

      {/* Security Info Banner */}
      <div className="bg-neutral-900 text-neutral-300 px-4 py-2.5 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
          <span>
            <strong className="text-white">Protected Online Reader:</strong> Educational content is licensed strictly for individual student study. Downloads, extraction, and screen captures are prohibited.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-[#FACC15]">
          <span>Student ID: {watermark.studentUsername}</span>
        </div>
      </div>

      {/* Main Reading Canvas with Dynamic Floating Watermark & Privacy Shield */}
      <div
        className={`relative rounded-xl border p-6 sm:p-12 shadow-sm transition-colors duration-150 min-h-[800px] overflow-hidden select-none ${
          themes[readingTheme]
        }`}
        onContextMenu={handleContextMenu}
      >
        {/* Anti-Screen Capture Inactive Window Shield */}
        {isWindowBlurred && (
          <div className="absolute inset-0 z-50 bg-neutral-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-[#FACC15]" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">Content Protected</h3>
            <p className="text-xs text-neutral-400 max-w-sm mt-1.5 leading-relaxed">
              Study material is securely hidden while the window is inactive or screen capture tools are detected. Click back into this window to resume study.
            </p>
            <div className="mt-5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] font-mono text-neutral-400">
              Student ID: @{watermark.studentUsername} • Notes Center Shield
            </div>
          </div>
        )}
        {/* Dynamic Watermark Layer */}
        <Watermark
          username={watermark.studentUsername}
          sessionId={watermark.sessionId}
          opacity={watermark.opacity}
          enabled={watermark.enabled}
        />

        {/* Note Document Content Container */}
        <div className={`relative z-10 max-w-4xl mx-auto ${fontSizes[fontSize]}`}>
          {/* Note Metadata Header */}
          <div className="border-b pb-6 mb-8 border-neutral-200">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-3">
              <span className="px-2.5 py-1 rounded bg-[#FACC15] text-black font-bold">
                {note.subject?.code || 'CS'}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-600">{note.topic?.title || 'General Topic'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {note.title}
            </h1>

            {note.description && (
              <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
                {note.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500 font-medium">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published: {new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Verified Exam Material</span>
              </div>
            </div>
          </div>

          {/* Note Cover Image if present */}
          {note.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm max-h-[450px] flex items-center justify-center bg-neutral-100 select-none">
              <img
                src={resolveFileUrl(note.coverImage)}
                alt={note.title}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover pointer-events-none select-none max-h-[450px]"
              />
            </div>
          )}

          {/* Attached Document or PDF Viewer */}
          {note.filePath && (
            <div className="mb-8 rounded-2xl border border-neutral-300 overflow-hidden shadow-sm bg-neutral-900 select-none">
              <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs text-white font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FACC15]" />
                  <span className="font-bold">Attached Study Material ({note.fileType || 'Document'})</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                  Protected Document Stream
                </span>
              </div>
              {note.fileType === 'PDF' || note.filePath.toLowerCase().endsWith('.pdf') ? (
                <div className="relative w-full h-[700px] bg-neutral-800">
                  <iframe
                    src={`${resolveFileUrl(note.filePath)}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0 select-none"
                    title="Protected PDF Document"
                  />
                </div>
              ) : (
                <div className="p-6 bg-neutral-50 text-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{note.title} Attachment</div>
                      <div className="text-xs text-neutral-500">Document file secured in study portal.</div>
                    </div>
                  </div>
                  <a
                    href={resolveFileUrl(note.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#111111] text-[#FACC15] text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Formatted Educational Body */}
          <div className="protected-study-content font-sans">
            {renderFormattedContent(note.content)}
          </div>

          {/* End of Study Document Notice */}
          <div className="mt-16 pt-8 border-t border-dashed border-neutral-300 text-center text-xs text-neutral-500">
            <p className="font-semibold text-neutral-700">End of Module Notes</p>
            <p className="mt-1">
              Notes Center • Student Account: <span className="font-mono text-neutral-900">{watermark.studentUsername}</span> • Active Session Verified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

