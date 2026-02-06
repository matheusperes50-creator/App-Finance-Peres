import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction } from '../types.ts';
import GeminiInsights from './GeminiInsights.tsx';

interface Props {
  transactions: Transaction[];
  hideValues: boolean;
  monthName: string;
}

const COLORS = ['#1ebf61', '#34d399', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#06b6d4', '#8b5cf6', '#6366f1'];

const Dashboard: React.FC<Props> = ({ transactions, hideValues, monthName }) => {
  const [excelStatus, setExcelStatus] = useState<'idle' | 'success'>('idle');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success'>('idle');

  const summary = transactions.reduce((acc, t) => {
    if (t.tipo === 'Receita') acc.income += t.valor;
    else if (t.tipo === 'Despesa') acc.expense += t.valor;
    else if (t.tipo === 'Investimento') acc.investment += t.valor;
    return acc;
  }, { income: 0, expense: 0, investment: 0 });

  const categoryData = transactions
    .filter(t => t.tipo === 'Despesa' || t.tipo === 'Investimento')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.categoria);
      if (existing) existing.value += t.valor;
      else acc.push({ name: t.categoria, value: t.valor });
      return acc;
    }, []);

  const formatValue = (val: number) => {
    if (hideValues) return "••••";
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleExport = () => {
    setExcelStatus('success');
    const headers = "ID;Descrição;Valor;Data;Categoria;Tipo;Status;Frequência\n";
    const body = transactions.map(t => `${t.id};${t.descricao};${t.valor};${t.data};${t.categoria};${t.tipo};${t.status};${t.frequencia}`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + body], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `finance_report_${monthName}.csv`;
    link.click();
    setTimeout(() => setExcelStatus('idle'), 2000);
  };

  const handleWhatsApp = () => {
    setWhatsappStatus('success');
    let msg = `📊 *Resumo Financeiro - ${monthName}*\n\n`;
    msg += `✅ Receitas: ${formatValue(summary.income)}\n`;
    msg += `🔴 Despesas: ${formatValue(summary.expense)}\n`;
    msg += `📈 Investimentos: ${formatValue(summary.investment)}\n`;
    msg += `💎 Saldo: ${formatValue(summary.income - summary.expense - summary.investment)}\n\n`;
    msg += `✨ Gerado via FinancePeres`;
    navigator.clipboard.writeText(msg);
    setTimeout(() => setWhatsappStatus('idle'), 2000);
  };

  const barData = [
    { name: 'Receita', val: summary.income, fill: '#1ebf61' },
    { name: 'Despesa', val: summary.expense, fill: '#ef4444' },
    { name: 'Investimento', val: summary.investment, fill: '#6366f1' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-enter">
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
        <div className="w-full xl:w-72">
          <GeminiInsights transactions={transactions} currentMonth={monthName} />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full xl:w-auto">
          <button onClick={handleExport} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${excelStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
            {excelStatus === 'success' ? '✓ Sucesso' : 'Exportar CSV'}
          </button>
          <button onClick={handleWhatsApp} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${whatsappStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
            {whatsappStatus === 'success' ? '✓ Copiado' : 'WhatsApp'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Saldo Mensal</p>
          <h3 className={`text-lg sm:text-xl font-black truncate ${summary.income - summary.expense - summary.investment >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>
            {formatValue(summary.income - summary.expense - summary.investment)}
          </h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Receitas</p>
          <h3 className="text-lg sm:text-xl font-black text-brand-500 truncate">{formatValue(summary.income)}</h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Despesas</p>
          <h3 className="text-lg sm:text-xl font-black text-rose-500 truncate">{formatValue(summary.expense)}</h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Aportes</p>
          <h3 className="text-lg sm:text-xl font-black text-indigo-500 truncate">{formatValue(summary.investment)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-50 flex flex-col min-h-[350px]">
          <h4 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest">Fluxo do Mês</h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-50 flex flex-col min-h-[350px]">
          <h4 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest">Distribuição</h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 9, fontWeight: 700, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;