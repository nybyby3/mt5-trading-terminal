'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { tradingStore } from '@/lib/store';
import { getInstrumentInfo } from '@/lib/api';

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');

  useEffect(() => {
    setOrders(tradingStore.getClosedOrders());
  }, []);

  let filtered = orders;
  if (filter === 'profit') filtered = orders.filter(o => o.profit > 0);
  if (filter === 'loss') filtered = orders.filter(o => o.profit <= 0);
  filtered = [...filtered].sort((a, b) => (b.closeTime || 0) - (a.closeTime || 0));

  const totalProfit = filtered.reduce((s, o) => s + o.profit, 0);
  const totalCommission = filtered.reduce((s, o) => s + o.commission, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Trade History</h1>
      <p className="text-sm text-terminal-muted mb-6">Complete record of closed positions</p>

      <div className="flex items-center gap-3 mb-4">
        {(['all', 'profit', 'loss'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              filter === f ? 'bg-terminal-accent text-white' : 'bg-terminal-panel border border-terminal-border text-terminal-muted hover:text-terminal-text'
            }`}>
            {f === 'all' ? `All (${orders.length})` : f === 'profit' ? `Profitable (${orders.filter(o => o.profit > 0).length})` : `Losing (${orders.filter(o => o.profit <= 0).length})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="text-terminal-muted">Total P&L: <span className={`font-mono font-medium ${totalProfit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}</span></span>
          <span className="text-terminal-muted">Commission: <span className="font-mono text-terminal-red">${totalCommission.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-terminal-muted">
            <div className="text-4xl mb-3 opacity-30">📊</div>
            <div className="text-sm">No trade history yet</div>
            <div className="text-xs mt-1">Start trading to see your history here</div>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-terminal-muted text-[10px] uppercase border-b border-terminal-border bg-terminal-header">
                <th className="text-left px-4 py-2.5">Order ID</th>
                <th className="text-left px-3 py-2.5">Symbol</th>
                <th className="text-left px-3 py-2.5">Type</th>
                <th className="text-right px-3 py-2.5">Volume</th>
                <th className="text-right px-3 py-2.5">Open Price</th>
                <th className="text-right px-3 py-2.5">Close Price</th>
                <th className="text-right px-3 py-2.5">Commission</th>
                <th className="text-right px-3 py-2.5">Profit</th>
                <th className="text-right px-4 py-2.5">Close Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const info = getInstrumentInfo(order.symbol);
                return (
                  <tr key={order.id} className="border-b border-terminal-border/30 hover:bg-terminal-hover">
                    <td className="px-4 py-2 font-mono text-terminal-muted">{order.id.slice(0, 15)}...</td>
                    <td className="px-3 py-2 font-mono font-medium">{order.symbol}</td>
                    <td className={`px-3 py-2 ${order.side === 'buy' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {order.side.toUpperCase()} {order.type}
                    </td>
                    <td className="text-right px-3 py-2 font-mono">{order.lots}</td>
                    <td className="text-right px-3 py-2 font-mono">{order.openPrice.toFixed(info.digits)}</td>
                    <td className="text-right px-3 py-2 font-mono">{order.closePrice?.toFixed(info.digits) || '---'}</td>
                    <td className="text-right px-3 py-2 font-mono text-terminal-red">{order.commission.toFixed(2)}</td>
                    <td className={`text-right px-3 py-2 font-mono font-medium ${order.profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-2 text-terminal-muted">
                      {order.closeTime ? new Date(order.closeTime).toLocaleString() : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
