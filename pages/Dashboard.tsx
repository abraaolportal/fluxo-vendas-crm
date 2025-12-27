
import React, { useMemo, useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, DollarSign, Target, Percent, Award, Sparkles, Loader2, BarChart3, ListChecks, ChevronDown, CalendarDays, ArrowRight, Zap, RefreshCw, ChevronRight, MessageCircle, Eye
} from 'lucide-react';
import { PipelineStage, Task, Lead } from '../types';
import { getDailyMotivation } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

const PowerHour = () => {
    const { leads } = useCRM();
    const navigate = useNavigate();
    const [actionQueue, setActionQueue] = useState<Lead[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const overdue = leads.filter(l => l.stage !== PipelineStage.GANHO && l.stage !== PipelineStage.PERDIDO && l.nextFollowUp < today);
        const dueToday = leads.filter(l => l.stage !== PipelineStage.GANHO && l.stage !== PipelineStage.PERDIDO && l.nextFollowUp === today);
        const hotLeads = leads.filter(l => l.interestLevel === 'Quente' && !overdue.find(o => o.id === l.id) && !dueToday.find(d => d.id === l.id));
        
        const sortedQueue = [...overdue, ...dueToday, ...hotLeads];
        setActionQueue(sortedQueue);
        setCurrentIndex(0);
    }, [leads]);

    const nextAction = () => {
        if (actionQueue.length > 1) {
            setCurrentIndex(prev => (prev + 1) % actionQueue.length);
        } else {
            // Last one, just clear it visually
            setActionQueue([]);
        }
    };
    
    const currentLead = actionQueue[currentIndex];
    
    if (!currentLead) {
        return (
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center h-full border border-green-500/20 bg-green-500/5">
                <CheckCircle2 size={32} className="text-green-400 mb-3"/>
                <h3 className="text-lg font-bold text-white">Caixa de Entrada Zerada!</h3>
                <p className="text-sm text-slate-400 mt-1">Nenhuma ação prioritária no momento. Bom trabalho!</p>
            </div>
        );
    }

    const getActionReason = (lead: Lead) => {
        const today = new Date().toISOString().split('T')[0];
        if (lead.nextFollowUp < today) return { text: "Follow-up Atrasado", color: "text-red-400" };
        if (lead.nextFollowUp === today) return { text: "Follow-up Hoje", color: "text-amber-400" };
        if (lead.interestLevel === 'Quente') return { text: "Lead Quente", color: "text-pink-400" };
        return { text: "Próxima Ação", color: "text-primary-400" };
    };

    const reason = getActionReason(currentLead);

    return (
        <div className="bg-gradient-to-br from-primary-500/20 via-background to-purple-500/20 p-6 rounded-2xl flex flex-col border border-primary-500/30 shadow-2xl h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap size={18} className="text-primary-400"/> Modo Foco
                </h3>
                <span className="text-xs font-mono bg-primary-500/20 text-primary-300 px-2.5 py-1 rounded-full">{currentIndex + 1} de {actionQueue.length}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center my-4">
                <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${reason.color}`}>{reason.text}</p>
                <h4 className="text-3xl font-bold text-white tracking-tight">{currentLead.name}</h4>
                <p className="text-base text-slate-400">{currentLead.company}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => navigate(`/leads/${currentLead.id}`)} className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-semibold py-3 rounded-lg transition-colors"><Eye size={16}/> Ver Lead</button>
                <button onClick={nextAction} className="flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-slate-900 font-bold py-3 rounded-lg transition-colors shadow-lg">Concluído <ChevronRight size={16}/></button>
            </div>
        </div>
    );
};

const GoalProgress = () => {
    const { goals } = useCRM();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const goal = goals.find(g => g.month === currentMonth && g.targetType === 'USER');
    if (!goal) return null;

    const valueProgress = goal.valueTarget > 0 ? (goal.currentValue / goal.valueTarget) * 100 : 0;
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="glass-panel p-6 rounded-2xl">
             <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Award size={18} className="text-amber-400"/> Meta Mensal
            </h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                        <span className="text-slate-400 font-medium">Progresso (R$)</span>
                        <span className="font-bold text-white tracking-tighter">{formatCurrency(goal.currentValue)} / <span className="text-slate-500">{formatCurrency(goal.valueTarget)}</span></span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(valueProgress, 100)}%`, boxShadow: `0 0 10px rgba(245, 158, 11, 0.5)` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyChecklist = () => {
    const { habits, toggleHabit, stats } = useCRM();

    const progressStyle = {
        background: `radial-gradient(closest-side, #0f172a 79%, transparent 80% 100%),
                     conic-gradient(from 180deg, #0ea5e9 ${stats.dailyProgress}%, #334155 0)`
    };

    let dynamicSubtitle = "Vamos começar!";
    if (stats.dailyProgress > 0 && stats.dailyProgress < 50) dynamicSubtitle = "Bom começo!";
    if (stats.dailyProgress >= 50 && stats.dailyProgress < 100) dynamicSubtitle = "Na metade do caminho!";
    if (stats.dailyProgress === 100) dynamicSubtitle = "Missão Cumprida!";

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
                <div 
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${stats.dailyProgress === 100 ? 'shadow-[0_0_20px_rgba(251,191,36,0.5)]' : ''}`}
                    style={progressStyle}
                >
                    {stats.dailyProgress < 100 ? (
                        <span className="text-xl font-bold text-white font-mono">{stats.dailyProgress}%</span>
                    ) : (
                        <div className="animate-celebrate-pop">
                           <Award size={28} className="text-amber-400" style={{filter: `drop-shadow(0 0 10px rgba(251, 191, 36, 0.7))`}} />
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2"><ListChecks size={18} className="text-primary-400"/> Missões Diárias</h3>
                    <p className="text-sm text-slate-400">{dynamicSubtitle}</p>
                </div>
            </div>
            
            <div className="space-y-2 flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
                {habits.map(habit => (
                    <button 
                        key={habit.id} 
                        onClick={() => toggleHabit(habit.id)} 
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 group ${habit.completed ? 'bg-slate-800/60' : 'hover:bg-slate-800/70 active:bg-slate-800'}`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out ${habit.completed ? 'bg-primary-500 border-primary-500 shadow-neon-blue' : 'border-slate-600 group-hover:border-primary-500'}`}>
                           {habit.completed && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className={`flex-1 text-sm transition-colors duration-300 ${habit.completed ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>{habit.title}</span>
                    </button>
                ))}
            </div>
            {stats.dailyProgress === 100 && (
                <div className="text-center mt-4 text-xs text-amber-400 font-bold animate-in fade-in">
                    +10 XP para sua Meta Mensal! 🏆
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { leads } = useCRM();
    const [motivation, setMotivation] = useState<{ message: string, tip: string } | null>(null);
    const [isLoadingMotivation, setIsLoadingMotivation] = useState(true);

    useEffect(() => {
        const fetchMotivation = async () => {
            if (!user) return;
            const cacheKey = `motivation_${new Date().toISOString().split('T')[0]}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) { setMotivation(JSON.parse(cached)); setIsLoadingMotivation(false); } 
            else { try { const result = await getDailyMotivation(user.name); setMotivation(result); sessionStorage.setItem(cacheKey, JSON.stringify(result)); } finally { setIsLoadingMotivation(false); } }
        };
        fetchMotivation();
    }, [user]);

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">{user?.name.split(' ')[0] || 'Vendedor'}.</span>
                </h1>
                {isLoadingMotivation ? (<div className="h-10 flex items-center"><Loader2 size={16} className="text-slate-500 animate-spin"/></div>) : (
                    <div className="mt-3 text-slate-400 flex items-start gap-3 p-3 bg-slate-900/40 rounded-lg max-w-2xl">
                        <Sparkles size={16} className="text-amber-400 flex-shrink-0 mt-1"/>
                        <div>
                            <p className="text-sm text-slate-300">{motivation?.message}</p>
                            <p className="text-xs mt-1"><strong className="text-amber-500">Dica do Dia:</strong> {motivation?.tip}</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 h-[450px]">
                    <PowerHour />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6 h-[450px]">
                    <GoalProgress />
                    <DailyChecklist />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
