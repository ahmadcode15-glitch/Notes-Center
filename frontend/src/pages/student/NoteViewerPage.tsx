import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { NoteReader } from '../../components/notes/NoteReader';
import { ShieldAlert, AlertTriangle, ArrowLeft, MessageCircle, Lock } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export const NoteViewerPage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorData, setErrorData] = useState<{
    code?: string;
    message?: string;
    expiryDate?: string;
    requiredCourse?: string;
  } | null>(null);

  useEffect(() => {
    if (noteId) {
      setIsLoading(true);
      setErrorData(null);

      api.notes.get(noteId)
        .then((res) => {
          if (res.success) {
            setNote(res.note);
            setWatermark(res.watermark);
          }
        })
        .catch((err: any) => {
          setErrorData({
            code: err.code || 'ERROR',
            message: err.message || 'Failed to open note.',
            expiryDate: err.data?.expiryDate,
            requiredCourse: err.data?.requiredCourse,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [noteId]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div className="pt-6 space-y-4 bg-white p-8 rounded-xl border border-neutral-200">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Access Expired State (#34 requirement)
  if (errorData?.code === 'ACCESS_EXPIRED') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
          Your access has expired.
        </h2>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          {errorData.message}
        </p>
        {errorData.expiryDate && (
          <div className="mt-4 inline-block px-3 py-1 bg-neutral-100 rounded-lg text-xs font-mono text-neutral-700">
            Expired on: {new Date(errorData.expiryDate).toLocaleDateString()}
          </div>
        )}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/support"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors"
          >
            Contact Support to Extend Access
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Forbidden / Not Subscribed State (#16 requirement)
  if (errorData?.code === 'FORBIDDEN') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
          Access Restricted
        </h2>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          {errorData.message}
        </p>
        {errorData.requiredCourse && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Required Program:</strong> {errorData.requiredCourse}
          </div>
        )}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/support"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors"
          >
            Upgrade Enrollment / Contact Support
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl"
          >
            Return to Courses
          </button>
        </div>
      </div>
    );
  }

  if (errorData || !note) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-neutral-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Unable to load study note</h2>
        <p className="mt-1 text-xs text-neutral-500">{errorData?.message || 'Note unavailable.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-5 px-4 py-2 bg-[#111111] text-[#FACC15] font-bold text-xs rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <NoteReader
      note={note}
      watermark={watermark}
      onBack={() => navigate(-1)}
    />
  );
};

