import { Candle, Tick, Timeframe } from '@/types';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

// Binance symbols mapping
const BINANCE_SYMBOLS: Record<string, string> = {
  'BTCUSD': 'BTCUSDT',
  'ETHUSD': 'ETHUSDT',
  'BNBUSD': 'BNBUSDT',
  'SOLUSD': 'SOLUSDT',
  'XRPUSD': 'XRPUSDT',
  'ADAUSD': 'ADAUSDT',
  'DOGEUSD': 'DOGEUSDT',
  'DOTUSD': 'DOTUSDT',
  'AVAXUSD': 'AVAXUSDT',
  'LINKUSD': 'LINKUSDT',
};

// Forex simulation based on real-ish data
const FOREX_BASE_PRICES: Record<string, { bid: number; digits: number }> = {
  'EURUSD': { bid: 1.0865, digits: 5 },
  'GBPUSD': { bid: 1.2710, digits: 5 },
  'USDJPY': { bid: 151.50, digits: 3 },
  'USDCHF': { bid: 0.8820, digits: 5 },
  'AUDUSD': { bid: 0.6540, digits: 5 },
  'USDCAD': { bid: 1.3580, digits: 5 },
  'NZDUSD': { bid: 0.6085, digits: 5 },
  'EURGBP': { bid: 0.8548, digits: 5 },
  'EURJPY': { bid: 164.60, digits: 3 },
  'GBPJPY': { bid: 192.55, digits: 3 },
};

const STOCK_BASE_PRICES: Record<string, { price: number; name: string }> = {
  'AAPL': { price: 178.50, name: 'Apple Inc.' },
  'GOOGL': { price: 141.80, name: 'Alphabet Inc.' },
  'MSFT': { price: 415.20, name: 'Microsoft Corp.' },
  'AMZN': { price: 178.90, name: 'Amazon.com Inc.' },
  'TSLA': { price: 245.60, name: 'Tesla Inc.' },
  'NVDA': { price: 875.30, name: 'NVIDIA Corp.' },
  'META': { price: 505.40, name: 'Meta Platforms' },
  'JPM': { price: 198.70, name: 'JPMorgan Chase' },
};

const COMMODITY_BASE_PRICES: Record<string, { price: number; name: string }> = {
  'XAUUSD': { price: 2345.50, name: 'Gold' },
  'XAGUSD': { price: 27.85, name: 'Silver' },
  'WTIUSD': { price: 78.40, name: 'Crude Oil WTI' },
  'BRNUSD': { price: 82.15, name: 'Brent Crude' },
};

// Random walk for simulated prices
let forexPrices: Record<string, number> = {};
let stockPrices: Record<string, number> = {};
let commodityPrices: Record<string, number> = {};

function initSimPrices() {
  Object.entries(FOREX_BASE_PRICES).forEach(([sym, data]) => {
    forexPrices[sym] = data.bid;
  });
  Object.entries(STOCK_BASE_PRICES).forEach(([sym, data]) => {
    stockPrices[sym] = data.price;
  });
  Object.entries(COMMODITY_BASE_PRICES).forEach(([sym, data]) => {
    commodityPrices[sym] = data.price;
  });
}
initSimPrices();

function randomWalk(price: number, volatility: number): number {
  const change = (Math.random() - 0.5) * 2 * volatility * price;
  return price + change;
}

export function getSimulatedTick(symbol: string): Tick | null {
  if (FOREX_BASE_PRICES[symbol]) {
    const vol = 0.0001;
    forexPrices[symbol] = randomWalk(forexPrices[symbol], vol);
    const bid = forexPrices[symbol];
    const spread = FOREX_BASE_PRICES[symbol].digits === 3 ? 0.02 : 0.00015;
    const ask = bid + spread;
    const base = FOREX_BASE_PRICES[symbol].bid;
    return {
      symbol, bid, ask, last: bid, volume: Math.random() * 1000000,
      change: bid - base,
      changePercent: ((bid - base) / base) * 100,
      high24h: bid * 1.002, low24h: bid * 0.998,
      timestamp: Date.now(),
    };
  }
  if (STOCK_BASE_PRICES[symbol]) {
    const vol = 0.0005;
    stockPrices[symbol] = randomWalk(stockPrices[symbol], vol);
    const price = stockPrices[symbol];
    const base = STOCK_BASE_PRICES[symbol].price;
    return {
      symbol, bid: price, ask: price + 0.01, last: price, volume: Math.random() * 5000000,
      change: price - base,
      changePercent: ((price - base) / base) * 100,
      high24h: price * 1.01, low24h: price * 0.99,
      timestamp: Date.now(),
    };
  }
  if (COMMODITY_BASE_PRICES[symbol]) {
    const vol = 0.0003;
    commodityPrices[symbol] = randomWalk(commodityPrices[symbol], vol);
    const price = commodityPrices[symbol];
    const base = COMMODITY_BASE_PRICES[symbol].price;
    return {
      symbol, bid: price, ask: price + 0.05, last: price, volume: Math.random() * 500000,
      change: price - base,
      changePercent: ((price - base) / base) * 100,
      high24h: price * 1.005, low24h: price * 0.995,
      timestamp: Date.now(),
    };
  }
  return null;
}

