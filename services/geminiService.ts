


import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Note } from '../types';

// Initialize the client. 
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const getDailyMotivation = async (userName: string): Promise<{ message: string; tip: string; }> => {
  try {
    const prompt = `
      Atue como um coach de vendas experiente e motivador. 
      Gere uma mensagem para um vendedor chamado ${userName}.
      A mensagem deve ser em português do Brasil.
      
      Formato de Resposta (JSON):
      {
        "message": "Uma frase motivacional curta e impactante para o dia de hoje. Use uma linguagem que inspira ação e confiança. Ex: 'Cada 'não' te aproxima do 'sim' que vai mudar o jogo. Vá com tudo!'",
        "tip": "Uma dica prática e acionável de vendas para o dia. A dica deve ser específica e fácil de aplicar. Ex: 'Hoje, ao invés de listar características, foque em contar uma história de sucesso de um cliente. Conexões vendem mais que especificações.'"
      }
    `;
    
    // FIX: Added responseSchema for reliable JSON output.
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              tip: { type: Type.STRING },
            },
            required: ['message', 'tip'],
          },
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("API response was empty.");
    }
    const parsed = JSON.parse(text);

    return {
      message: parsed.message || "Vamos fazer deste o melhor dia de vendas!",
      tip: parsed.tip || "Conecte-se com um cliente antigo hoje. A lealdade é um ativo valioso."
    };

  } catch (error) {
    console.error("Erro ao buscar motivação diária:", error);
    // Fallback em caso de erro da API
    return {
      message: "A disciplina é a ponte entre metas e realizações. Tenha um ótimo dia!",
      tip: "Revise seus follow-ups pendentes. A persistência inteligente constrói resultados."
    };
  }
};


export const generateEmailDraft = async (lead: Lead, context: string): Promise<string> => {
  try {
    const prompt = `
      Atue como um especialista em vendas B2B (SaaS) no Brasil.
      Escreva um e-mail curto, persuasivo e profissional para o seguinte lead.
      
      Dados do Lead:
      Nome: ${lead.name}
      Cargo: ${lead.role || 'Não informado'}
      Empresa: ${lead.company}
      Histórico Recente: ${lead.notes.slice(0, 2).map(n => n.content).join('; ')}
      
      Objetivo do e-mail: ${context}
      
      Regras:
      - Use tom profissional mas acessível.
      - Foco em resolver dor ou oferecer valor.
      - Máximo de 150 palavras.
      - Sem "assunto" no output, apenas o corpo do e-mail.
      - Formate com quebras de linha para leitura fácil.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o e-mail.";
  } catch (error) {
    console.error("Erro ao gerar e-mail:", error);
    throw new Error("Falha na comunicação com a IA.");
  }
};

export const analyzeLeadHealth = async (lead: Lead): Promise<string> => {
  try {
    const prompt = `
      Analise a probabilidade de fechamento deste negócio baseado nos dados abaixo.
      Retorne uma análise curta (3 tópicos bullet points) em Português.

      Lead: ${lead.name} (${lead.company})
      Estágio: ${lead.stage}
      Valor: R$ ${lead.value}
      Interações: ${JSON.stringify(lead.notes)}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Sem dados suficientes para análise.";
  } catch (error) {
    console.error("Erro ao analisar lead:", error);
    throw new Error("Falha na análise.");
  }
};

export const summarizeHistory = async (notes: Note[]): Promise<string> => {
  try {
    const history = notes.map(n => `[${new Date(n.createdAt).toLocaleDateString('pt-BR')} - ${n.type}]: ${n.content}`).join('\n');
    const prompt = `
      Analise o histórico de interações com um lead e crie um resumo conciso.
      O resumo deve ter no máximo 3 bullet points em Português, destacando o estado atual e os próximos passos.

      Histórico de Interações:
      ${history}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Erro ao sumarizar histórico:", error);
    throw new Error("Falha na comunicação com a IA.");
  }
};