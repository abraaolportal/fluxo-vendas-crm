
import React, { useState, useMemo, memo, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { PipelineStage, Lead, User, Squad } from '../types';
import { Search, Plus, Filter, MessageCircle, Flame, Calendar, Eye, Trash2, LayoutGrid, List } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import WhatsAppModal from '../components/WhatsAppModal';
import NewLeadModal from '../components/NewLeadModal';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';

// --- STAGE CONFIGURATION ---
const stageConfig: Record<PipelineStage, { color: string; glow: string, dot: string }> = {
  [PipelineStage.QUALIFICADO]: { color: 'border-purple-400', glow: 'shadow-purple-400/20', dot: 'bg-purple-400' },
  [PipelineStage.NEGOCIACAO]: { color: 'border-blue-400', glow: 'shadow-blue-400/20', dot: 'bg-blue-400' },
  [PipelineStage.PROPOSTA_ENVIADA]: { color: 'border-cyan-400', glow: 'shadow-cyan-400/20', dot: 'bg-cyan-400' },
  [PipelineStage.AGENDOU_PAGAMENTO]: { color: 'border-pink-400', glow: 'shadow-pink-400/20', dot: 'bg-pink-400' },
  [PipelineStage.PAGAMENTO_ENVIADO]: { color: 'border-pink-500', glow: 'shadow-pink-500/20', dot: 'bg-pink-500' },
  [PipelineStage.AGUARDANDO_PAGAMENTO]: { color: 'border-amber-400', glow: 'shadow-amber-400/20', dot: 'bg-amber-400' },
  [PipelineStage.FOLLOW_UP_1]: { color: 'border-yellow-500', glow: 'shadow-yellow-500/20', dot: 'bg-yellow-500' },
  [PipelineStage.FOLLOW_UP_2]: { color: 'border-yellow-600', glow: 'shadow-yellow-600/20', dot: 'bg-yellow-600' },
  [PipelineStage.FOLLOW_UP_3_PLUS]: { color: 'border-yellow-700', glow: 'shadow-yellow-700/20', dot: 'bg-yellow-700' },
  [PipelineStage.GANHO]: { color: 'border-green-400', glow: 'shadow-green-400/20', dot: 'bg-green-400' },
  [PipelineStage.PERDIDO]: { color: 'border-slate-600', glow: 'shadow-slate-600/20', dot: 'bg-slate-600' },
};

// --- DRAGGABLE CARD COMPONENT (FOR KANBAN) ---
interface DraggableCardProps {
  lead: Lead;
  owner?: User;
  onWhatsApp: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  config: { color: string; glow: string; };
}
const DraggableCard = memo(({ lead, owner, onWhatsApp, onDelete, config }: DraggableCardProps) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, data: { lead } });
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    boxShadow: isDragging ? `0 0 40px 5px ${config.glow.replace('shadow-','').replace('/20', '/40')}` : undefined,
  };

  const ownerInitials = owner ? owner.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = new Date(lead.nextFollowUp) < today && lead.stage !== PipelineStage.GANHO && lead.stage !== PipelineStage.PERDIDO;
  const daysSinceUpdate = (new Date().getTime() - new Date(lead.updatedAt).getTime()) / (1000 * 3600 * 24);
  const isStale = daysSinceUpdate > 7 && lead.stage !== PipelineStage.GANHO && lead.stage !== PipelineStage.PERDIDO;

  const interestConfig = { 'Frio': { icon: '❄️', color: 'text-blue-400' }, 'Morno': { icon: '🌤️', color: 'text-yellow-400' }, 'Quente': { icon: '🔥', color: 'text-red-400' } };
  const currentInterest = interestConfig[lead.interestLevel || 'Frio'];

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => navigate(`/leads/${lead.id}`)} className={`relative glass-card p-4 rounded-xl cursor-grab active:cursor-grabbing mb-3 group transition-all text-sm hover:border-primary-500/50 border-l-4 ${config.color}`}>
      <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-100 leading-tight pr-4 flex-1">{lead.name}</h4><span className="font-bold text-xs text-primary-400 tracking-wide bg-primary-500/10 px-2 py-1 rounded-full">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.value)}</span></div>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-3"><p className="truncate font-mono max-w-[180px]">{lead.company}</p><div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-600" title={owner?.name}>{ownerInitials}</div></div>
      <div className="flex items-center gap-3 text-xs text-slate-400"><div className="flex items-center gap-1.5"><span className={currentInterest.color}>{currentInterest.icon}</span></div>{isOverdue && <div className="flex items-center gap-1.5 text-red-400"><Calendar size={14}/> Atrasado</div>}{isStale && <div className="flex items-center gap-1.5 text-amber-500"><Flame size={14}/> Estagnado</div>}</div>
      <div className="absolute bottom-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
        <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }} className="action-btn hover:text-primary-400" title="Ver Detalhes"><Eye size={16} /></button>
        <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onWhatsApp(lead); }} className="action-btn hover:text-green-400" title="Enviar WhatsApp"><MessageCircle size={16} /></button>
        <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} className="action-btn hover:text-red-400" title="Excluir Lead"><Trash2 size={16} /></button>
      </div>
      <style>{`.action-btn { background-color: rgba(30, 41, 59, 0.7); backdrop-filter: blur(4px); padding: 8px; border-radius: 9999px; color: #94a3b8; transition: all .2s; } .action-btn:hover { background-color: rgba(51, 65, 85, 0.9); }`}</style>
    </div>
  );
});

