
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Lead, PipelineStage } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  stage: PipelineStage;
  initialMessage: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, lead, stage, initialMessage }) => {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (!isOpen) return null;

  const handleSend = () => {
    // Using a more robust phone number cleaner
    const cleanedPhone = lead.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanedPhone.length > 10 ? cleanedPhone : `55${cleanedPhone}`; // Assuming BR code if missing
    
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-full">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Enviar WhatsApp</h3>
              <p className="text-xs text-slate-400">Para: {lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mensagem (Editável)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSend}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 hover:bg-green-500 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Send size={16} />
            Enviar no App
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;