import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction } from '../types.ts';

interface Props {
  transactions: Transaction[];
  hideValues: boolean;
  monthName: string;
}

const COLORS = ['#1ebf61', '#34d399', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#06b6d4', '#8b5cf6', '#6366f1'];

const Dashboard: React.FC<Props> = ({ transactions, hideValues, monthName }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');

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

  const totalSpent = summary.expense + summary.investment;

  const formatValue = (val: number) => {
    if (hideValues) return "••••";
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleWhatsAppReport = () => {
    setCopyStatus('success');
    
    const balance = summary.income - summary.expense - summary.investment;
    
    let text = `📊 *RESUMO: ${monthName.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🟢 *ENTRADAS:* ${summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `🔴 *SAÍDAS:* ${summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `🔵 *APORTES:* ${summary.investment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *SALDO:* ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;
    
    if (categoryData.length > 0) {
      text += `📉 *DISTRIBUIÇÃO:*\n`;
      categoryData
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .forEach(cat => {
          const percentage = ((cat.value / totalSpent) * 100).toFixed(0);
          text += `• ${cat.name}: ${percentage}%\n`;
        });
    }

    text += `\n_FinancePeres Dashboard_`;
    
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const barData = [
    { name: 'Receita', val: summary.income, fill: '#1ebf61' },
    { name: 'Despesa', val: summary.expense, fill: '#ef4444' },
    { name: 'Aporte', val: summary.investment, fill: '#6366f1' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-enter">
      <div className="flex justify-end">
        <button 
          onClick={handleWhatsAppReport}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-100 border ${
            copyStatus === 'success' 
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' 
            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {copyStatus === 'success' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408 0 12.044c0 2.123.555 4.197 1.608 6.04L0 24l6.117-1.605a11.803 11.803 0 005.925 1.577c6.638 0 12.048-5.41 12.051-12.048a11.817 11.817 0 00-3.483-8.514z"/></svg>
              Resumo Visual
            </>
          )}
        </button>
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