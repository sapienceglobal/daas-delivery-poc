'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, ArrowLeft, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI, aiAPI } from '@/lib/api';
import { GlassCard, StatCard, Skeleton, showToast, Button } from '@/components/ui';
import { downloadCSV } from '@/lib/exportUtils';

export default function AnalyticsDashboard() {
  const { user, isMerchant, isAuthenticated } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  // AI Prediction State
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant) { router.push('/customer'); return; }
    loadAnalytics();
  }, [isAuthenticated, isMerchant, days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getSalesAnalytics(user.restaurantId, days);
      setData(res.data);
    } catch (err) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMaxRevenue = () => {
    if (!data?.dailyStats?.length) return 100;
    const max = Math.max(...data.dailyStats.map(d => d.revenue));
    return max > 0 ? max : 100;
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.predictSales(user.restaurantId);
      setAiPrediction(res.data);
      showToast('AI Forecast generated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate forecast', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !data) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/merchant')} className="p-2 rounded-xl bg-brand-card border border-brand-border hover:text-brand-cyan transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-brand-cyan" />
              Advanced Analytics
            </h1>
            <p className="text-sm text-brand-muted mt-1">Track your performance and sales trends.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-brand-bg/50 border border-brand-border rounded-xl p-1">
          <Button variant="outline" size="sm" onClick={() => {
            if (!data?.dailyStats) return;
            const exportData = data.dailyStats.map(d => ({
              Date: new Date(d.date).toLocaleDateString(),
              Revenue: d.revenue.toFixed(2),
              Orders: d.orders
            }));
            downloadCSV(exportData, `analytics_${days}days.csv`);
          }}>
            Export CSV
          </Button>
          <div className="w-px h-6 bg-brand-border mx-1" />
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                days === d ? 'bg-brand-cyan text-brand-bg shadow-lg shadow-brand-cyan/20' : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-24 h-24 text-brand-green" />
              </div>
              <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-2">Total Revenue</h3>
              <p className="text-4xl font-black text-brand-text mb-1">${data.summary.totalRevenue.toFixed(2)}</p>
              <div className="flex items-center text-xs font-bold text-brand-green">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +12% from previous period
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag className="w-24 h-24 text-brand-cyan" />
              </div>
              <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-2">Total Orders</h3>
              <p className="text-4xl font-black text-brand-text mb-1">{data.summary.totalOrders}</p>
              <div className="flex items-center text-xs font-bold text-brand-green">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +5% from previous period
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-brand-yellow" />
              </div>
              <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-2">Avg Order Value</h3>
              <p className="text-4xl font-black text-brand-text mb-1">${data.summary.aov.toFixed(2)}</p>
              <div className="flex items-center text-xs font-bold text-brand-muted">
                Based on {days} days data
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <GlassCard className="col-span-1 lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-brand-text flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-cyan" /> Revenue Trend
                </h2>
                <div className="text-xs text-brand-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {days} Day History
                </div>
              </div>
              
              <div className="relative flex-1 flex items-end gap-1 sm:gap-2 h-64 mt-auto">
                {/* Y-axis guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[1, 0.75, 0.5, 0.25, 0].map((step, i) => (
                    <div key={i} className="flex items-center w-full border-b border-brand-border/30 h-0 relative">
                      <span className="absolute -left-2 -translate-x-full text-[10px] text-brand-muted">
                        ${Math.round(getMaxRevenue() * step)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                <div className="absolute inset-0 pl-8 flex items-end gap-[2px] sm:gap-2 z-10 pt-2">
                  {data.dailyStats.map((stat, i) => {
                    const height = (stat.revenue / getMaxRevenue()) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-card border border-brand-border rounded-lg px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                          <p className="font-bold text-brand-text">${stat.revenue.toFixed(2)}</p>
                          <p className="text-brand-muted">{new Date(stat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        </div>
                        {/* Bar */}
                        <div 
                          className="w-full bg-gradient-to-t from-brand-cyan/20 to-brand-cyan/60 rounded-t-sm group-hover:from-brand-cyan/40 group-hover:to-brand-cyan transition-all duration-500 ease-out min-h-[1px]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between pl-8 mt-3 text-[10px] text-brand-muted">
                <span>{new Date(data.dailyStats[0]?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(data.dailyStats[Math.floor(data.dailyStats.length/2)]?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(data.dailyStats[data.dailyStats.length - 1]?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </GlassCard>

            {/* Top Items */}
            <GlassCard className="col-span-1 flex flex-col h-full">
              <h2 className="font-bold text-brand-text flex items-center gap-2 mb-6">
                <ShoppingBag className="h-4 w-4 text-brand-yellow" /> Top Selling Items
              </h2>
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {data.topItems.length === 0 ? (
                  <p className="text-sm text-brand-muted text-center py-8">No items sold in this period.</p>
                ) : (
                  data.topItems.map((item, idx) => {
                    const maxSold = data.topItems[0].quantitySold;
                    const fillWidth = (item.quantitySold / maxSold) * 100;
                    return (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-1 relative z-10 px-1">
                          <span className="text-sm font-bold text-brand-text truncate pr-2">{item._id}</span>
                          <span className="text-xs font-black text-brand-cyan whitespace-nowrap">{item.quantitySold} sold</span>
                        </div>
                        <div className="h-2 w-full bg-brand-bg/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-yellow to-brand-cyan rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${fillWidth}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-brand-muted mt-1 px-1">
                          Generated ${item.revenueGenerated.toFixed(2)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>

          {/* AI Sales Prediction Section */}
          <GlassCard className="mt-6 border border-brand-cyan/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-brand-cyan flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> AI Sales Forecast
                </h2>
                <p className="text-sm text-brand-muted mt-1">Predictive analytics powered by GPT-4o-mini</p>
              </div>
              <Button onClick={handleGenerateAI} icon={Sparkles} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'Generate Forecast'}
              </Button>
            </div>
            
            {aiPrediction && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                  <h4 className="text-sm font-bold text-brand-text mb-2">AI Insight</h4>
                  <p className="text-sm text-brand-cyan leading-relaxed">{aiPrediction.insight}</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                  {aiPrediction.predictions.map(p => (
                    <div key={p.day} className="p-3 rounded-xl bg-brand-bg/40 border border-brand-border text-center">
                      <p className="text-[10px] uppercase font-bold text-brand-muted mb-1">Day {p.day}</p>
                      <p className="text-lg font-black text-brand-text">${p.predictedRevenue.toFixed(2)}</p>
                      <p className="text-xs text-brand-muted mt-1">{p.predictedOrders} orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
