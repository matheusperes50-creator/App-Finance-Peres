
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import InvestmentList from './components/InvestmentList.tsx';
import { sheetsService } from './services/googleSheetsService.ts';

const App: React.FC = () => {
  const [isHome, setIsHome] = useState(true);
  const [hideValues, setHideValues] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'investments'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('syncing');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data do dia formatada dinamicamente
  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }, []);

  // Estado das transações com persistência LocalStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ff_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar no LocalStorage sempre que houver mudança
  useEffect(() => {
    localStorage.setItem('ff_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Carregar dados da planilha ao iniciar
  const loadData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const remoteData = await sheetsService.getAll();
      if (remoteData && remoteData.length >= 0) {
        setTransactions(remoteData);
        setSyncStatus('online');
      }
    } catch (error) {
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.data) return false;
      const datePart = t.data.toString().split('T')[0];
      const [year, month] = datePart.split('-').map(Number);
      return (month - 1) === selectedMonth && year === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Ações em Tempo Real: Atualiza interface primeiro, depois envia para o Google
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) } as Transaction;
    setTransactions(prev => [newTransaction, ...prev]); // Atualização instantânea na UI
    setSyncStatus('syncing');
    const success = await sheetsService.save(newTransaction);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const updateTransaction = async (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSyncStatus('syncing');
    const success = await sheetsService.save(updated);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setSyncStatus('syncing');
    const success = await sheetsService.delete(id);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const handleFullSync = async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    const success = await sheetsService.syncAll(transactions);
    setSyncStatus(success ? 'online' : 'offline');
    if(success) alert("Planilha totalmente atualizada!");
  };

  if (isHome) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-enter">
        <div className="w-20 h-20 bg-brand-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-brand-200">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Finance<span className="text-brand-500">Peres</span></h1>
        <p className="text-slate-400 max-w-sm mb-12 font-medium">Sua vida financeira salva em tempo real na sua planilha.</p>
        <button onClick={() => setIsHome(false)} className="w-full max-w-xs py-5 bg-brand-500 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-brand-600 transition-all active:scale-95">Acessar Sistema</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="p-8">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black">FP</div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">Finance<span className="text-brand-500">Peres</span></h1>
            </div>
            {/* Data do dia discreta abaixo do nome */}
            <p className="text-[11px] font-bold text-slate-400 mt-2 ml-0.5 tracking-tight">
              {currentDateFormatted}
            </p>
          </div>
          
          {/* Status de Sincronização */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all mb-8 ${syncStatus === 'online' ? 'bg-emerald-50 border-emerald-100' : syncStatus === 'syncing' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'} text-white`}>
              {syncStatus === 'online' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              ) : syncStatus === 'syncing' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planilha</p>
              <p className={`text-xs font-black uppercase tracking-tight ${syncStatus === 'online' ? 'text-emerald-600' : syncStatus === 'syncing' ? 'text-amber-600' : 'text-rose-600'}`}>
                {syncStatus === 'online' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Erro de Link'}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-brand-500 text-white shadow-lg shadow-brand-100' : 'text-slate-400 hover:bg-slate-50'}`}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
               Dashboard
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'transactions' ? 'bg-brand-500 text-white shadow-lg shadow-brand-100' : 'text-slate-400 hover:bg-slate-50'}`}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
               Lançamentos
            </button>
            <button onClick={() => setActiveTab('investments')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'investments' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
               Investimentos
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'transactions' ? 'Lançamentos' : 'Investimentos'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${activeTab === 'investments' ? 'text-indigo-500 bg-indigo-50' : 'text-brand-500 bg-brand-50'}`}>{monthNames[selectedMonth]}</span>
              <span className="text-xs font-black text-slate-300 uppercase">{selectedYear}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm focus:border-brand-500">
              {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
            <button onClick={() => setHideValues(!hideValues)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-500 transition-all shadow-sm">
              {hideValues ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              )}
            </button>
            <button onClick={loadData} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-500 transition-all shadow-sm" title="Recarregar">
               <svg className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-brand-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <Dashboard transactions={filteredTransactions} hideValues={hideValues} monthName={monthNames[selectedMonth]} />
        ) : activeTab === 'transactions' ? (
          <TransactionList 
            transactions={filteredTransactions} 
            onAdd={addTransaction} 
            onUpdate={updateTransaction} 
            onDelete={deleteTransaction} 
            onToggleStatus={(id) => {
              const t = transactions.find(x => x.id === id);
              if (t) updateTransaction({ ...t, status: t.status === 'Pago' ? 'Pendente' : 'Pago' });
            }}
            onCopyPrevious={async () => {
              let pm = selectedMonth - 1, py = selectedYear;
              if (pm < 0) { pm = 11; py--; }
              const prev = transactions.filter(t => {
                const datePart = t.data.toString().split('T')[0];
                const [y, m] = datePart.split('-').map(Number);
                return (m - 1) === pm && y === py && t.tipo !== 'Investimento';
              });
              const safeMonth = (selectedMonth + 1).toString().padStart(2, '0');
              const newDate = `${selectedYear}-${safeMonth}-01`;
              const newEntries: Transaction[] = prev.map(t => ({
                ...t, id: Math.random().toString(36).substr(2, 9), data: newDate, status: 'Pendente' as const
              }));
              const updatedList = [...newEntries, ...transactions];
              setTransactions(updatedList);
              setSyncStatus('syncing');
              const success = await sheetsService.syncAll(updatedList);
              setSyncStatus(success ? 'online' : 'offline');
            }}
            defaultMonth={selectedMonth} 
            defaultYear={selectedYear} 
            monthName={monthNames[selectedMonth]}
            hideValues={hideValues}
          />
        ) : (
          <InvestmentList 
            transactions={filteredTransactions} 
            onAdd={addTransaction} 
            onUpdate={updateTransaction} 
            onDelete={deleteTransaction}
            defaultMonth={selectedMonth} 
            defaultYear={selectedYear} 
            hideValues={hideValues}
          />
        )}
      </main>
    </div>
  );
};

export default App;
