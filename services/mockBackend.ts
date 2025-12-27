
import { Lead, Task, PipelineStage, User, UserRole, Note, Squad, HabitTemplate, DailyHabit, MessageTemplate, Goal, SquadPerformanceData } from '../types';

// --- MOCK DATABASE (Repository Layer) ---
const DELAY = 250; // Simulate realistic network latency

const DB = {
  squads: [
    { id: 's1', name: 'Squad 1 - Alpha', supervisorId: 'sup1' },
    { id: 's2', name: 'Squad 2 - Beta', supervisorId: 'sup2' }
  ] as Squad[],
  users: [
    { id: 'coord1', name: 'Ana Souza', email: 'ana@portal.com', password: 'Portal2025*', role: 'ADMIN' as UserRole, isActive: true, createdAt: new Date().toISOString() },
    { id: 'sup1', name: 'Carlos Lima', email: 'carlos@portal.com', password: '123', role: 'SUPERVISOR' as UserRole, squadId: 's1', isActive: true, createdAt: new Date().toISOString() },
    { id: 'sup2', name: 'Beatriz Reis', email: 'beatriz@portal.com', password: '123', role: 'SUPERVISOR' as UserRole, squadId: 's2', isActive: true, createdAt: new Date().toISOString() },
    { id: 'sales1', name: 'João Silva', email: 'joao@portal.com', password: '123', role: 'SALESPERSON' as UserRole, squadId: 's1', isActive: true, createdAt: new Date().toISOString() },
    { id: 'sales2', name: 'Mariana Costa', email: 'mariana@portal.com', password: '123', role: 'SALESPERSON' as UserRole, squadId: 's1', isActive: true, createdAt: new Date().toISOString() },
    { id: 'sales3', name: 'Pedro Alves', email: 'pedro@portal.com', password: '123', role: 'SALESPERSON' as UserRole, squadId: 's2', isActive: true, createdAt: new Date().toISOString() },
    { id: 'sales4', name: 'Mateus Borges', email: 'mateus@portal.com', password: '123', role: 'SALESPERSON' as UserRole, squadId: 's2', isActive: true, createdAt: new Date().toISOString() },
  ] as (User & { password?: string })[],
  leads: [] as Lead[],
  tasks: [] as Task[], 
  habitTemplates: [] as HabitTemplate[],
  dailyHabits: [] as DailyHabit[], 
  messageTemplates: [] as MessageTemplate[],
  goals: [] as Goal[]
};

// --- DB INITIALIZATION & PERSISTENCE ---
const loadDB = () => {
  const data = {
    leads: localStorage.getItem('fluxo_leads'),
    tasks: localStorage.getItem('fluxo_tasks'),
    habitTemplates: localStorage.getItem('fluxo_habit_templates'),
    dailyHabits: localStorage.getItem('fluxo_daily_habits'),
    messageTemplates: localStorage.getItem('fluxo_message_templates'),
    goals: localStorage.getItem('fluxo_goals'),
  };

  DB.leads = data.leads ? JSON.parse(data.leads) : [];
  DB.tasks = data.tasks ? JSON.parse(data.tasks) : [];
  DB.goals = data.goals ? JSON.parse(data.goals) : [];

  if (data.habitTemplates) DB.habitTemplates = JSON.parse(data.habitTemplates);
  else DB.habitTemplates = [ { id: 'ht1', title: 'Login no Sistema', active: true, roleTarget: ['ADMIN', 'SALESPERSON', 'SUPERVISOR', 'COORDINATOR'] }, { id: 'ht2', title: 'Zeramento de Caixa de Entrada (MegaZap)', active: true, roleTarget: ['SALESPERSON'] }, { id: 'ht3', title: '10 Tentativas de Contato (Novos)', active: true, roleTarget: ['SALESPERSON'] }, { id: 'ht4', title: 'Follow-up de Propostas (> 2 dias)', active: true, roleTarget: ['SALESPERSON'], squadId: 's1' }, { id: 'ht5', title: 'Validação de Métricas do Squad', active: true, roleTarget: ['SUPERVISOR'] }, ];
  
  DB.dailyHabits = data.dailyHabits ? JSON.parse(data.dailyHabits) : [];
  
  if (data.messageTemplates) DB.messageTemplates = JSON.parse(data.messageTemplates);
  else DB.messageTemplates = [ { id: 'mt1', stage: PipelineStage.QUALIFICADO, content: "Olá, {{nome_lead}}!\nAqui é {{nome_vendedor}} do Portal Concursos.\nRecebi seu contato e vou te explicar como podemos te ajudar 😊" }, { id: 'mt2', stage: PipelineStage.NEGOCIACAO, content: "Oi {{nome_lead}}, tudo bem?\nEstou passando para dar continuidade ao nosso atendimento sobre os concursos que você tem interesse." }, { id: 'mt3', stage: PipelineStage.PROPOSTA_ENVIADA, content: "{{nome_lead}}, já te enviei a proposta com todos os detalhes.\nFicou alguma dúvida que eu possa te ajudar agora?" }, { id: 'mt4', stage: PipelineStage.FOLLOW_UP_1, content: "Oi {{nome_lead}}!\nPassando para retomar nossa conversa sobre sua preparação para concursos.\nConseguiu analisar as informações que te enviei?" }, { id: 'mt5', stage: PipelineStage.GANHO, content: "Parabéns, {{nome_lead}}! 🎉\nSeu acesso ao Portal Concursos já está garantido.\nQualquer dúvida, estou por aqui!" }, { id: 'mt6', stage: PipelineStage.PERDIDO, content: "{{nome_lead}}, agradeço o contato.\nSe futuramente precisar de apoio na sua preparação para concursos, pode contar com a gente." } ];
};
loadDB();