// --- DROPPABLE COLUMN COMPONENT (FOR KANBAN) ---
const DroppableColumn = memo(({ stage, leads, users, config, onWhatsApp, onDelete, totalPipelineValue }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValueInStage = leads.reduce((acc: number, curr: Lead) => acc + curr.value, 0);
  const percentageOfTotal = totalPipelineValue > 0 ? (totalValueInStage / totalPipelineValue) * 100 : 0;

  return (
    <div className="flex flex-col min-w-[320px] w-[320px] h-full mr-4 select-none">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 pt-1 pb-3">
        <div className={`flex items-center justify-between mb-2 px-2`}><div className="flex items-center gap-2"><h3 className="font-bold text-slate-300 text-sm">{stage}</h3><span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{leads.length}</span></div><span className="text-xs font-mono font-semibold text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalValueInStage)}</span></div>
        <div className="px-2"><div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden"><div className={`h-1 rounded-full ${config.color.replace('border-','bg-')}`} style={{ width: `${percentageOfTotal}%`, transition: 'width 0.5s ease-in-out', boxShadow: `0 0 10px ${config.glow.replace('shadow-','').replace('/20', '/80')}` }}/></div></div>
      </div>
      <div ref={setNodeRef} className={`flex-1 rounded-xl p-2 -mx-2 overflow-y-auto no-scrollbar transition-all duration-300 border-2 ${isOver ? 'bg-primary-500/10 shadow-[inset_0_0_30px_rgba(14,165,233,0.3)] border-primary-500/50 border-dashed' : 'border-transparent'}`}>
        {leads.map((lead: Lead) => <DraggableCard key={lead.id} lead={lead} owner={users.find((u:User) => u.id === lead.ownerId)} onWhatsApp={onWhatsApp} onDelete={onDelete} config={config} />)}
        {leads.length === 0 && <div className="h-24 rounded-xl flex items-center justify-center text-slate-700 text-xs font-mono">Arraste para cá</div>}
      </div>
    </div>
  );
});

