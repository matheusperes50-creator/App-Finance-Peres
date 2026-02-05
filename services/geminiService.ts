
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], currentMonth: string) => {
  // Inicialização dinâmica para garantir que process.env.API_KEY esteja disponível no momento do uso
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const summary = transactions.reduce((acc: { income: number; expense: number }, t) => {
    if (t.tipo === 'Receita') acc.income += t.valor;
    else acc.expense += t.valor;
    return acc;
  }, { income: 0, expense: 0 });

  const categoryBreakdown = transactions
    .filter(t => t.tipo === 'Despesa')
    .reduce((acc: any, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {});

  const prompt = `
    Analise as finanças de ${currentMonth}:
    - Receita: R$ ${summary.income.toFixed(2)}
    - Despesas: R$ ${summary.expense.toFixed(2)}
    - Saldo: R$ ${(summary.income - summary.expense).toFixed(2)}
    - Categorias: ${JSON.stringify(categoryBreakdown)}
    
    Forneça um resumo curto e 3 dicas rápidas em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            alertLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
          },
          required: ["summary", "recommendations", "alertLevel"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
