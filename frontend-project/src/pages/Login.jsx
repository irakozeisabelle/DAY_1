import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ username: '', password: '', confirm: '' });
  const [regMsg, setRegMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMsg('');
    if (regForm.password !== regForm.confirm) {
      setRegMsg('Passwords do not match.');
      return;
    }
    try {
      await api.post('/auth/register', { username: regForm.username, password: regForm.password });
      setRegMsg('✅ Account created! You can now log in.');
      setRegForm({ username: '', password: '', confirm: '' });
    } catch (err) {
      setRegMsg(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-800 rounded-full mb-3">
            <span className="text-3xl">🅿</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-800">SmartPark</h1>
          <p className="text-gray-500 text-sm">Parking Space Sales Management System</p>
          <p className="text-gray-400 text-xs mt-1">Rubavu District, Western Province, Rwanda</p>
        </div>

        {!showRegister ? (
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Manager Login</h2>
            {error && <div className="bg-red-50 border border-red-300 text-red-700 rounded p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              No account?{' '}
              <button onClick={() => setShowRegister(true)} className="text-blue-700 hover:underline font-medium">
                Register here
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Create Account</h2>
            {regMsg && (
              <div className={`rounded p-3 mb-4 text-sm border ${regMsg.startsWith('✅') ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
                {regMsg}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={regForm.username}
                  onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regForm.confirm}
                  onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repeat password"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Register
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <button onClick={() => setShowRegister(false)} className="text-blue-700 hover:underline font-medium">
                Login here
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
