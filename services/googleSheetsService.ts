
import { Transaction } from "../types";

const API_URL = "https://script.google.com/macros/s/AKfycbwkkqQLWU-fTZbx3cftjHHpd5xZ33dHNWldWwVSbwciWkDlIoZ7ngbqds_Gqjwq-uQZ/exec";

export const sheetsService = {
  async getAll(): Promise<Transaction[]> {
    if (!API_URL || API_URL.includes("SUA_URL_AQUI")) return [];
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        redirect: "follow"
      });
      if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];

      return data.map((t: any) => ({
        ...t,
        id: t.id ? t.id.toString() : Math.random().toString(36).substr(2, 9),
        valor: typeof t.valor === 'string' ? parseFloat(t.valor.replace(',', '.')) : (parseFloat(t.valor) || 0),
        data: t.data || new Date().toISOString().split('T')[0],
        tipo: t.tipo || 'Despesa',
        status: t.status || 'Pendente',
        categoria: t.categoria || 'Outro'
      }));
    } catch (error) {
      console.error("Erro ao carregar dados do Google Sheets:", error);
      throw error;
    }
  },

  async save(transaction: Transaction): Promise<boolean> {
    if (!API_URL || API_URL.includes("SUA_URL_AQUI")) return false;
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "save", payload: transaction })
      });
      return true; 
    } catch (error) {
      console.error("Erro ao salvar no Google Sheets:", error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!API_URL || API_URL.includes("SUA_URL_AQUI")) return false;
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "delete", payload: { id } })
      });
      return true;
    } catch (error) {
      console.error("Erro ao deletar no Google Sheets:", error);
      return false;
    }
  },

  async syncAll(transactions: Transaction[]): Promise<boolean> {
    if (!API_URL || API_URL.includes("SUA_URL_AQUI")) return false;
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "syncAll", payload: transactions })
      });
      return true;
    } catch (error) {
      console.error("Erro ao sincronizar lote no Google Sheets:", error);
      return false;
    }
  }
};
