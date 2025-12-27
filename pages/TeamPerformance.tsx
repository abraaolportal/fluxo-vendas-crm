// This is a new file.
import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { Award, BarChart3, DollarSign, Flame, ListChecks, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
  <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </div>
);

const SellerCard = ({ seller, goal, performance, staleLeadsCount }: any) => {
  const goalProgress = goal && goal.valueTarget > 0 ? (goal.currentValue / goal.valueTarget) * 100 : 0;
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

  const progressColor = goalProgress >= 100 ? 'bg-green-500' : 'bg-brand-500';
  const borderColor = goalProgress >= 100 ? 'border-green-500/30' : 'border-slate-800';

  return (
    <div className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 border ${borderColor} transition-colors hover:border-brand-500/50`}>
      <div className="flex justify-between items-center">
        <Link to={`/leads?owner=${seller.userId}`} className="font-bold text-white hover:text-brand-400">{seller.userName}</Link>
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${performance.dailyProgress === 100 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
          <ListChecks size={12} className="inline-block -mt-0.5 mr-1" />
          {performance.dailyProgress}%
        </span>
      </div>
      
      {goal ? (
        <div>
          <div className="flex justify-between items-baseline text-sm mb-1">
            <span className="text-slate-400">Meta Mensal</span>
            <span className="font-bold text-white">{formatCurrency(goal.currentValue)} / <span className="text-slate-500">{formatCurrency(goal.valueTarget)}</span></span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(goalProgress, 100)}%` }}/>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-slate-600 font-medium">Meta não definida</div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
          <div className="text-center">
             <p className="text-xs text-slate-500 font-bold uppercase">Pipeline</p>
             <p className="text-lg font-bold text-white font-mono">{formatCurrency(performance.pipelineValue)}</p>
          </div>
          <div className="text-center">
             <p className="text-xs text-slate-500 font-bold uppercase">Estagnados</p>
             <p className={`text-lg font-bold font-mono flex items-center justify-center gap-1.5 ${staleLeadsCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {staleLeadsCount > 0 && <Flame size={14} />}
                {staleLeadsCount}
             </p>
          </div>
      </div>
    </div>
  );
};

const TeamPerformance: React.FC = () => {
  const { squadPerformance, goals, leads, isLoading } = useCRM();
  const { user } = useAuth();
  
  const squadUsersPerformance = useMemo(() => {
    if (!squadPerformance) return [];
    
    const usersWithPipeline = squadPerformance.activityVolume.map(perf => {
        const userLeads = leads.filter(l => l.ownerId === perf.userId && l.stage !== 'Ganho' && l.stage !== 'Perdido');
        const pipelineValue = userLeads.reduce((sum, lead) => sum + lead.value, 0);
        const today = new Date();
        const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7)).toISOString();
        const staleLeadsCount = userLeads.filter(l => l.updatedAt < sevenDaysAgo).length;

        return { ...perf, pipelineValue, staleLeadsCount };
    });
    
    return usersWithPipeline;
  }, [squadPerformance, leads]);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-brand-500" size={32}/></div>
  if (!squadPerformance) return <div className="text-center text-slate-500">Nenhum dado de performance para exibir.</div>;
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
          <BarChart3 size={24} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Visão da Equipe</h1>
          <p className="text-slate-400 text-sm">Performance da Squad: {user?.squadId && squadPerformance.squadId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="Pipeline Total" value={formatCurrency(squadPerformance.totalPipelineValue)} icon={DollarSign} color="from-blue-500/50 to-cyan-500/50" />
        <StatCard title="Vendas (Mês)" value={formatCurrency(squadPerformance.dealsWonValueThisMonth)} icon={Award} color="from-amber-500/50 to-yellow-500/50" />
        <StatCard title="Negócios Fechados (Mês)" value={squadPerformance.dealsWonThisMonth} icon={ListChecks} color="from-green-500/50 to-emerald-500/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {squadUsersPerformance.map(perf => {
            const userGoal = goals.find(g => g.targetId === perf.userId && g.targetType === 'USER');
            return (
              <SellerCard 
                key={perf.userId} 
                seller={perf} 
                goal={userGoal}
                performance={perf}
                staleLeadsCount={perf.staleLeadsCount}
              />
            );
          })}
      </div>
    </div>
  );
};

export default TeamPerformance;