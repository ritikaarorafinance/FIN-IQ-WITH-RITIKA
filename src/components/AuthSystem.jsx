import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail, Lock, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthSystem() {
  const { setCurrentUserLocal, signup, login, updateProfile } = useAuth();
  // default landing for /auth should be login (per request)
  const [screen, setScreen] = useState('login'); // signup, captcha, login, dashboard
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    loginEmail: '',
    loginPassword: ''
  });

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', photo: null });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Load users and current user from storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const usersRes = await window.storage.get('auth_users');
        if (usersRes && usersRes.value) setUsers(JSON.parse(usersRes.value));
      } catch (err) {
        // ignore
      }

      try {
        const cur = await window.storage.get('auth_currentUser');
        if (cur && cur.value) {
          setCurrentUser(JSON.parse(cur.value));
          setScreen('dashboard');
        }
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({ fullName: currentUser.fullName || '', photo: currentUser.photo || null });
    } else {
      setProfileForm({ fullName: '', photo: null });
    }
  }, [currentUser]);

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(captcha);
    setCaptchaInput('');
  };

  useEffect(() => {
    if (screen === 'captcha') generateCaptcha();
  }, [screen]);

  const validateSignup = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (users.some(u => u.email === formData.email)) {
      newErrors.email = 'Email already registered';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSignup = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const newErrors = validateSignup();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    setPendingUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password
    });
    setTimeout(() => {
      setIsSubmitting(false);
      setScreen('captcha');
    }, 800);
  };

  const verifyCaptcha = async () => {
    if (!captchaInput) {
      setMessage({ type: 'error', text: 'Please enter the CAPTCHA' });
      return;
    }
    if (captchaInput === captchaText) {
      setIsSubmitting(true);
      try {
        // Use auth provider (Firebase or mockAuth) to create the account so it works across devices
        await signup(pendingUser.email, pendingUser.password);
        setIsSubmitting(false);
        setMessage({ type: 'success', text: 'Account created. Please log in.' });
        setScreen('login');
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          loginEmail: '',
          loginPassword: ''
        });
        setCaptchaInput('');
      } catch (err) {
        setIsSubmitting(false);
        if (err.code === 'auth/email-already-in-use' || err.message.includes('email-already-in-use')) {
          setMessage({ type: 'error', text: 'account already exists with this profile' });
        } else {
          setMessage({ type: 'error', text: 'Failed to create account. ' + (err?.message || '') });
        }
      }
    } else {
      setMessage({ type: 'error', text: 'Incorrect CAPTCHA. Please try again.' });
      generateCaptcha();
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.loginEmail || !formData.loginPassword) {
      setMessage({ type: 'error', text: 'Please enter both email and password' });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(formData.loginEmail, formData.loginPassword);
      // persist current user locally as well for app components that rely on storage
      try { await window.storage.set('auth_currentUser', JSON.stringify(user)); } catch (err) { try { localStorage.setItem('auth_currentUser', JSON.stringify(user)); } catch (e) { } }
      setCurrentUser(user);
      try { setCurrentUserLocal && setCurrentUserLocal(user); } catch (e) { }
      setIsSubmitting(false);
      setMessage({ type: '', text: '' });
      navigate('/');
    } catch (err) {
      setIsSubmitting(false);
      setMessage({ type: 'error', text: 'Invalid email or password' });
    }
  };

  const continueAsGuest = async () => {
    // Do not sign the user in as a persisted guest. Simply navigate to home.
    navigate('/');
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    try { await window.storage.remove('auth_currentUser'); } catch (err) { try { localStorage.removeItem('auth_currentUser'); } catch (e) { } }
    try { setCurrentUserLocal && setCurrentUserLocal(null); } catch (e) { }
    setScreen('login');
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      loginEmail: '',
      loginPassword: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (message.text) setMessage({ type: '', text: '' });
    // real-time validation while on signup screen
    if (screen === 'signup') {
      const newData = { ...formData, [name]: value };
      const newErrors = (() => {
        const saved = formData; // use function validateSignup which reads formData state
        // temporarily set formData to newData for validation by calling validateSignup logic inline
        const newErrorsLocal = {};
        if (!newData.fullName.trim()) newErrorsLocal.fullName = 'Full name is required';
        else if (newData.fullName.trim().length < 2) newErrorsLocal.fullName = 'Name must be at least 2 characters';
        if (!newData.email) newErrorsLocal.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newData.email)) newErrorsLocal.email = 'Please enter a valid email';
        else if (users.some(u => u.email === newData.email)) newErrorsLocal.email = 'Email already registered';
        if (!newData.password) newErrorsLocal.password = 'Password is required';
        else if (newData.password.length < 8) newErrorsLocal.password = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newData.password)) newErrorsLocal.password = 'Password must contain uppercase, lowercase, and number';
        if (!newData.confirmPassword) newErrorsLocal.confirmPassword = 'Please confirm your password';
        else if (newData.password !== newData.confirmPassword) newErrorsLocal.confirmPassword = 'Passwords do not match';
        return newErrorsLocal;
      })();
      setErrors(newErrors);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((p) => ({ ...p, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileMsg({ type: '', text: '' });
    if (!profileForm.fullName || profileForm.fullName.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters' });
      return;
    }
    try {
      const idKey = currentUser.id || currentUser.uid;
      const ok = await updateProfile(idKey, { fullName: profileForm.fullName, photo: profileForm.photo });

      if (ok) {
        // Local update for immediate feedback (AuthContext updateProfile handles persistence and currentUser state update)
        // But we might need to update local 'users' state if we want to keep it in sync for the local list, 
        // though strictly speaking AuthContext handles the source of truth now.
        // We'll trust AuthContext. 

        // However, AuthSystem maintains its own 'users' state for local checks. 
        // We should probably update it too if we want to keep using it, but strictly relying on AuthContext is better.
        // Let's just rely on updateProfile returning true/false.

        setProfileMsg({ type: 'success', text: 'Profile updated' });
        setEditingProfile(false);
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleChangePassword = async () => {
    setProfileMsg({ type: '', text: '' });
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setProfileMsg({ type: 'error', text: 'All password fields are required' });
      return;
    }
    if (currentPassword !== currentUser.password) {
      setProfileMsg({ type: 'error', text: 'Current password is incorrect' });
      return;
    }
    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setProfileMsg({ type: 'error', text: 'New password must be 8+ chars with upper, lower and number' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setProfileMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      const updated = users.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u);
      setUsers(updated);
      try { await window.storage.set('auth_users', JSON.stringify(updated)); } catch (e) { localStorage.setItem('auth_users', JSON.stringify(updated)); }

      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      try { await window.storage.set('auth_currentUser', JSON.stringify(updatedUser)); } catch (e) { localStorage.setItem('auth_currentUser', JSON.stringify(updatedUser)); }
      try { setCurrentUserLocal && setCurrentUserLocal(updatedUser); } catch (e) { }

      setProfileMsg({ type: 'success', text: 'Password changed' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to change password' });
    }
  };

  // Sign Up Screen
  if (screen === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-28 pb-12 px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2">
              <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
          <p className="text-gray-600 text-center mb-6">Sign up to get started (optional)</p>
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              onClick={handleSignup}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Processing...' : 'Sign Up'}
            </button>

            <button
              onClick={continueAsGuest}
              disabled={isSubmitting}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors font-medium"
            >
              Continue as Guest (no signup required)
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => setScreen('login')} className="text-blue-600 hover:text-blue-700 font-medium">
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // CAPTCHA Verification Screen
  if (screen === 'captcha') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-28 pb-12 px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify You're Human</h2>
            <p className="text-gray-600">Enter the CAPTCHA code below to complete registration</p>
          </div>
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg p-6 mb-4 relative">
              <div className="text-center">
                <p className="text-3xl font-bold tracking-widest select-none" style={{
                  fontFamily: 'monospace',
                  letterSpacing: '8px',
                  textDecoration: 'line-through',
                  textDecorationStyle: 'wavy',
                  textDecorationColor: '#999',
                  color: '#333',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {captchaText}
                </p>
              </div>
              <button
                onClick={generateCaptcha}
                className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded-full transition-colors"
                title="Refresh CAPTCHA"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Enter CAPTCHA</label>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (message.text) setMessage({ type: '', text: '' });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest font-mono"
              placeholder="Enter code"
              maxLength="6"
            />
          </div>

          <button
            onClick={verifyCaptcha}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            <button onClick={() => setScreen('signup')} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-28 pb-12 px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2">
              <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-center mb-6">Log in to your account (optional)</p>
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="loginEmail"
                  value={formData.loginEmail}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  name="loginPassword"
                  value={formData.loginPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>

            <button
              type="button"
              onClick={continueAsGuest}
              disabled={isSubmitting}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors font-medium"
            >
              Continue as Guest (no signup required)
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button onClick={() => setScreen('signup')} className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-3">
            {currentUser?.guest ? (
              <span className="text-gray-600">Guest</span>
            ) : (
              <span className="text-gray-800 font-medium">{currentUser?.fullName}</span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Welcome, {currentUser?.fullName || 'Guest'}!</h2>
              {currentUser?.guest ? (
                <p className="text-gray-600">You are using the app as a guest. Progress won't be saved to a profile.</p>
              ) : (
                <p className="text-gray-600">You are successfully logged in</p>
              )}
            </div>
          </div>

          {!currentUser?.guest && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-800">Account Information</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingProfile(!editingProfile)} className="text-sm px-3 py-1 bg-white border rounded">{editingProfile ? 'Cancel' : 'Edit Profile'}</button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded overflow-hidden border">
                    {currentUser?.photo ? <img src={currentUser.photo} alt="avatar" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-700"><span className="font-medium">Name:</span> {currentUser?.fullName}</p>
                    <p className="text-gray-700"><span className="font-medium">Email:</span> {currentUser?.email}</p>
                    <p className="text-gray-700"><span className="font-medium">User ID:</span> {currentUser?.id}</p>
                  </div>
                </div>
                <p className="text-gray-700"><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Verified ✓</span></p>
                <p className="text-gray-700"><span className="font-medium">Joined:</span> {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              {editingProfile && (
                <div className="mt-4 border-t pt-4">
                  {profileMsg.text && (
                    <div className={`mb-3 p-2 rounded ${profileMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{profileMsg.text}</div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm font-medium">Full Name</label>
                    <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))} className="p-2 border rounded" />

                    <label className="text-sm font-medium">Profile Photo</label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />

                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Profile</button>
                      <button onClick={() => setEditingProfile(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <h4 className="font-semibold">Change Password</h4>
                      <input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="mt-2 p-2 border rounded w-full" />
                      <input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="mt-2 p-2 border rounded w-full" />
                      <input type="password" placeholder="Confirm new password" value={passwordForm.confirmNewPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmNewPassword: e.target.value }))} className="mt-2 p-2 border rounded w-full" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleChangePassword} className="px-4 py-2 bg-green-600 text-white rounded">Change Password</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
