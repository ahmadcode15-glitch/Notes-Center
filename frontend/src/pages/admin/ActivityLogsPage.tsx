import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClipboardList, Search, Filter, Clock, User, Shield } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export const ActivityLogsPage: React.FC = () => {
  const { error } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.activityLogs.list({
        page,
        limit: 25,
        action: actionFilter,
        username: usernameFilter,
      });
      if (res.success) {
        setLogs(res.logs);
        setTotalLogs(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Security & Audit Activity Logs</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Complete compliance audit trail tracking logins, session terminations, access assignments, and curriculum updates.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            placeholder="Filter by username..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FAILED_LOGIN">FAILED_LOGIN</option>
            <option value="DEVICE_LIMIT_EXCEEDED">DEVICE_LIMIT_EXCEEDED</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="FILE_UPLOADED">FILE_UPLOADED</option>
            <option value="ACCESS_GRANTED">ACCESS_GRANTED</option>
            <option value="ACCESS_REVOKED">ACCESS_REVOKED</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED</option>
            <option value="NOTE_CREATED">NOTE_CREATED</option>
            <option value="NOTE_VIEWED">NOTE_VIEWED</option>
            <option value="COURSE_CREATED">COURSE_CREATED</option>
            <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center font-sans text-xs">
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-neutral-900 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-neutral-900">
                          {log.username ? `@${log.username}` : 'System'}
                        </span>
                        {log.user?.role && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              log.user.role === 'SUPER_ADMIN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : log.user.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {log.user.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-neutral-600 max-w-md">
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs font-sans text-neutral-500">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

