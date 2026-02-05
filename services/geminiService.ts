
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], currentMonth: string) => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: changed 'type' to 'tipo', 'INCOME' to 'Receita' and 'amount' to 'valor'
  const summary = transactions.reduce((acc: { income: number; expense: number }, t) => {
    if (t.tipo === 'Receita') {
      acc.income += t.valor;
    } else {
      acc.expense += t.valor;
    }
    return acc;
  }, { income: 0, expense: 0 });

  // Fix: changed 'type' to 'tipo', 'EXPENSE' to 'Despesa', 'category' to 'categoria' and 'amount' to 'valor'
  const categoryBreakdown = transactions
    .filter(t => t.tipo === 'Despesa')
    .reduce((acc: any, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {});

  const prompt = `
    Analise as seguintes finanças pessoais do mês de ${currentMonth}:
    - Total de Receita: R$ ${summary.income.toFixed(2)}
    - Total de Despesas: R$ ${summary.expense.toFixed(2)}
    - Saldo: R$ ${(summary.income - summary.expense).toFixed(2)}
    - Gastos por Categoria: ${JSON.stringify(categoryBreakdown)}

    Por favor, forneça um resumo amigável e 3 recomendações acionáveis para melhorar a saúde financeira.
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
            summary: { type: Type.STRING, description: "A friendly summary of the month's financial performance in Portuguese." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 actionable tips in Portuguese."
            },
            alertLevel: { 
              type: Type.STRING, 
              enum: ['low', 'medium', 'high'],
              description: "The level of financial concern."
            }
          },
          required: ["summary", "recommendations", "alertLevel"]
        }
      }
    });

    // Directly access .text property as per guidelines
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    throw error;
  }
};