const saveDB = () => {
  localStorage.setItem('fluxo_leads', JSON.stringify(DB.leads));
  localStorage.setItem('fluxo_tasks', JSON.stringify(DB.tasks));
  localStorage.setItem('fluxo_habit_templates', JSON.stringify(DB.habitTemplates));
  localStorage.setItem('fluxo_daily_habits', JSON.stringify(DB.dailyHabits));
  localStorage.setItem('fluxo_message_templates', JSON.stringify(DB.messageTemplates));
  localStorage.setItem('fluxo_goals', JSON.stringify(DB.goals));
};

// --- SERVICE LAYER (Business Logic) ---
const p = <T,>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), DELAY));

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => setTimeout(() => {
        const user = DB.users.find(u => u.email === email && u.password === password);
        if (user) {
          if (!user.isActive) return reject(new Error("Usuário desativado."));
          const { password, ...safeUser } = user;
          resolve(safeUser);
        } else reject(new Error("Credenciais inválidas."));
      }, DELAY));
  },
  getAllUsers: async (req: User): Promise<User[]> => {
    const users = DB.users.map(({password, ...u}) => u);
    if (req.role === 'ADMIN' || req.role === 'COORDINATOR') return p(users);
    if (req.role === 'SUPERVISOR') return p(users.filter(u => u.squadId === req.squadId));
    return p([]);
  },
  getSquads: async (): Promise<Squad[]> => p(DB.squads),
  createUser: async (user: Omit<User, 'id' | 'createdAt'> & { password?: string }, reqUser: User): Promise<User> => {
      if (reqUser.role === 'SUPERVISOR') {
        if (user.role !== 'SALESPERSON') throw new Error("Supervisores só podem criar Vendedores.");
        if (user.squadId !== reqUser.squadId) throw new Error("Supervisores só podem criar usuários em sua própria squad.");
      }

      if (DB.users.some(u => u.email === user.email)) throw new Error("Email já cadastrado.");
      const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), password: user.password || 'Portal2025*', createdAt: new Date().toISOString() }; 
      DB.users.push(newUser); const { password, ...safeUser } = newUser; return p(safeUser);
  },
  updateUser: async (id: string, updates: Partial<User> & { password?: string }, reqUser: User): Promise<User> => {
      const idx = DB.users.findIndex(u => u.id === id); if (idx === -1) throw new Error("Usuário não encontrado.");
      const targetUser = DB.users[idx];

      if (reqUser.role === 'SUPERVISOR') {
        if (targetUser.squadId !== reqUser.squadId) throw new Error("Acesso negado para gerenciar este usuário.");
        if (updates.role && updates.role !== 'SALESPERSON') throw new Error("Supervisores não podem alterar para esta função.");
        if (updates.squadId && updates.squadId !== reqUser.squadId) throw new Error("Supervisores não podem mover usuários para outra squad.");
      }

      const updatedUser = { ...DB.users[idx], ...updates };
      if (updates.password && updates.password.trim() !== '') updatedUser.password = updates.password;
      DB.users[idx] = updatedUser; const { password, ...safeUser } = updatedUser; return p(safeUser);
  },
  toggleStatus: async (id: string): Promise<boolean> => { const u = DB.users.find(u => u.id === id); if (u) { u.isActive = !u.isActive; return p(u.isActive); } throw new Error("Usuário não encontrado."); },
  resetPassword: async (id: string): Promise<void> => { const u = DB.users.find(u => u.id === id); if (u) { u.password = 'Portal2025*'; return p(undefined); } throw new Error("Usuário não encontrado."); }
};

