import { Transaction } from "../types";

const API_URL = "https://script.google.com/macros/s/AKfycbxrF6Iq8rKcviAfy-_PBD2SrOt-SHBpfzZt1cfqY1KKW8-dqcqiLdpnj1V2EozdW6DRTQ/exec";

/**
 * Normaliza as chaves de um objeto para minúsculas e remove acentos comuns.
 */
const normalizeKeys = (obj: any) => {
  const normalized: any = {};
  for (const key in obj) {
    const normalizedKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .trim();
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
        
        // Parsing de valor com suporte a múltiplos nomes de colunas e formatos
        const rawValue = t.valor !== undefined ? t.valor : (t.value !== undefined ? t.value : t.montante);
        let valorNumerico = 0;
        if (typeof rawValue === 'number') {
          valorNumerico = rawValue;
        } else if (typeof rawValue === 'string') {
          // Remove símbolos de moeda e ajusta separador decimal
          const cleaned = rawValue.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
          valorNumerico = parseFloat(cleaned) || 0;
        }

        // Mapeamento flexível de status
        let rawStatus = (t.status || t.situacao || t.estado || 'Pendente').toString().trim();
        // Normaliza primeira letra maiúscula
        rawStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        const finalStatus = (rawStatus === 'Pago' || rawStatus === 'Pendente') ? rawStatus : 'Pendente';

        // Mapeamento de data
        let finalDate = t.data || t.date || new Date().toISOString().split('T')[0];
        if (typeof finalDate === 'string' && finalDate.includes('T')) {
          finalDate = finalDate.split('T')[0];
        }

        // ID determinístico se estiver faltando para evitar duplicatas em múltiplos dispositivos
        const generatedId = `${finalDate}-${(t.descricao || t.description || "sem-nome").toLowerCase().replace(/\s+/g, '-')}-${valorNumerico}`;
        const finalId = t.id ? t.id.toString() : generatedId;

        // updatedAt robusto: se não vier da planilha, usamos 0 para que qualquer alteração local vença
        // a menos que a remota seja explicitamente mais nova.
        const updatedAt = t.updatedat ? Number(t.updatedat) : 0;

        return {
          id: finalId,
          descricao: t.descricao || t.description || t.nome || "Sem descrição",
          valor: valorNumerico,
          data: finalDate,
          tipo: t.tipo || t.type || 'Despesa',
          status: finalStatus as any,
          categoria: t.categoria || t.category || 'Outro',
          frequencia: t.frequencia || t.frequency || 'Esporádico',
          updatedAt: updatedAt
        } as Transaction;
      });
    } catch (error) {
      console.error("Erro ao buscar dados do Google Sheets:", error);
      throw error;
    }
  },

  async save(transaction: Transaction): Promise<boolean> {
    if (!API_URL) return false;
    
    // Garantimos que o updatedAt vá para a planilha
    const dataToSave = { ...transaction, updatedAt: transaction.updatedAt || Date.now() };
    console.log("Salvando transação:", dataToSave.descricao);
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "save", payload: dataToSave })
      });
      
      if (response.ok) {
        try {
          const result = await response.json();
          console.log("Resultado do save:", result);
          return result.status === "success" || result.success === true;
        } catch (e) {
          return true;
        }
      }
      return response.type === 'opaque';
    } catch (error) {
      console.error("Erro ao salvar no Sheets (tentando fallback no-cors):", error);
      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "save", payload: dataToSave })
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!API_URL) return false;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "delete", payload: { id } })
      });
      return response.ok || response.type === 'opaque';
    } catch (error) {
      console.error("Erro ao deletar no Sheets (tentando fallback no-cors):", error);
      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "delete", payload: { id } })
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  async syncAll(transactions: Transaction[]): Promise<boolean> {
    if (!API_URL) return false;
    console.log("Sincronizando todos os dados:", transactions.length);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "syncAll", payload: transactions })
      });
      
      if (response.ok) {
        try {
          const result = await response.json();
          console.log("Resultado do syncAll:", result);
          return result.status === "success" || result.success === true;
        } catch (e) {
          return true;
        }
      }
      return response.ok || response.type === 'opaque';
    } catch (error) {
      console.error("Erro ao sincronizar tudo no Sheets (tentando fallback no-cors):", error);
      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "syncAll", payload: transactions })
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  }
};