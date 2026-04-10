'use client';

import { useState, useEffect, useRef } from 'react';
import { Tick } from '@/types';
import { tradingStore } from '@/lib/store';
import { fetchAllTickers, getInstrumentInfo, getAllSymbols } from '@/lib/api';

interface Props {
  onSelectSymbol: (symbol: string) => void;
  activeSymbol: string;
}

export default function Watchlist({ onSelectSymbol, activeSymbol }: Props) {
  const [tickers, setTickers] = useState<Map<string, Tick>>(new Map());
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  useEffect(() => {
    setWatchlist(tradingStore.getWatchlist());
  }, []);

  useEffect(() => {
    let running = true;
    async function update() {
      const all = await fetchAllTickers();
      if (!running) return;
      const map = new Map<string, Tick>();
      const flashes = new Map<string, 'up' | 'down'>();
      all.forEach(t => {
        map.set(t.symbol, t);
        const prev = prevPrices.current.get(t.symbol);
        if (prev !== undefined && prev !== t.last) {
          flashes.set(t.symbol, t.last > prev ? 'up' : 'down');
        }
        prevPrices.current.set(t.symbol, t.last);
      });
      setTickers(map);
      setFlashMap(flashes);
      setTimeout(() => setFlashMap(new Map()), 300);
    }
    update();
    const interval = setInterval(update, 3000);
    return () => { running = false; clearInterval(interval); };
  }, []);

  const allSymbols = getAllSymbols();
  const allList = [...allSymbols.crypto, ...allSymbols.forex, ...allSymbols.stocks, ...allSymbols.commodities];
  const availableToAdd = allList.filter(s => !watchlist.includes(s) && s.toLowerCase().includes(filter.toLowerCase()));

  const addSymbol = (sym: string) => {
    tradingStore.addToWatchlist(sym);
    setWatchlist(tradingStore.getWatchlist());
    setShowAdd(false);
    setFilter('');
  };

  const removeSymbol = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    tradingStore.removeFromWatchlist(sym);
    setWatchlist(tradingStore.getWatchlist());
  };

  return (
    <div className="bg-terminal-panel border-r border-terminal-border flex flex-col h-full" style={{ width: 240 }}>
      <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-terminal-muted">Market Watch</span>
        <button onClick={() => setShowAdd(!showAdd)} className="text-terminal-muted hover:text-terminal-accent text-lg leading-none">+</button>
      </div>
      {showAdd && (
        <div className="p-2 border-b border-terminal-border">
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search symbol..."
            className="w-full bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-xs focus:border-terminal-accent outline-none" autoFocus />
          <div className="max-h-32 overflow-y-auto mt-1">
            {availableToAdd.slice(0, 10).map(sym => (
              <button key={sym} onClick={() => addSymbol(sym)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-terminal-hover rounded flex items-center justify-between">
                <span>{sym}</span>
                <span className="text-terminal-muted text-[10px]">{getInstrumentInfo(sym).type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-terminal-muted uppercase">
              <th className="text-left px-2 py-1.5">Symbol</th>
              <th className="text-right px-2 py-1.5">Bid</th>
              <th className="text-right px-2 py-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map(sym => {
              const tick = tickers.get(sym);
              const info = getInstrumentInfo(sym);
              const flash = flashMap.get(sym);
              const isActive = sym === activeSymbol;
              return (
                <tr key={sym} onClick={() => onSelectSymbol(sym)}
                  className={`cursor-pointer text-xs border-b border-terminal-border/50 transition-colors ${
                    isActive ? 'bg-terminal-accent/10' : 'hover:bg-terminal-hover'
                  } ${flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''}`}>
                  <td className="px-2 py-1.5">
                    <div className="font-mono font-medium">{sym}</div>
                    <div className="text-[10px] text-terminal-muted">{info.type}</div>
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono">
                    {tick ? tick.bid.toFixed(info.digits) : '---'}
                  </td>
                  <td className={`text-right px-2 py-1.5 font-mono ${
                    tick && tick.changePercent >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      {tick ? `${tick.changePercent >= 0 ? '+' : ''}${tick.changePercent.toFixed(2)}%` : '---'}
                      <button onClick={(e) => removeSymbol(sym, e)} className="opacity-0 group-hover:opacity-100 text-terminal-muted hover:text-terminal-red ml-1"
                        title="Remove">x</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
