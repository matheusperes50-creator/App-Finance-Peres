import React, { useState, useEffect } from 'react';
import { Transaction, CATEGORIES, TransactionStatus } from '../types.ts';

interface Props {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
  defaultMonth: number;
  defaultYear: number;
  hideValues: boolean;
}

const InvestmentList: React.FC<Props> = ({ 
  transactions, 
  onAdd, 
  onUpdate, 
  onDelete, 
  defaultMonth, 
  defaultYear, 
  hideValues 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [viewMode, setViewMode] = useState<'table' | 'list'>(window.innerWidth < 768 ? 'list' : 'table');

  const investmentTransactions = transactions.filter(t => t.tipo === 'Investimento');

  const getInitialDate = () => {
    const month = (defaultMonth + 1).toString().padStart(2, '0');
    return `${defaultYear}-${month}-01`;
  };

  const [formData, setFormData] = useState({
    descricao: '', 
    valor: '', 
    data: getInitialDate(), 
    categoria: CATEGORIES.INVESTMENT[0], 
    tipo: 'Investimento' as const, 
    status: 'Pago' as TransactionStatus
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor.toString(),
        data: editingTransaction.data,
        categoria: editingTransaction.categoria,
        tipo: 'Investimento',
        status: editingTransaction.status
      });
    } else {
      setFormData({
        descricao: '', 
        valor: '', 
        data: getInitialDate(), 
        categoria: CATEGORIES.INVESTMENT[0], 
        tipo: 'Investimento', 
        status: 'Pago'
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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (    <div className="space-y-6 animate-enter">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-500'}`}>
              <svg className="mx-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-500'}`}>
              <svg className="mx-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">Aportes</h4>
          </div>
        </div>
        <button onClick={() => { setEditingTransaction(null); setShowModal(true); }} className="px-8 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95">
          + Novo Aporte
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-sm overflow-hidden w-full">
        {investmentTransactions.length === 0 ? (
          <div className="px-8 py-12 text-center text-slate-600 font-medium italic">Nenhum investimento registrado.</div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500">
                <tr>
                  <th className="px-8 py-6">Categoria</th>
                  <th className="px-8 py-6">Descrição</th>
                  <th className="px-8 py-6">Data</th>
                  <th className="px-8 py-6">Valor</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {investmentTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {t.categoria}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-100 text-sm">{t.descricao}</td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{formatDateDisplay(t.data)}</td>
                    <td className={`px-8 py-5 font-black text-sm text-indigo-400`}>
                      {hideValues ? 'R$ ••••' : t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(t)} className="p-2 text-slate-600 hover:text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(t.id)} 
                          className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-slate-800">
            {investmentTransactions.map(t => (
              <div key={t.id} className="p-6 flex flex-col gap-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-black text-slate-100 text-base">{t.descricao}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{formatDateDisplay(t.data)}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.categoria}</span>
                    </div>
                  </div>
                  <div className={`text-right font-black text-lg text-indigo-400`}>
                    {hideValues ? 'R$ ••••' : t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <button onClick={() => handleEdit(t)} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-400 transition-colors border border-slate-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(t.id)} 
                    className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-rose-500 transition-colors border border-slate-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-[2rem] w-full max-w-md p-5 sm:p-8 space-y-5 shadow-2xl animate-enter border-t-8 border-indigo-500">
            <h3 className="text-xl font-black text-slate-100 tracking-tight">
              {editingTransaction ? 'Editar Aporte' : 'Novo Aporte'}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Onde você guardou?</label>
                <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Aporte CDB Mensal" required className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-indigo-500 focus:bg-slate-800/50 outline-none font-bold text-slate-100 transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor do Aporte</label>
                <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0,00" required className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-indigo-500 focus:bg-slate-800/50 outline-none font-black text-2xl text-indigo-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs font-black text-slate-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Ativo</label>
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs font-black text-slate-300">
                    {CATEGORIES.INVESTMENT.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3.5 bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              <button type="submit" className={`flex-1 p-3.5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 bg-indigo-500 hover:bg-indigo-600`}>
                {saveStatus === 'success' ? 'Salvo!' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 rounded-[2rem] w-full max-w-xs p-8 space-y-6 shadow-2xl animate-enter border border-slate-800 text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100 tracking-tight">Excluir Aporte?</h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed">Esta ação não pode ser desfeita e removerá o item da sua planilha.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)} 
                className="flex-1 p-3.5 bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }} 
                className="flex-1 p-3.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentList;