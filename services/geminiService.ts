
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight } from "../types";

// Generates financial insights from transaction data using the Gemini 3 Flash model
export const getFinancialInsights = async (transactions: Transaction[], currentMonth: string): Promise<FinancialInsight> => {
  // Always use a named parameter for the API key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc: { income: number; expense: number }, t) => {
    if (t.tipo === 'Receita') acc.income += t.valor;
    else acc.expense += t.valor;
    return acc;
  }, { income: 0, expense: 0 });

  const categoryBreakdown = transactions
    .filter(t => t.tipo === 'Despesa')
    .reduce((acc: Record<string, number>, t) => {
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
            summary: { 
              type: Type.STRING,
              description: "A summary of the current month's financial performance."
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of actionable financial advice."
            },
            alertLevel: { 
              type: Type.STRING, 
              enum: ['low', 'medium', 'high'],
              description: "The priority or urgency level of the financial situation."
            }
          },
          propertyOrdering: ["summary", "recommendations", "alertLevel"],
          required: ["summary", "recommendations", "alertLevel"]
        }
      }
    });

    // Directly access the text property as a string (not a method call)
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr) as FinancialInsight;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
