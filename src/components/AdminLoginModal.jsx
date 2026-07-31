import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminLoginModal({ isOpen, onClose, onSuccess, t }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('សូមបញ្ចូលពាក្យសម្ងាត់');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setPassword('');
        setErrorMsg('');
        onSuccess();
      } else {
        setErrorMsg(data.message || 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ');
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      setErrorMsg('មានបញ្ហាក្នុងការភ្ជាប់ទៅ Server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-khmer">
      <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative space-y-6 bg-slate-900/90 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-800/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20 font-bold border border-amber-400/40">
            <Lock className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-2xl font-extrabold gold-gradient-text tracking-wide">
            {t?.adminLogin || "Admin Login"}
          </h2>
          <p className="text-xs text-slate-400">
            {t?.enterAdminPassword || "សូមបញ្ចូលពាក្យសម្ងាត់ Admin ដើម្បីចូលប្រើប្រាស់"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              🔑 {t?.password || "Password (ពាក្យសម្ងាត់)"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm tracking-widest"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              *(Default password: <code className="text-amber-300 font-mono">admin123</code>)*
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-shake">
              ❌ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{submitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : (t?.loginBtn || 'ចូលប្រព័ន្ធ (Login)')}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
