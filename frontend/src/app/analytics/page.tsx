'use client';
import { useEffect, useState } from 'react';
import { getOverviewAnalytics, getCampaigns } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import Papa from 'papaparse';
import { Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getOverviewAnalytics(), getCampaigns()])
      .then(([o, c]) => { setOverview(o.data); setCampaigns(c.data); })
      .catch(console.error);
  }, []);

  const exportAnalytics = () => {
    if (!campaigns || campaigns.length === 0) {
      alert('No data to export');
      return;
    }
    const exportData = campaigns.map(c => ({
      Campaign: c.name,
      Channel: c.channel,
      Recipients: c.segment_size,
      Delivered: c.stats?.delivered || 0,
      Opened: c.stats?.opened || 0,
      Clicked: c.stats?.clicked || 0,
      Failed: c.stats?.failed || 0,
      Date: new Date(c.created_at).toLocaleDateString()
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'analytics_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const campaignChartData = campaigns
    .filter(c => c.stats?.total > 0)
    .map(c => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
      delivered: c.stats?.delivered || 0,
      opened: c.stats?.opened || 0,
      clicked: c.stats?.clicked || 0,
      failed: c.stats?.failed || 0,
    }));

  const tooltipStyle = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a' };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Campaign performance across all channels</p>
        </div>
        <button onClick={exportAnalytics} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* KPIs */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sent', value: overview.total_messages_sent?.toLocaleString(), color: 'text-slate-900' },
            { label: 'Delivery Rate', value: `${overview.delivery_rate}%`, color: 'text-green-400' },
            { label: 'Open Rate', value: `${overview.open_rate}%`, color: 'text-blue-400' },
            { label: 'Total Clicked', value: overview.total_clicked?.toLocaleString(), color: 'text-brand-400' },
          ].map(k => (
            <div key={k.label} className="card text-center">
              <p className={`text-3xl font-bold ${k.color}`}>{k.value || '—'}</p>
              <p className="text-sm text-slate-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Campaign comparison chart */}
      {campaignChartData.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Campaign Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-30} textAnchor="end" interval={0} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} itemStyle={{ color: '#0f172a' }} />
              <Bar dataKey="delivered" name="Delivered" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="opened" name="Opened" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="clicked" name="Clicked" fill="#d946ef" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">All Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Campaign', 'Channel', 'Recipients', 'Delivered', 'Opened', 'Clicked', 'Failed', 'Open Rate'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => {
                const openRate = c.stats?.delivered > 0
                  ? ((c.stats.opened / c.stats.delivered) * 100).toFixed(0) + '%'
                  : '—';
                return (
                  <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 uppercase text-xs">{c.channel}</td>
                    <td className="px-4 py-3 text-slate-700">{c.segment_size}</td>
                    <td className="px-4 py-3 text-green-400">{c.stats?.delivered || 0}</td>
                    <td className="px-4 py-3 text-blue-400">{c.stats?.opened || 0}</td>
                    <td className="px-4 py-3 text-brand-400">{c.stats?.clicked || 0}</td>
                    <td className="px-4 py-3 text-red-400">{c.stats?.failed || 0}</td>
                    <td className="px-4 py-3 text-slate-700">{openRate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
