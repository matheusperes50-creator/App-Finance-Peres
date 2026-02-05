
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
  const [excelStatus, setExcelStatus] = useState<'idle' | 'active'>('idle');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'active'>('idle');

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

  const barData = [
    { name: 'Receita', total: summary.income, fill: '#1ebf61' },
    { name: 'Despesa', total: summary.expense, fill: '#ef4444' }
  ];

  const formatValue = (val: number) => {
    if (hideValues) return "••••";
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleExportCSV = () => {
    setExcelStatus('active');
    setTimeout(() => setExcelStatus('idle'), 2000);

    const headers = ["Descrição", "Valor", "Data", "Categoria", "Tipo", "Status"];
    const rows = transactions.map(t => [t.descricao, t.valor, t.data, t.categoria, t.tipo, t.status]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Relatorio_FinancePeres_${monthName}.csv`;
    link.click();
  };

  const handleCopyWhatsApp = () => {
    setWhatsappStatus('active');
    setTimeout(() => setWhatsappStatus('idle'), 2000);

    const incomeStr = summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const expenseStr = summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const balanceStr = (summary.income - summary.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    let msg = `📊 *RESUMO FINANCEIRO - ${monthName.toUpperCase()}*\n`;
    msg += `🏦 *App:* FinancePeres\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *DADOS DO MÊS*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🟢 *Receitas:* R$ ${incomeStr}\n`;
    msg += `🔴 *Despesas:* R$ ${expenseStr}\n`;
    msg += `💎 *Saldo Final:* R$ ${balanceStr}\n\n`;

    if (categoryData.length > 0) {
      msg += `📂 *MAIORES GASTOS POR CATEGORIA*\n`;
      categoryData.sort((a, b) => b.value - a.value).slice(0, 5).forEach(cat => {
        msg += `• ${cat.name}: R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ _Gerado por FinancePeres_`;

    navigator.clipboard.writeText(msg);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-2 mb-2">
        <button 
          onClick={handleExportCSV} 
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm ${excelStatus === 'active' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
        >
          {excelStatus === 'active' ? (
            <>
              <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Baixado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Exportar Excel
            </>
          )}
        </button>
        <button 
          onClick={handleCopyWhatsApp} 
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm ${whatsappStatus === 'active' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
        >
          {whatsappStatus === 'active' ? (
            <>
              <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.589.944 3.119 1.462 4.827 1.463 5.424 0 9.835-4.411 9.838-9.835.002-2.628-1.023-5.1-2.885-6.963-1.862-1.865-4.334-2.889-6.96-2.891-5.424 0-9.835 4.411-9.838 9.836-.002 1.848.497 3.654 1.446 5.233l-.966 3.525 3.58-.938zm12.501-7.07c-.036-.06-.133-.096-.279-.169-.147-.073-.869-.43-1.003-.478-.133-.049-.231-.073-.329.073-.097.147-.378.478-.463.574-.085.096-.17.108-.317.036-.147-.073-.62-.228-1.181-.728-.436-.39-1.31-1.28-1.31-1.28.1-.036.19-.085.27-.16l.16-.16c.07-.07.12-.13.16-.2.07-.12.03-.23-.01-.31-.04-.08-.33-.79-.45-.11-.12-.3-.23-.53-.26-.14-.04-.26-.01-.35.03-.09.04-.15.24-.31.32-.08.08-.24.23-.39.43-.15.2-.23.47-.35.6-.12.13-.23.19-.39.12-.15-.07-.63-.23-1.19-.73-.44-.39-.74-.87-.82-.99-.08-.12-.01-.19.06-.27l.11-.13c.04-.05.07-.11.11-.16.03-.05.06-.12.06-.2 0-.08-.03-.17-.07-.26-.04-.09-.33-.79-.45-1.08-.12-.29-.25-.25-.33-.25h-.28c-.1 0-.26.04-.39.19-.13.15-.51.5-.51 1.21s.52 1.4 1.22 1.63c.7.23 1.21.2 1.43.17.22-.03.71-.27.81-.54.1-.27.1-.5.07-.54-.03-.04-.11-.06-.25-.14z"></path></svg>
              Relatório WhatsApp
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Saldo Mensal</p>
          <div className="flex items-end justify-between mt-2">
             <h3 className={`text-2xl font-black ${summary.income - summary.expense >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
               R$ {formatValue(summary.income - summary.expense)}
             </h3>
             <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Receita Mensal</p>
          <div className="flex items-end justify-between mt-2">
             <h3 className="text-2xl font-black text-brand-500">
               R$ {formatValue(summary.income)}
             </h3>
             <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Despesa Mensal</p>
          <div className="flex items-end justify-between mt-2">
             <h3 className="text-2xl font-black text-rose-500">
               R$ {formatValue(summary.expense)}
             </h3>
             <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
            Fluxo de Caixa
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  formatter={(value: any) => hideValues ? "••••" : `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-400 rounded-full"></span>
            Gastos por Categoria
          </h4>
          <div className="h-[280px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => hideValues ? "••••" : `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '11px', fontWeight: 600, color: '#64748b'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm font-medium">Sem despesas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
