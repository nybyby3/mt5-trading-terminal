'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CandlestickData, LineData, HistogramData, Time } from 'lightweight-charts';
import { Candle, Timeframe } from '@/types';
import { fetchBinanceCandles } from '@/lib/api';
import { calcSMA, calcEMA, calcRSI, calcMACD, calcBollinger } from '@/lib/indicators';

interface Props {
  symbol: string;
  onTimeframeChange?: (tf: Timeframe) => void;
}

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1M', value: '1m' },
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

const INDICATORS = ['SMA 20', 'EMA 50', 'Bollinger', 'RSI', 'MACD'];

export default function TradingChart({ symbol, onTimeframeChange }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['SMA 20']);
  const [crosshairData, setCrosshairData] = useState<any>(null);
  const [candles, setCandles] = useState<Candle[]>([]);

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;
    // Cleanup
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; }
    indicatorSeriesRefs.current = [];

    const showRSI = activeIndicators.includes('RSI');
    const showMACD = activeIndicators.includes('MACD');
    const subChartHeight = (showRSI || showMACD) ? 120 : 0;
    const container = chartContainerRef.current;
    const height = container.clientHeight - subChartHeight;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: Math.max(height, 200),
      layout: { background: { type: ColorType.Solid, color: '#0d1117' }, textColor: '#8b949e', fontSize: 11 },
      grid: { vertLines: { color: '#1c2128' }, horzLines: { color: '#1c2128' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#30363d', scaleMargins: { top: 0.1, bottom: 0.2 } },
      timeScale: { borderColor: '#30363d', timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candleSeries) as any;
        if (data) setCrosshairData(data);
      }
    });

    // RSI sub-chart
    if (showRSI && rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        width: container.clientWidth,
        height: 100,
        layout: { background: { type: ColorType.Solid, color: '#0d1117' }, textColor: '#8b949e', fontSize: 10 },
        grid: { vertLines: { color: '#1c2128' }, horzLines: { color: '#1c2128' } },
        rightPriceScale: { borderColor: '#30363d' },
        timeScale: { borderColor: '#30363d', visible: false },
      });
      rsiChartRef.current = rsiChart;
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) rsiChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const w = chartContainerRef.current.clientWidth;
        chartRef.current.applyOptions({ width: w });
        if (rsiChartRef.current) rsiChartRef.current.applyOptions({ width: w });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndicators]);

  useEffect(() => {
    const cleanup = initChart();
    return () => { cleanup?.(); };
  }, [initChart]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const data = await fetchBinanceCandles(symbol, timeframe, 300);
      if (cancelled || !candleSeriesRef.current) return;
      setCandles(data);
      const chartData: CandlestickData[] = data.map(c => ({
        time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
      }));
      candleSeriesRef.current.setData(chartData);

      if (volumeSeriesRef.current) {
        const volData: HistogramData[] = data.map(c => ({
          time: c.time as Time, value: c.volume,
          color: c.close >= c.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
        }));
        volumeSeriesRef.current.setData(volData);
      }

      // Remove old indicator series
      indicatorSeriesRefs.current.forEach(s => {
        try { chartRef.current?.removeSeries(s); } catch {}
      });
      indicatorSeriesRefs.current = [];

      // Add indicators
      if (activeIndicators.includes('SMA 20') && chartRef.current) {
        const smaData = calcSMA(data, 20);
        const series = chartRef.current.addLineSeries({ color: '#f0b429', lineWidth: 1 });
        series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRefs.current.push(series);
      }
      if (activeIndicators.includes('EMA 50') && chartRef.current) {
        const emaData = calcEMA(data, 50);
        const series = chartRef.current.addLineSeries({ color: '#818cf8', lineWidth: 1 });
        series.setData(emaData.map(d => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRefs.current.push(series);
      }
      if (activeIndicators.includes('Bollinger') && chartRef.current) {
        const bb = calcBollinger(data, 20, 2);
        const upperS = chartRef.current.addLineSeries({ color: 'rgba(96,165,250,0.5)', lineWidth: 1 });
        upperS.setData(bb.upper.map(d => ({ time: d.time as Time, value: d.value })));
        const middleS = chartRef.current.addLineSeries({ color: 'rgba(96,165,250,0.3)', lineWidth: 1, lineStyle: 2 });
        middleS.setData(bb.middle.map(d => ({ time: d.time as Time, value: d.value })));
        const lowerS = chartRef.current.addLineSeries({ color: 'rgba(96,165,250,0.5)', lineWidth: 1 });
        lowerS.setData(bb.lower.map(d => ({ time: d.time as Time, value: d.value })));
        indicatorSeriesRefs.current.push(upperS, middleS, lowerS);
      }
      if (activeIndicators.includes('RSI') && rsiChartRef.current) {
        const rsiData = calcRSI(data, 14);
        const rsiSeries = rsiChartRef.current.addLineSeries({ color: '#c084fc', lineWidth: 1 });
        rsiSeries.setData(rsiData.map(d => ({ time: d.time as Time, value: d.value })));
        // Add 70/30 lines
        const line70 = rsiChartRef.current.addLineSeries({ color: 'rgba(239,83,80,0.3)', lineWidth: 1, lineStyle: 2 });
        line70.setData(rsiData.map(d => ({ time: d.time as Time, value: 70 })));
        const line30 = rsiChartRef.current.addLineSeries({ color: 'rgba(38,166,154,0.3)', lineWidth: 1, lineStyle: 2 });
        line30.setData(rsiData.map(d => ({ time: d.time as Time, value: 30 })));
      }

      chartRef.current?.timeScale().fitContent();
    }
    loadData();
    return () => { cancelled = true; };
  }, [symbol, timeframe, activeIndicators]);

  const toggleIndicator = (ind: string) => {
    setActiveIndicators(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-terminal-border bg-terminal-panel">
        <div className="flex items-center gap-0.5 mr-3">
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => { setTimeframe(tf.value); onTimeframeChange?.(tf.value); }}
              className={`px-2 py-1 text-xs rounded ${timeframe === tf.value ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'}`}>
              {tf.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-terminal-border mx-1"></div>
        <div className="flex items-center gap-0.5">
          {INDICATORS.map(ind => (
            <button key={ind} onClick={() => toggleIndicator(ind)}
              className={`px-2 py-1 text-xs rounded ${activeIndicators.includes(ind) ? 'bg-terminal-accent/20 text-terminal-accent' : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'}`}>
              {ind}
            </button>
          ))}
        </div>
        {/* OHLCV display */}
        {crosshairData && (
          <div className="ml-auto flex items-center gap-3 text-xs font-mono">
            <span className="text-terminal-muted">O: <span className="text-terminal-text">{crosshairData.open?.toFixed(2)}</span></span>
            <span className="text-terminal-muted">H: <span className="text-terminal-green">{crosshairData.high?.toFixed(2)}</span></span>
            <span className="text-terminal-muted">L: <span className="text-terminal-red">{crosshairData.low?.toFixed(2)}</span></span>
            <span className="text-terminal-muted">C: <span className="text-terminal-text">{crosshairData.close?.toFixed(2)}</span></span>
          </div>
        )}
      </div>
      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1 relative" />
      {/* RSI sub-chart */}
      {activeIndicators.includes('RSI') && (
        <div className="border-t border-terminal-border">
          <div className="text-xs text-terminal-muted px-2 py-0.5 bg-terminal-panel">RSI(14)</div>
          <div ref={rsiContainerRef} style={{ height: 100 }} />
        </div>
      )}
    </div>
  );
}
