
export enum PipelineStage {
  QUALIFICADO = 'Qualificado',
  NEGOCIACAO = 'Negociação',
  PROPOSTA_ENVIADA = 'Proposta Enviada',
  AGENDOU_PAGAMENTO = 'Agendou pagamento',
  PAGAMENTO_ENVIADO = 'Pagamento Enviado',
  AGUARDANDO_PAGAMENTO = 'Aguardando Pagamento',
  FOLLOW_UP_1 = 'FOLLOW UP 1',
  FOLLOW_UP_2 = 'FOLLOW-UP 2',
  FOLLOW_UP_3_PLUS = 'FOLLOW-UP 3+',
  GANHO = 'Ganho',
  PERDIDO = 'Perdido',
}

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'SUPERVISOR' | 'SALESPERSON';

export interface Squad {
  id: string;
  name: string;
  supervisorId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  squadId?: string; // Links user to a team
  avatar?: string;
  isActive: boolean; // Controls login access
  createdAt?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  createdBy?: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string; // Used for "Place/City" or Organization in this context
  email: string;
  phone: string;
  value: number;
  stage: PipelineStage;
  nextFollowUp: string; // ISO Date string (Mandatory)
  notes: Note[];
  tags: string[];
  role?: string;
  ownerId: string; // Matches user.id
  squadId?: string; // Denormalized for performance
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  
  // Portal Concursos Specific Fields
  source?: 'Receptivo' | 'Indicação' | 'SDR' | 'Migração' | 'Renovação' | 'Base de Leads' | 'Automação' | 'EBOOK' | 'Carrinho';
  interestLevel?: 'Frio' | 'Morno' | 'Quente';
  productOfInterest?: string;
}

export interface Task {
  id: string;
  leadId?: string; 
  leadName?: string;
  title: string;
  dueDate: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  assignedTo: string; // Matches user.id
  type: 'HABIT' | 'FOLLOW_UP';
}

// --- NEW CHECKLIST SYSTEM TYPES ---

export interface HabitTemplate {
  id: string;
  title: string;
  active: boolean;
  roleTarget: UserRole[]; // Which roles get this task?
  squadId?: string; // Optional: Assign to a specific squad
}

export interface DailyHabit {
  id: string;
  templateId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string; // Copied from template to preserve history if template changes
  completed: boolean;
}

export interface MessageTemplate {
  id: string;
  stage: PipelineStage;
  content: string; // Supports {{name}}, {{company}}
}

export interface AppNotification {
  id: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  actionLink?: string;
}

// --- NEW GOAL & PERFORMANCE TYPES ---

export interface Goal {
  id: string;
  targetId: string; // userId or squadId
  targetType: 'USER' | 'SQUAD';
  month: string; // YYYY-MM
  valueTarget: number; // in R$
  countTarget: number; // number of deals
  // Calculated properties
  currentValue: number;
  currentCount: number;
}

export interface SquadPerformanceData {
  squadId: string;
  totalPipelineValue: number;
  dealsWonThisMonth: number;
  dealsWonValueThisMonth: number;
  sellerRanking: { userId: string, userName: string, dealsWon: number, valueWon: number }[];
  activityVolume: { userId: string, userName: string, calls: number, emails: number, meetings: number, notes: number, dailyProgress: number }[];
  funnelConversion: { stage: PipelineStage, count: number, conversionRate: number }[];
}