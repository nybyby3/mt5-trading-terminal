import { Candle } from '@/types';

export function calcSMA(candles: Candle[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

export function calcEMA(candles: Candle[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  result.push({ time: candles[period - 1].time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
    result.push({ time: candles[i].time, value: ema });
  }
  return result;
}

export function calcRSI(candles: Candle[], period: number = 14): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (candles.length < period + 1) return result;
  const changes = candles.map((c, i) => i === 0 ? 0 : c.close - candles[i - 1].close);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: candles[period].time, value: 100 - (100 / (1 + rs)) });
  for (let i = period + 1; i < candles.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: candles[i].time, value: 100 - (100 / (1 + rs)) });
  }
  return result;
}

export function calcMACD(candles: Candle[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(candles, fast);
  const emaSlow = calcEMA(candles, slow);
  const offset = slow - fast;
  const macdLine: { time: number; value: number }[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push({
      time: emaSlow[i].time,
      value: emaFast[i + offset].value - emaSlow[i].value,
    });
  }
  const signalLine: { time: number; value: number }[] = [];
  if (macdLine.length >= signal) {
    const mult = 2 / (signal + 1);
    let ema = macdLine.slice(0, signal).reduce((s, v) => s + v.value, 0) / signal;
    signalLine.push({ time: macdLine[signal - 1].time, value: ema });
    for (let i = signal; i < macdLine.length; i++) {
      ema = (macdLine[i].value - ema) * mult + ema;
      signalLine.push({ time: macdLine[i].time, value: ema });
    }
  }
  const histogram: { time: number; value: number; color: string }[] = [];
  const signalOffset = macdLine.length - signalLine.length;
  for (let i = 0; i < signalLine.length; i++) {
    const val = macdLine[i + signalOffset].value - signalLine[i].value;
    histogram.push({
      time: signalLine[i].time,
      value: val,
      color: val >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)',
    });
  }
  return { macdLine, signalLine, histogram };
}

export function calcBollinger(candles: Candle[], period = 20, stdDev = 2) {
  const middle = calcSMA(candles, period);
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = 0; i < middle.length; i++) {
    const idx = i + period - 1;
    let sumSq = 0;
    for (let j = idx - period + 1; j <= idx; j++) {
      sumSq += Math.pow(candles[j].close - middle[i].value, 2);
    }
    const std = Math.sqrt(sumSq / period);
    upper.push({ time: middle[i].time, value: middle[i].value + stdDev * std });
    lower.push({ time: middle[i].time, value: middle[i].value - stdDev * std });
  }
  return { middle, upper, lower };
}
