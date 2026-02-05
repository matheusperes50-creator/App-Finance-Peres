export type TransactionType = 'Receita' | 'Despesa';
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

// Fixed: Added missing FinancialInsight interface export
export interface FinancialInsight {
  summary: string;
  recommendations: string[];
  alertLevel: 'low' | 'medium' | 'high';
}

export const CATEGORIES = {
  INCOME: ['Salário', 'Freelance', 'Investimento', 'Presente', 'Outro'],
  EXPENSE: ['Moradia', 'Alimentação', 'Transporte', 'Utilidades', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outro']
};