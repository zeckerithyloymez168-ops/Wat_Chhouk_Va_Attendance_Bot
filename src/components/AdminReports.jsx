import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Check, RefreshCw, Download, Printer, PieChart, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import { getTodayString } from '../utils';

export default function AdminReports({ monks, onRefreshNeeded }) {
  const [summaries, setSummaries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchAllSummaries = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const results = await Promise.all(
        monks.map(async (monk) => {
          const res = await fetch(`${API_BASE}/api/monks/${monk.id}/summary`);
          const data = await res.json();
          return data.success ? data : null;
        })
      );
      setSummaries(results.filter(Boolean));

      // Fetch analytics
      const analyticsRes = await fetch(`${API_BASE}/api/analytics/monthly`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (err) {
      console.error("Error fetching summaries/analytics:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (monks.length > 0) {
      fetchAllSummaries(false);
      const interval = setInterval(() => {
        fetchAllSummaries(true);
      }, 4000);
      return () => clearInterval(interval);
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

  const handleExportCSV = () => {
    if (summaries.length === 0) return;

    let csvContent = "\uFEFF"; // UTF-8 BOM for Khmer text support in Excel
    csvContent += "ID,ព្រះនាម/ឈ្មោះ,តួនាទី,Telegram ID,លេខទូរស័ព្ទ,វត្តមាន (លើក),អវត្តមាន (លើក),មានច្បាប់ (លើក),ប្រាក់ពិន័យសរុប (៛),ប្រាក់ពិន័យនៅខ្វះ (៛)\n";

    summaries.forEach((s) => {
      const m = s.monk;
      const st = s.stats;
      csvContent += `${m.id},"${m.name}","${m.role === 'admin' ? 'Admin' : 'ព្រះសង្ឃ'}",${m.telegram_id},"${m.phone || ''}",${st.totalPresent},${st.totalAbsent},${st.totalPermission},${st.totalFine},${st.unpaidFine}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wat_chhouk_va_attendance_report_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const grandTotalFines = summaries.reduce((acc, curr) => acc + (curr.stats?.totalFine || 0), 0);
  const grandUnpaidFines = summaries.reduce((acc, curr) => acc + (curr.stats?.unpaidFine || 0), 0);
  const grandPaidFines = grandTotalFines - grandUnpaidFines;

  const filteredSummaries = summaries.filter(s =>
    s.monk.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overview = analytics?.overview || {
    attendanceRate: 100,
    totalPresent: 0,
    totalAbsent: 0,
    totalPermission: 0,
    totalFines: grandTotalFines,
    paidFines: grandPaidFines,
    unpaidFines: grandUnpaidFines
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            <span>ផ្ទាំងគ្រប់គ្រង & របាយការណ៍សរុប (Analytics & Reports)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ទិន្នន័យស្ថិតិវត្តមាន ប្រាក់ពិន័យសរុប ក្រាហ្វវិភាគ និងការទាញយករបាយការណ៍
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព (Print)</span>
          </button>

          <button
            onClick={fetchAllSummaries}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Visual Charts & KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Rate Progress Ring */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <h3 className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>អត្រាវត្តមានសរុប (Overall Attendance Rate)</span>
          </h3>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${overview.attendanceRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-amber-400">{overview.attendanceRate}%</span>
              <span className="text-[10px] text-slate-400">មធ្យមភាគប្រចាំវត្ត</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full mt-4 text-[11px] pt-3 border-t border-slate-800">
            <div>
              <div className="text-emerald-400 font-bold">{overview.totalPresent}</div>
              <div className="text-slate-400">វត្តមាន</div>
            </div>
            <div>
              <div className="text-rose-400 font-bold">{overview.totalAbsent}</div>
              <div className="text-slate-400">អវត្តមាន</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{overview.totalPermission}</div>
              <div className="text-slate-400">មានច្បាប់</div>
            </div>
          </div>
        </div>

        {/* Fine Breakdown Visual Bars */}
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
          <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-rose-400" />
            <span>វិភាគប្រាក់ពិន័យ (Fine Breakdown)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rose-300 font-medium">ប្រាក់ពិន័យនៅខ្វះ (Unpaid)</span>
                <span className="text-rose-400 font-bold">{grandUnpaidFines.toLocaleString()} ៛</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${grandTotalFines > 0 ? (grandUnpaidFines / grandTotalFines) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-emerald-300 font-medium">ប្រាក់ពិន័យបានបង់រួច (Paid)</span>
                <span className="text-emerald-400 font-bold">{grandPaidFines.toLocaleString()} ៛</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${grandTotalFines > 0 ? (grandPaidFines / grandTotalFines) * 100 : 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center mt-2">
              <span className="text-slate-400">ប្រាក់ពិន័យសរុបទាំងអស់</span>
              <span className="text-base font-bold text-amber-400">{grandTotalFines.toLocaleString()} ៛</span>
            </div>
          </div>
        </div>

        {/* Top Monks Attendance Leaderboard */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-3">
          <h3 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-sky-400" />
            <span>ព្រះសង្ឃឡើងនមស្សការទៀងទាត់ជាងគេ</span>
          </h3>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {(!analytics?.leaderboard || analytics.leaderboard.length === 0) ? (
              <div className="text-xs text-slate-500 text-center py-6">មិនទាន់មានទិន្នន័យ</div>
            ) : (
              analytics.leaderboard.slice(0, 5).map((m, idx) => (
                <div key={m.id} className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-xl text-xs border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-500 text-slate-950' :
                      idx === 1 ? 'bg-slate-300 text-slate-950' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-200">{m.name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{m.rate}% ({m.present} លើក)</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Reports Table */}
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
