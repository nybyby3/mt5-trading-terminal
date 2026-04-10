'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tick } from '@/types';
import { fetchAllTickers, getInstrumentInfo, getAllSymbols } from '@/lib/api';

type FilterType = 'all' | 'crypto' | 'forex' | 'stock' | 'commodity';

export default function MarketPage() {
  const [tickers, setTickers] = useState<Tick[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'change'>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let running = true;
    async function load() {
      const all = await fetchAllTickers();
      if (running) setTickers(all);
    }
    load();
    const interval = setInterval(load, 4000);
    return () => { running = false; clearInterval(interval); };
  }, []);

  const symbols = getAllSymbols();
  const counts = {
    all: symbols.crypto.length + symbols.forex.length + symbols.stocks.length + symbols.commodities.length,
    crypto: symbols.crypto.length,
    forex: symbols.forex.length,
    stock: symbols.stocks.length,
    commodity: symbols.commodities.length,
  };

  let filtered = tickers.filter(t => {
    const info = getInstrumentInfo(t.symbol);
    if (filter !== 'all' && info.type !== filter) return false;
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !info.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
    return (a.changePercent - b.changePercent) * dir;
  });

  const toggleSort = (col: 'symbol' | 'change') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'crypto', label: `Crypto (${counts.crypto})` },
    { key: 'forex', label: `Forex (${counts.forex})` },
    { key: 'stock', label: `Stocks (${counts.stock})` },
    { key: 'commodity', label: `Commodities (${counts.commodity})` },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Market Overview</h1>
      <p className="text-sm text-terminal-muted mb-6">Real-time prices across all asset classes</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === f.key ? 'bg-terminal-accent text-white' : 'bg-terminal-panel border border-terminal-border text-terminal-muted hover:text-terminal-text'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search instruments..."
          className="ml-auto bg-terminal-panel border border-terminal-border rounded px-3 py-1.5 text-sm w-64 focus:border-terminal-accent outline-none" />
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-terminal-muted text-xs uppercase border-b border-terminal-border bg-terminal-header">
              <th className="text-left px-4 py-3 cursor-pointer hover:text-terminal-text" onClick={() => toggleSort('symbol')}>
                Symbol {sortBy === 'symbol' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-3 py-3">Name</th>
              <th className="text-left px-3 py-3">Type</th>
              <th className="text-right px-3 py-3">Bid</th>
              <th className="text-right px-3 py-3">Ask</th>
              <th className="text-right px-3 py-3">Spread</th>
              <th className="text-right px-3 py-3">High 24h</th>
              <th className="text-right px-3 py-3">Low 24h</th>
              <th className="text-right px-3 py-3 cursor-pointer hover:text-terminal-text" onClick={() => toggleSort('change')}>
                Change % {sortBy === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tick => {
              const info = getInstrumentInfo(tick.symbol);
              const isUp = tick.changePercent >= 0;
              return (
                <tr key={tick.symbol} className="border-b border-terminal-border/30 hover:bg-terminal-hover transition-colors">
                  <td className="px-4 py-2.5 font-mono font-medium">{tick.symbol}</td>
                  <td className="px-3 py-2.5 text-terminal-muted text-xs">{info.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      info.type === 'crypto' ? 'bg-yellow-900/30 text-yellow-400' :
                      info.type === 'forex' ? 'bg-blue-900/30 text-blue-400' :
                      info.type === 'stock' ? 'bg-purple-900/30 text-purple-400' :
                      'bg-orange-900/30 text-orange-400'
                    }`}>{info.type.toUpperCase()}</span>
                  </td>
                  <td className="text-right px-3 py-2.5 font-mono">{tick.bid.toFixed(info.digits)}</td>
                  <td className="text-right px-3 py-2.5 font-mono">{tick.ask.toFixed(info.digits)}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-terminal-muted">{(tick.ask - tick.bid).toFixed(info.digits)}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-terminal-muted">{tick.high24h.toFixed(info.digits)}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-terminal-muted">{tick.low24h.toFixed(info.digits)}</td>
                  <td className={`text-right px-3 py-2.5 font-mono font-medium ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {isUp ? '+' : ''}{tick.changePercent.toFixed(2)}%
                  </td>
                  <td className="text-right px-4 py-2.5">
                    <Link href="/trade/" className="px-3 py-1 bg-terminal-accent/20 text-terminal-accent rounded text-xs hover:bg-terminal-accent/30">
                      Trade
                    </Link>
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
