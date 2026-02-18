import React, { useState, useEffect } from 'react';
import { useIptv } from '@/contexts/IptvContext';
import { Loader2, Globe, User, Lock, Server, Edit3, ArrowLeft } from 'lucide-react';
import { getDnsServers, type DnsServer } from '@/lib/dns-servers';
import logo from '@/assets/logo.png';

const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useIptv();
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [dnsServers, setDnsServers] = useState<DnsServer[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    getDnsServers()
      .then((servers) => {
        setDnsServers(servers);
        if (servers.length === 1) {
          setHost(servers[0].url);
          setSelectedServerId(servers[0].id);
        }
      })
      .catch(() => {
        // On error, fallback to manual mode
        setManualMode(true);
      })
      .finally(() => setLoadingServers(false));
  }, []);

  const handleSelectServer = (server: DnsServer) => {
    setSelectedServerId(server.id);
    setHost(server.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ host, username, password });
  };

  const showServerSelection = !manualMode && dnsServers.length > 1;
  const singleServer = !manualMode && dnsServers.length === 1;

  return (
    <div className="login-bg h-screen w-screen flex flex-row overflow-hidden">
      {/* Left Column - Branding (40%) */}
      <div className="w-[40%] flex flex-col items-center justify-center gap-3 px-6">
        <img src={logo} alt="BestApp" className="w-20 h-20 rounded-2xl shadow-lg shadow-purple-500/25" />
        <h1 className="text-2xl font-bold tracking-tight text-white">BestApp</h1>
        <p className="text-gray-500 text-xs text-center max-w-[200px]">Sua experiência de entretenimento premium</p>
      </div>

      {/* Right Column - Form (60%) */}
      <div className="w-[60%] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Server selection */}
            {loadingServers ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Servidor</label>
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-xl bg-white/5 animate-pulse" />
                  <div className="h-10 flex-1 rounded-xl bg-white/5 animate-pulse" />
                </div>
              </div>
            ) : showServerSelection ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  Servidor
                </label>
                <div className="flex gap-2">
                  {dnsServers.map((server) => (
                    <button
                      key={server.id}
                      type="button"
                      onClick={() => handleSelectServer(server)}
                      className={`flex-1 h-10 rounded-xl text-xs font-medium transition-all ${
                        selectedServerId === server.id
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                      } border backdrop-blur-sm`}
                    >
                      {server.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setManualMode(true); setHost(''); setSelectedServerId(null); }}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mt-0.5"
                >
                  <Edit3 className="w-3 h-3" />
                  Configurar Manualmente
                </button>
              </div>
            ) : manualMode ? (
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
                {dnsServers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setManualMode(false); setHost(''); setSelectedServerId(null); }}
                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Voltar para lista
                  </button>
                )}
              </div>
            ) : null}

            {/* Single server info (hidden selection) */}
            {singleServer && (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500">
                  Servidor: <span className="text-gray-400">{dnsServers[0].name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setManualMode(true); setHost(''); setSelectedServerId(null); }}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Alterar
                </button>
              </div>
            )}

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
