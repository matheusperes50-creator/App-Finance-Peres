
import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionStatus, TransactionFrequency, CATEGORIES } from '../types';

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

const TransactionList: React.FC<Props> = ({ transactions, onAdd, onUpdate, onDelete, onToggleStatus, onCopyPrevious, defaultMonth, defaultYear, monthName, hideValues }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  
  const getDefaultDate = () => {
    const now = new Date();
    return new Date(defaultYear, defaultMonth, now.getDate()).toISOString().split('T')[0];
  };

  const initialFormState = {
    descricao: '', valor: '', data: getDefaultDate(), categoria: 'Outro', tipo: 'Despesa' as TransactionType, status: 'Pendente' as TransactionStatus, frequencia: 'Fixo' as TransactionFrequency
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor) return;
    
    setSaveStatus('success');
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    
    setTimeout(() => {
      if (editingTransaction) onUpdate({ ...payload, id: editingTransaction.id });
      else onAdd(payload);
      setShowModal(false);
      setSaveStatus('idle');
    }, 600);
  };

  const handleImport = () => {
    setImportStatus('success');
    onCopyPrevious();
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <button 
          onClick={handleImport} 
          className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${importStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
        >
          {importStatus === 'success' ? 'Sucesso!' : 'Importar Anterior'}
        </button>
        
        <button onClick={() => { setEditingTransaction(null); setFormData(initialFormState); setShowModal(true); }} className="px-8 py-3 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-100 hover:bg-brand-600 transition-all active:scale-95">
           + Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Lançamento</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length > 0 ? transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <button onClick={() => onToggleStatus(t.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'Pago' ? 'bg-brand-50 text-brand-600' : 'bg-orange-50 text-orange-600'}`}>
                      {t.status}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800 text-sm">{t.descricao}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{t.data}</div>
                  </td>
                  <td className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-tighter">{t.categoria}</td>
                  <td className={`px-8 py-5 font-black text-sm ${t.tipo === 'Receita' ? 'text-brand-600' : 'text-rose-500'}`}>
                    {hideValues ? "R$ ••••" : `R$ ${t.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}`}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditingTransaction(t); setFormData({descricao:t.descricao, valor:t.valor.toString(), data:t.data, categoria:t.categoria, tipo:t.tipo, status:t.status, frequencia:t.frequencia}); setShowModal(true); }} className="p-2.5 text-slate-300 hover:text-brand-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-300 font-bold uppercase tracking-widest text-xs opacity-50">Nenhum lançamento</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-6 shadow-2xl animate-enter">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingTransaction ? 'Editar' : 'Novo'} Lançamento</h3>
            
            <div className="flex p-2 bg-slate-50 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Despesa'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.tipo === 'Despesa' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>DESPESA</button>
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Receita'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.tipo === 'Receita' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>RECEITA</button>
            </div>

            <div className="space-y-4">
              <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="O que você comprou?" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" />
              <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0,00" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-500 focus:bg-white outline-none font-black text-3xl text-slate-800" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black text-slate-600 focus:bg-white" />
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black text-slate-600 focus:bg-white">
                  {(formData.tipo === 'Receita' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-colors">Fechar</button>
              <button 
                type="submit" 
                className={`flex-1 p-5 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${saveStatus === 'success' ? 'bg-emerald-500 shadow-emerald-100' : (formData.tipo === 'Receita' ? 'bg-brand-500 shadow-brand-100 hover:bg-brand-600' : 'bg-rose-500 shadow-rose-100 hover:bg-rose-600')}`}
              >
                {saveStatus === 'success' ? 'Salvo!' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
