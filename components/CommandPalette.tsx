
import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, User, PlusCircle, X, CornerDownLeft } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandResult = {
  type: 'lead' | 'page' | 'action';
  id: string;
  title: string;
  description?: string;
  icon: React.ReactElement;
  action: () => void;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { leads } = useCRM();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseCommands: CommandResult[] = useMemo(() => [
    { type: 'page', id: 'goto-foco', title: 'Ir para Foco', description: 'Navegar para o dashboard principal', icon: <Hash size={16}/>, action: () => navigate('/') },
    { type: 'page', id: 'goto-leads', title: 'Ir para Leads', description: 'Visualizar o pipeline de vendas', icon: <Hash size={16}/>, action: () => navigate('/leads') },
    { type: 'page', id: 'goto-admin', title: 'Ir para Admin', description: 'Gerenciar usuários e sistema', icon: <Hash size={16}/>, action: () => navigate('/admin') },
    { type: 'action', id: 'new-lead', title: 'Criar Novo Lead', description: 'Adicionar um novo lead ao pipeline', icon: <PlusCircle size={16}/>, action: () => console.log("Action: New Lead") },
  ], [navigate]);

  const allResults: CommandResult[] = useMemo(() => {
    const leadResults: CommandResult[] = leads.map(lead => ({
      type: 'lead',
      id: lead.id,
      title: lead.name,
      description: lead.company,
      icon: <User size={16}/>,
      action: () => navigate(`/leads/${lead.id}`)
    }));
    return [...baseCommands, ...leadResults];
  }, [leads, baseCommands, navigate]);

  const filteredResults = useMemo(() => {
    if (!query) return baseCommands.slice(0, 5);
    return allResults.filter(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) || 
      (r.description && r.description.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);
  }, [query, allResults, baseCommands]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        filteredResults[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-20">
      <div 
        className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Search size={20} className="text-slate-500"/>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Buscar leads ou executar comandos..."
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
          />
          <button onClick={onClose} className="text-xs text-slate-500 border border-slate-700 rounded px-2 py-1">ESC</button>
        </div>
        
        <ul className="max-h-96 overflow-y-auto no-scrollbar p-2">
          {filteredResults.map((result, index) => (
            <li key={result.id}>
              <button 
                onClick={() => { result.action(); onClose(); }}
                className={`w-full flex items-center justify-between text-left p-3 rounded-lg transition-colors ${selectedIndex === index ? 'bg-brand-500/20' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded ${selectedIndex === index ? 'text-brand-300' : 'text-slate-500'}`}>
                    {result.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${selectedIndex === index ? 'text-brand-300' : 'text-slate-200'}`}>{result.title}</p>
                    {result.description && <p className="text-xs text-slate-500">{result.description}</p>}
                  </div>
                </div>
                {selectedIndex === index && <CornerDownLeft size={16} className="text-slate-500"/>}
              </button>
            </li>
          ))}
          {filteredResults.length === 0 && (
             <li className="text-center p-6 text-sm text-slate-500">Nenhum resultado encontrado.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
