export type AssetType = 'crypto' | 'forex' | 'stock' | 'commodity';

export interface Instrument {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
  digits: number;
  pipSize: number;
  lotSize: number;
  minLot: number;
  maxLot: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop';
export type OrderStatus = 'open' | 'closed' | 'cancelled' | 'pending';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  lots: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: number;
  closeTime?: number;
  comment?: string;
}

export interface Account {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
}

export interface WatchlistItem {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
}

export interface IndicatorConfig {
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';
  period?: number;
  color?: string;
  visible: boolean;
}
