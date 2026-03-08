import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Transaction } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import InvestmentList from './components/InvestmentList.tsx';
import { sheetsService } from './services/googleSheetsService.ts';

const App: React.FC = () => {
  const [isHome, setIsHome] = useState(true);
  const [hideValues, setHideValues] = useState(false); // Agora inicia como falso para mostrar valores
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'investments'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('syncing');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSettings, setShowSettings] = useState(false);

  const hasLoadedInitialData = useRef(false);

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('ff_transactions');
      let currentData = saved ? JSON.parse(saved) : [];
      
      // Injeção única dos dados da imagem de Março/2026
      const injectionKey = 'ff_injected_march_2026_v2';
      if (!localStorage.getItem(injectionKey)) {
        const marchData: Transaction[] = [
          { id: 'hwttkl6w6', descricao: 'internet', valor: 100, data: '2026-03-06', categoria: 'Moradia', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'hgbvnvfhb', descricao: 'Cartão Nubank', valor: 800, data: '2026-03-01', categoria: 'Cartão de crédito', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'ir156pfka', descricao: 'Internet', valor: 100, data: '2026-03-01', categoria: 'Moradia', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'ozzgou4rs', descricao: 'Lavagem Roupa + pilhas', valor: 175, data: '2026-03-01', categoria: 'Moradia', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'gh6ypsxyc', descricao: 'Cartão Nubank', valor: 800, data: '2026-03-01', categoria: 'Cartão de crédito', tipo: 'Despesa', status: 'Pago', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'kfh69c8fi', descricao: 'Som culto praise 202', valor: 25, data: '2026-03-01', categoria: 'Outro', tipo: 'Despesa', status: 'Pago', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'ysbprdasj', descricao: 'Viagem que não fomos', valor: 34, data: '2026-03-01', categoria: 'Outro', tipo: 'Despesa', status: 'Pago', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'u5z4gjrvs', descricao: 'Encontro de casais P', valor: 209, data: '2026-03-01', categoria: 'Outro', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'djsupdy7b', descricao: 'Contas Thainná', valor: 200, data: '2026-03-01', categoria: 'Utilidades gerais', tipo: 'Despesa', status: 'Pago', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'a2kb0ipxq', descricao: 'João Thiago cartão', valor: 55, data: '2026-03-01', categoria: 'Outro', tipo: 'Despesa', status: 'Pago', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: 'igcee4up6', descricao: 'Conta Nucel', valor: 30, data: '2026-03-01', categoria: 'Utilidades gerais', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() },
          { id: '0t1jufqlu', descricao: 'Vivo Matheus', valor: 60.65, data: '2026-03-01', categoria: 'Utilidades gerais', tipo: 'Despesa', status: 'Pendente', frequencia: 'Fixo', pendingSync: true, updatedAt: Date.now() }
        ];
        
        const existingIds = new Set(currentData.map((t: any) => t.id));
        const toAdd = marchData.filter(t => !existingIds.has(t.id));
        
        currentData = [...toAdd, ...currentData];
        localStorage.setItem(injectionKey, 'true');
        localStorage.setItem('ff_transactions', JSON.stringify(currentData));
      }
      
      return currentData;
    } catch (e) {
      console.error("Erro ao carregar dados locais:", e);
      return [];
    }
  });

  // Persistência local robusta
  useEffect(() => {
    try {
      localStorage.setItem('ff_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error("Erro ao salvar dados locais:", e);
    }
  }, [transactions]);

  const loadData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const remoteData = await sheetsService.getAll();
      
      if (Array.isArray(remoteData)) {
        setTransactions(current => {
          // Mapa para reconciliação
          const mergedMap = new Map<string, Transaction>();
          
          // 1. Adiciona dados atuais (incluindo pendentes)
          current.forEach(t => mergedMap.set(t.id, t));
          
          // 2. Mescla dados remotos
          remoteData.forEach(remote => {
            const local = mergedMap.get(remote.id);
            
            // Se não existe localmente, adiciona
            if (!local) {
              mergedMap.set(remote.id, remote);
            } 
            // Se existe remotamente, o servidor é a fonte da verdade
            // a menos que tenhamos uma alteração local mais recente que ainda não foi sincronizada
            else {
              const remoteTime = remote.updatedAt || 0;
              const localTime = local.updatedAt || 0;
              
              // Só sobrescreve o local se:
              // 1. O remoto for estritamente mais novo
              // 2. O local não estiver pendente de sincronização
              if (remoteTime > localTime || !local.pendingSync) {
                mergedMap.set(remote.id, { ...remote, pendingSync: false });
              }
              // Se os tempos forem iguais e o local estiver pendente, mantemos o local
              // para garantir que o flag pendingSync continue visível até o sucesso do POST
            }
          });
          
          const merged = Array.from(mergedMap.values());
          return merged.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        });
        setSyncStatus('online');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('offline');
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
      hasLoadedInitialData.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedInitialData.current) {
      loadData();
    }
  }, [loadData]);

  // Polling mais frequente (30s) para manter dados atualizados entre dispositivos
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncStatus !== 'syncing' && document.visibilityState === 'visible') {
        loadData();
      }
    }, 30000); 
    
    return () => clearInterval(interval);
  }, [loadData, syncStatus]);

  // Tenta sincronizar transações pendentes periodicamente
  useEffect(() => {
    const syncPending = async () => {
      const pending = transactions.filter(t => t.pendingSync);
      if (pending.length > 0 && syncStatus !== 'syncing') {
        console.log(`Tentando sincronizar ${pending.length} transações pendentes...`);
        for (const t of pending) {
          let success = false;
          if (t.isDeleted) {
            success = await sheetsService.delete(t.id);
            if (success) {
              setTransactions(prev => prev.filter(item => item.id !== t.id));
            }
          } else {
            success = await sheetsService.save(t);
            if (success) {
              setTransactions(prev => prev.map(item => 
                item.id === t.id ? { ...item, pendingSync: false } : item
              ));
            }
          }
        }
      }
    };

    const interval = setInterval(syncPending, 15000); // Tenta a cada 15 segundos
    return () => clearInterval(interval);
  }, [transactions, syncStatus]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => !t.isDeleted) // Filtra removidos localmente que ainda não foram sincronizados
      .filter(t => {
        if (!t.data) return false;
        const datePart = t.data.toString().split('T')[0];
        const [year, month] = datePart.split('-').map(Number);
        return (month - 1) === selectedMonth && year === selectedYear;
      });
  }, [transactions, selectedMonth, selectedYear]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const now = Date.now();
    const newTransaction = { 
      ...t, 
      id: Math.random().toString(36).substr(2, 9),
      pendingSync: true,
      updatedAt: now
    } as Transaction;

    setTransactions(prev => [newTransaction, ...prev]);
    
    setSyncStatus('syncing');
    const success = await sheetsService.save(newTransaction);
    
    if (success) {
      setTransactions(prev => prev.map(item => 
        item.id === newTransaction.id ? { ...item, pendingSync: false } : item
      ));
      setSyncStatus('online');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('offline');
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    const now = Date.now();
    const transactionWithPending = { ...updated, pendingSync: true, updatedAt: now };
    
    setTransactions(prev => prev.map(t => t.id === updated.id ? transactionWithPending : t));
    
    setSyncStatus('syncing');
    const success = await sheetsService.save(transactionWithPending);
    
    if (success) {
      setTransactions(prev => prev.map(item => 
        item.id === updated.id ? { ...item, pendingSync: false } : item
      ));
      setSyncStatus('online');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('offline');
    }
  };

  const deleteTransaction = async (id: string) => {
    const now = Date.now();
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isDeleted: true, pendingSync: true, updatedAt: now } : t
    ));
    
    setSyncStatus('syncing');
    const success = await sheetsService.delete(id);
    
    if (success) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      setSyncStatus('online');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('offline');
    }
  };

  const clearAllData = async () => {
    if (window.confirm("Tem certeza que deseja ZERAR TODOS os dados? Esta ação não pode ser desfeita e apagará tudo da planilha também.")) {
      setSyncStatus('syncing');
      setTransactions([]);
      localStorage.removeItem('ff_transactions');
      try {
        const success = await sheetsService.syncAll([]);
        setSyncStatus(success ? 'online' : 'offline');
        alert("Dados zerados com sucesso!");
      } catch (e) {
        setSyncStatus('offline');
        alert("Erro ao sincronizar limpeza com a planilha.");
      }
    }
  };

  if (isHome) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-enter overflow-hidden">
        <div className="w-20 h-20 bg-brand-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h1 className="text-4xl font-black text-slate-100 mb-2 tracking-tight">Controle<span className="text-brand-500">Financeiro</span></h1>
        <p className="text-slate-400 max-w-sm mb-12 font-medium">Controle financeiro inteligente integrado ao Google Sheets.</p>
        <button onClick={() => setIsHome(false)} className="w-full max-w-xs py-5 bg-brand-500 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-brand-600 transition-all active:scale-95">Acessar Sistema</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {isLoading && !hasLoadedInitialData.current && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold animate-pulse">Sincronizando dados...</p>
        </div>
      )}

      <aside className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="p-4 md:p-8">
          <div className="mb-4 md:mb-10 flex flex-row md:flex-col justify-between items-center md:items-start">
            <div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-sm">CF</div>
                <h1 className="text-base md:text-xl font-black tracking-tight text-slate-100">Controle<span className="text-brand-500">Financeiro</span></h1>
              </div>
              <p className="hidden md:block text-[11px] font-bold text-slate-500 mt-2 ml-0.5 tracking-tight">
                Data: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())}
              </p>
            </div>
            
            <div className={`md:hidden flex items-center gap-2 px-3 py-1 rounded-full border ${syncStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{syncStatus}</span>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3 p-4 rounded-2xl border transition-all bg-slate-800/50 border-slate-800">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'} text-white shadow-sm`}>
                 {syncStatus === 'online' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ) : syncStatus === 'syncing' ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Planilha</p>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-black uppercase truncate tracking-tight ${syncStatus === 'online' ? 'text-emerald-500' : syncStatus === 'syncing' ? 'text-amber-500' : 'text-rose-500'}`}>
                    {syncStatus === 'online' ? 'Atualizado' : syncStatus === 'syncing' ? 'Sincronizando' : 'Desconectado'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {lastSyncTime && (
                      <span className="text-[8px] font-bold text-slate-600">
                        {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button 
                      onClick={loadData} 
                      disabled={syncStatus === 'syncing'}
                      className="p-1 text-slate-500 hover:text-slate-100 disabled:opacity-50 transition-colors"
                      title="Sincronizar Agora"
                    >
                      <svg className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto no-scrollbar md:overflow-visible pb-2 md:pb-0">
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold text-[10px] md:text-sm transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
               <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
               <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold text-[10px] md:text-sm transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
               <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
               <span>Lançamentos</span>
            </button>
            <button onClick={() => setActiveTab('investments')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold text-[10px] md:text-sm transition-all whitespace-nowrap ${activeTab === 'investments' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
               <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
               <span>Aportes</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-[calc(100vh-80px)] md:h-screen w-full scroll-smooth no-scrollbar">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-3">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl md:text-3xl font-black text-slate-100 tracking-tight">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'transactions' ? 'Lançamentos' : 'Investimentos'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${activeTab === 'investments' ? 'text-indigo-400 bg-indigo-500/10' : 'text-brand-400 bg-brand-500/10'}`}>{monthNames[selectedMonth]}</span>
              <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase">{selectedYear}</span>
            </div>
          </div>
          
          <div className="flex w-full sm:w-auto gap-2 items-center">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
              className="flex-1 sm:flex-none bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-[10px] md:text-[11px] font-bold outline-none shadow-sm focus:border-brand-500 appearance-none"
            >
              {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
              className="flex-1 sm:flex-none bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-[10px] md:text-[11px] font-bold outline-none shadow-sm focus:border-brand-500 appearance-none"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <div className="flex gap-1">
              <button onClick={() => setHideValues(!hideValues)} title={hideValues ? "Mostrar valores" : "Esconder valores"} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-brand-500 transition-all shadow-sm">
                {hideValues ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
              <button onClick={() => setShowSettings(true)} title="Configurações" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-brand-500 transition-all shadow-sm">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto w-full pb-8">
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
                let updatedList: Transaction[] = [];
                setTransactions(prev => {
                  updatedList = [...newEntries, ...prev];
                  localStorage.setItem('ff_transactions', JSON.stringify(updatedList));
                  return updatedList;
                });
                setSyncStatus('syncing');
                try {
                  const success = await sheetsService.syncAll(updatedList);
                  setSyncStatus(success ? 'online' : 'offline');
                } catch (e) {
                  setSyncStatus('offline');
                }
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
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-slate-900 rounded-[2rem] w-full max-w-sm p-6 sm:p-8 space-y-6 shadow-2xl animate-enter border border-slate-800">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase">Gerenciar Dados</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status da Planilha</p>
                  <p className={`text-xs font-black uppercase ${syncStatus === 'online' ? 'text-emerald-500' : syncStatus === 'syncing' ? 'text-amber-500' : 'text-rose-500'}`}>
                    {syncStatus === 'online' ? 'Conectado' : syncStatus === 'syncing' ? 'Sincronizando' : 'Desconectado'}
                  </p>
                </div>
              </div>

              <button 
                onClick={async () => { 
                  if (window.confirm("Isso enviará TODOS os seus dados locais para a planilha, sobrescrevendo o que estiver lá. Deseja continuar?")) {
                    setSyncStatus('syncing');
                    const success = await sheetsService.syncAll(transactions);
                    setSyncStatus(success ? 'online' : 'offline');
                    if (success) {
                      setTransactions(prev => prev.map(t => ({ ...t, pendingSync: false })));
                      alert("Sincronização completa realizada com sucesso!");
                    } else {
                      alert("Erro ao realizar sincronização completa.");
                    }
                  }
                }} 
                disabled={syncStatus === 'syncing'}
                className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-slate-700"
              >
                <span>Forçar Envio Total</span>
                <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </button>

              <button 
                onClick={() => { loadData(); setShowSettings(false); }} 
                disabled={syncStatus === 'syncing'}
                className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-slate-700"
              >
                <span>Sincronizar Agora</span>
                <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;