
import { useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useNotifications } from '../context/NotificationContext';
import { PipelineStage } from '../types';

const NOTIFICATION_KEY = 'fluxo_notified_events';

export const useSmartNotifications = () => {
  const { leads, habits, stats, isLoading } = useCRM();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isLoading) return;

    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Load sent events from session to avoid spamming on refresh
    const sentEvents = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || '{}');
    
    // Helper to fire only once per day
    const fireOnce = (key: string, fn: () => void) => {
       if (sentEvents[key] !== today) {
          fn();
          sentEvents[key] = today;
          localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(sentEvents));
       }
    };

    // RULE 1: OVERDUE FOLLOW-UPS (High Priority)
    // Trigger: If there are leads with overdue follow-ups
    const overdueLeads = leads.filter(l => l.nextFollowUp < today && l.stage !== PipelineStage.GANHO && l.stage !== PipelineStage.PERDIDO);
    if (overdueLeads.length > 0) {
      fireOnce('overdue_alert', () => {
        addNotification({
          type: 'ALERT',
          title: 'Atenção Necessária',
          message: `Você tem ${overdueLeads.length} follow-ups atrasados. Não deixe o lead esfriar!`,
          actionLink: '/?tab=calls'
        });
      });
    }

    // RULE 2: START OF DAY CHECKLIST (Morning Nudge)
    // Trigger: It's after 9 AM and 0 habits completed
    if (hour >= 9 && habits.length > 0 && stats.dailyProgress === 0) {
      fireOnce('morning_nudge', () => {
        addNotification({
          type: 'INFO',
          title: 'Bom dia! ☀️',
          message: 'Sua rotina diária ainda não foi iniciada. Vamos bater a meta hoje?',
          actionLink: '/'
        });
      });
    }

    // RULE 3: END OF DAY CLOSING (Afternoon Push)
    // Trigger: It's after 4 PM and progress is good but not finished (50% < x < 100%)
    if (hour >= 16 && stats.dailyProgress > 50 && stats.dailyProgress < 100) {
       fireOnce('afternoon_push', () => {
         addNotification({
           type: 'INFO',
           title: 'Quase lá! 🚀',
           message: 'Falta pouco para fechar 100% da sua rotina. Finalize suas tarefas.',
           actionLink: '/'
         });
       });
    }

    // RULE 4: HIGH VALUE OPPORTUNITY STALLED (Context Aware)
    // Trigger: Lead value > 10k in 'Proposal' for more than 5 days (Simulated logic here)
    const bigDeals = leads.filter(l => l.value > 10000 && l.stage === PipelineStage.PROPOSTA_ENVIADA);
    if (bigDeals.length > 0) {
        // Just a random check simulation for "stalled"
        fireOnce('big_deal_check', () => {
            addNotification({
                type: 'WARNING',
                title: 'Oportunidade de Ouro 💰',
                message: `O deal da ${bigDeals[0].company} está em Proposta. Que tal enviar um material de apoio?`,
                actionLink: `/leads/${bigDeals[0].id}`
            });
        });
    }

  }, [leads, habits, stats, isLoading, addNotification]);
};