export const TemplateService = {
  getAll: async (): Promise<MessageTemplate[]> => p(DB.messageTemplates),
  update: async (stage: PipelineStage, content: string): Promise<void> => { const idx = DB.messageTemplates.findIndex(t => t.stage === stage); if (idx!==-1) DB.messageTemplates[idx].content = content; else DB.messageTemplates.push({id: Math.random().toString(36).substr(2, 9), stage, content }); saveDB(); return p(undefined); }
}

export const HabitService = {
  getTemplates: async (): Promise<HabitTemplate[]> => p(DB.habitTemplates),
  addTemplate: async (data: { title: string, squadId?: string }): Promise<HabitTemplate> => {
    const newT: HabitTemplate = { id: Math.random().toString(36).substr(2, 9), title: data.title, squadId: data.squadId || undefined, active: true, roleTarget: ['SALESPERSON', 'SUPERVISOR'] };
    DB.habitTemplates.push(newT); saveDB(); return p(newT);
  },
  updateTemplate: async (id: string, updates: Partial<HabitTemplate>): Promise<HabitTemplate> => {
    const idx = DB.habitTemplates.findIndex(h => h.id === id);
    if(idx === -1) throw new Error("Template não encontrado.");
    DB.habitTemplates[idx] = { ...DB.habitTemplates[idx], ...updates };
    saveDB();
    return p(DB.habitTemplates[idx]);
  },
  deleteTemplate: async (id: string): Promise<void> => { DB.habitTemplates = DB.habitTemplates.filter(t => t.id !== id); saveDB(); return p(undefined); },
  ensureDailyHabits: async (user: User): Promise<DailyHabit[]> => {
      const today = new Date().toISOString().split('T')[0];
      const existing = DB.dailyHabits.filter(h => h.userId === user.id && h.date === today);
      if (existing.length > 0) return p(existing);

      // Global habits for the user's role + squad-specific habits
      const templates = DB.habitTemplates.filter(t => 
          t.active && 
          t.roleTarget.includes(user.role) &&
          (!t.squadId || t.squadId === user.squadId)
      );
      
      const newHabits = templates.map(t => ({ id: Math.random().toString(36).substr(2, 9), templateId: t.id, userId: user.id, date: today, title: t.title, completed: false }));
      DB.dailyHabits.push(...newHabits); saveDB(); return p(newHabits);
  },
  toggleHabit: async (habitId: string): Promise<void> => { const h = DB.dailyHabits.find(h => h.id === habitId); if (h) h.completed = !h.completed; saveDB(); return new Promise(res => setTimeout(() => res(), 100)); }
};

export const LeadService = {
  getAll: async (user: User): Promise<Lead[]> => {
    if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return p([...DB.leads]);
    if (user.role === 'SUPERVISOR') return p(DB.leads.filter(l => l.squadId === user.squadId));
    return p(DB.leads.filter(l => l.ownerId === user.id));
  },
  create: async (lead: Omit<Lead, 'id' | 'ownerId' | 'squadId' | 'createdAt' | 'updatedAt'>, user: User): Promise<Lead> => { const now = new Date().toISOString(); const newLead: Lead = { ...lead, id: Math.random().toString(36).substr(2, 9), ownerId: user.id, squadId: user.squadId, createdAt: now, updatedAt: now }; DB.leads.unshift(newLead); saveDB(); return p(newLead); },
  update: async (id: string, updates: Partial<Lead>): Promise<Lead> => { const i = DB.leads.findIndex(l => l.id === id); if (i !== -1) { DB.leads[i] = { ...DB.leads[i], ...updates, updatedAt: new Date().toISOString() }; saveDB(); return p(DB.leads[i]); } throw new Error("Lead não encontrado"); },
  delete: async (id: string): Promise<void> => { const i = DB.leads.findIndex(l => l.id === id); if (i !== -1) { DB.leads.splice(i, 1); saveDB(); return p(undefined); } throw new Error("Lead não encontrado"); },
  addNote: async (leadId: string, note: Omit<Note, 'id' | 'createdAt'>): Promise<Lead> => { const i = DB.leads.findIndex(l => l.id === leadId); if (i !== -1) { const newNote = { ...note, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }; DB.leads[i].notes.unshift(newNote); DB.leads[i].updatedAt = new Date().toISOString(); saveDB(); return p(DB.leads[i]); } throw new Error("Lead não encontrado"); },
};

export const TaskService = {
  getAll: async (userId: string): Promise<Task[]> => p(DB.tasks.filter(t => t.assignedTo === userId)),
  create: async (task: Omit<Task, 'id' | 'assignedTo'>, user: User): Promise<Task> => { const newTask = { ...task, id: Math.random().toString(36).substr(2, 9), assignedTo: user.id }; DB.tasks.unshift(newTask); saveDB(); return p(newTask); },
  toggle: async (id: string): Promise<void> => { const t = DB.tasks.find(t => t.id === id); if (t) t.completed = !t.completed; saveDB(); return new Promise(res => setTimeout(() => res(), 100)); }
};

