
import React, { useState } from 'react';
import { getFinancialInsights } from '../services/geminiService';
import { Transaction, FinancialInsight } from '../types';

interface Props {
  transactions: Transaction[];
  currentMonth: string;
  mobileCompact?: boolean;
}

const GeminiInsights: React.FC<Props> = ({ transactions, currentMonth, mobileCompact = false }) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<FinancialInsight | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const result = await getFinancialInsights(transactions, currentMonth);
      setInsight(result);
      setShowPopup(true);
    } catch (err) {
      alert("Erro ao buscar insights.");
    } finally {
      setLoading(false);
    }
  };

  if (mobileCompact) {
    return (
      <button onClick={fetchInsights} disabled={loading || transactions.length === 0} className={`p-2 rounded-xl transition-all ${loading ? 'opacity-50' : 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm active:scale-90'}`}>
        {loading ? <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
      </button>
    );
  }

  return (
    <>
      <button onClick={fetchInsights} disabled={loading || transactions.length === 0} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${loading ? 'bg-gray-100 opacity-50' : 'bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 shadow-sm active:scale-95'}`}>
        {loading ? <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM15 10a5 5 0 11-10 0 5 5 0 0110 0z"></path></svg>}
        IA INSIGHTS
      </button>

      {showPopup && insight && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowPopup(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800">IA Insights</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-brand-50/30 p-5 rounded-2xl border border-brand-100 text-slate-600 italic font-medium leading-relaxed">
                "{insight.summary}"
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recomendações Acionáveis</h4>
                {insight.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="font-black text-brand-500 shrink-0">{i + 1}.</span>
                    <p className="text-sm font-bold text-slate-600">{rec}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Financeiro</span>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${insight.alertLevel === 'low' ? 'bg-brand-50 text-brand-600' : insight.alertLevel === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>
                  {insight.alertLevel === 'low' ? 'Otimizado' : insight.alertLevel === 'medium' ? 'Atenção' : 'Crítico'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiInsights;
