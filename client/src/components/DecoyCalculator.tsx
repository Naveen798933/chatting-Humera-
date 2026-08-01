import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface DecoyCalculatorProps {
  onUnlockRealApp: () => void;
}

export const DecoyCalculator: React.FC<DecoyCalculatorProps> = ({ onUnlockRealApp }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const calculateResult = (expr: string): string => {
    try {
      // Safe math evaluator replacing eval
      const cleanExpr = expr.replace(/[^0-9+\-*/.]/g, '');
      const func = new Function(`return ${cleanExpr}`);
      const val = func();
      return String(val);
    } catch (e) {
      return 'Error';
    }
  };

  const handleBtnClick = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === '=') {
      if (display === '7989' || display === '1402' || equation.includes('1402') || equation.includes('7989')) {
        onUnlockRealApp();
        return;
      }
      const res = calculateResult(equation + display);
      setDisplay(res);
      setEquation('');
      return;
    }

    if (['+', '-', '*', '/'].includes(val)) {
      setEquation(prev => prev + display + ' ' + val + ' ');
      setDisplay('0');
      return;
    }

    setDisplay(prev => prev === '0' ? val : prev + val);
  };

  const btns = [
    'C', '(', ')', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '=', '🔓'
  ];

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xs glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
          <span>Decoy Scientific Calc</span>
          <button onClick={onUnlockRealApp} className="p-1 hover:text-pink-300" title="Exit Decoy">
            <Lock className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-space-900 p-4 rounded-2xl border border-white/10 text-right space-y-1">
          <p className="text-[10px] text-slate-400 h-4">{equation}</p>
          <p className="text-3xl font-mono font-bold text-white tracking-wider truncate">{display}</p>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {btns.map((b) => (
            <button
              key={b}
              onClick={() => b === '🔓' ? onUnlockRealApp() : handleBtnClick(b)}
              className={`py-3.5 rounded-xl font-bold text-sm transition-all ${
                b === '=' || b === '🔓'
                  ? 'bg-accent-pink text-white shadow-lg'
                  : ['/', '*', '-', '+', 'C'].includes(b)
                  ? 'bg-white/10 text-pink-300'
                  : 'glass-card text-white hover:bg-white/10'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