export const GoalService = {
    getGoalsForTarget: async (user: User): Promise<Goal[]> => {
        const month = new Date().toISOString().slice(0, 7);
        const userGoal = DB.goals.find(g => g.targetId === user.id && g.month === month && g.targetType === 'USER');
        const squadGoal = user.squadId ? DB.goals.find(g => g.targetId === user.squadId && g.month === month && g.targetType === 'SQUAD') : undefined;
        
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const wonLeads = DB.leads.filter(l => l.stage === PipelineStage.GANHO && l.updatedAt >= firstDayOfMonth);

        const calculatedGoals: Goal[] = [];
        if (userGoal) {
            const userWonLeads = wonLeads.filter(l => l.ownerId === user.id);
            calculatedGoals.push({ ...userGoal, currentCount: userWonLeads.length, currentValue: userWonLeads.reduce((s, l) => s + l.value, 0) });
        }
        if (squadGoal) {
            const squadWonLeads = wonLeads.filter(l => l.squadId === user.squadId);
            calculatedGoals.push({ ...squadGoal, currentCount: squadWonLeads.length, currentValue: squadWonLeads.reduce((s, l) => s + l.value, 0) });
        }
        return p(calculatedGoals);
    },
    setGoal: async (goalData: Omit<Goal, 'id'|'currentValue'|'currentCount'>): Promise<Goal> => {
        const existingIndex = DB.goals.findIndex(g => g.targetId === goalData.targetId && g.month === goalData.month);
        const newGoal = { ...goalData, id: Math.random().toString(36).substr(2,9), currentValue: 0, currentCount: 0 };
        if (existingIndex !== -1) DB.goals[existingIndex] = newGoal;
        else DB.goals.push(newGoal);
        saveDB();
        return p(newGoal);
    }
};

export const AnalyticsService = {
    getSquadPerformance: async (squadId: string): Promise<SquadPerformanceData> => {
        const squadUsers = DB.users.filter(u => u.squadId === squadId && u.role === 'SALESPERSON');
        const squadLeads = DB.leads.filter(l => l.squadId === squadId);
        const month = new Date().toISOString().slice(0, 7);
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        const wonLeadsThisMonth = squadLeads.filter(l => l.stage === PipelineStage.GANHO && l.updatedAt >= firstDayOfMonth);
        
        const sellerRanking = squadUsers.map(u => {
            const userWon = wonLeadsThisMonth.filter(l => l.ownerId === u.id);
            return { userId: u.id, userName: u.name, dealsWon: userWon.length, valueWon: userWon.reduce((s, l) => s + l.value, 0) };
        }).sort((a,b) => b.valueWon - a.valueWon);

        const activityVolume = squadUsers.map(u => {
            const userLeads = squadLeads.filter(l => l.ownerId === u.id);
            const activities = { calls: 0, emails: 0, meetings: 0, notes: 0, dailyProgress: 0 };
            userLeads.forEach(l => l.notes.forEach(n => {
                if (n.createdAt.startsWith(month)) {
                    if (n.type === 'call') activities.calls++;
                    else if (n.type === 'email') activities.emails++;
                    else if (n.type === 'meeting') activities.meetings++;
                    else if (n.type === 'note') activities.notes++;
                }
            }));

            const userHabits = DB.dailyHabits.filter(h => h.userId === u.id && h.date === today);
            if (userHabits.length > 0) {
                const completed = userHabits.filter(h => h.completed).length;
                activities.dailyProgress = Math.round((completed / userHabits.length) * 100);
            }
            return { userId: u.id, userName: u.name, ...activities };
        });

        // Dummy funnel data for now
        const funnelConversion = [
            { stage: PipelineStage.QUALIFICADO, count: squadLeads.filter(l => l.stage === PipelineStage.QUALIFICADO).length, conversionRate: 100 },
            { stage: PipelineStage.NEGOCIACAO, count: squadLeads.filter(l => l.stage === PipelineStage.NEGOCIACAO).length, conversionRate: 75 },
        ];

        const data: SquadPerformanceData = {
            squadId,
            totalPipelineValue: squadLeads.filter(l => l.stage !== PipelineStage.GANHO && l.stage !== PipelineStage.PERDIDO).reduce((s, l) => s + l.value, 0),
            dealsWonThisMonth: wonLeadsThisMonth.length,
            dealsWonValueThisMonth: wonLeadsThisMonth.reduce((s, l) => s + l.value, 0),
            sellerRanking,
            activityVolume,
            funnelConversion
        };
        return p(data);
    }
};