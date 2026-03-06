import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, CATEGORIES, TransactionFrequency } from '../types.ts';

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
  monthName,
  hideValues 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success'>('idle');
  const [csvStatus, setCsvStatus] = useState<'idle' | 'success'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');
  const [viewMode, setViewMode] = useState<'table' | 'list'>(window.innerWidth < 768 ? 'list' : 'table');

  // Estados de Filtro
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterFrequency, setFilterFrequency] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todas');

  // Filtra as transações com base na aba (apenas Receitas/Despesas) e nos filtros do usuário
  const displayTransactions = useMemo(() => {
    return transactions
      .filter(t => t.tipo !== 'Investimento')
      .filter(t => filterCategory === 'Todas' || t.categoria === filterCategory)
      .filter(t => filterFrequency === 'Todas' || t.frequencia === filterFrequency)
      .filter(t => filterStatus === 'Todas' || t.status === filterStatus);
  }, [transactions, filterCategory, filterFrequency, filterStatus]);

  const allCategories = useMemo(() => {
    return ['Todas', ...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE].filter((v, i, a) => a.indexOf(v) === i);
  }, []);

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
    status: 'Pendente' as 'Pago' | 'Pendente',
    frequencia: 'Esporádico' as TransactionFrequency
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor.toString(),
        data: editingTransaction.data,
        categoria: editingTransaction.categoria,
        tipo: editingTransaction.tipo as any,
        status: editingTransaction.status,
        frequencia: editingTransaction.frequencia || 'Esporádico'
      });
    } else {
      setFormData({
        descricao: '', 
        valor: '', 
        data: getInitialDate(), 
        categoria: 'Outro', 
        tipo: 'Despesa', 
        status: 'Pendente',
        frequencia: 'Esporádico'
      });
    }
  }, [editingTransaction, showModal, defaultMonth, defaultYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      valor: parseFloat(formData.valor),
    };
    if (editingTransaction) {
      onUpdate({ ...transactionData, id: editingTransaction.id } as Transaction);
    } else {
      onAdd(transactionData);
    }
    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleWhatsAppExport = () => {
    setWhatsappStatus('success');
    
    const income = displayTransactions.filter(t => t.tipo === 'Receita').reduce((a, b) => a + b.valor, 0);
    const expense = displayTransactions.filter(t => t.tipo === 'Despesa').reduce((a, b) => a + b.valor, 0);
    
    let text = `📊 *RESUMO MENSAL: ${monthName.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💰 *RECEITAS:* ${income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `🔻 *DESPESAS:* ${expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `⚖️ *SALDO:* ${(income - expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;
    
    text += `📝 *LANÇAMENTOS:* \n`;
    displayTransactions.forEach(t => {
      const icon = t.tipo === 'Receita' ? '🟢' : '🔴';
      const statusIcon = t.status === 'Pago' ? '✅' : '⏳';
      text += `${icon} *${t.descricao}*\n`;
      text += `└ ${t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | ${t.categoria} | ${statusIcon}\n\n`;
    });

    text += `_Gerado por FinancePeres_`;
    
    navigator.clipboard.writeText(text);
    setTimeout(() => setWhatsappStatus('idle'), 2000);
  };

  const handleCSVExport = () => {
    setCsvStatus('success');
    const headers = "Data;Descrição;Categoria;Frequência;Tipo;Valor;Status\n";
    const body = displayTransactions.map(t => 
      `${t.data};${t.descricao};${t.categoria};${t.frequencia};${t.tipo};${t.valor};${t.status}`
    ).join("\n");
    
    const blob = new Blob(["\uFEFF" + headers + body], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${monthName.toLowerCase()}_${defaultYear}.csv`;
    link.click();
    setTimeout(() => setCsvStatus('idle'), 2000);
  };

  const handleCopyPrevious = () => {
    onCopyPrevious();
    setCopyStatus('success');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Barra de Filtros e Ações */}
      <div className="bg-slate-900 p-3.5 sm:p-6 rounded-[2rem] border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-[100px] sm:flex-none">
              <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-[10px] md:text-[11px] font-bold outline-none focus:border-brand-500 appearance-none"
              >
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[100px] sm:flex-none">
              <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Frequência</label>
              <select 
                value={filterFrequency} 
                onChange={(e) => setFilterFrequency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-[10px] md:text-[11px] font-bold outline-none focus:border-brand-500 appearance-none"
              >
                <option value="Todas">Todas</option>
                <option value="Fixo">Fixo</option>
                <option value="Esporádico">Esporádico</option>
              </select>
            </div>
            <div className="flex-1 min-w-[100px] sm:flex-none">
              <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-[10px] md:text-[11px] font-bold outline-none focus:border-brand-500 appearance-none"
              >
                <option value="Todas">Todas</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl self-end">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-500'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-500'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={handleWhatsAppExport} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${whatsappStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408 0 12.044c0 2.123.555 4.197 1.608 6.04L0 24l6.117-1.605a11.803 11.803 0 005.925 1.577c6.638 0 12.048-5.41 12.051-12.048a11.817 11.817 0 00-3.483-8.514z"/></svg>
              {whatsappStatus === 'success' ? 'Copiado' : 'WhatsApp'}
            </button>
            <button onClick={handleCSVExport} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${csvStatus === 'success' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              {csvStatus === 'success' ? 'Salvo' : 'Excel'}
            </button>
            <button onClick={handleCopyPrevious} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${copyStatus === 'success' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              {copyStatus === 'success' ? 'Copiado' : 'Anterior'}
            </button>
            <button onClick={() => { setEditingTransaction(null); setShowModal(true); }} className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95">
              + Novo
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-sm overflow-hidden">
        {displayTransactions.length === 0 ? (
          <div className="px-8 py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <p className="text-slate-400 font-bold">Nenhum lançamento este mês.</p>
            <p className="text-slate-600 text-xs max-w-xs mx-auto leading-relaxed">
              Você pode adicionar um novo lançamento manualmente ou copiar os gastos fixos do mês anterior.
            </p>
            <button 
              onClick={handleCopyPrevious}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              Copiar do Mês Anterior
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500">
                <tr>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Descrição</th>
                  <th className="px-8 py-6">Categoria</th>
                  <th className="px-8 py-6">Frequência</th>
                  <th className="px-8 py-6">Valor</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {displayTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <button onClick={() => onToggleStatus(t.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}>
                        {t.status}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-100 text-sm">{t.descricao}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{formatDateDisplay(t.data)}</p>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">{t.categoria}</td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">
                      <span className={`px-2 py-0.5 rounded-md ${t.frequencia === 'Fixo' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                        {t.frequencia}
                      </span>
                    </td>
                    <td className={`px-8 py-5 font-black text-sm ${t.tipo === 'Receita' ? 'text-brand-500' : 'text-rose-500'}`}>
                      {hideValues ? 'R$ ••••' : t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingTransaction(t); setShowModal(true); }} className="p-2 text-slate-600 hover:text-brand-500 transition-colors">
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
            {displayTransactions.map(t => (
              <div key={t.id} className="p-6 flex flex-col gap-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-black text-slate-100 text-base">{t.descricao}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{formatDateDisplay(t.data)}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.categoria}</span>
                    </div>
                  </div>
                  <div className={`text-right font-black text-lg ${t.tipo === 'Receita' ? 'text-brand-500' : 'text-rose-500'}`}>
                    {hideValues ? 'R$ ••••' : t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    <button onClick={() => onToggleStatus(t.id)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {t.status}
                    </button>
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${t.frequencia === 'Fixo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {t.frequencia}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTransaction(t); setShowModal(true); }} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-brand-500 transition-colors border border-slate-700">
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
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-[2rem] w-full max-w-md p-5 sm:p-8 space-y-5 shadow-2xl animate-enter border border-slate-800">
            <h3 className="text-xl font-black text-slate-100 tracking-tight">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            
            <div className="flex p-1 bg-slate-800 rounded-xl">
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Despesa'})} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formData.tipo === 'Despesa' ? 'bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500'}`}>DESPESA</button>
              <button type="button" onClick={() => setFormData({...formData, tipo: 'Receita'})} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formData.tipo === 'Receita' ? 'bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-500'}`}>RECEITA</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Supermercado" required className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-brand-500 focus:bg-slate-800/50 outline-none font-bold text-slate-100 transition-all text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor</label>
                <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0,00" required className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-brand-500 focus:bg-slate-800/50 outline-none font-black text-2xl text-slate-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs font-black text-slate-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs font-black text-slate-300">
                    {(formData.tipo === 'Receita' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Frequência</label>
                <select value={formData.frequencia} onChange={e => setFormData({...formData, frequencia: e.target.value as TransactionFrequency})} className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs font-black text-slate-300 focus:border-brand-500 focus:bg-slate-800/50 transition-all">
                  <option value="Esporádico">Esporádico (Único)</option>
                  <option value="Fixo">Fixo (Mensal)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3.5 bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              <button type="submit" className={`flex-1 p-3.5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${formData.tipo === 'Receita' ? 'bg-brand-500' : 'bg-rose-500'}`}>
                {editingTransaction ? 'Salvar' : 'Confirmar'}
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
              <h3 className="text-xl font-black text-slate-100 tracking-tight">Excluir Lançamento?</h3>
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

export default TransactionList;