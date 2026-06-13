'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Megaphone, Sparkles } from 'lucide-react';
import { getCampaigns } from '@/lib/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns().then(r => setCampaigns(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusColor: any = {
    draft: 'bg-slate-200 text-slate-700',
    active: 'bg-green-900/50 text-green-300',
    completed: 'bg-blue-900/50 text-blue-300',
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1">{campaigns.length} campaigns total</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-12">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={40} className="text-gray-700 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No campaigns yet</p>
          <Link href="/campaigns/new" className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Create your first AI campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}
              className="card flex items-center gap-4 hover:border-slate-300 transition-colors cursor-pointer block">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  {c.ai_generated && <span className="badge bg-brand-900/50 text-brand-300 text-xs"><Sparkles size={10} className="inline mr-1" />AI</span>}
                  <span className={`badge ${statusColor[c.status] || statusColor.draft}`}>{c.status}</span>
                </div>
                <p className="text-xs text-slate-400">{c.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>{c.segment_size} recipients</span>
                  <span className="uppercase">{c.channel}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {c.stats && c.stats.total > 0 && (
                <div className="grid grid-cols-3 gap-4 text-center shrink-0">
                  {[
                    { label: 'Delivered', value: c.stats.delivered, color: 'text-green-400' },
                    { label: 'Opened', value: c.stats.opened, color: 'text-blue-400' },
                    { label: 'Clicked', value: c.stats.clicked, color: 'text-brand-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className={`font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
