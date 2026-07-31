import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, User, UserPlus, Phone, Edit2, CheckCircle2, AlertCircle, RefreshCw, Trash2, Key } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminUsers({ monks, currentAdmin, onRefreshNeeded, onOpenRegister }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'monk'
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [editingMonk, setEditingMonk] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', telegram_id: '', role: 'monk' });

  const handleRoleToggle = async (monk) => {
    const newRole = monk.role === 'admin' ? 'monk' : 'admin';
    setUpdatingId(monk.id);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/monks/${monk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: `បានប្តូរតួនាទីរបស់ ${monk.name} ទៅជា ${newRole === 'admin' ? 'Admin / គ្រូសូត្រ' : 'ព្រះសង្ឃ'} ដោយជោគជ័យ!`
        });
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        setMsg({ type: 'error', text: data.message || 'មានបញ្ហាក្នុងការប្តូរតួនាទី' });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartEdit = (monk) => {
    setEditingMonk(monk);
    setEditForm({
      name: monk.name || '',
      phone: monk.phone || '',
      telegram_id: monk.telegram_id || '',
      role: monk.role || 'monk'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMonk) return;

    setUpdatingId(editingMonk.id);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/monks/${editingMonk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          telegram_id: Number(editForm.telegram_id),
          role: editForm.role
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានរបស់ ${editForm.name} រួចរាល់!` });
        setEditingMonk(null);
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        setMsg({ type: 'error', text: data.message || 'មានបញ្ហាក្នុងការរក្សាទុក' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMonk = async (monk) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យព្រះសង្ឃ ${monk.name} មែនទេ?`)) return;

    setUpdatingId(monk.id);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/monks/${monk.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានលុបទិន្នន័យ ${monk.name} រួចរាល់!` });
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        setMsg({ type: 'error', text: data.message || 'មិនអាចលុបទិន្នន័យបានទេ' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMonks = monks.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.telegram_id && String(m.telegram_id).includes(searchTerm));
    
    const matchesRole =
      roleFilter === 'all' ? true : m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalAdmins = monks.filter(m => m.role === 'admin').length;
  const totalMonks = monks.filter(m => m.role === 'monk').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>បញ្ជីអ្នកប្រើប្រាស់ & ព្រះសង្ឃ (User List & Management)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            សម្រាប់ Admin គ្រប់គ្រងគណនី ព្រះសង្ឃ តួនាទី និងព័ត៌មានទំនាក់ទំនង Telegram
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenRegister}
            className="gold-gradient-btn text-slate-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md w-full md:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ បន្ថែមព្រះសង្ឃ / អ្នកប្រើប្រាស់</span>
          </button>

          <button
            onClick={onRefreshNeeded}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="text-slate-400 font-medium mb-1">អ្នកប្រើប្រាស់សរុប (Total Users)</div>
          <div className="text-2xl font-bold text-amber-400">{monks.length} អង្គ/រូប</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <div className="text-slate-400 font-medium mb-1">Admin / គ្រូសូត្រ</div>
          <div className="text-2xl font-bold text-rose-400">{totalAdmins} អង្គ</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
          <div className="text-slate-400 font-medium mb-1">ព្រះសង្ឃសាមញ្ញ (Monks)</div>
          <div className="text-2xl font-bold text-sky-400">{totalMonks} អង្គ</div>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Controls & Search */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម ព្រះនាម, លេខទូរស័ព្ទ, Telegram ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-khmer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
            {[
              { id: 'all', label: 'ទាំងអស់' },
              { id: 'admin', label: '🛡️ Admin' },
              { id: 'monk', label: '🙏 ព្រះសង្ឃ' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium flex-1 sm:flex-initial text-center ${
                  roleFilter === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* User List Table / Cards */}
        {filteredMonks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-khmer">
            មិនមានទិន្នន័យអ្នកប្រើប្រាស់ដែលត្រូវបង្ហាញឡើយ
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {filteredMonks.map((monk) => {
              const isAdmin = monk.role === 'admin';
              const isEditing = editingMonk?.id === monk.id;

              if (isEditing) {
                return (
                  <form key={monk.id} onSubmit={handleSaveEdit} className="p-4 bg-amber-500/5 space-y-3">
                    <div className="font-bold text-amber-400 text-xs">កែប្រែព័ត៌មានអ្នកប្រើប្រាស់ ID #{monk.id}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">ព្រះនាម / ឈ្មោះ</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-khmer"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Telegram ID</label>
                        <input
                          type="number"
                          value={editForm.telegram_id}
                          onChange={(e) => setEditForm({ ...editForm, telegram_id: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">លេខទូរស័ព្ទ</label>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-khmer"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">តួនាទី</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-khmer"
                        >
                          <option value="monk">ព្រះសង្ឃ (Monk)</option>
                          <option value="admin">Admin / គ្រូសូត្រ</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditingMonk(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                      >
                        បោះបង់
                      </button>
                      <button
                        type="submit"
                        disabled={updatingId === monk.id}
                        className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                      >
                        រក្សាទុក
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div key={monk.id} className="p-4 bg-slate-900/60 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                      isAdmin ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {isAdmin ? <Shield className="w-5 h-5 text-rose-400" /> : <User className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{monk.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAdmin
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        }`}>
                          {isAdmin ? '🛡️ Admin' : '🙏 ព្រះសង្ឃ'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                        <span>Telegram ID: <code className="text-amber-300 font-mono">{monk.telegram_id}</code></span>
                        {monk.phone && <span>• Phone: {monk.phone}</span>}
                        {monk.created_at && <span>• ចុះឈ្មោះ៖ {new Date(monk.created_at).toLocaleDateString('km-KH')}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleRoleToggle(monk)}
                      disabled={updatingId === monk.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isAdmin
                          ? 'bg-slate-800 hover:bg-sky-900/40 text-sky-300 border-slate-700'
                          : 'bg-slate-800 hover:bg-rose-900/40 text-rose-300 border-slate-700'
                      }`}
                      title="ប្តូរតួនាទី Admin / Monk"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'ប្តូរទៅជា Monk' : 'ដំឡើងជា Admin'}</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(monk)}
                      disabled={updatingId === monk.id}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700"
                      title="កែប្រែព័ត៌មាន"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteMonk(monk)}
                      disabled={updatingId === monk.id}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700"
                      title="លុប"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
