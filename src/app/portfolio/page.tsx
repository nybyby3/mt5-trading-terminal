'use client';

import { useState, useEffect } from 'react';
import { tradingStore } from '@/lib/store';
import { Account, Order } from '@/types';
import { getInstrumentInfo } from '@/lib/api';

export default function PortfolioPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [closedOrders, setClosedOrders] = useState<Order[]>([]);

  useEffect(() => {
    setAccount(tradingStore.getAccount());
    setOpenOrders(tradingStore.getOpenOrders());
    setClosedOrders(tradingStore.getClosedOrders());
  }, []);

  const totalProfit = closedOrders.reduce((s, o) => s + o.profit, 0);
  const totalCommission = closedOrders.reduce((s, o) => s + o.commission, 0);
  const winRate = closedOrders.length > 0
    ? ((closedOrders.filter(o => o.profit > 0).length / closedOrders.length) * 100).toFixed(1)
    : '0.0';
  const avgProfit = closedOrders.length > 0 ? (totalProfit / closedOrders.length).toFixed(2) : '0.00';
  const bestTrade = closedOrders.length > 0 ? Math.max(...closedOrders.map(o => o.profit)) : 0;
  const worstTrade = closedOrders.length > 0 ? Math.min(...closedOrders.map(o => o.profit)) : 0;

  // Exposure by symbol
  const exposure = new Map<string, { lots: number; profit: number }>();
  openOrders.forEach(o => {
    const existing = exposure.get(o.symbol) || { lots: 0, profit: 0 };
    existing.lots += o.side === 'buy' ? o.lots : -o.lots;
    existing.profit += o.profit;
    exposure.set(o.symbol, existing);
  });

  const handleReset = () => {
    if (confirm('Reset account to $10,000? All trades will be cleared.')) {
      tradingStore.resetAccount();
      setAccount(tradingStore.getAccount());
      setOpenOrders([]);
      setClosedOrders([]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-terminal-muted mt-1">Account overview and trading statistics</p>
        </div>
        <button onClick={handleReset}
          className="px-3 py-1.5 border border-terminal-red/50 text-terminal-red rounded text-xs hover:bg-terminal-red/10">
          Reset Account
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Balance', value: `$${account?.balance.toFixed(2) || '10,000.00'}`, color: '' },
          { label: 'Equity', value: `$${account?.equity.toFixed(2) || '10,000.00'}`, color: '' },
          { label: 'Used Margin', value: `$${account?.margin.toFixed(2) || '0.00'}`, color: '' },
          { label: 'Free Margin', value: `$${account?.freeMargin.toFixed(2) || '10,000.00'}`, color: '' },
        ].map(item => (
          <div key={item.label} className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
            <div className="text-xs text-terminal-muted uppercase">{item.label}</div>
            <div className={`text-xl font-mono font-bold mt-1 ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Trades', value: closedOrders.length.toString() },
          { label: 'Win Rate', value: `${winRate}%`, color: parseFloat(winRate) >= 50 ? 'text-terminal-green' : 'text-terminal-red' },
          { label: 'Net P&L', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, color: totalProfit >= 0 ? 'text-terminal-green' : 'text-terminal-red' },
          { label: 'Avg Trade', value: `$${avgProfit}`, color: parseFloat(avgProfit) >= 0 ? 'text-terminal-green' : 'text-terminal-red' },
          { label: 'Best Trade', value: `+$${bestTrade.toFixed(2)}`, color: 'text-terminal-green' },
          { label: 'Worst Trade', value: `$${worstTrade.toFixed(2)}`, color: 'text-terminal-red' },
        ].map(item => (
          <div key={item.label} className="bg-terminal-panel border border-terminal-border rounded-lg p-3">
            <div className="text-[10px] text-terminal-muted uppercase">{item.label}</div>
            <div className={`text-sm font-mono font-bold mt-1 ${(item as any).color || ''}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Current Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg">
          <div className="px-4 py-3 border-b border-terminal-border font-bold text-sm">Current Exposure</div>
          {exposure.size === 0 ? (
            <div className="p-8 text-center text-terminal-muted text-sm">No open positions</div>
          ) : (
            <div className="divide-y divide-terminal-border/30">
              {Array.from(exposure.entries()).map(([sym, data]) => (
                <div key={sym} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-mono font-medium text-sm">{sym}</div>
                    <div className="text-xs text-terminal-muted">{getInstrumentInfo(sym).name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono ${data.lots > 0 ? 'text-terminal-green' : data.lots < 0 ? 'text-terminal-red' : ''}`}>
                      {data.lots > 0 ? '+' : ''}{data.lots.toFixed(2)} lots
                    </div>
                    <div className={`text-xs font-mono ${data.profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-terminal-panel border border-terminal-border rounded-lg">
          <div className="px-4 py-3 border-b border-terminal-border font-bold text-sm">Recent Closed Trades</div>
          {closedOrders.length === 0 ? (
            <div className="p-8 text-center text-terminal-muted text-sm">No closed trades yet</div>
          ) : (
            <div className="divide-y divide-terminal-border/30 max-h-72 overflow-y-auto">
              {closedOrders.slice(-10).reverse().map(order => (
                <div key={order.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{order.symbol}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.side === 'buy' ? 'bg-green-900/30 text-terminal-green' : 'bg-red-900/30 text-terminal-red'}`}>
                        {order.side.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-terminal-muted">
                      {order.lots} lots @ {order.openPrice.toFixed(2)} → {order.closePrice?.toFixed(2)}
                    </div>
                  </div>
                  <div className={`font-mono text-sm font-medium ${order.profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {order.profit >= 0 ? '+' : ''}${order.profit.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
