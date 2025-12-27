
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <AlertCircle size={18} className="text-red-400" />;
      case 'WARNING': return <AlertTriangle size={18} className="text-amber-400" />;
      case 'SUCCESS': return <CheckCircle2 size={18} className="text-green-400" />;
      default: return <Info size={18} className="text-brand-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white rounded-full relative transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-neon"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 border border-slate-700">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-bold text-slate-200">Sinais</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-brand-400 font-bold hover:text-brand-300">
                Ler tudo
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Silêncio no radar.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map(n => (
                  <li key={n.id} className={`p-4 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-brand-500/5' : ''}`}>
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                           <h4 className={`text-sm font-bold ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                             {n.title}
                           </h4>
                           {!n.isRead && <span className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5"></span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                        
                        {n.actionLink && (
                           <Link 
                             to={n.actionLink} 
                             onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                             className="block mt-2 text-[10px] font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider"
                           >
                             Verificar >
                           </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
             <button onClick={clearAll} className="w-full py-3 text-xs text-slate-500 border-t border-white/5 hover:bg-white/5 font-medium transition-colors">
                Limpar Radar
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
