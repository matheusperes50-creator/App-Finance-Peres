import { Transaction } from "../types";

/**
 * URL da planilha do Google Sheets utilizada como banco de dados.
 * Atualizada conforme solicitação do usuário.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzGLXVNSW83zlD7fwRGX2lTNAwGCsfRoMsiDpLVdCwfwty5-iN8Aarjo7SkcUEt-jfGnw/exec";

export const sheetsService = {
  async getAll(): Promise<Transaction[]> {
    if (!API_URL) return [];
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        redirect: "follow",
        cache: "no-store"
      });
      
      if (!response.ok) {
        throw new Error(`Erro na rede: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.warn("Dados inválidos do servidor.");
        return [];
      }

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
      console.error("Erro na sincronização Google Sheets:", error);
      const localData = localStorage.getItem('ff_transactions');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async save(transaction: Transaction): Promise<boolean> {
    if (!API_URL) return false;
    try {
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
      console.error("Erro ao sincronizar:", error);
      return false;
    }
  }
};