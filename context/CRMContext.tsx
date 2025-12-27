
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Lead, Task, PipelineStage, DailyHabit, HabitTemplate, MessageTemplate, Goal, SquadPerformanceData } from '../types';
import { LeadService, TaskService, HabitService, TemplateService, GoalService, AnalyticsService } from '../services/mockBackend';
import { useAuth } from './AuthContext';

interface CRMContextType {
  leads: Lead[];
  tasks: Task[];
  habits: DailyHabit[];
  habitTemplates: HabitTemplate[];
  messageTemplates: MessageTemplate[];
  goals: Goal[];
  squadPerformance?: SquadPerformanceData;
  isLoading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'ownerId' | 'squadId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addNote: (leadId: string, content: string, type: 'call' | 'email' | 'meeting' | 'note') => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'leadName' | 'assignedTo'> & { leadName?: string }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  addHabitTemplate: (data: { title: string, squadId?: string }) => Promise<void>;
  updateHabitTemplate: (id: string, updates: Partial<HabitTemplate>) => Promise<void>;
  deleteHabitTemplate: (id: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateMessageTemplate: (stage: PipelineStage, content: string) => Promise<void>;
  getParsedTemplate: (stage: PipelineStage, lead: Lead) => string;
  setGoal: (goal: Omit<Goal, 'id'|'currentValue'|'currentCount'>) => Promise<void>;
  stats: {
    totalPipeline: number;
    dealsCount: number;
    pendingTasks: number;
    dailyProgress: number;
  };
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isManager } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<DailyHabit[]>([]);
  const [habitTemplates, setHabitTemplates] = useState<HabitTemplate[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [squadPerformance, setSquadPerformance] = useState<SquadPerformanceData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const promises: any[] = [
          LeadService.getAll(user),
          TaskService.getAll(user.id),
          HabitService.ensureDailyHabits(user),
          TemplateService.getAll(),
          GoalService.getGoalsForTarget(user)
        ];

        if (isManager) {
          promises.push(HabitService.getTemplates());
          if (user.squadId) {
            promises.push(AnalyticsService.getSquadPerformance(user.squadId));
          }
        }
        
        const [
          loadedLeads, loadedTasks, loadedHabits, loadedMsgTemplates, loadedGoals, 
          loadedTemplates, loadedSquadPerformance
        ] = await Promise.all(promises);
        
        if (isMounted) {
          setLeads(loadedLeads);
          setTasks(loadedTasks);
          setHabits(loadedHabits);
          setMessageTemplates(loadedMsgTemplates);
          setGoals(loadedGoals);
          if (isManager) {
            setHabitTemplates(loadedTemplates || []);
            setSquadPerformance(loadedSquadPerformance);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user, isManager]);

  const stats = useMemo(() => ({
    totalPipeline: leads.reduce((acc, curr) => acc + (curr.stage !== PipelineStage.PERDIDO && curr.stage !== PipelineStage.GANHO ? curr.value : 0), 0),
    dealsCount: leads.length,
    pendingTasks: tasks.filter(t => !t.completed).length,
    dailyProgress: habits.length > 0 
      ? Math.round((habits.filter(h => h.completed).length / habits.length) * 100) 
      : 0
  }), [leads, tasks, habits]);

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'ownerId' | 'squadId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const newLead = await LeadService.create(leadData, user);
    setLeads(prev => [newLead, ...prev]);
  }, [user]);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    await LeadService.update(id, updates);
  }, []);
  
  const deleteLead = useCallback(async (id: string) => {
    await LeadService.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const addNote = useCallback(async (leadId: string, content: string, type: 'call' | 'email' | 'meeting' | 'note') => {
    const updatedLead = await LeadService.addNote(leadId, { content, type });
    setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'leadName' | 'assignedTo'> & { leadName?: string }) => {
    if (!user) return;
    let leadName = taskData.leadName;
    if (!leadName && taskData.leadId) {
      const lead = leads.find(l => l.id === taskData.leadId);
      leadName = lead ? (lead.name || 'Geral') : 'Geral';
    }
    const newTask = await TaskService.create({ 
      ...taskData, 
      leadName: leadName || 'Geral',
      type: taskData.leadId ? 'FOLLOW_UP' : 'HABIT'
    }, user);
    setTasks(prev => [newTask, ...prev]);
  }, [user, leads]); 

  const toggleTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    await TaskService.toggle(taskId);
  }, []);

  const toggleHabit = useCallback(async (habitId: string) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: !h.completed } : h));
    await HabitService.toggleHabit(habitId);
  }, []);

  const addHabitTemplate = useCallback(async (data: { title: string, squadId?: string }) => {
    const newT = await HabitService.addTemplate(data);
    setHabitTemplates(prev => [...prev, newT]);
  }, []);
  
  const updateHabitTemplate = useCallback(async (id: string, updates: Partial<HabitTemplate>) => {
    const updated = await HabitService.updateTemplate(id, updates);
    setHabitTemplates(prev => prev.map(t => t.id === id ? updated : t));
  }, []);

  const deleteHabitTemplate = useCallback(async (id: string) => {
    await HabitService.deleteTemplate(id);
    setHabitTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const updateMessageTemplate = useCallback(async (stage: PipelineStage, content: string) => {
    const newTemplates = [...messageTemplates];
    const idx = newTemplates.findIndex(t => t.stage === stage);
    if (idx !== -1) { newTemplates[idx].content = content; } 
    else { newTemplates.push({ id: 'temp', stage, content }); }
    setMessageTemplates(newTemplates);
    await TemplateService.update(stage, content);
  }, [messageTemplates]);

  const getParsedTemplate = useCallback((stage: PipelineStage, lead: Lead): string => {
    const template = messageTemplates.find(t => t.stage === stage);
    if (!template) return '';
    let content = template.content.replace(/{{nome_lead}}/g, lead.name)
                                 .replace(/{{nome_vendedor}}/g, user?.name || 'Vendedor')
                                 .replace(/{{produto}}/g, lead.productOfInterest || 'material de estudos')
                                 .replace(/{{company}}/g, lead.company || 'sua preparação');
    if (lead.nextFollowUp) {
      const dateStr = new Date(lead.nextFollowUp).toLocaleDateString('pt-BR');
      content = content.replace(/{{data_followup}}/g, dateStr);
    } else { content = content.replace(/{{data_followup}}/g, 'breve'); }
    return content;
  }, [messageTemplates, user]);

  const setGoal = useCallback(async (goalData: Omit<Goal, 'id'|'currentValue'|'currentCount'>) => {
    const newGoal = await GoalService.setGoal(goalData);
    setGoals(prev => {
        const existing = prev.filter(g => !(g.targetId === newGoal.targetId && g.month === newGoal.month));
        return [...existing, newGoal];
    });
  }, []);

  const contextValue = useMemo(() => ({ 
    leads, tasks, habits, habitTemplates, messageTemplates, goals, squadPerformance, isLoading, 
    addLead, updateLead, deleteLead, addNote, addTask, 
    toggleTask, toggleHabit, addHabitTemplate, updateHabitTemplate, deleteHabitTemplate, deleteTask, 
    updateMessageTemplate, getParsedTemplate, setGoal, stats 
  }), [
    leads, tasks, habits, habitTemplates, messageTemplates, goals, squadPerformance, isLoading, 
    addLead, updateLead, deleteLead, addNote, addTask, 
    toggleTask, toggleHabit, deleteHabitTemplate, deleteTask, 
    updateMessageTemplate, getParsedTemplate, setGoal, stats, user
  ]);

  return (
    <CRMContext.Provider value={contextValue}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within a CRMProvider");
  return context;
};