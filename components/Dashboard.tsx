
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  hideValues: boolean;
  monthName: string;
}

const COLORS = ['#1ebf61', '#34d399', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#06b6d4', '#8b5cf6'];

const Dashboard: React.FC<Props> = ({ transactions, hideValues, monthName }) => {
  const [btnExcelState, setBtnExcelState] = useState<'idle' | 'success'>('idle');
  const [btnWppState, setBtnWppState] = useState<'idle' | 'success'>('idle');

  const summary = transactions.reduce((acc, t) => {
    if (t.tipo === 'Receita') acc.income += t.valor;
    else acc.expense += t.valor;
    return acc;
  }, { income: 0, expense: 0 });

  const categoryData = transactions
    .filter(t => t.tipo === 'Despesa')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.categoria);
      if (existing) existing.value += t.valor;
      else acc.push({ name: t.categoria, value: t.valor });
      return acc;
    }, []);

  const formatValue = (val: number) => {
    if (hideValues) return "••••";
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleExportCSV = () => {
    setBtnExcelState('success');
    setTimeout(() => setBtnExcelState('idle'), 2000);

    const headers = ["Descrição", "Valor", "Data", "Categoria", "Tipo", "Status"];
    const rows = transactions.map(t => [t.descricao, t.valor, t.data, t.categoria, t.tipo, t.status]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Relatorio_${monthName}.csv`;
    link.click();
  };

  const handleCopyWhatsApp = () => {
    setBtnWppState('success');
    setTimeout(() => setBtnWppState('idle'), 2000);

    const incomeStr = summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const expenseStr = summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const balanceStr = (summary.income - summary.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    let msg = `📊 *RESUMO FINANCEIRO - ${monthName.toUpperCase()}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `💰 *DADOS GERAIS*\n`;
    msg += `✅ *Receitas:* R$ ${incomeStr}\n`;
    msg += `🔴 *Despesas:* R$ ${expenseStr}\n`;
    msg += `💎 *Saldo:* R$ ${balanceStr}\n\n`;

    if (categoryData.length > 0) {
      msg += `📂 *GASTOS POR CATEGORIA*\n`;
      categoryData.sort((a,b) => b.value - a.value).slice(0, 5).forEach(cat => {
        msg += `• ${cat.name}: R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ _Enviado via FinancePeres_`;

    navigator.clipboard.writeText(msg);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-3">
        <button 
          onClick={handleExportCSV} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm border ${btnExcelState === 'success' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
        >
          {btnExcelState === 'success' ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>Baixado!</>
          ) : (
            <><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Exportar Excel</>
          )}
        </button>
        <button 
          onClick={handleCopyWhatsApp} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm border ${btnWppState === 'success' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
        >
          {btnWppState === 'success' ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>Copiado!</>
          ) : (
            <><svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.589.944 3.119 1.462 4.827 1.463 5.424 0 9.835-4.411 9.838-9.835.002-2.628-1.023-5.1-2.885-6.963-1.862-1.865-4.334-2.889-6.96-2.891-5.424 0-9.835 4.411-9.838 9.836-.002 1.848.497 3.654 1.446 5.233l-.966 3.525 3.58-.938zm12.501-7.07c-.036-.06-.133-.096-.279-.169-.147-.073-.869-.43-1.003-.478-.133-.049-.231-.073-.329.073-.097.147-.378.478-.463.574-.085.096-.17.108-.317.036-.147-.073-.62-.228-1.181-.728-.436-.39-1.31-1.28-1.31-1.28.1-.036.19-.085.27-.16l.16-.16c.07-.07.12-.13.16-.2.07-.12.03-.23-.01-.31-.04-.08-.33-.79-.45-.11-.12-.3-.23-.53-.26-.14-.04-.26-.01-.35.03-.09.04-.15.24-.31.32-.08.08-.24.23-.39.43-.15.2-.23.47-.35.6-.12.13-.23.19-.39.12-.15-.07-.63-.23-1.19-.73-.44-.39-.74-.87-.82-.99-.08-.12-.01-.19.06-.27l.11-.13c.04-.05.07-.11.11-.16.03-.05.06-.12.06-.2 0-.08-.03-.17-.07-.26-.04-.09-.33-.79-.45-1.08-.12-.29-.25-.25-.33-.25h-.28c-.1 0-.26.04-.39.19-.13.15-.51.5-.51 1.21s.52 1.4 1.22 1.63c.7.23 1.21.2 1.43.17.22-.03.71-.27.81-.54.1-.27.1-.5.07-.54-.03-.04-.11-.06-.25-.14z"></path></svg>Relatório WhatsApp</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo Mensal</p>
          <div className="flex items-end justify-between mt-3">
             <h3 className={`text-3xl font-black ${summary.income - summary.expense >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
               R$ {formatValue(summary.income - summary.expense)}
             </h3>
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Receitas</p>
          <div className="flex items-end justify-between mt-3">
             <h3 className="text-3xl font-black text-brand-500">
               R$ {formatValue(summary.income)}
             </h3>
             <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
             </div>
          </div>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Despesas</p>
          <div className="flex items-end justify-between mt-3">
             <h3 className="text-3xl font-black text-rose-500">
               R$ {formatValue(summary.expense)}
             </h3>
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path></svg>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="w-1.5 h-5 bg-brand-500 rounded-full"></span>
            Resumo de Fluxo
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Receita', total: summary.income, fill: '#1ebf61' },
                { name: 'Despesa', total: summary.expense, fill: '#ef4444' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)'}} formatter={(val: any) => hideValues ? "••••" : `R$ ${val}`} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="w-1.5 h-5 bg-orange-400 rounded-full"></span>
            Gastos por Categoria
          </h4>
          <div className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => hideValues ? "••••" : `R$ ${val}`} />
                  <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 800}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                <svg className="w-14 h-14 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                <p className="text-sm font-bold tracking-tight">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