// --- LIST VIEW COMPONENT ---
const ListView = memo(({ leads, users, stageConfig, onWhatsApp, onDelete }: any) => {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto w-full animate-in fade-in">
      <table className="w-full text-left text-sm text-slate-400 border-collapse">
        <thead className="text-xs text-slate-500 uppercase font-medium">
          <tr>
            <th className="p-3">Alvo</th><th className="p-3">Valor</th><th className="p-3">Etapa</th>
            <th className="p-3">Responsável</th><th className="p-3">Próx. Ação</th><th className="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {leads.map((lead: Lead) => {
            const owner = users.find((u:User) => u.id === lead.ownerId);
            const ownerInitials = owner ? owner.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
            return (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="glass-card hover:bg-slate-800/60 cursor-pointer">
                <td className="p-3"><div className="font-bold text-white">{lead.name}</div><div className="text-xs text-slate-500">{lead.company}</div></td>
                <td className="p-3 font-mono text-primary-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.value)}</td>
                <td className="p-3"><span className={`flex items-center gap-2 text-xs font-semibold ${stageConfig[lead.stage].color.replace('border','text')}`}><span className={`w-2 h-2 rounded-full ${stageConfig[lead.stage].dot}`}></span>{lead.stage}</span></td>
                <td className="p-3"><div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-600" title={owner?.name}>{ownerInitials}</div></td>
                <td className="p-3 text-xs font-mono">{new Date(lead.nextFollowUp).toLocaleDateString('pt-BR')}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }} className="action-btn-list hover:text-primary-400" title="Ver Detalhes"><Eye size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onWhatsApp(lead); }} className="action-btn-list hover:text-green-400" title="Enviar WhatsApp"><MessageCircle size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} className="action-btn-list hover:text-red-400" title="Excluir Lead"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`.action-btn-list { padding: 6px; border-radius: 9999px; color: #94a3b8; transition: all .2s; } .action-btn-list:hover { background-color: rgba(51, 65, 85, 0.9); }`}</style>
    </div>
  );
});

