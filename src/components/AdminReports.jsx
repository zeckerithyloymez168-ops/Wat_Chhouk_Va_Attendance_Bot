import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Check, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminReports({ monks, onRefreshNeeded }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchAllSummaries = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        monks.map(async (monk) => {
          const res = await fetch(`${API_BASE}/api/monks/${monk.id}/summary`);
          const data = await res.json();
          return data.success ? data : null;
        })
      );
      setSummaries(results.filter(Boolean));
    } catch (err) {
      console.error("Error fetching summaries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monks.length > 0) {
      fetchAllSummaries();
    } else {
      setLoading(false);
    }
  }, [monks]);

  const handleMarkPaid = async (attendanceId) => {
    setProcessingId(attendanceId);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/${attendanceId}/paid`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        fetchAllSummaries();
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      console.error("Error marking fine as paid:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const grandTotalFines = summaries.reduce((acc, curr) => acc + (curr.stats?.totalFine || 0), 0);
  const grandUnpaidFines = summaries.reduce((acc, curr) => acc + (curr.stats?.unpaidFine || 0), 0);
  const grandPaidFines = grandTotalFines - grandUnpaidFines;

  const filteredSummaries = summaries.filter(s =>
    s.monk.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="text-xs text-rose-300 font-medium mb-1">ប្រាក់ពិន័យនៅខ្វះ (Unpaid Fines)</div>
          <div className="text-3xl font-bold text-rose-400">{grandUnpaidFines.toLocaleString()} ៛</div>
          <p className="text-[10px] text-slate-400 mt-2">ប្រាក់ពិន័យអវត្តមានដែលមិនទាន់បានបង់</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs text-emerald-300 font-medium mb-1">ប្រាក់ពិន័យបានបង់រួច (Paid Fines)</div>
          <div className="text-3xl font-bold text-emerald-400">{grandPaidFines.toLocaleString()} ៛</div>
          <p className="text-[10px] text-slate-400 mt-2">ប្រាក់ពិន័យដែលបានប្រគល់ជូនវត្តរួច</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs text-amber-300 font-medium mb-1">ប្រាក់ពិន័យសរុបទាំងអស់</div>
          <div className="text-3xl font-bold text-amber-400">{grandTotalFines.toLocaleString()} ៛</div>
          <p className="text-[10px] text-slate-400 mt-2">អវត្តមាន ១ លើក = ២,០០០៛</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span>របាយការណ៍ និងការទូទាត់ប្រាក់ពិន័យ (Monk Fines & Reports)</span>
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមព្រះនាម..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-khmer"
              />
            </div>
            <button
              onClick={fetchAllSummaries}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-khmer">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
            កំពុងគណនារបាយការណ៍...
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-khmer">
            មិនមានទិន្នន័យព្រះសង្ឃត្រូវបង្ហាញឡើយ
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {filteredSummaries.map((item) => {
              const monk = item.monk;
              const stats = item.stats;
              const unpaidAttendances = item.recentAttendances.filter(a => a.status === 'absent' && !a.is_paid);

              return (
                <div key={monk.id} className="p-4 bg-slate-900/60 hover:bg-slate-800/40 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                        🙏
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{monk.name}</h4>
                        <div className="flex gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-emerald-400">វត្តមាន {stats.totalPresent}</span> • 
                          <span className="text-rose-400">អវត្តមាន {stats.totalAbsent}</span> • 
                          <span className="text-amber-400">មានច្បាប់ {stats.totalPermission}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">ប្រាក់ពិន័យត្រូវបង់</div>
                      <div className={`text-base font-bold ${stats.unpaidFine > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {stats.unpaidFine.toLocaleString()} ៛
                      </div>
                    </div>
                  </div>

                  {unpaidAttendances.length > 0 && (
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] text-rose-300 font-medium">កំណត់ត្រាអវត្តមានមិនទាន់បង់ប្រាក់៖</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unpaidAttendances.map((att) => (
                          <div key={att.id} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg text-xs border border-slate-800">
                            <div>
                              <span className="text-slate-200 font-bold">{att.date}</span> ({att.session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'})
                              <span className="ml-2 text-rose-400 font-bold">២,០០០៛</span>
                            </div>

                            <button
                              onClick={() => handleMarkPaid(att.id)}
                              disabled={processingId === att.id}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>បង់រួច</span>
                            </button>
                          </div>
                        ))}
                      </div>
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
