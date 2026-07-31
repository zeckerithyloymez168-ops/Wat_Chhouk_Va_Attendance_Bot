import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, Check, X } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminLeaveApproval({ monks, currentAdmin, onActionDone }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leave`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.leaveRequests);
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      fetchRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/leave/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approved_by: currentAdmin?.id || 1
        })
      });

      const data = await res.json();
      if (data.success) {
        fetchRequests();
        if (onActionDone) onActionDone();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>គ្រប់គ្រង និងអនុម័តការសុំច្បាប់ (Leave Requests Manager)</span>
          </h2>
          <p className="text-xs text-slate-400">ពិនិត្យ និងអនុម័តពាក្យសុំច្បាប់របស់ព្រះសង្ឃ ដែលផ្ញើមកតាម Telegram</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'ទាំងអស់' },
            { id: 'pending', label: '⏳ រង់ចាំពិនិត្យ' },
            { id: 'approved', label: '✅ បានអនុម័ត' },
            { id: 'rejected', label: '❌ បានបដិសេធ' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                filterStatus === btn.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-khmer">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
            កំពុងទាញយកការសុំច្បាប់...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-khmer">
            មិនមានទិន្នន័យការសុំច្បាប់ដែលត្រូវបង្ហាញឡើយ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(req => {
              const monk = monks.find(m => m.id === req.monk_id);
              return (
                <div key={req.id} className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        🙏
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{monk ? monk.name : 'Unknown Monk'}</h4>
                        <span className="text-[11px] text-amber-400">
                          {req.session === 'morning' ? '🌅 ពេលព្រឹក' : req.session === 'evening' ? '🌆 ពេលល្ងាច' : '☀️ ពេញមួយថ្ងៃ'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}>
                      {req.status === 'approved' ? '✅ បានអនុម័ត' :
                       req.status === 'rejected' ? '❌ បដិសេធ' : '⏳ រង់ចាំពិនិត្យ'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-400 mb-1">
                      កាលបរិច្ឆេទ៖ <span className="text-slate-200 font-bold">{req.start_date}</span> {req.start_date !== req.end_date && `ដល់ ${req.end_date}`}
                    </div>
                    <div className="text-slate-200">
                      មូលហេតុ៖ "{req.reason}"
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                        disabled={processingId === req.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>អនុម័ត (Approve)</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        disabled={processingId === req.id}
                        className="flex-1 bg-slate-800 hover:bg-rose-600/80 text-rose-300 hover:text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 hover:border-rose-500"
                      >
                        <X className="w-4 h-4" />
                        <span>បដិសេធ (Reject)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