// --- MAIN LEADS PAGE ---
const PIPELINE_ORDER = [PipelineStage.QUALIFICADO, PipelineStage.NEGOCIACAO, PipelineStage.PROPOSTA_ENVIADA, PipelineStage.AGENDOU_PAGAMENTO, PipelineStage.PAGAMENTO_ENVIADO, PipelineStage.AGUARDANDO_PAGAMENTO, PipelineStage.FOLLOW_UP_1, PipelineStage.FOLLOW_UP_2, PipelineStage.FOLLOW_UP_3_PLUS, PipelineStage.GANHO, PipelineStage.PERDIDO];
const Leads: React.FC = () => {
  const { user, isManager } = useAuth();
  const { leads, updateLead, deleteLead, getParsedTemplate } = useCRM();
  
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [activeWaData, setActiveWaData] = useState<{ lead: Lead, stage: PipelineStage, message: string } | null>(null);
  const [textFilter, setTextFilter] = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [usersForFilter, setUsersForFilter] = useState<User[]>([]);
  const [squadsForFilter, setSquadsForFilter] = useState<Squad[]>([]);

  useEffect(() => { const loadFilterData = async () => { if (isManager && user) { const [users, squads] = await Promise.all([AuthService.getAllUsers(user), AuthService.getSquads()]); setUsersForFilter(users); setSquadsForFilter(squads); } else if(user) { setUsersForFilter([user]) } }; loadFilterData(); }, [isManager, user]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  const filteredLeads = useMemo(() => {
     let tempLeads = leads;
     if (isManager) {
        if (squadFilter) tempLeads = tempLeads.filter(l => l.squadId === squadFilter);
        if (ownerFilter) tempLeads = tempLeads.filter(l => l.ownerId === ownerFilter);
     }
     if (textFilter) tempLeads = tempLeads.filter(l => l.name.toLowerCase().includes(textFilter.toLowerCase()) || (l.company && l.company.toLowerCase().includes(textFilter.toLowerCase())));
     return tempLeads;
  }, [leads, textFilter, squadFilter, ownerFilter, isManager]);
  
  const totalPipelineValue = useMemo(() => filteredLeads.filter(l => l.stage !== PipelineStage.GANHO && l.stage !== PipelineStage.PERDIDO).reduce((acc, curr) => acc + curr.value, 0), [filteredLeads]);
  const activeLead = useMemo(() => activeDragId ? leads.find(l => l.id === activeDragId) : null, [activeDragId, leads]);

  const openWhatsApp = (lead: Lead, stage?: PipelineStage) => { setActiveWaData({ lead, stage: stage || lead.stage, message: getParsedTemplate(stage || lead.stage, lead) }); setWaModalOpen(true); };
  const handleDeleteLead = async (leadId: string) => { if (window.confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")) await deleteLead(leadId); };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event; setActiveDragId(null);
    if (!over) return;
    const leadId = active.id as string, newStage = over.id as PipelineStage, lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) { await updateLead(leadId, { stage: newStage }); openWhatsApp(lead, newStage); }
  };
  const activeLeadConfig = activeLead ? stageConfig[activeLead.stage] : stageConfig[PipelineStage.QUALIFICADO];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in">
      <div className="flex justify-between items-start md:items-center mb-6 flex-col md:flex-row gap-4">
        <div><h1 className="text-2xl font-bold text-white tracking-tight">Pipeline de Vendas</h1><p className="text-xs text-slate-500 font-mono">Arraste e solte para mover os leads</p></div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg"><button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={16} /></button><button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><List size={16} /></button></div>
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type="text" placeholder="Buscar alvo..." className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-slate-600" value={textFilter} onChange={(e) => setTextFilter(e.target.value)} /></div>
            <button onClick={() => setIsModalOpen(true)} className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-400 text-sm font-bold flex items-center gap-2 shadow-neon-blue transition-all hover:scale-105"><Plus size={18} /> <span className="hidden sm:inline">Novo Lead</span></button>
        </div>
      </div>

      {isManager && (<div className="mb-4 glass-panel p-2 rounded-xl flex items-center gap-2 flex-wrap"><Filter size={16} className="text-slate-500 ml-2" /><select value={squadFilter} onChange={e => {setSquadFilter(e.target.value); setOwnerFilter('');}} className="bg-slate-800/50 border-none rounded-md text-xs p-1.5 focus:ring-1 focus:ring-primary-500"><option value="">Todas Squads</option>{squadsForFilter.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} className="bg-slate-800/50 border-none rounded-md text-xs p-1.5 focus:ring-1 focus:ring-primary-500"><option value="">Todos Vendedores</option>{usersForFilter.filter(u => !squadFilter || u.squadId === squadFilter).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>)}

      {view === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-6 px-6"><div className="flex h-full min-w-max pb-12">{PIPELINE_ORDER.map(stage => ( <DroppableColumn key={stage} stage={stage} leads={filteredLeads.filter(l => l.stage === stage)} users={usersForFilter} config={stageConfig[stage]} onWhatsApp={openWhatsApp} onDelete={handleDeleteLead} totalPipelineValue={totalPipelineValue} /> ))}</div></div>
          <DragOverlay dropAnimation={null}>{activeLead ? (<div className="w-[300px] rotate-2 scale-105"><DraggableCard lead={activeLead} owner={usersForFilter.find(u => u.id === activeLead.ownerId)} onWhatsApp={() => {}} onDelete={() => {}} config={activeLeadConfig}/></div>) : null}</DragOverlay>
        </DndContext>
      ) : (
        <ListView leads={filteredLeads} users={usersForFilter} stageConfig={stageConfig} onWhatsApp={openWhatsApp} onDelete={handleDeleteLead} />
      )}
      
      <NewLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeWaData && <WhatsAppModal isOpen={waModalOpen} onClose={() => { setWaModalOpen(false); setActiveWaData(null); }} lead={activeWaData.lead} stage={activeWaData.stage} initialMessage={activeWaData.message} />}
    </div>
  );
};

export default Leads;