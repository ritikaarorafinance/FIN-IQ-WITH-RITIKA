import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const { currentUser, updateProfile, changePassword, setCurrentUserLocal } = useAuth();
  const [form, setForm] = useState({ fullName: '', photo: null });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setForm({
        fullName: currentUser.fullName || '',
        photo: currentUser.photo || null,
        rollNumber: ''
      });
    }
  }, [currentUser]);

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check file size initially to warn if massive (e.g. > 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Please choose an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 500; // Resize to max 500px

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Allow user to see preview immediately
        setForm(f => ({ ...f, photo: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setMsg({ type: '', text: '' });
    if (!form.fullName || form.fullName.trim().length < 2) return setMsg({ type: 'error', text: 'Name must be at least 2 characters' });


    setSaving(true);
    try {
      const idKey = currentUser && (currentUser.id || currentUser.uid);
      const ok = await updateProfile(idKey, {
        fullName: form.fullName,
        photo: form.photo
      });
      if (ok) {
        setMsg({ type: 'success', text: 'Profile updated' });
        try {
          setCurrentUserLocal && setCurrentUserLocal({
            ...currentUser,
            fullName: form.fullName,
            photo: form.photo
          });
        } catch (e) { }
        setTimeout(() => navigate('/profile'), 800);
      } else {
        setMsg({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: e.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const doChangePassword = async () => {
    setMsg({ type: '', text: '' });
    const { currentPassword, newPassword, confirmNewPassword } = pw;
    if (!currentPassword || !newPassword || !confirmNewPassword) return setMsg({ type: 'error', text: 'All password fields required' });
    if (currentUser && currentUser.password && currentPassword !== currentUser.password) return setMsg({ type: 'error', text: 'Current password incorrect' });
    if (newPassword !== confirmNewPassword) return setMsg({ type: 'error', text: 'New passwords do not match' });
    const idKey = currentUser && (currentUser.id || currentUser.uid);
    const ok = await changePassword(idKey, newPassword);
    if (ok) {
      setMsg({ type: 'success', text: 'Password changed' });
      setPw({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } else setMsg({ type: 'error', text: 'Failed to change password' });
  };

  if (!currentUser) {
    return (
      <main className="pt-32 pb-16 px-4 max-w-4xl mx-auto min-h-screen text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Not signed in</h2>
          <p className="text-slate-600 mb-6">Please log in to edit your profile.</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-6 py-2 rounded-lg">Go to Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen">
      <button onClick={() => navigate("/profile")} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors font-medium">
        <span>←</span> Back to Profile
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-6">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
          <p className="text-slate-500 text-sm mt-2">Update your personal information</p>
        </div>

        <div className="p-8">
          {msg.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
              <span>{msg.type === 'error' ? '⚠️' : '✅'}</span>
              {msg.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  {form.photo ? (
                    <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">👤</div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-brand-50 text-brand-700 rounded-xl font-semibold hover:bg-brand-100 transition-all border border-brand-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload New Photo
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-400 mt-2">Recommended: Square image, max 2MB</p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                placeholder="Enter your full name"
              />
            </div>



            <div className="pt-4 flex gap-4">
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Saving Changes...
                  </>
                ) : 'Save Changes'}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>🔐</span> Security
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={pw.confirmNewPassword}
                  onChange={(e) => setPw(p => ({ ...p, confirmNewPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={doChangePassword}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-500/20"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
