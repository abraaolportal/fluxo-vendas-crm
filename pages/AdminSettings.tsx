
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCRM } from '../context/CRMContext';
import { AuthService } from '../services/mockBackend';
import { User, UserRole, PipelineStage, Squad, HabitTemplate } from '../types';
import { Shield, MessageCircle, CheckSquare, Users, Save, Trash2, Plus, GripVertical, Edit2, Key, UserCheck, UserX, AlertCircle, X, Loader2, BarChart3, Award, Phone, Mail, ListChecks, Globe, UserSquare } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminSettings: React.FC = () => {
  const { isManager, user: currentUser, isFullAdmin } = useAuth();
  const { habitTemplates, addHabitTemplate, deleteHabitTemplate, updateHabitTemplate, messageTemplates, updateMessageTemplate, squadPerformance, goals, setGoal } = useCRM();

  const [activeTab, setActiveTab] = useState<'users' | 'checklist' | 'scripts'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'SALESPERSON' as UserRole, squadId: '', password: '' });
  const [userError, setUserError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Script Template State
  const [editingTemplates, setEditingTemplates] = useState<Record<string, string>>({});

  // Habit/Checklist State
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitTemplate | null>(null);
  const [habitFormData, setHabitFormData] = useState({ title: '', squadId: '' });
  
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [activeTab, currentUser]);

  const loadInitialData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedSquads] = await Promise.all([AuthService.getAllUsers(currentUser), AuthService.getSquads()]);
      setUsers(fetchedUsers); 
      setSquads(fetchedSquads);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };
  
  if (!isManager) return <Navigate to="/" replace />;
  
  // User Management Handlers
  const handleOpenUserModal = (userToEdit?: User) => {
    setEditingUser(userToEdit || null);
    const initialSquadId = !isFullAdmin && currentUser ? currentUser.squadId || '' : (userToEdit ? userToEdit.squadId || '' : '');
    
    setFormData(userToEdit 
      ? { name: userToEdit.name, email: userToEdit.email, role: userToEdit.role, squadId: initialSquadId, password: '' } 
      : { name: '', email: '', role: 'SALESPERSON', squadId: initialSquadId, password: '' }
    );
    setUserError(''); setIsUserModalOpen(true);
  };
  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault(); setActionLoading(true); setUserError('');
    if (!currentUser) { setUserError("Sessão inválida. Por favor, faça login novamente."); setActionLoading(false); return; }
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) delete (dataToSend as any).password;
      
      if (editingUser) await AuthService.updateUser(editingUser.id, dataToSend, currentUser);
      else await AuthService.createUser({ ...dataToSend, isActive: true }, currentUser);

      setIsUserModalOpen(false); loadInitialData();
    } catch (err: any) { setUserError(err.message || "Ocorreu um erro desconhecido."); } finally { setActionLoading(false); }
  };
  
  const handleToggleStatus = async (id: string) => { try { await AuthService.toggleStatus(id); loadInitialData(); } catch (e) { alert("Erro."); }};
  const handleResetPassword = async (id: string) => { if (window.confirm("Resetar senha para 'Portal2025*'?")) { try { await AuthService.resetPassword(id); alert("Senha resetada."); } catch (e) { alert("Erro."); } }};
  
  // Script Management
  const getTemplateContent = (stage: PipelineStage) => editingTemplates[stage] !== undefined ? editingTemplates[stage] : (messageTemplates.find(t => t.stage === stage)?.content || '');
  const handleSaveTemplate = async (stage: PipelineStage) => { const content = editingTemplates[stage]; if (content !== undefined) { await updateMessageTemplate(stage, content); const newState = { ...editingTemplates }; delete newState[stage]; setEditingTemplates(newState); }};
  
  // Checklist/Habit Management
  const handleOpenHabitModal = (habit?: HabitTemplate) => {
    setEditingHabit(habit || null);
    setHabitFormData(habit ? { title: habit.title, squadId: habit.squadId || '' } : { title: '', squadId: '' });
    setIsHabitModalOpen(true);
  };
  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitFormData.title.trim()) return;
    setActionLoading(true);
    try {
      if (editingHabit) {
        await updateHabitTemplate(editingHabit.id, { title: habitFormData.title, squadId: habitFormData.squadId || undefined });
      } else {
        await addHabitTemplate({ title: habitFormData.title, squadId: habitFormData.squadId || undefined });
      }
      setIsHabitModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };
  
  const AdminTabButton = ({ label, tabName, icon: Icon }: any) => ( <button onClick={() => setActiveTab(tabName)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tabName ? 'bg-white/10 text-brand-400' : 'text-slate-400 hover:bg-white/5'}`}> <Icon size={16} /> {label} </button> );

  const globalHabits = habitTemplates.filter(h => !h.squadId);
  const squadHabits = squads.map(squad => ({ ...squad, habits: habitTemplates.filter(h => h.squadId === squad.id) }));

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
      <div className="flex items-center gap-4 mb-8"><div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700"><Shield size={24} className="text-brand-400" /></div><div><h1 className="text-2xl font-bold text-white">Painel de Gestão</h1><p className="text-slate-400 text-sm">Gerencie usuários, checklists e scripts.</p></div></div>
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-xl mb-8 w-full md:w-auto overflow-x-auto">
        <AdminTabButton label="Usuários" tabName="users" icon={Users} />
        <AdminTabButton label="Checklist" tabName="checklist" icon={CheckSquare} />
        <AdminTabButton label="Scripts" tabName="scripts" icon={MessageCircle} />
      </div>

      {activeTab === 'users' && <div className="animate-in fade-in slide-in-from-bottom-2"><div className="glass-panel rounded-xl overflow-hidden"><div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-sm font-bold text-white">Gerenciamento de Equipe</h3><button onClick={() => handleOpenUserModal()} className="text-xs bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"><Plus size={14} /> Novo Usuário</button></div>{isLoading ? <div className="p-12 flex justify-center text-brand-400"><Loader2 className="animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-400"><thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500"><tr><th className="px-6 py-3">Usuário</th><th className="px-6 py-3">Squad</th><th className="px-6 py-3">Função</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-800">{users.map(u => (<tr key={u.id} className="hover:bg-slate-800/30"><td className="px-6 py-3"><div className="font-medium text-white">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></td><td className="px-6 py-3"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{squads.find(s => s.id === u.squadId)?.name || 'N/A'}</span></td><td className="px-6 py-3">{u.role}</td><td className="px-6 py-3">{u.isActive ? <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.h-1.5 rounded-full bg-green-400"></span> Ativo</span> : <span className="flex items-center gap-1.5 text-xs text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Inativo</span>}</td><td className="px-6 py-3"><div className="flex items-center justify-end gap-2"><button onClick={() => handleOpenUserModal(u)} className="p-1.5 text-slate-400 hover:text-white rounded" title="Editar"><Edit2 size={16} /></button><button onClick={() => handleResetPassword(u.id)} className="p-1.5 text-slate-400 hover:text-amber-400 rounded" title="Resetar Senha"><Key size={16} /></button><button onClick={() => handleToggleStatus(u.id)} className={`p-1.5 rounded ${u.isActive ? 'text-slate-400 hover:text-red-400' : 'hover:text-green-400'}`} title={u.isActive ? "Desativar" : "Ativar"}>{u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}</button></div></td></tr>))}</tbody></table></div>}</div></div>}
      
      {activeTab === 'checklist' && <div className="animate-in fade-in slide-in-from-bottom-2 glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white">Gerenciar Rotinas Diárias</h3>
            <button onClick={() => handleOpenHabitModal()} className="flex items-center gap-2 text-xs bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-md"><Plus size={14} /> Nova Tarefa</button>
          </div>
          <div className="space-y-6">
              <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Globe size={14} /> Tarefas Globais</h4>
                  <div className="space-y-2">{globalHabits.map(t => ( <div key={t.id} className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800 rounded-lg group"><span className="text-sm text-slate-300">{t.title}</span><div className="flex items-center gap-2 opacity-50 group-hover:opacity-100"><button onClick={() => handleOpenHabitModal(t)} className="text-slate-500 hover:text-white p-1"><Edit2 size={14}/></button><button onClick={() => deleteHabitTemplate(t.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={14} /></button></div></div>))}</div>
              </div>
              {squadHabits.map(s => (
                  <div key={s.id}>
                      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><UserSquare size={14}/> {s.name}</h4>
                      <div className="space-y-2">{s.habits.map(t => (<div key={t.id} className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800 rounded-lg group"><span className="text-sm text-slate-300">{t.title}</span><div className="flex items-center gap-2 opacity-50 group-hover:opacity-100"><button onClick={() => handleOpenHabitModal(t)} className="text-slate-500 hover:text-white p-1"><Edit2 size={14}/></button><button onClick={() => deleteHabitTemplate(t.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={14} /></button></div></div>))}</div>
                  </div>
              ))}
          </div>
      </div>}

      {activeTab === 'scripts' && <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2"><div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex gap-4 items-start"><div className="p-2 bg-brand-500/10 rounded text-brand-400"><MessageCircle size={20} /></div><div><h3 className="text-sm font-bold text-white">Variáveis Disponíveis</h3><p className="text-xs text-slate-500 mb-2">Use estas tags para personalizar as mensagens.</p><div className="flex gap-2 flex-wrap">{['{{nome_lead}}', '{{nome_vendedor}}', '{{produto}}', '{{data_followup}}'].map(tag => (<code key={tag} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">{tag}</code>))}</div></div></div><div className="grid md:grid-cols-2 gap-6">{Object.values(PipelineStage).map(stage => ( <div key={stage} className="glass-panel p-5 rounded-xl"><div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stage}</span>{editingTemplates[stage] !== undefined && (<button onClick={() => handleSaveTemplate(stage)} className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 py-1.5 rounded transition-colors"><Save size={14} /> Salvar</button>)}</div><textarea value={getTemplateContent(stage)} onChange={(e) => setEditingTemplates({...editingTemplates, [stage]: e.target.value})} className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-brand-500 resize-none" placeholder="Digite o modelo..."/></div> ))}</div></div>}

      {isUserModalOpen && ( <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3><button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button></div>{userError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400"><AlertCircle size={16} /> {userError}</div>}<form onSubmit={handleSaveUser} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label><input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input required type="email" value={formData.email} disabled={!!editingUser} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white ${editingUser ? 'opacity-50' : ''}`}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white"><option value="SALESPERSON">Vendedor</option>{isFullAdmin && (<><option value="SUPERVISOR">Supervisor</option><option value="COORDINATOR">Coordenador</option><option value="ADMIN">Admin</option></>)}</select></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Squad</label><select value={formData.squadId} onChange={(e) => setFormData({...formData, squadId: e.target.value})} disabled={!isFullAdmin} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50"><option value="">Nenhum</option>{squads.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label><input type="password" placeholder={editingUser ? 'Deixe em branco para não alterar' : ''} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder:text-slate-600"/></div><div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium">Cancelar</button><button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold flex justify-center items-center">{actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar'}</button></div></form></div></div>)}
      
      {isHabitModalOpen && ( <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white">{editingHabit ? 'Editar Tarefa' : 'Nova Tarefa de Rotina'}</h3><button onClick={() => setIsHabitModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button></div><form onSubmit={handleSaveHabit} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título da Tarefa</label><input required value={habitFormData.title} onChange={(e) => setHabitFormData({...habitFormData, title: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Atribuir ao Squad</label><select value={habitFormData.squadId} onChange={(e) => setHabitFormData({...habitFormData, squadId: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-white"><option value="">Global (Todos)</option>{squads.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div><div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsHabitModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium">Cancelar</button><button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold flex justify-center items-center">{actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar'}</button></div></form></div></div>)}
    </div>
  );
};

export default AdminSettings;
