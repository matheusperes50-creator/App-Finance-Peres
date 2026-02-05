import React, { useState, useEffect } from 'react';
import { Transaction, CATEGORIES } from '../types.ts';

interface Props {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCopyPrevious: () => void;
  defaultMonth: number;
  defaultYear: number;
  monthName: string;
  hideValues: boolean;
}

const TransactionList: React.FC<Props> = ({ 
  transactions, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onToggleStatus, 
  onCopyPrevious, 
  defaultMonth, 
  defaultYear, 
  hideValues 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success'>('idle');

  const getInitialDate = () => {
    const month = (defaultMonth + 1).toString().padStart(2, '0');
    return `${defaultYear}-${month}-01`;
  };

  const [formData, setFormData] = useState({
    descricao: '', 
    valor: '', 
    data: getInitialDate(), 
    categoria: 'Outro', 
    tipo: 'Despesa' as 'Receita' | 'Despesa', 
    status: 'Pendente' as 'Pago' | 'Pendente'
  });

  // Atualiza o formulário quando entra em modo de edição ou muda o mês selecionado
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor.toString(),
        data: editingTransaction.data,
        categoria: editingTransaction.categoria,
        tipo: editingTransaction.tipo,
        status: editingTransaction.status
      });
    } else {
      setFormData({
        descricao: '', 
        valor: '', 
        data: getInitialDate(), 
        categoria: 'Outro', 
        tipo: 'Despesa', 
        status: 'Pendente'
      });
    }
  }, [editingTransaction, showModal, defaultMonth, defaultYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('success');
    
    const transactionData = {
      ...formData,
      valor: parseFloat(formData.valor),
      frequencia: 'Esporádico' as const
    };

    if (editingTransaction) {
      onUpdate({ ...transactionData, id: editingTransaction.id } as Transaction);
    } else {
      onAdd(transactionData);
    }

    setTimeout(() => {
      setShowModal(false);
      setEditingTransaction(null);
      setSaveStatus('idle');
    }, 1000);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setShowModal(true);
  };

  const handleImport = () => {
    setImportStatus('success');
    onCopyPrevious();
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
        <button onClick={handleImport} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${importStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}>
          {importStatus === 'success' ? '✓ Importado' : 'Importar Anterior'}
        </button>
        <button onClick={() => { setEditingTransaction(null); setShowModal(true); }} className="px-8 py-3 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-100 hover:bg-brand-600 transition-all active:scale-95">
          + Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Descrição</th>
                <th className="px-8 py-6">Categoria</th>
                <th className="px-8 py-6">Valor</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-300 font-medium italic">Nenhum lançamento encontrado para este período.</td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <button onClick={() => onToggleStatus(t.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'Pago' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                        {t.status}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 text-sm">{t.descricao}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{formatDateDisplay(t.data)}</p>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{t.categoria}</td>
                    <td className={`px-8 py-5 font-black text-sm ${t.tipo === 'Receita' ? 'text-brand-500' : 'text-rose-500'}`}>
                      {hideValues ? 'R$ ••••' : t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(t)} className="p-2 text-slate-300 hover:text-brand-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] w-full max-w-md p-10 space-y-6 shadow-2xl animate-enter">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            
            <div className="flex p-2 bg-slate-50 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Despesa'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.tipo === 'Despesa' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>DESPESA</button>
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Receita'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.tipo === 'Receita' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'}`}>RECEITA</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Supermercado" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0,00" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-500 focus:bg-white outline-none font-black text-3xl text-slate-800" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black text-slate-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black text-slate-600">
                    {(formData.tipo === 'Receita' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={closeModal} className="flex-1 p-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
              <button type="submit" className={`flex-1 p-5 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${saveStatus === 'success' ? 'bg-emerald-500' : (formData.tipo === 'Receita' ? 'bg-brand-500' : 'bg-rose-500')}`}>
                {saveStatus === 'success' ? 'Sucesso!' : (editingTransaction ? 'Salvar' : 'Confirmar')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransactionList;