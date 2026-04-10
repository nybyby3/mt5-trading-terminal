'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { tradingStore } from '@/lib/store';
import { fetchBinanceTicker, getInstrumentInfo } from '@/lib/api';

interface Props {
  refreshKey?: number;
}

export default function PositionsPanel({ refreshKey }: Props) {
  const [tab, setTab] = useState<'positions' | 'pending' | 'account'>('positions');
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState<Order[]>([]);
  const [account, setAccount] = useState(tradingStore.getAccount());

  useEffect(() => {
    function loadOrders() {
      setOrders(tradingStore.getOpenOrders());
      setPending(tradingStore.getPendingOrders());
      setAccount(tradingStore.getAccount());
    }
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  // Update P&L for open orders
  useEffect(() => {
    let running = true;
    async function updatePnL() {
      const open = tradingStore.getOpenOrders();
      for (const order of open) {
        const tick = await fetchBinanceTicker(order.symbol);
        if (!running || !tick) continue;
        const currentPrice = order.side === 'buy' ? tick.bid : tick.ask;
        tradingStore.updateOrderProfit(order.id, currentPrice);
      }
      if (running) {
        setOrders(tradingStore.getOpenOrders());
        const totalProfit = tradingStore.calculateOpenProfit();
        const acc = tradingStore.getAccount();
        acc.profit = totalProfit;
        acc.equity = acc.balance + totalProfit;
        acc.freeMargin = acc.equity - acc.margin;
        acc.marginLevel = acc.margin > 0 ? (acc.equity / acc.margin) * 100 : 0;
        tradingStore.updateAccount(acc);
        setAccount(acc);
      }
    }
    updatePnL();
    const interval = setInterval(updatePnL, 3000);
    return () => { running = false; clearInterval(interval); };
  }, [refreshKey]);

  const closeOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const tick = await fetchBinanceTicker(order.symbol);
    if (!tick) return;
    const closePrice = order.side === 'buy' ? tick.bid : tick.ask;
    tradingStore.closeOrder(orderId, closePrice);
    setOrders(tradingStore.getOpenOrders());
    setAccount(tradingStore.getAccount());
  };

  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);

  const tabs = [
    { key: 'positions' as const, label: `Positions (${orders.length})` },
    { key: 'pending' as const, label: `Pending (${pending.length})` },
    { key: 'account' as const, label: 'Account' },
  ];

  return (
    <div className="bg-terminal-panel border-t border-terminal-border" style={{ height: 200 }}>
      <div className="flex items-center border-b border-terminal-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-terminal-accent text-terminal-accent' : 'border-transparent text-terminal-muted hover:text-terminal-text'
            }`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto px-3 flex items-center gap-4 text-xs">
          <span className="text-terminal-muted">Balance: <span className="text-terminal-text font-mono">${account.balance.toFixed(2)}</span></span>
          <span className="text-terminal-muted">Equity: <span className="text-terminal-text font-mono">${account.equity.toFixed(2)}</span></span>
          <span className="text-terminal-muted">P&L: <span className={`font-mono ${totalProfit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}</span></span>
        </div>
      </div>
      <div className="overflow-auto" style={{ height: 165 }}>
        {tab === 'positions' && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-terminal-header">
              <tr className="text-terminal-muted text-[10px] uppercase">
                <th className="text-left px-3 py-1.5">Symbol</th>
                <th className="text-left px-2 py-1.5">Type</th>
                <th className="text-right px-2 py-1.5">Volume</th>
                <th className="text-right px-2 py-1.5">Open Price</th>
                <th className="text-right px-2 py-1.5">S/L</th>
                <th className="text-right px-2 py-1.5">T/P</th>
                <th className="text-right px-2 py-1.5">Commission</th>
                <th className="text-right px-2 py-1.5">Profit</th>
                <th className="text-center px-2 py-1.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-6 text-terminal-muted">No open positions</td></tr>
              ) : orders.map(order => {
                const info = getInstrumentInfo(order.symbol);
                return (
                  <tr key={order.id} className="border-b border-terminal-border/30 hover:bg-terminal-hover">
                    <td className="px-3 py-1.5 font-mono">{order.symbol}</td>
                    <td className={`px-2 py-1.5 ${order.side === 'buy' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {order.side.toUpperCase()}
                    </td>
                    <td className="text-right px-2 py-1.5 font-mono">{order.lots}</td>
                    <td className="text-right px-2 py-1.5 font-mono">{order.openPrice.toFixed(info.digits)}</td>
                    <td className="text-right px-2 py-1.5 font-mono text-terminal-muted">{order.stopLoss?.toFixed(info.digits) || '---'}</td>
                    <td className="text-right px-2 py-1.5 font-mono text-terminal-muted">{order.takeProfit?.toFixed(info.digits) || '---'}</td>
                    <td className="text-right px-2 py-1.5 font-mono text-terminal-red">{order.commission.toFixed(2)}</td>
                    <td className={`text-right px-2 py-1.5 font-mono font-medium ${order.profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(2)}
                    </td>
                    <td className="text-center px-2 py-1.5">
                      <button onClick={() => closeOrder(order.id)}
                        className="px-2 py-0.5 bg-terminal-red/20 text-terminal-red rounded text-[10px] hover:bg-terminal-red/30">
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {tab === 'pending' && (
          <div className="flex items-center justify-center h-full text-terminal-muted text-sm">
            {pending.length === 0 ? 'No pending orders' : `${pending.length} pending orders`}
          </div>
        )}
        {tab === 'account' && (
          <div className="p-4 grid grid-cols-4 gap-4">
            {[
              { label: 'Balance', value: `$${account.balance.toFixed(2)}` },
              { label: 'Equity', value: `$${account.equity.toFixed(2)}` },
              { label: 'Margin', value: `$${account.margin.toFixed(2)}` },
              { label: 'Free Margin', value: `$${account.freeMargin.toFixed(2)}` },
              { label: 'Margin Level', value: account.marginLevel > 0 ? `${account.marginLevel.toFixed(1)}%` : '---' },
              { label: 'Open P&L', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, color: totalProfit >= 0 ? 'text-terminal-green' : 'text-terminal-red' },
              { label: 'Open Orders', value: `${orders.length}` },
              { label: 'Currency', value: account.currency },
            ].map(item => (
              <div key={item.label}>
                <div className="text-[10px] text-terminal-muted uppercase">{item.label}</div>
                <div className={`text-sm font-mono font-medium ${(item as any).color || 'text-terminal-text'}`}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
