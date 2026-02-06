
import { Transaction } from "../types";

// URL fornecida pelo usuário para o Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwq_gGJ6PlQ1WfI53Qpm14RImHRYbzXuHvf39QeQt-fl5o8BWrGNJODQj85o7WWFgiS/exec";

export const sheetsService = {
  async getAll(): Promise<Transaction[]> {
    if (!API_URL) return [];
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        mode: "cors",
        redirect: "follow"
      });
      
      if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];

      return data.map((t: any) => ({
        ...t,
        id: t.id ? t.id.toString() : Math.random().toString(36).substr(2, 9),
        valor: typeof t.valor === 'string' ? parseFloat(t.valor.replace(',', '.')) : (parseFloat(t.valor) || 0),
        data: t.data ? t.data.toString().split('T')[0] : new Date().toISOString().split('T')[0],
        tipo: t.tipo || 'Despesa',
        status: t.status || 'Pendente',
        categoria: t.categoria || 'Outro',
        frequencia: t.frequencia || 'Esporádico'
      }));
    } catch (error) {
      console.error("Erro ao carregar do Google Sheets:", error);
      const localData = localStorage.getItem('ff_transactions');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async save(transaction: Transaction): Promise<boolean> {
    if (!API_URL) return false;
    try {
      // Usamos 'text/plain' para evitar pre-flight OPTIONS que o Google Script não suporta bem com CORS padrão
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "save", payload: transaction })
      });
      return true; 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!API_URL) return false;
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "delete", payload: { id } })
      });
      return true;
    } catch (error) {
      console.error("Erro ao deletar:", error);
      return false;
    }
  },

  async syncAll(transactions: Transaction[]): Promise<boolean> {
    if (!API_URL) return false;
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "syncAll", payload: transactions })
      });
      return true;
    } catch (error) {
      console.error("Erro ao sincronizar lote:", error);
      return false;
    }
  }
};
