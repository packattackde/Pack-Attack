'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Ban,
  Clock,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';

interface ChatLogEntry {
  id: string;
  originalId: string;
  content: string;
  userId: string;
  userName: string;
  userRole: string;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedById: string | null;
  deleteReason: string | null;
  createdAt: string;
}

interface BanEntry {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  type: 'TIMEOUT' | 'BAN';
  reason: string | null;
  active: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  createdBy: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ChatManagementClient() {
  const [tab, setTab] = useState<'log' | 'bans'>('log');

  // Chat log state
  const [logs, setLogs] = useState<ChatLogEntry[]>([]);
  const [logPagination, setLogPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [logLoading, setLogLoading] = useState(false);
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');

  // Bans state
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [bansLoading, setBansLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);

  // Load chat log
  const loadLogs = useCallback(
    async (page = 1) => {
      setLogLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '50',
        });
        if (deletedOnly) params.set('deletedOnly', 'true');
        if (searchUserId) params.set('userId', searchUserId);

        const res = await fetch(`/api/chat/admin/log?${params}`);
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
          setLogPagination(data.pagination);
        }
      } catch (error) {
        console.error('Failed to load chat log:', error);
      }
      setLogLoading(false);
    },
    [deletedOnly, searchUserId],
  );

  // Load bans
  const loadBans = useCallback(async () => {
    setBansLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeExpired) params.set('includeExpired', 'true');

      const res = await fetch(`/api/chat/admin/bans?${params}`);
      const data = await res.json();
      if (data.success) {
        setBans(data.bans);
      }
    } catch (error) {
      console.error('Failed to load bans:', error);
    }
    setBansLoading(false);
  }, [includeExpired]);

  // Load on mount / tab switch
  useEffect(() => {
    if (tab === 'log') {
      loadLogs(1);
    } else {
      loadBans();
    }
  }, [tab, loadLogs, loadBans]);

  // Remove ban
  const removeBan = async (banId: string) => {
    try {
      const res = await fetch(`/api/chat/admin/bans?banId=${banId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBans((prev) => prev.filter((b) => b.id !== banId));
      }
    } catch (error) {
      console.error('Failed to remove ban:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'log'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat Log
        </button>
        <button
          onClick={() => setTab('bans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'bans'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Ban className="w-4 h-4" />
          Bans & Timeouts
          {bans.filter((b) => b.active && !b.isExpired).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white">
              {bans.filter((b) => b.active && !b.isExpired).length}
            </span>
          )}
        </button>
      </div>

      {/* ─── Chat Log Tab ─── */}
      {tab === 'log' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={deletedOnly}
                onChange={(e) => setDeletedOnly(e.target.checked)}
                className="rounded bg-white/[0.06] border-white/[0.1]"
              />
              Deleted only
            </label>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Filter by user ID..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="h-8 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <button
              onClick={() => loadLogs(1)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-colors"
            >
              Search
            </button>
          </div>

          {/* Log table */}
          <div className="glass-strong rounded-xl overflow-hidden">
            {logLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500 text-sm">
                Loading...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-gray-500 text-sm">
                No messages found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-white/[0.02] ${log.isDeleted ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-medium ${
                                log.userRole === 'ADMIN' ? 'text-red-400' : 'text-gray-300'
                              }`}
                            >
                              {log.userName}
                            </span>
                            {log.userRole === 'ADMIN' && (
                              <Shield className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p
                            className={`text-xs max-w-md truncate ${
                              log.isDeleted ? 'text-gray-600 line-through' : 'text-gray-300'
                            }`}
                          >
                            {log.content}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          {log.isDeleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-[10px] font-medium text-red-400">
                              <Trash2 className="w-3 h-3" />
                              Deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-medium text-green-400">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {logPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {logPagination.page} of {logPagination.totalPages} ({logPagination.total} messages)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadLogs(logPagination.page - 1)}
                  disabled={logPagination.page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => loadLogs(logPagination.page + 1)}
                  disabled={logPagination.page >= logPagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Bans & Timeouts Tab ─── */}
      {tab === 'bans' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(e) => setIncludeExpired(e.target.checked)}
                className="rounded bg-white/[0.06] border-white/[0.1]"
              />
              Show expired / inactive
            </label>
          </div>

          <div className="glass-strong rounded-xl overflow-hidden">
            {bansLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500 text-sm">
                Loading...
              </div>
            ) : bans.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-gray-500 text-sm">
                No bans or timeouts found
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {bans.map((ban) => (
                  <div
                    key={ban.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      !ban.active || ban.isExpired ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* User avatar */}
                      {ban.userImage ? (
                        <img
                          src={ban.userImage}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-400">
                            {(ban.userName || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{ban.userName}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ban.type === 'BAN'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {ban.type === 'BAN' ? (
                              <>
                                <Ban className="w-3 h-3" /> Banned
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> Timeout
                              </>
                            )}
                          </span>
                          {ban.isExpired && (
                            <span className="text-[10px] text-gray-500">expired</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>By {ban.createdBy}</span>
                          <span>·</span>
                          <span>{formatDate(ban.createdAt)}</span>
                          {ban.expiresAt && (
                            <>
                              <span>·</span>
                              <span>Until {formatDate(ban.expiresAt)}</span>
                            </>
                          )}
                        </div>
                        {ban.reason && (
                          <p className="text-xs text-gray-400 mt-0.5">Reason: {ban.reason}</p>
                        )}
                      </div>
                    </div>
                    {ban.active && !ban.isExpired && (
                      <button
                        onClick={() => removeBan(ban.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
