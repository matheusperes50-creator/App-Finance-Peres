import { Transaction } from "../types";

const API_URL = "https://script.google.com/macros/s/AKfycbyRZwkY1-CG8MDNCF-2QbMYGVK9pcI-MgcvG4HsICO46FGY4n255Gzjr5YMiU_bKlNjow/exec";

/**
 * Normaliza as chaves de um objeto para minúsculas e remove acentos comuns
 * para garantir compatibilidade com os cabeçalhos da planilha.
 */
const normalizeKeys = (obj: any) => {
  const normalized: any = {};
  for (const key in obj) {
    const normalizedKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
    normalized[normalizedKey] = obj[key];
  }
  return normalized;
};

export const sheetsService = {
  async getAll(): Promise<Transaction[]> {
    if (!API_URL) return [];
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        redirect: "follow",
        cache: "no-store"
      });
      
      if (!response.ok) throw new Error(`Erro na rede: ${response.status}`);

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const t = normalizeKeys(item);
        
        // Parsing robusto do valor
        let valorNumerico = 0;
        if (typeof t.valor === 'number') {
          valorNumerico = t.valor;
        } else if (typeof t.valor === 'string') {
          valorNumerico = parseFloat(t.valor.replace(',', '.')) || 0;
        }

        return {
          id: t.id ? t.id.toString() : Math.random().toString(36).substr(2, 9),
          descricao: t.descricao || t.description || "Sem descrição",
          valor: valorNumerico,
          data: t.data ? t.data.toString().split('T')[0] : new Date().toISOString().split('T')[0],
          tipo: t.tipo || 'Despesa',
          status: t.status || 'Pendente',
          categoria: t.categoria || 'Outro',
          frequencia: t.frequencia || 'Esporádico'
        } as Transaction;
      });
    } catch (error) {
      console.error("Erro ao buscar dados do Google Sheets:", error);
      throw error;
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
      console.error("Erro ao salvar no Sheets:", error);
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
      console.error("Erro ao deletar no Sheets:", error);
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
      console.error("Erro ao sincronizar tudo no Sheets:", error);
      return false;
    }
  }
};