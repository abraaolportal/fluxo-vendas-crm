
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

const LOGO_BASE64 = 'data:image/png;base64,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';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setError('');
    try {
        await login('joao@portal.com', '123');
        navigate('/');
    } catch (err: any) {
        setError("Falha no login rápido. Verifique o mockBackend.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="glass-panel p-10 rounded-2xl border-slate-700 shadow-glass">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center shadow-inner-lg mb-4 border border-slate-700/50 ring-1 ring-black/5">
               <img src={LOGO_BASE64} alt="Portal Concursos Logo" className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal Concursos</h1>
            <p className="text-slate-400 text-sm">Plataforma de Vendas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive-500/10 border border-destructive-500/20 text-destructive-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-primary-500/50 focus:shadow-neon-blue focus:outline-none transition-all placeholder:text-slate-600"
                placeholder="seu.email@portal.com"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-primary-500/50 focus:shadow-neon-blue focus:outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] flex justify-center items-center shadow-lg shadow-primary-500/20 hover:shadow-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Plataforma'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={handleQuickLogin}
              disabled={loading}
              className="bg-transparent text-slate-500 hover:text-slate-300 font-medium py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              Entrar como Vendedor (Demo)
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-700 mt-8">
          © {new Date().getFullYear()} Portal Concursos. Acesso restrito a colaboradores.
        </p>
      </div>
    </div>
  );
};

export default Login;
      