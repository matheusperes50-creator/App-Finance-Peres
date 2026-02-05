
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import GeminiInsights from './components/GeminiInsights';
import { sheetsService } from './services/googleSheetsService';

const App: React.FC = () => {
  const [isHome, setIsHome] = useState(true);
  const [hideValues, setHideValues] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('syncing');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setSyncStatus('syncing');
    
    try {
      const data = await sheetsService.getAll();
      if (data && data.length > 0) {
        setTransactions(data);
        localStorage.setItem('ff_transactions', JSON.stringify(data));
        setSyncStatus('online');
      } else {
        const saved = localStorage.getItem('ff_transactions');
        if (saved) setTransactions(JSON.parse(saved));
        setSyncStatus('online');
      }
    } catch (error) {
      console.error("Sync error:", error);
      const saved = localStorage.getItem('ff_transactions');
      if (saved) setTransactions(JSON.parse(saved));
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.data);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const generateShortId = () => Math.floor(100000 + Math.random() * 900000).toString();

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: generateShortId() } as Transaction;
    const newList = [...transactions, newTransaction];
    setTransactions(newList);
    localStorage.setItem('ff_transactions', JSON.stringify(newList));
    const success = await sheetsService.save(newTransaction);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const updateTransaction = async (updated: Transaction) => {
    const newList = transactions.map(t => t.id === updated.id ? updated : t);
    setTransactions(newList);
    localStorage.setItem('ff_transactions', JSON.stringify(newList));
    const success = await sheetsService.save(updated);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const deleteTransaction = async (id: string) => {
    const newList = transactions.filter(t => t.id !== id);
    setTransactions(newList);
    localStorage.setItem('ff_transactions', JSON.stringify(newList));
    const success = await sheetsService.delete(id);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const toggleTransactionStatus = async (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;
    const updated = { ...target, status: target.status === 'Pago' ? 'Pendente' : 'Pago' } as Transaction;
    const newList = transactions.map(t => t.id === id ? updated : t);
    setTransactions(newList);
    localStorage.setItem('ff_transactions', JSON.stringify(newList));
    const success = await sheetsService.save(updated);
    setSyncStatus(success ? 'online' : 'offline');
  };

  const copyFromPreviousMonth = async () => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = selectedYear - 1; }
    const prevTransactions = transactions.filter(t => {
      const d = new Date(t.data);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    if (prevTransactions.length === 0) return alert(`Nenhum dado no mês anterior.`);
    const newEntries: Transaction[] = prevTransactions.map(t => ({
      ...t, id: generateShortId(), data: new Date(selectedYear, selectedMonth, new Date(t.data).getDate()).toISOString().split('T')[0], status: 'Pendente'
    }));
    const updatedList = [...transactions, ...newEntries];
    setTransactions(updatedList);
    localStorage.setItem('ff_transactions', JSON.stringify(updatedList));
    const success = await sheetsService.syncAll(updatedList);
    setSyncStatus(success ? 'online' : 'offline');
  };

  if (isHome) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-enter">
        <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-brand-100">
          <div className="w-10 h-10 border-4 border-white rounded-full border-t-transparent"></div>
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-2">Finance<span className="text-brand-500">Peres</span></h1>
        <p className="text-slate-400 max-w-sm mb-12">Seu controle financeiro pessoal simplificado e inteligente.</p>
        <button 
          onClick={() => setIsHome(false)}
          className="w-full max-w-xs py-4 bg-brand-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-100 hover:bg-brand-600 transition active:scale-95"
        >
          Entrar no App
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f7f8]">
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col md:sticky md:top-0 md:h-screen z-20">
        <div className="p-6 flex justify-between items-center md:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Finance<span className="text-brand-500">Peres</span>
            </h1>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${syncStatus === 'online' ? 'bg-emerald-50 border-emerald-100' : syncStatus === 'syncing' ? 'bg-amber-50 border-amber-100 animate-pulse' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncStatus === 'online' ? 'bg-emerald-500 text-white' : syncStatus === 'syncing' ? 'bg-amber-400 text-white' : 'bg-rose-500 text-white'}`}>
              {syncStatus === 'online' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
              ) : syncStatus === 'syncing' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-1.414 1.414m-10.95 10.95l-1.414 1.414M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 5.636l12.728 12.728"></path></svg>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
              <p className={`text-xs font-black uppercase tracking-tight ${syncStatus === 'online' ? 'text-emerald-600' : syncStatus === 'syncing' ? 'text-amber-600' : 'text-rose-600'}`}>
                {syncStatus === 'online' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Modo Offline'}
              </p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3 mt-4">
             <button onClick={() => setHideValues(!hideValues)} className="p-2 text-slate-400">
               {hideValues ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
               )}
             </button>
             <GeminiInsights transactions={filteredTransactions} currentMonth={monthNames[selectedMonth]} mobileCompact />
          </div>
        </div>

        <nav className="flex md:flex-col px-3 mt-4 space-x-1 md:space-x-0 md:space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'dashboard' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-gray-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"></path></svg>
             Painel
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'transactions' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-gray-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
             Lançamentos
          </button>
        </nav>

        <div className="hidden md:block p-6 mt-auto">
          <GeminiInsights transactions={filteredTransactions} currentMonth={monthNames[selectedMonth]} />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        {(isLoading || isRefreshing) && <div className="fixed top-0 left-0 w-full h-1 bg-brand-500 z-[100] animate-pulse"></div>}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">{activeTab === 'dashboard' ? 'Painel de Controle' : 'Lançamentos'}</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">{monthNames[selectedMonth]} de {selectedYear}</p>
            </div>
            <button onClick={() => setHideValues(!hideValues)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-slate-400 hover:text-brand-500 transition shadow-sm">
              {hideValues ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  <span className="text-[10px] font-bold">EXIBIR</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  <span className="text-[10px] font-bold">OCULTAR</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button onClick={() => loadData(true)} className="p-2.5 bg-white border border-gray-200 rounded-xl text-slate-500 hover:text-brand-500 transition shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent text-slate-700 text-xs font-bold px-3 py-1 outline-none">
                {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <div className="w-px h-4 bg-gray-200 self-center"></div>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent text-slate-700 text-xs font-bold px-3 py-1 outline-none">
                <option value={2024}>2024</option><option value={2025}>2025</option>
              </select>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'dashboard' ? (
            <Dashboard 
              transactions={filteredTransactions} 
              hideValues={hideValues} 
              monthName={monthNames[selectedMonth]}
            />
          ) : (
            <TransactionList 
              transactions={filteredTransactions} 
              onAdd={addTransaction} 
              onUpdate={updateTransaction} 
              onDelete={deleteTransaction} 
              onToggleStatus={toggleTransactionStatus} 
              onCopyPrevious={copyFromPreviousMonth} 
              defaultMonth={selectedMonth} 
              defaultYear={selectedYear} 
              monthName={monthNames[selectedMonth]}
              hideValues={hideValues}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
