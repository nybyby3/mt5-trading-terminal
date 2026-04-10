import { Order, Account, OrderSide, OrderType } from '@/types';

const STORAGE_KEYS = {
  ORDERS: 'mt5_orders',
  ACCOUNT: 'mt5_account',
  WATCHLIST: 'mt5_watchlist',
  SETTINGS: 'mt5_settings',
};

const DEFAULT_ACCOUNT: Account = {
  balance: 10000,
  equity: 10000,
  margin: 0,
  freeMargin: 10000,
  marginLevel: 0,
  profit: 0,
  currency: 'USD',
};

const DEFAULT_WATCHLIST = [
  'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'USDJPY',
  'XAUUSD', 'AAPL', 'GOOGL', 'MSFT', 'TSLA',
];

class TradingStore {
  private static instance: TradingStore;

  static getInstance(): TradingStore {
    if (!TradingStore.instance) {
      TradingStore.instance = new TradingStore();
    }
    return TradingStore.instance;
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem(key: string, value: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  getAccount(): Account {
    return this.getItem(STORAGE_KEYS.ACCOUNT, DEFAULT_ACCOUNT);
  }

  updateAccount(account: Partial<Account>) {
    const current = this.getAccount();
    this.setItem(STORAGE_KEYS.ACCOUNT, { ...current, ...account });
  }

  getOrders(): Order[] {
    return this.getItem(STORAGE_KEYS.ORDERS, []);
  }

  getOpenOrders(): Order[] {
    return this.getOrders().filter(o => o.status === 'open');
  }

  getPendingOrders(): Order[] {
    return this.getOrders().filter(o => o.status === 'pending');
  }

  getClosedOrders(): Order[] {
    return this.getOrders().filter(o => o.status === 'closed' || o.status === 'cancelled');
  }

  openOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    lots: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }): Order {
    const orders = this.getOrders();
    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      status: params.type === 'market' ? 'open' : 'pending',
      lots: params.lots,
      openPrice: params.price,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      profit: 0,
      swap: 0,
      commission: -(params.lots * 3.5),
      openTime: Date.now(),
      comment: params.comment,
    };
    orders.push(order);
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    // Update margin
    const account = this.getAccount();
    const marginRequired = params.lots * params.price * 100 * 0.01; // 1:100 leverage
    account.margin += marginRequired;
    account.freeMargin = account.equity - account.margin;
    account.marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;
    this.updateAccount(account);

    return order;
  }

  closeOrder(orderId: string, closePrice: number): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    const priceDiff = order.side === 'buy'
      ? closePrice - order.openPrice
      : order.openPrice - closePrice;
    const profit = priceDiff * order.lots * 100000; // Standard lot

    order.closePrice = closePrice;
    order.profit = +profit.toFixed(2);
    order.status = 'closed';
    order.closeTime = Date.now();
    orders[idx] = order;
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    // Update account
    const account = this.getAccount();
    account.balance += order.profit + order.commission;
    const marginRelease = order.lots * order.openPrice * 100 * 0.01;
    account.margin = Math.max(0, account.margin - marginRelease);
    account.equity = account.balance + this.calculateOpenProfit();
    account.freeMargin = account.equity - account.margin;
    account.marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;
    account.profit = this.calculateOpenProfit();
    this.updateAccount(account);

    return order;
  }

  calculateOpenProfit(): number {
    return this.getOpenOrders().reduce((sum, o) => sum + o.profit, 0);
  }

  updateOrderProfit(orderId: string, currentPrice: number) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return;
    const order = orders[idx];
    if (order.status !== 'open') return;
    const priceDiff = order.side === 'buy'
      ? currentPrice - order.openPrice
      : order.openPrice - currentPrice;
    order.profit = +(priceDiff * order.lots * 100000).toFixed(2);
    orders[idx] = order;
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  getWatchlist(): string[] {
    return this.getItem(STORAGE_KEYS.WATCHLIST, DEFAULT_WATCHLIST);
  }

  addToWatchlist(symbol: string) {
    const wl = this.getWatchlist();
    if (!wl.includes(symbol)) {
      wl.push(symbol);
      this.setItem(STORAGE_KEYS.WATCHLIST, wl);
    }
  }

  removeFromWatchlist(symbol: string) {
    const wl = this.getWatchlist().filter(s => s !== symbol);
    this.setItem(STORAGE_KEYS.WATCHLIST, wl);
  }

  resetAccount() {
    this.setItem(STORAGE_KEYS.ACCOUNT, DEFAULT_ACCOUNT);
    this.setItem(STORAGE_KEYS.ORDERS, []);
  }
}

export const tradingStore = TradingStore.getInstance();
