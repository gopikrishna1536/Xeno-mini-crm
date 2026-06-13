'use client';
import { useEffect, useState } from 'react';
import { Users, Megaphone, TrendingUp, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCustomerStats, getOverviewAnalytics, getCampaigns, suggestCampaigns } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-slate-900" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    Promise.all([getCustomerStats(), getOverviewAnalytics(), getCampaigns()])
      .then(([s, o, c]) => {
        setStats(s.data);
        setOverview(o.data);
        setCampaigns(c.data.slice(0, 5));
      })
      .catch(console.error);
  }, []);

  const handleGetSuggestions = async () => {
    if (!stats) return;
    setLoadingSuggestions(true);
    try {
      const res = await suggestCampaigns(stats);
      setSuggestions(res.data.suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const channelData = [
    { name: 'WhatsApp', value: overview?.total_messages_sent || 0, color: '#22c55e' },
    { name: 'SMS', value: Math.floor((overview?.total_messages_sent || 0) * 0.3), color: '#3b82f6' },
    { name: 'Email', value: Math.floor((overview?.total_messages_sent || 0) * 0.2), color: '#a855f7' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your CRM activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Customers" value={stats?.total?.toLocaleString() || '—'} sub={`${stats?.active || 0} active`} icon={Users} color="bg-blue-600" />
        <StatCard label="At Risk" value={stats?.atRisk || '—'} sub="31–90 days inactive" icon={AlertTriangle} color="bg-amber-600" />
        <StatCard label="Campaigns Sent" value={overview?.total_campaigns || '—'} sub={`${overview?.active_campaigns || 0} active`} icon={Megaphone} color="bg-brand-600" />
        <StatCard label="Avg Open Rate" value={`${overview?.open_rate || 0}%`} sub={`${overview?.total_opened || 0} opens`} icon={TrendingUp} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Campaign performance chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Message Delivery Overview</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Delivered', value: overview?.total_delivered || 0, color: 'text-green-400' },
              { label: 'Opened', value: overview?.total_opened || 0, color: 'text-blue-400' },
              { label: 'Clicked', value: overview?.total_clicked || 0, color: 'text-brand-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                <p className={`text-xl font-bold ${s.color}`}>{s.value?.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={channelData}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer health */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Customer Health</h2>
          <div className="space-y-3">
            {[
              { label: 'Active (30d)', value: stats?.active, color: 'bg-green-500', total: stats?.total },
              { label: 'At Risk (31–90d)', value: stats?.atRisk, color: 'bg-amber-500', total: stats?.total },
              { label: 'Churned (90d+)', value: stats?.churned, color: 'bg-red-500', total: stats?.total },
              { label: 'VIP', value: stats?.vip, color: 'bg-brand-500', total: stats?.total },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">{s.label}</span>
                  <span className="text-slate-800 font-medium">{s.value || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.total ? (s.value / s.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-400" />
            <h2 className="font-semibold text-slate-800">AI Campaign Suggestions</h2>
          </div>
          <button onClick={handleGetSuggestions} disabled={loadingSuggestions} className="btn-primary text-sm flex items-center gap-2">
            {loadingSuggestions ? 'Thinking...' : 'Get Suggestions'}
            <Sparkles size={14} />
          </button>
        </div>
        {suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-300">
                <span className={`badge mb-2 ${s.priority === 'high' ? 'bg-red-900/50 text-red-300' : s.priority === 'medium' ? 'bg-amber-900/50 text-amber-300' : 'bg-slate-200 text-slate-700'}`}>
                  {s.priority} priority
                </span>
                <p className="font-medium text-slate-900 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-slate-500 mb-3">{s.description}</p>
                <Link href={`/campaigns/new?goal=${encodeURIComponent(s.goal)}&segment=${encodeURIComponent(s.segment)}`}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  Create campaign <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Click "Get Suggestions" to let AI analyze your customer base and recommend campaigns.</p>
        )}
      </div>

      {/* Recent campaigns */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-slate-400 text-sm">No campaigns yet. <Link href="/campaigns/new" className="text-brand-400">Create your first one →</Link></p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c: any) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-100/40 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-sm text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.segment_size} recipients · {c.channel}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className={`badge ${c.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-slate-200 text-slate-500'}`}>{c.status}</span>
                  {c.stats && <span>{c.stats.delivered} delivered</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
