'use client';

import { useState } from 'react';
import TradingChart from '@/components/TradingChart';
import OrderPanel from '@/components/OrderPanel';
import Watchlist from '@/components/Watchlist';
import PositionsPanel from '@/components/PositionsPanel';

export default function TradePage() {
  const [symbol, setSymbol] = useState('BTCUSD');
  const [orderRefresh, setOrderRefresh] = useState(0);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Watchlist onSelectSymbol={setSymbol} activeSymbol={symbol} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-terminal-header border-b border-terminal-border flex items-center gap-2">
            <span className="font-mono font-bold text-sm">{symbol}</span>
            <span className="text-xs text-terminal-muted">{symbol.includes('USD') ? 'USD' : ''}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TradingChart symbol={symbol} />
          </div>
        </div>
        <OrderPanel symbol={symbol} onOrderPlaced={() => setOrderRefresh(k => k + 1)} />
      </div>
      <PositionsPanel refreshKey={orderRefresh} />
    </div>
  );
}
