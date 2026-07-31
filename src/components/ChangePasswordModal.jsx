import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { API_BASE } from '../config';

export default function ChangePasswordModal({ isOpen, onClose, currentMonk, t }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('សូមបញ្ចូលព័ត៌មានឱ្យគ្រប់ជ្រុងជ្រោយ');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(t?.passwordMismatch || 'ពាក្យសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ!');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('ពាក្យសម្ងាត់ថ្មីត្រូវតែមានយ៉ាងតិច ៤ ខ្ទង់');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monk_id: currentMonk?.id,
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(t?.changePasswordSuccess || 'បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.message || 'ការប្តូរពាក្យសម្ងាត់បរាជ័យ');
      }
    } catch (err) {
      console.error('Change password error:', err);
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
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto">
            <KeyRound className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold gold-gradient-text tracking-wide">
            {t?.changePassword || "ប្តូរពាក្យសម្ងាត់ Admin"}
          </h2>
          <p className="text-xs text-slate-400">
            កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់គណនី {currentMonk?.name || 'Admin'}
          </p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            ❌ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {t?.currentPassword || "ពាក្យសម្ងាត់បច្ចុប្បន្ន"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500 text-xs tracking-wider"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {t?.newPassword || "ពាក្យសម្ងាត់ថ្មី"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500 text-xs tracking-wider"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {t?.confirmNewPassword || "ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500 text-xs tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-all"
            >
              {t?.cancel || "បោះបង់"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'កំពុងរក្សាទុក...' : (t?.save || 'រក្សាទុក')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