export function generateSimulatedCandles(symbol: string, tf: Timeframe, count: number = 200): Candle[] {
  let basePrice = 100;
  if (FOREX_BASE_PRICES[symbol]) basePrice = FOREX_BASE_PRICES[symbol].bid;
  else if (STOCK_BASE_PRICES[symbol]) basePrice = STOCK_BASE_PRICES[symbol].price;
  else if (COMMODITY_BASE_PRICES[symbol]) basePrice = COMMODITY_BASE_PRICES[symbol].price;

  const tfMinutes: Record<Timeframe, number> = {
    '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440, '1w': 10080,
  };
  const interval = tfMinutes[tf] * 60 * 1000;
  const now = Date.now();
  const candles: Candle[] = [];
  let price = basePrice * (0.95 + Math.random() * 0.1);

  for (let i = count; i > 0; i--) {
    const vol = basePrice * 0.003;
    const open = price;
    const close = open + (Math.random() - 0.48) * vol;
    const high = Math.max(open, close) + Math.random() * vol * 0.5;
    const low = Math.min(open, close) - Math.random() * vol * 0.5;
    candles.push({
      time: Math.floor((now - i * interval) / 1000),
      open: +open.toFixed(5),
      high: +high.toFixed(5),
      low: +low.toFixed(5),
      close: +close.toFixed(5),
      volume: Math.floor(Math.random() * 100000),
    });
    price = close;
  }
  return candles;
}

export async function fetchBinanceCandles(
  symbol: string, tf: Timeframe, limit: number = 200
): Promise<Candle[]> {
  const binSymbol = BINANCE_SYMBOLS[symbol];
  if (!binSymbol) return generateSimulatedCandles(symbol, tf, limit);

  try {
    const res = await fetch(
      `${BINANCE_BASE}/klines?symbol=${binSymbol}&interval=${TIMEFRAME_MAP[tf]}&limit=${limit}`
    );
    if (!res.ok) throw new Error('Binance API error');
    const data = await res.json();
    return data.map((d: any[]) => ({
      time: Math.floor(d[0] / 1000),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch {
    return generateSimulatedCandles(symbol, tf, limit);
  }
}

export async function fetchBinanceTicker(symbol: string): Promise<Tick | null> {
  const binSymbol = BINANCE_SYMBOLS[symbol];
  if (!binSymbol) return getSimulatedTick(symbol);

  try {
    const res = await fetch(`${BINANCE_BASE}/ticker/24hr?symbol=${binSymbol}`);
    if (!res.ok) throw new Error('Binance ticker error');
    const d = await res.json();
    return {
      symbol,
      bid: parseFloat(d.bidPrice),
      ask: parseFloat(d.askPrice),
      last: parseFloat(d.lastPrice),
      volume: parseFloat(d.volume),
      change: parseFloat(d.priceChange),
      changePercent: parseFloat(d.priceChangePercent),
      high24h: parseFloat(d.highPrice),
      low24h: parseFloat(d.lowPrice),
      timestamp: d.closeTime,
    };
  } catch {
    return getSimulatedTick(symbol);
  }
}

export async function fetchAllTickers(): Promise<Tick[]> {
  const ticks: Tick[] = [];
  // Fetch crypto from Binance
  const cryptoSymbols = Object.keys(BINANCE_SYMBOLS);
  try {
    const res = await fetch(`${BINANCE_BASE}/ticker/24hr`);
    if (res.ok) {
      const data = await res.json();
      const binMap = new Map(data.map((d: any) => [d.symbol, d]));
      for (const sym of cryptoSymbols) {
        const bin = BINANCE_SYMBOLS[sym];
        const d: any = binMap.get(bin);
        if (d) {
          ticks.push({
            symbol: sym,
            bid: parseFloat(d.bidPrice),
            ask: parseFloat(d.askPrice),
            last: parseFloat(d.lastPrice),
            volume: parseFloat(d.volume),
            change: parseFloat(d.priceChange),
            changePercent: parseFloat(d.priceChangePercent),
            high24h: parseFloat(d.highPrice),
            low24h: parseFloat(d.lowPrice),
            timestamp: d.closeTime,
          });
        }
      }
    }
  } catch {
    for (const sym of cryptoSymbols) {
      const t = getSimulatedTick(sym);
      if (t) ticks.push(t);
    }
  }
  // Simulated forex, stocks, commodities
  for (const sym of Object.keys(FOREX_BASE_PRICES)) {
    const t = getSimulatedTick(sym);
    if (t) ticks.push(t);
  }
  for (const sym of Object.keys(STOCK_BASE_PRICES)) {
    const t = getSimulatedTick(sym);
    if (t) ticks.push(t);
  }
  for (const sym of Object.keys(COMMODITY_BASE_PRICES)) {
    const t = getSimulatedTick(sym);
    if (t) ticks.push(t);
  }
  return ticks;
}

export function getInstrumentInfo(symbol: string) {
  if (BINANCE_SYMBOLS[symbol]) {
    const name = symbol.replace('USD', '') + '/USD';
    return { name, type: 'crypto' as const, exchange: 'Binance', digits: 2 };
  }
  if (FOREX_BASE_PRICES[symbol]) {
    const name = symbol.slice(0, 3) + '/' + symbol.slice(3);
    return { name, type: 'forex' as const, exchange: 'Forex', digits: FOREX_BASE_PRICES[symbol].digits };
  }
  if (STOCK_BASE_PRICES[symbol]) {
    return { name: STOCK_BASE_PRICES[symbol].name, type: 'stock' as const, exchange: 'NASDAQ', digits: 2 };
  }
  if (COMMODITY_BASE_PRICES[symbol]) {
    return { name: COMMODITY_BASE_PRICES[symbol].name, type: 'commodity' as const, exchange: 'COMEX', digits: 2 };
  }
  return { name: symbol, type: 'crypto' as const, exchange: 'Unknown', digits: 2 };
}

export function getAllSymbols() {
  return {
    crypto: Object.keys(BINANCE_SYMBOLS),
    forex: Object.keys(FOREX_BASE_PRICES),
    stocks: Object.keys(STOCK_BASE_PRICES),
    commodities: Object.keys(COMMODITY_BASE_PRICES),
  };
}
