import React, { useState } from 'react';
import { useIptv } from '@/contexts/IptvContext';
import { Tv, Loader2, Globe, User, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useIptv();
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ host, username, password });
  };

  return (
    <div className="login-bg h-screen w-screen flex flex-row overflow-hidden">
      {/* Left Column - Branding (40%) */}
      <div className="w-[40%] flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Tv className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">IPTV Player</h1>
        <p className="text-gray-500 text-xs text-center max-w-[200px]">Sua experiência de entretenimento premium</p>
      </div>

      {/* Right Column - Form (60%) */}
      <div className="w-[60%] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Host - full width */}
            <div className="space-y-1">
              <label htmlFor="host" className="text-xs font-medium text-gray-400">Host / URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="host"
                  type="text"
                  placeholder="http://servidor.com:8080"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  required
                  autoComplete="url"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* User + Password side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="username" className="text-xs font-medium text-gray-400">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="username"
                    type="text"
                    placeholder="Seu usuário"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-gray-400">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-[0.98] text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </button>

            <p className="text-center text-[10px] text-gray-600 pt-1">
              Seus dados são salvos localmente no dispositivo
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
