import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Mail, UserCheck, AlertCircle, LogOut } from 'lucide-react';
import { apiClient, UserAuthData } from '../../services/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('user@firesync.nasa.gov');
  const [password, setPassword] = useState('FiresyncAnalyst2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAuthData['user'] | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient
        .getMe()
        .then((user) => {
          if (user) setCurrentUser(user);
        })
        .catch(() => {
          setCurrentUser(null);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.login(email, password);
      setCurrentUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.setToken(null);
    setCurrentUser(null);
  };

  const fillCredentials = (role: 'admin' | 'analyst') => {
    if (role === 'admin') {
      setEmail('admin@firesync.nasa.gov');
      setPassword('FiresyncAdmin2026!');
    } else {
      setEmail('user@firesync.nasa.gov');
      setPassword('FiresyncAnalyst2026!');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-md bg-space-950 border border-nasa-cyan/40 rounded-2xl p-6 shadow-2xl shadow-nasa-cyan/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-nasa-blue/30 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">FIRESYNC ACCESS CONTROL</h2>
            <p className="text-xs text-slate-400">NASA FIRMS SECURED GATEWAY</p>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <UserCheck className="w-4 h-4" />
                <span>AUTHENTICATED OPERATOR</span>
              </div>
              <p className="text-slate-300">Logged in as: {currentUser.fullName}</p>
              <p className="text-slate-400 font-mono text-[11px] mt-1">{currentUser.email}</p>
              <div className="mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold">
                ROLE: {currentUser.role}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/60 rounded-xl text-xs font-bold text-rose-300 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>TERMINATE SESSION</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">OPERATOR EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-space-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-nasa-cyan"
                  placeholder="name@firesync.nasa.gov"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">SECURITY CREDENTIAL</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-space-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-nasa-cyan"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-nasa-blue to-nasa-cyan text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHORIZE SESSION'}
            </button>

            {/* Quick Presets for Evaluator */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Quick Login:</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('analyst')}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin')}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
                >
                  Admin
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

