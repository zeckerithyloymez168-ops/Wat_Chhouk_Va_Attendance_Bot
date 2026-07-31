import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, Shield, Calendar, DollarSign, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.auditLogs);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' ? true : log.action_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getActionBadge = (type) => {
    switch (type) {
      case 'ATTENDANCE_RECORDED':
        return { label: 'ស្រង់វត្តមាន', icon: Calendar, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'FINE_PAID':
        return { label: 'បង់ប្រាក់ពិន័យ', icon: DollarSign, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'LEAVE_APPROVED':
        return { label: 'អនុម័តច្បាប់', icon: CheckCircle2, color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'LEAVE_REJECTED':
        return { label: 'បដិសេធច្បាប់', icon: FileText, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'LEAVE_SUBMITTED':
        return { label: 'សុំច្បាប់', icon: FileText, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'BROADCAST_SENT':
        return { label: 'ជូនដំណឹង', icon: Shield, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'សកម្មភាព', icon: History, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>ប្រវត្តិសកម្មភាព & តម្លាភាពប្រព័ន្ធ (Audit Logs & Activity History)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            កត់ត្រារាល់សកម្មភាពស្រង់វត្តមាន ការអនុម័តច្បាប់ ការបង់ប្រាក់ពិន័យ និងការចុះឈ្មោះក្នុងប្រព័ន្ធ
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម សកម្មភាព, អ្នកធ្វើ, ឬព័ត៌មាន..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-khmer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'ទាំងអស់' },
              { id: 'ATTENDANCE_RECORDED', label: '📅 វត្តមាន' },
              { id: 'FINE_PAID', label: '💰 ពិន័យ' },
              { id: 'LEAVE_APPROVED', label: '✅ ច្បាប់' },
              { id: 'BROADCAST_SENT', label: '📢 ជូនដំណឹង' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table / Stream */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-khmer">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
            កំពុងទាញយកប្រវត្តិសកម្មភាព...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-khmer">
            មិនមានទិន្នន័យប្រវត្តិសកម្មភាពដែលត្រូវបង្ហាញឡើយ
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action_type);
              const Icon = badge.icon;
              return (
                <div key={log.id} className="p-4 bg-slate-900/60 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${badge.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{log.actor_name}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{log.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('km-KH')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
