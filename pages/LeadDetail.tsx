

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { generateEmailDraft, analyzeLeadHealth, summarizeHistory } from '../services/geminiService';
import { PipelineStage, Note } from '../types';
import { 
  ArrowLeft, Phone, Mail, Sparkles, Send, CheckCircle2, Clock, MessageCircle,
  Tag, BarChart3, Users, Plus, BrainCircuit, Loader2, FileText
} from 'lucide-react';
import WhatsAppModal from '../components/WhatsAppModal';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, updateLead, addNote, addTask, tasks, toggleTask, getParsedTemplate } = useCRM();
  
  const lead = leads.find(l => l.id === id);
  const leadTasks = tasks.filter(t => t.leadId === id);

  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'tasks' | 'ai'>('details');
  const [noteContent, setNoteContent] = useState('');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const [aiContext, setAiContext] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [waModalOpen, setWaModalOpen] = useState(false);

  if (!lead) return <div className="p-4">Lead não encontrado</div>;

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => { updateLead(lead.id, { stage: e.target.value as PipelineStage }); };
  const handleAddNote = (e: React.FormEvent) => { e.preventDefault(); if(!noteContent.trim()) return; addNote(lead.id, noteContent, 'note'); setNoteContent(''); };
  const handleAddTask = (e: React.FormEvent) => { e.preventDefault(); if (!newTaskTitle.trim() || !newTaskDate) return; addTask({ leadId: lead.id, title: newTaskTitle, dueDate: newTaskDate, completed: false, priority: 'medium', type: 'FOLLOW_UP' }); setNewTaskTitle(''); };

  const handleQuickLog = (type: Note['type']) => {
    const contentMap = { 'call': 'Chamada realizada.', 'email': 'E-mail enviado.', 'meeting': 'Reunião agendada.' };
    addNote(lead.id, contentMap[type] || 'Atividade registrada.', type);
  };
  
  const handleSummarize = async () => {
    setIsSummaryLoading(true);
    setSummary('');
    try {
        const result = await summarizeHistory(lead.notes);
        setSummary(result);
    } catch(e) {
        setSummary("Erro ao gerar resumo.");
    } finally {
        setIsSummaryLoading(false);
    }
  };

  const runAiEmail = async () => {
    setIsAiLoading(true); setAiOutput('');
    try { const result = await generateEmailDraft(lead, aiContext || "Apresentação comercial padrão"); setAiOutput(result); } 
    catch (e) { setAiOutput("Erro ao gerar e-mail. Verifique a chave de API."); } finally { setIsAiLoading(false); }
  };

  const runAiAnalysis = async () => {
    setIsAiLoading(true); setAiOutput('');
    try { const result = await analyzeLeadHealth(lead); setAiOutput(result); } 
    catch (e) { setAiOutput("Erro ao analisar lead."); } finally { setIsAiLoading(false); }
  };

  const noteIcons: Record<Note['type'], React.ReactElement> = {
    note: <FileText size={14} className="text-slate-500" />,
    call: <Phone size={14} className="text-blue-500" />,
    email: <Mail size={14} className="text-purple-500" />,
    meeting: <Users size={14} className="text-green-500" />,
  };

  return (
    <div className="pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={20} className="text-slate-400" /></button>
        <div className="flex-1"><h1 className="text-xl font-bold text-white leading-tight">{lead.name}</h1><p className="text-sm text-slate-500">{lead.company}</p></div>
        <div className="relative"><select value={lead.stage} onChange={handleStageChange} className="appearance-none bg-slate-800 text-slate-300 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 focus:ring-2 focus:ring-brand-500">{Object.values(PipelineStage).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <button onClick={() => setWaModalOpen(true)} className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-800 rounded-xl shadow-sm hover:bg-slate-800/80"><MessageCircle size={20} className="text-green-500 mb-1" /><span className="text-[10px] font-medium text-slate-400">Whats</span></button>
        <a href={`mailto:${lead.email}`} className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-800 rounded-xl shadow-sm hover:bg-slate-800/80"><Mail size={20} className="text-blue-500 mb-1" /><span className="text-[10px] font-medium text-slate-400">Email</span></a>
        <button onClick={() => setActiveTab('ai')} className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-brand-500 to-accent-purple rounded-xl shadow-md text-white"><Sparkles size={20} className="mb-1" /><span className="text-[10px] font-medium">IA Help</span></button>
      </div>

      <div className="flex border-b border-slate-800 mb-4 overflow-x-auto no-scrollbar">
        {['details', 'timeline', 'tasks', 'ai'].map(tab => <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 pb-2 min-w-[80px] text-sm font-medium ${activeTab === tab ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'timeline' && (
          <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
            <div className="flex gap-2 items-center"><p className="text-xs font-bold text-slate-500 uppercase">Registrar</p><div className="flex-1 border-t border-dashed border-slate-700"></div></div>
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleQuickLog('call')} className="quick-log-btn"><Phone size={14}/> Chamada</button>
                <button onClick={() => handleQuickLog('email')} className="quick-log-btn"><Mail size={14}/> Email</button>
                <button onClick={() => handleQuickLog('meeting')} className="quick-log-btn"><Users size={14}/> Reunião</button>
            </div>
            <style>{`.quick-log-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background-color: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; font-size: 12px; font-weight: 500; color: #94a3b8; transition: all .2s; } .quick-log-btn:hover { background-color: rgba(51, 65, 85, 0.9); color: #e2e8f0; }`}</style>
            
            <form onSubmit={handleAddNote} className="relative"><input value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Adicionar nota detalhada..." className="w-full bg-slate-800/80 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-500/50 border border-slate-700 text-white"/><button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-600 text-white rounded-full"><Send size={16} /></button></form>
            
            {(summary || isSummaryLoading) ? (
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 whitespace-pre-line shadow-inner">
                    {isSummaryLoading ? <div className="flex items-center justify-center p-4"><BrainCircuit size={20} className="text-purple-400 animate-pulse-glow" /></div> : summary}
                </div>
            ) : ( lead.notes.length > 2 && <button onClick={handleSummarize} className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2 text-purple-400 hover:text-purple-300"><BrainCircuit size={14} /> Sumarizar Histórico com IA</button> )}

            <div className="space-y-4 pt-2">
              {lead.notes.map(note => (
                <div key={note.id} className="flex gap-3 text-sm">
                   <div className="w-8 flex-shrink-0 flex flex-col items-center"><div className="p-1 rounded-full bg-slate-800 border border-slate-700 mb-1">{noteIcons[note.type]}</div><div className="w-0.5 flex-1 bg-slate-800"></div></div>
                   <div className="pb-4"><p className="text-slate-300">{note.content}</p><span className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
              ))}
              {lead.notes.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Nenhuma nota ainda.</p>}
            </div>
          </div>
        )}
        {/* Other tabs content here, keeping it minimal for brevity */}
         {activeTab === 'details' && ( <div className="space-y-4 animate-in slide-in-from-right-2 duration-300"><div className="glass-panel p-4 rounded-xl space-y-4"><h3 className="font-bold text-slate-200 text-sm flex items-center gap-2"><BarChart3 size={16} className="text-brand-400" /> Classificação</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Interesse</label><select value={lead.interestLevel || 'Frio'} onChange={(e) => updateLead(lead.id, { interestLevel: e.target.value as any })} className="w-full bg-slate-900/50 border-slate-700 border rounded-lg text-sm font-medium p-2 text-slate-300 focus:ring-2 focus:ring-brand-500"><option value="Frio">❄️ Frio</option><option value="Morno">🌤️ Morno</option><option value="Quente">🔥 Quente</option></select></div><div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Origem</label><select value={lead.source || 'Outros'} onChange={(e) => updateLead(lead.id, { source: e.target.value as any })} className="w-full bg-slate-900/50 border-slate-700 border rounded-lg text-sm font-medium p-2 text-slate-300 focus:ring-2 focus:ring-brand-500"><option>Receptivo</option><option>Indicação</option><option>SDR</option><option>Migração</option><option>Renovação</option><option>Base de Leads</option><option>Automação</option><option>EBOOK</option><option>Carrinho</option></select></div></div><div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Produto de Interesse</label><input value={lead.productOfInterest || ''} onChange={(e) => updateLead(lead.id, { productOfInterest: e.target.value })} placeholder="Ex: Curso Auditor Fiscal" className="w-full bg-slate-900/50 border-slate-700 border rounded-lg text-sm font-medium p-2 text-slate-300 focus:ring-2 focus:ring-brand-500 placeholder-slate-600"/></div></div><div className="glass-panel p-4 rounded-xl space-y-3"><h3 className="font-bold text-slate-200 text-sm flex items-center gap-2"><Tag size={16} className="text-brand-400" /> Dados Básicos</h3><div className="flex justify-between py-2 border-b border-slate-800"><span className="text-sm text-slate-500">Valor Estimado</span><span className="text-sm font-bold text-slate-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}</span></div><div className="flex justify-between py-2 border-b border-slate-800"><span className="text-sm text-slate-500">Telefone</span><span className="text-sm font-medium text-slate-300">{lead.phone}</span></div><div className="flex justify-between py-2"><span className="text-sm text-slate-500">Email</span><span className="text-sm font-medium text-slate-300 truncate max-w-[150px]">{lead.email}</span></div></div></div> )}
         {activeTab === 'tasks' && ( <div className="space-y-3 animate-in slide-in-from-right-2 duration-300"><form onSubmit={handleAddTask} className="flex gap-2 items-center p-2 bg-slate-900/50 border border-slate-800 rounded-lg"><input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Adicionar tarefa..." className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none"/><input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300 p-1 focus:ring-1 focus:ring-brand-500"/><button type="submit" className="p-2 bg-brand-500 rounded-md text-white hover:bg-brand-400 disabled:opacity-50" disabled={!newTaskTitle.trim()}><Plus size={16} /></button></form>{leadTasks.map(task => ( <div key={task.id} className="flex items-center p-3 bg-slate-900/50 border border-slate-800 rounded-lg shadow-sm"><button onClick={() => toggleTask(task.id)} className={`mr-3 ${task.completed ? 'text-green-500' : 'text-slate-600'}`}>{task.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}</button><span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.title}</span><span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span></div> ))}</div> )}
         {activeTab === 'ai' && ( <div className="space-y-4 animate-in slide-in-from-right-2 duration-300"><div className="bg-gradient-to-r from-brand-500/10 to-accent-purple/10 p-4 rounded-xl border border-brand-500/20"><h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Sparkles size={16} /> Assistente Gemini</h3><div className="flex gap-2 mb-4"><button onClick={runAiAnalysis} className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-700/80">Analisar Saúde</button><button onClick={() => setAiContext('Follow-up de proposta')} className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-700/80">Gerar E-mail</button></div><div className="mb-3"><label className="text-xs font-bold text-brand-400/80 mb-1 block">Contexto (para e-mail)</label><input value={aiContext} onChange={(e) => setAiContext(e.target.value)} placeholder="Ex: Cobrar resposta..." className="w-full text-sm p-2 rounded border border-slate-700 bg-slate-900/50 focus:ring-brand-500 text-white"/><button onClick={runAiEmail} disabled={isAiLoading || !aiContext} className="mt-2 w-full bg-brand-600 text-white py-1.5 rounded text-xs font-bold disabled:opacity-50">{isAiLoading ? 'Gerando...' : 'Criar Rascunho'}</button></div>{isAiLoading ? (<div className="flex items-center justify-center p-4"><BrainCircuit size={20} className="text-purple-400 animate-pulse-glow" /></div>) : aiOutput && ( <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 whitespace-pre-line shadow-inner">{aiOutput}</div> )}</div></div> )}
      </div>
      <WhatsAppModal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} lead={lead} stage={lead.stage} initialMessage={getParsedTemplate(lead.stage, lead)} />
    </div>
  );
};

export default LeadDetail;
