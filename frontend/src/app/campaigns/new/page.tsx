'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, Users, MessageSquare, Send, ChevronRight, Loader2 } from 'lucide-react';
import { parseAISegment, generateMessage, createCampaign, launchCampaign } from '@/lib/api';

const CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'];
const STEPS = ['Audience', 'Message', 'Review & Launch'];

function NewCampaignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Segment state
  const [segmentPrompt, setSegmentPrompt] = useState(searchParams.get('segment') || '');
  const [segmentRules, setSegmentRules] = useState<any>(null);
  const [segmentSize, setSegmentSize] = useState<number | null>(null);
  const [segmentSample, setSegmentSample] = useState<any[]>([]);
  const [loadingSegment, setLoadingSegment] = useState(false);

  // Message state
  const [channel, setChannel] = useState('whatsapp');
  const [campaignGoal, setCampaignGoal] = useState(searchParams.get('goal') || '');
  const [messageVariants, setMessageVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Campaign state
  const [campaignName, setCampaignName] = useState('');
  const [launching, setLaunching] = useState(false);

  const handleParseSegment = async () => {
    if (!segmentPrompt.trim()) return;
    setLoadingSegment(true);
    try {
      const res = await parseAISegment(segmentPrompt);
      setSegmentRules(res.data.rules);
      setSegmentSize(res.data.count);
      setSegmentSample(res.data.sample);
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoadingSegment(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!segmentPrompt) return;
    setLoadingMessage(true);
    try {
      const res = await generateMessage({
        segment_description: segmentPrompt,
        campaign_goal: campaignGoal || 'drive repeat purchase',
        channel,
        brand_name: 'StyleHub',
      });
      setMessageVariants(res.data.variants);
      setCustomMessage(res.data.variants[0]?.message || '');
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleLaunch = async () => {
    if (!segmentRules || !customMessage || !campaignName) return;
    setLaunching(true);
    try {
      const campaignRes = await createCampaign({
        name: campaignName,
        description: segmentPrompt,
        segment_rules: segmentRules,
        message: customMessage,
        channel,
        ai_generated: messageVariants.length > 0,
      });
      await launchCampaign(campaignRes.data.campaign.id);
      router.push(`/campaigns/${campaignRes.data.campaign.id}`);
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.error || e.message));
      setLaunching(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-400" /> New Campaign
        </h1>
        <p className="text-slate-500 mt-1">AI-powered audience targeting and message creation</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === step ? 'bg-brand-600 text-slate-900' : i < step ? 'bg-brand-900/50 text-brand-400' : 'bg-slate-100 text-slate-400'
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">{i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={16} className="text-slate-400" />}
          </div>
        ))}
      </div>

      {/* Step 0: Audience */}
      {step === 0 && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-brand-400" />
            <h2 className="font-semibold text-slate-800">Define Your Audience</h2>
          </div>
          <p className="text-sm text-slate-500">Describe who you want to reach in plain English. AI will find the matching customers.</p>

          <div>
            <label className="block text-sm text-slate-500 mb-2">Describe your audience</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="e.g. customers who spent over ₹3000 but haven't ordered in the last 60 days"
              value={segmentPrompt}
              onChange={e => setSegmentPrompt(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleParseSegment} disabled={loadingSegment || !segmentPrompt.trim()} className="btn-primary flex items-center gap-2">
              {loadingSegment ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loadingSegment ? 'Analyzing...' : 'Find Audience'}
            </button>
          </div>

          {segmentSize !== null && (
            <div className="bg-brand-900/20 border border-brand-700/30 rounded-lg p-4">
              <p className="text-brand-300 font-semibold text-lg">{segmentSize} customers matched</p>
              <p className="text-sm text-slate-500 mb-3">Sample:</p>
              <div className="space-y-1">
                {segmentSample.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-slate-500">
                    <span>{c.name}</span>
                    <span className="text-slate-400">{c.city} · ₹{parseFloat(c.total_spend).toLocaleString()}</span>
                  </div>
                ))}
                {segmentSize > 5 && <p className="text-xs text-slate-400">...and {segmentSize - 5} more</p>}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button onClick={() => setStep(1)} disabled={!segmentRules} className="btn-primary w-full">
              Continue to Message →
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Message */}
      {step === 1 && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={18} className="text-brand-400" />
            <h2 className="font-semibold text-slate-800">Craft Your Message</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">Channel</label>
              <select className="input" value={channel} onChange={e => setChannel(e.target.value)}>
                {CHANNELS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">Campaign goal (optional)</label>
              <input className="input" placeholder="e.g. win-back, upsell, announce sale" value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)} />
            </div>
          </div>

          <button onClick={handleGenerateMessage} disabled={loadingMessage} className="btn-secondary w-full flex items-center justify-center gap-2">
            {loadingMessage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-brand-400" />}
            {loadingMessage ? 'Writing messages...' : 'Generate AI Message Variants'}
          </button>

          {messageVariants.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Choose a variant:</p>
              {messageVariants.map((v: any, i: number) => (
                <div
                  key={i}
                  onClick={() => { setSelectedVariant(i); setCustomMessage(v.message); }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVariant === i ? 'border-brand-500 bg-brand-900/20' : 'border-slate-300 hover:border-gray-600'
                  }`}
                >
                  <span className="badge bg-slate-200 text-slate-700 mb-2">{v.tone}</span>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{v.message}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-500 mb-2">Final message (edit freely · use {'{{name}}'} for personalization)</label>
            <textarea
              className="input min-h-[120px] resize-none"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Write your message or generate variants above..."
            />
            <p className="text-xs text-slate-400 mt-1">{customMessage.length} chars</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => setStep(2)} disabled={!customMessage.trim()} className="btn-primary flex-1">Review & Launch →</button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Launch */}
      {step === 2 && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Send size={18} className="text-brand-400" />
            <h2 className="font-semibold text-slate-800">Review & Launch</h2>
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">Campaign name</label>
            <input className="input" placeholder="e.g. Win-back June 2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Audience</span>
              <span className="text-slate-700">{segmentSize} customers</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Channel</span>
              <span className="text-slate-700 uppercase">{channel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">AI Generated</span>
              <span className="text-slate-700">{messageVariants.length > 0 ? 'Yes' : 'No'}</span>
            </div>
            <div className="border-t border-slate-300 pt-3">
              <p className="text-xs text-slate-400 mb-1">Message preview</p>
              <p className="text-sm text-slate-700 bg-white rounded p-3 whitespace-pre-wrap">{customMessage}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
            <button onClick={handleLaunch} disabled={!campaignName.trim() || launching} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {launching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {launching ? 'Launching...' : `Launch to ${segmentSize} shoppers`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <NewCampaignContent />
    </Suspense>
  );
}
