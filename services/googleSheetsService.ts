
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

      // Garantir que os valores numéricos sejam tratados corretamente
      return data.map((t: any) => ({
        ...t,
        id: t.id ? t.id.toString() : "",
        valor: typeof t.valor === 'string' ? parseFloat(t.valor.replace(',', '.')) : (parseFloat(t.valor) || 0)
      }));
    } catch (error) {
      console.error("Erro ao carregar dados do Google Sheets:", error);
      throw error;
    }
  },

  async save(transaction: Transaction): Promise<boolean> {
    if (!API_URL || API_URL.includes("SUA_URL_AQUI")) return false;
    try {
      // Enviamos o objeto exatamente como o Apps Script espera receber
      console.log("Enviando para Sheets:", transaction);
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
      console.error("Erro ao sincronizar Google Sheets:", error);
      return false;
    }
  }
};
