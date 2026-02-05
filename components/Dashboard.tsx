
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

const COLORS = ['#1ebf61', '#34d399', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#06b6d4', '#8b5cf6'];

const Dashboard: React.FC<Props> = ({ transactions, hideValues, monthName }) => {
  const [excelStatus, setExcelStatus] = useState<'idle' | 'success'>('idle');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success'>('idle');

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
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleExport = () => {
    setExcelStatus('success');
    const headers = "Descrição;Valor;Data;Categoria;Tipo\n";
    const body = transactions.map(t => `${t.descricao};${t.valor};${t.data};${t.categoria};${t.tipo}`).join("\n");
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
    msg += `💎 Saldo: ${formatValue(summary.income - summary.expense)}\n\n`;
    msg += `✨ Gerado via FinancePeres`;
    navigator.clipboard.writeText(msg);
    setTimeout(() => setWhatsappStatus('idle'), 2000);
  };

  return (
    <div className="space-y-8 animate-enter">
      <div className="flex justify-end gap-3">
        <button onClick={handleExport} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${excelStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
          {excelStatus === 'success' ? '✓ Exportado' : 'Exportar Excel'}
        </button>
        <button onClick={handleWhatsApp} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${whatsappStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white transform scale-105' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
          {whatsappStatus === 'success' ? '✓ Copiado' : 'Relatório WhatsApp'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Balanço</p>
          <h3 className={`text-2xl font-black ${summary.income - summary.expense >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>
            {formatValue(summary.income - summary.expense)}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Receitas</p>
          <h3 className="text-2xl font-black text-brand-500">{formatValue(summary.income)}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Despesas</p>
          <h3 className="text-2xl font-black text-rose-500">{formatValue(summary.expense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 min-h-[400px]">
          <h4 className="font-black text-slate-800 mb-8 uppercase text-xs tracking-widest">Fluxo de Caixa</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: 'Receita', val: summary.income, fill: '#1ebf61' }, { name: 'Despesa', val: summary.expense, fill: '#ef4444' }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 min-h-[400px]">
          <h4 className="font-black text-slate-800 mb-8 uppercase text-xs tracking-widest">Gastos por Categoria</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
