
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'active'>('idle');
  
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
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    if (editingTransaction) onUpdate({ ...payload, id: editingTransaction.id });
    else onAdd(payload);
    setShowModal(false);
  };

  const handleCopy = () => {
    setCopyStatus('active');
    setTimeout(() => setCopyStatus('idle'), 2000);
    onCopyPrevious();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={handleCopy} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${copyStatus === 'active' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-gray-50 text-slate-600 border-gray-100 hover:bg-gray-100'}`}
          >
            {copyStatus === 'active' ? 'Copiado!' : 'Importar Anterior'}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => { setEditingTransaction(null); setFormData(initialFormState); setShowModal(true); }} className="px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-brand-100 hover:bg-brand-600 transition active:scale-95">
             + Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Lançamento</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <button onClick={() => onToggleStatus(t.id)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'Pago' ? 'bg-brand-50 text-brand-600' : 'bg-orange-50 text-orange-600'}`}>
                      {t.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{t.descricao}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{t.data} • #{t.id}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{t.categoria}</td>
                  <td className={`px-6 py-4 font-black text-sm ${t.tipo === 'Receita' ? 'text-brand-500' : 'text-rose-500'}`}>
                    {hideValues ? "R$ ••••" : `R$ ${t.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingTransaction(t); setFormData({descricao:t.descricao, valor:t.valor.toString(), data:t.data, categoria:t.categoria, tipo:t.tipo, status:t.status, frequencia:t.frequencia}); setShowModal(true); }} className="p-2 text-slate-300 hover:text-brand-500 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-500 transition ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-medium italic">Nenhum lançamento encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-md p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800">{editingTransaction ? 'Editar' : 'Novo'} Lançamento</h3>
            
            <div className="flex p-1.5 bg-gray-100 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Despesa'})} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition ${formData.tipo === 'Despesa' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>DESPESA</button>
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Receita'})} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition ${formData.tipo === 'Receita' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'}`}>RECEITA</button>
            </div>

            <div className="space-y-4">
              <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Descrição" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-brand-500 outline-none font-bold text-slate-800" />
              <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="R$ 0,00" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-brand-500 outline-none font-black text-2xl text-slate-800" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold text-slate-600" />
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold text-slate-600">
                  {(formData.tipo === 'Receita' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 bg-gray-50 text-slate-400 rounded-2xl font-bold text-sm hover:bg-gray-100 transition">Cancelar</button>
              <button type="submit" className={`flex-1 p-4 text-white rounded-2xl font-black text-sm shadow-lg transition active:scale-95 ${formData.tipo === 'Receita' ? 'bg-brand-500 shadow-brand-100 hover:bg-brand-600' : 'bg-rose-500 shadow-rose-100 hover:bg-rose-600'}`}>
                {editingTransaction ? 'Atualizar' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
