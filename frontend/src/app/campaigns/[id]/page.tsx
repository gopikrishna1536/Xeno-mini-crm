'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCampaign, getCampaignAnalytics } from '@/lib/api';
import { ArrowLeft, Send, CheckCircle, Eye, MousePointer, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [c, a] = await Promise.all([getCampaign(id as string), getCampaignAnalytics(id as string)]);
      setCampaign(c.data);
      setAnalytics(a.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds while campaign is active
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (!campaign) return <div className="p-8 text-slate-500">Campaign not found</div>;

  const pieData = analytics ? [
    { name: 'Delivered', value: analytics.delivered, color: '#22c55e' },
    { name: 'Opened', value: analytics.opened, color: '#3b82f6' },
    { name: 'Clicked', value: analytics.clicked, color: '#d946ef' },
    { name: 'Failed', value: analytics.failed, color: '#ef4444' },
    { name: 'Queued', value: analytics.queued, color: '#6b7280' },
  ].filter(d => d.value > 0) : [];

  const statusIcon: any = {
    queued: <Clock size={14} className="text-slate-500" />,
    sent: <Send size={14} className="text-blue-400" />,
    delivered: <CheckCircle size={14} className="text-green-400" />,
    opened: <Eye size={14} className="text-blue-400" />,
    clicked: <MousePointer size={14} className="text-brand-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/campaigns" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6">
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <p className="text-slate-500 mt-1">{campaign.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
            <span className="uppercase">{campaign.channel}</span>
            <span>·</span>
            <span>{campaign.segment_size} recipients</span>
            <span>·</span>
            <span>{campaign.launched_at ? `Launched ${new Date(campaign.launched_at.endsWith('Z') ? campaign.launched_at : campaign.launched_at + 'Z').toLocaleString()}` : 'Not launched'}</span>
          </div>
        </div>
        <span className={`badge text-sm px-3 py-1 ${campaign.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-slate-200 text-slate-700'}`}>
          {campaign.status}
        </span>
      </div>

      {/* Stats cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: analytics.total, color: 'text-slate-700' },
            { label: 'Delivered', value: analytics.delivered, sub: `${analytics.delivery_rate}%`, color: 'text-green-400' },
            { label: 'Opened', value: analytics.opened, sub: `${analytics.open_rate}%`, color: 'text-blue-400' },
            { label: 'Clicked', value: analytics.clicked, sub: `${analytics.click_rate}%`, color: 'text-brand-400' },
            { label: 'Failed', value: analytics.failed, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              {s.sub && <p className="text-xs text-slate-400">{s.sub} rate</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="card lg:col-span-1">
            <h3 className="font-medium text-slate-700 mb-3">Delivery Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Message preview */}
        <div className="card lg:col-span-2">
          <h3 className="font-medium text-slate-700 mb-3">Message</h3>
          <div className="bg-slate-100 rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{campaign.message}</p>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="badge bg-slate-200 text-slate-500 uppercase">{campaign.channel}</span>
            {campaign.ai_generated && <span className="badge bg-brand-900/50 text-brand-300">AI Generated</span>}
          </div>
        </div>
      </div>

      {/* Communications table */}
      {campaign.communications?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-medium text-slate-700">Individual Communications</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100/90">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Customer</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {campaign.communications.slice(0, 100).map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="px-4 py-2">
                      <p className="text-slate-700 text-xs">{c.customers?.name || c.customer_id}</p>
                      <p className="text-slate-400 text-xs">{c.customers?.city}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1.5 text-xs">
                        {statusIcon[c.status]}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {new Date(c.updated_at.endsWith('Z') ? c.updated_at : c.updated_at + 'Z').toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
