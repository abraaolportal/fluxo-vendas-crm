
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Lead, PipelineStage } from '../types';
import { X, PlusCircle, Loader2 } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead } = useCRM();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    value: '',
    source: 'Receptivo',
    productOfInterest: '',
    interestLevel: 'Morno',
    stage: PipelineStage.QUALIFICADO,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.phone || !formData.value) {
        setError("Nome, Telefone e Valor são obrigatórios.");
        return;
    }
    
    setLoading(true);
    try {
        const newLeadData: Omit<Lead, 'id' | 'ownerId' | 'squadId' | 'createdAt' | 'updatedAt'> = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            value: parseFloat(formData.value) || 0,
            stage: formData.stage as PipelineStage,
            nextFollowUp: new Date().toISOString(),
            notes: [{
                id: 'init',
                content: `Lead criado via formulário.`,
                createdAt: new Date().toISOString(),
                type: 'note'
            }],
            tags: [],
            source: formData.source as any,
            interestLevel: formData.interestLevel as any,
            productOfInterest: formData.productOfInterest,
        };
        await addLead(newLeadData);
        onClose();
        // Reset form after successful submission
        setFormData({ name: '', email: '', phone: '', value: '', source: 'Receptivo', productOfInterest: '', interestLevel: 'Morno', stage: PipelineStage.QUALIFICADO });
    } catch (err) {
        setError("Falha ao criar lead.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-lg rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle size={20} className="text-brand-400" />
            Adicionar Novo Lead
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome*</label>
              <input name="name" value={formData.name} onChange={handleChange} required className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone*</label>
              <input name="phone" value={formData.phone} onChange={handleChange} required className="form-input" placeholder="(XX) XXXXX-XXXX"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)*</label>
              <input type="number" name="value" value={formData.value} onChange={handleChange} required className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origem</label>
              <select name="source" value={formData.source} onChange={handleChange} className="form-input">
                  <option>Receptivo</option>
                  <option>Indicação</option>
                  <option>SDR</option>
                  <option>Migração</option>
                  <option>Renovação</option>
                  <option>Base de Leads</option>
                  <option>Automação</option>
                  <option>EBOOK</option>
                  <option>Carrinho</option>
              </select>
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nível de Interesse</label>
                <select name="interestLevel" value={formData.interestLevel} onChange={handleChange} className="form-input">
                    <option value="Frio">❄️ Frio</option>
                    <option value="Morno">🌤️ Morno</option>
                    <option value="Quente">🔥 Quente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estágio no Funil</label>
                <select name="stage" value={formData.stage} onChange={handleChange} className="form-input">
                  {Object.values(PipelineStage)
                    .filter(s => s !== PipelineStage.GANHO && s !== PipelineStage.PERDIDO)
                    .map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto de Interesse</label>
            <input name="productOfInterest" value={formData.productOfInterest} onChange={handleChange} className="form-input" placeholder="Ex: Curso Policia Federal"/>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex justify-center items-center">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
      <style>{`.form-input { width: 100%; background-color: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 0.5rem; padding: 0.625rem; font-size: 0.875rem; color: #cbd5e1; outline: none;} .form-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.3); }`}</style>
    </div>
  );
};

export default NewLeadModal;