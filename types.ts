export type TransactionType = 'Receita' | 'Despesa' | 'Investimento';
export type TransactionStatus = 'Pago' | 'Pendente';
export type TransactionFrequency = 'Fixo' | 'Esporádico';

export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  data: string; // Formato ISO yyyy-mm-dd
  categoria: string;
  tipo: TransactionType;
  status: TransactionStatus;
  frequencia: TransactionFrequency;
}

export interface MonthlyData {
  month: number;
  year: number;
  transactions: Transaction[];
}

// FinancialInsight interface for structured responses from the Gemini API
export interface FinancialInsight {
  summary: string;
  recommendations: string[];
  alertLevel: 'low' | 'medium' | 'high';
}

export const CATEGORIES = {
  INCOME: ['Salário', 'Fotografia', 'Outro'],
  EXPENSE: [
    'Lanche',
    'Compras mercado',
    'Lazer',
    'Moradia',
    'Utilidades José',
    'Utilidades geral',
    'Carro',
    'Cartão de crédito',
    'Saúde',
    'Alimentação',
    'Outro'
  ],
  INVESTMENT: ['Reserva de Emergência', 'Renda Fixa', 'Ações', 'Fundos Imobiliários', 'Criptoativos', 'Previdência', 'Outro']
};