'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tradingStore } from '@/lib/store';
import { fetchAllTickers, getInstrumentInfo, getAllSymbols } from '@/lib/api';
import { Tick, Account } from '@/types';

function StatCard({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color?: string }) {
  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
      <div className="text-xs text-terminal-muted uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-mono font-bold mt-1 ${color || 'text-terminal-text'}`}>{value}</div>
      {subValue && <div className="text-xs text-terminal-muted mt-0.5">{subValue}</div>}
    </div>
  );
}

function TopMoverRow({ tick }: { tick: Tick }) {
  const info = getInstrumentInfo(tick.symbol);
  const isUp = tick.changePercent >= 0;
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-terminal-hover rounded">
      <div>
        <div className="font-mono text-sm font-medium">{tick.symbol}</div>
        <div className="text-[10px] text-terminal-muted">{info.name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm">{tick.last.toFixed(info.digits)}</div>
        <div className={`text-xs font-mono ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
          {isUp ? '+' : ''}{tick.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [tickers, setTickers] = useState<Tick[]>([]);
  const [openOrders, setOpenOrders] = useState(0);
  const [closedToday, setClosedToday] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    const acc = tradingStore.getAccount();
    setAccount(acc);
    setOpenOrders(tradingStore.getOpenOrders().length);
    const today = new Date().setHours(0, 0, 0, 0);
    const closed = tradingStore.getClosedOrders().filter(o => o.closeTime && o.closeTime >= today);
    setClosedToday(closed.length);
    setTotalPnL(closed.reduce((s, o) => s + o.profit, 0));
  }, []);

  useEffect(() => {
    let running = true;
    async function load() {
      const all = await fetchAllTickers();
      if (running) setTickers(all);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { running = false; clearInterval(interval); };
  }, []);

  const gainers = [...tickers].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...tickers].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const symbols = getAllSymbols();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-terminal-muted mt-1">Multi-Asset Trading Terminal Overview</p>
        </div>
        <Link href="/trade/" className="px-4 py-2 bg-terminal-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          Open Terminal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Balance" value={account ? `$${account.balance.toFixed(2)}` : '$10,000.00'} />
        <StatCard label="Open Positions" value={`${openOrders}`} subValue="active trades" />
        <StatCard label="Closed Today" value={`${closedToday}`} subValue={`P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          color={totalPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'} />
        <StatCard label="Instruments" value={`${symbols.crypto.length + symbols.forex.length + symbols.stocks.length + symbols.commodities.length}`}
          subValue={`${symbols.crypto.length} crypto, ${symbols.forex.length} forex, ${symbols.stocks.length} stocks`} />
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg">
          <div className="px-4 py-3 border-b border-terminal-border flex items-center gap-2">
            <span className="text-terminal-green">▲</span>
            <span className="text-sm font-bold">Top Gainers</span>
          </div>
          <div className="divide-y divide-terminal-border/30">
            {gainers.map(t => <TopMoverRow key={t.symbol} tick={t} />)}
          </div>
        </div>
        <div className="bg-terminal-panel border border-terminal-border rounded-lg">
          <div className="px-4 py-3 border-b border-terminal-border flex items-center gap-2">
            <span className="text-terminal-red">▼</span>
            <span className="text-sm font-bold">Top Losers</span>
          </div>
          <div className="divide-y divide-terminal-border/30">
            {losers.map(t => <TopMoverRow key={t.symbol} tick={t} />)}
          </div>
        </div>
      </div>

      {/* All Instruments Quick View */}
      <div className="bg-terminal-panel border border-terminal-border rounded-lg">
        <div className="px-4 py-3 border-b border-terminal-border">
          <span className="text-sm font-bold">Live Market Prices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-terminal-muted text-[10px] uppercase border-b border-terminal-border">
                <th className="text-left px-4 py-2">Symbol</th>
                <th className="text-left px-2 py-2">Type</th>
                <th className="text-right px-2 py-2">Bid</th>
                <th className="text-right px-2 py-2">Ask</th>
                <th className="text-right px-2 py-2">Spread</th>
                <th className="text-right px-2 py-2">Change</th>
                <th className="text-right px-2 py-2">Change %</th>
                <th className="text-right px-4 py-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map(tick => {
                const info = getInstrumentInfo(tick.symbol);
                const isUp = tick.changePercent >= 0;
                return (
                  <tr key={tick.symbol} className="border-b border-terminal-border/30 hover:bg-terminal-hover cursor-pointer">
                    <td className="px-4 py-2">
                      <Link href="/trade/" className="font-mono font-medium hover:text-terminal-accent">{tick.symbol}</Link>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        info.type === 'crypto' ? 'bg-yellow-900/30 text-yellow-400' :
                        info.type === 'forex' ? 'bg-blue-900/30 text-blue-400' :
                        info.type === 'stock' ? 'bg-purple-900/30 text-purple-400' :
                        'bg-orange-900/30 text-orange-400'
                      }`}>{info.type}</span>
                    </td>
                    <td className="text-right px-2 py-2 font-mono">{tick.bid.toFixed(info.digits)}</td>
                    <td className="text-right px-2 py-2 font-mono">{tick.ask.toFixed(info.digits)}</td>
                    <td className="text-right px-2 py-2 font-mono text-terminal-muted">{(tick.ask - tick.bid).toFixed(info.digits)}</td>
                    <td className={`text-right px-2 py-2 font-mono ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {isUp ? '+' : ''}{tick.change.toFixed(info.digits)}
                    </td>
                    <td className={`text-right px-2 py-2 font-mono ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {isUp ? '+' : ''}{tick.changePercent.toFixed(2)}%
                    </td>
                    <td className="text-right px-4 py-2 font-mono text-terminal-muted">
                      {tick.volume > 1000000 ? `${(tick.volume / 1000000).toFixed(1)}M` : tick.volume > 1000 ? `${(tick.volume / 1000).toFixed(1)}K` : tick.volume.toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
