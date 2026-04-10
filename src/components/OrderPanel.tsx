'use client';

import { useState, useEffect } from 'react';
import { OrderSide, OrderType, Tick } from '@/types';
import { tradingStore } from '@/lib/store';
import { fetchBinanceTicker, getInstrumentInfo } from '@/lib/api';

interface Props {
  symbol: string;
  onOrderPlaced?: () => void;
}

export default function OrderPanel({ symbol, onOrderPlaced }: Props) {
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [lots, setLots] = useState(0.01);
  const [price, setPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [tick, setTick] = useState<Tick | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let running = true;
    async function updateTick() {
      const t = await fetchBinanceTicker(symbol);
      if (running && t) {
        setTick(t);
        if (orderType === 'market') setPrice(side === 'buy' ? t.ask : t.bid);
      }
    }
    updateTick();
    const interval = setInterval(updateTick, 2000);
    return () => { running = false; clearInterval(interval); };
  }, [symbol, side, orderType]);

  const info = getInstrumentInfo(symbol);
  const account = tradingStore.getAccount();
  const spread = tick ? Math.abs(tick.ask - tick.bid) : 0;

  const handleSubmit = () => {
    if (!tick || lots <= 0) return;
    const execPrice = side === 'buy' ? tick.ask : tick.bid;
    try {
      tradingStore.openOrder({
        symbol,
        side,
        type: orderType,
        lots,
        price: orderType === 'market' ? execPrice : price,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
      setMessage(`${side.toUpperCase()} ${lots} ${symbol} @ ${execPrice.toFixed(info.digits)}`);
      setTimeout(() => setMessage(''), 3000);
      onOrderPlaced?.();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  return (
    <div className="bg-terminal-panel border-l border-terminal-border flex flex-col h-full" style={{ width: 280 }}>
      <div className="px-3 py-2 border-b border-terminal-border">
        <div className="text-sm font-bold">{info.name}</div>
        <div className="text-xs text-terminal-muted">{info.exchange} | Spread: {spread.toFixed(info.digits)}</div>
      </div>
      {/* Bid/Ask */}
      <div className="grid grid-cols-2 gap-0 border-b border-terminal-border">
        <button onClick={() => setSide('sell')}
          className={`py-3 text-center transition-colors ${side === 'sell' ? 'bg-terminal-red/20' : 'hover:bg-terminal-hover'}`}>
          <div className="text-xs text-terminal-muted">SELL</div>
          <div className={`text-lg font-mono font-bold ${side === 'sell' ? 'text-terminal-red' : 'text-terminal-muted'}`}>
            {tick?.bid.toFixed(info.digits) || '---'}
          </div>
        </button>
        <button onClick={() => setSide('buy')}
          className={`py-3 text-center transition-colors border-l border-terminal-border ${side === 'buy' ? 'bg-terminal-green/20' : 'hover:bg-terminal-hover'}`}>
          <div className="text-xs text-terminal-muted">BUY</div>
          <div className={`text-lg font-mono font-bold ${side === 'buy' ? 'text-terminal-green' : 'text-terminal-muted'}`}>
            {tick?.ask.toFixed(info.digits) || '---'}
          </div>
        </button>
      </div>
      {/* Order Form */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <label className="text-xs text-terminal-muted block mb-1">Order Type</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}
            className="w-full bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-sm focus:border-terminal-accent outline-none">
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-terminal-muted block mb-1">Volume (lots)</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setLots(Math.max(0.01, lots - 0.01))} className="px-2 py-1.5 bg-terminal-bg border border-terminal-border rounded text-sm hover:bg-terminal-hover">-</button>
            <input type="number" value={lots} onChange={e => setLots(parseFloat(e.target.value) || 0.01)} step={0.01} min={0.01}
              className="flex-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-sm text-center font-mono focus:border-terminal-accent outline-none" />
            <button onClick={() => setLots(+(lots + 0.01).toFixed(2))} className="px-2 py-1.5 bg-terminal-bg border border-terminal-border rounded text-sm hover:bg-terminal-hover">+</button>
          </div>
          <div className="flex gap-1 mt-1">
            {[0.01, 0.05, 0.1, 0.5, 1.0].map(v => (
              <button key={v} onClick={() => setLots(v)}
                className={`flex-1 py-1 text-xs rounded ${lots === v ? 'bg-terminal-accent/20 text-terminal-accent' : 'bg-terminal-bg border border-terminal-border text-terminal-muted hover:text-terminal-text'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        {orderType !== 'market' && (
          <div>
            <label className="text-xs text-terminal-muted block mb-1">Price</label>
            <input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value))} step={0.00001}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-sm font-mono focus:border-terminal-accent outline-none" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-terminal-muted block mb-1">Stop Loss</label>
            <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="---"
              className="w-full bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-sm font-mono focus:border-terminal-accent outline-none" />
          </div>
          <div>
            <label className="text-xs text-terminal-muted block mb-1">Take Profit</label>
            <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="---"
              className="w-full bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-sm font-mono focus:border-terminal-accent outline-none" />
          </div>
        </div>
        {/* Submit */}
        <button onClick={handleSubmit}
          className={`w-full py-3 rounded font-bold text-sm text-white transition-colors ${
            side === 'buy' ? 'bg-terminal-green hover:bg-green-600' : 'bg-terminal-red hover:bg-red-600'
          }`}>
          {side === 'buy' ? 'BUY' : 'SELL'} {lots} {symbol}
        </button>
        {message && (
          <div className={`text-xs p-2 rounded ${message.startsWith('Error') ? 'bg-red-900/30 text-terminal-red' : 'bg-green-900/30 text-terminal-green'}`}>
            {message}
          </div>
        )}
        {/* Account Info */}
        <div className="border-t border-terminal-border pt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-terminal-muted">Balance</span>
            <span className="font-mono">${account.balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-muted">Equity</span>
            <span className="font-mono">${account.equity.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-muted">Free Margin</span>
            <span className="font-mono">${account.freeMargin.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
