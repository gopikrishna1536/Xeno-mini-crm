'use client';
import { useEffect, useState, useRef } from 'react';
import { Search, Users, TrendingUp, AlertTriangle, Star, Upload, Download } from 'lucide-react';
import { getCustomers, getCustomerStats, importCustomers } from '@/lib/api';
import Papa from 'papaparse';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CITIES = ['', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];

  useEffect(() => {
    getCustomerStats().then(r => setStats(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getCustomers({ page, limit: 50, search: search || undefined, city: city || undefined })
      .then(r => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, city]);

  const daysSince = (date: string) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };

  const statusBadge = (customer: any) => {
    const days = daysSince(customer.last_order_date);
    if (days === null) return <span className="badge bg-slate-200 text-slate-500">New</span>;
    if (days <= 30) return <span className="badge bg-green-900/50 text-green-300">Active</span>;
    if (days <= 90) return <span className="badge bg-amber-900/50 text-amber-300">At Risk</span>;
    return <span className="badge bg-red-900/50 text-red-300">Churned</span>;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await importCustomers({ customers: results.data });
          alert(`Successfully imported ${res.data.imported} customers!`);
          setPage(1);
          getCustomers({ page: 1, limit: 50, search: search || undefined, city: city || undefined })
            .then(r => { setCustomers(r.data.customers); setTotal(r.data.total); })
            .catch(console.error);
          getCustomerStats().then(r => setStats(r.data)).catch(console.error);
        } catch (err: any) {
          alert('Error importing customers: ' + (err.response?.data?.error || err.message));
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error: any) => {
        alert('Error parsing CSV: ' + error.message);
        setUploading(false);
      }
    });
  };

  const exportCustomers = () => {
    if (!customers || customers.length === 0) {
      alert('No customers to export');
      return;
    }
    const csv = Papa.unparse(customers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Your shopper base</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCustomers} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary flex items-center gap-2">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats?.total, icon: Users, color: 'text-blue-400' },
          { label: 'Active', value: stats?.active, icon: TrendingUp, color: 'text-green-400' },
          { label: 'At Risk', value: stats?.atRisk, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'VIP', value: stats?.vip, icon: Star, color: 'text-brand-400' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value?.toLocaleString() || '—'}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-40" value={city} onChange={e => { setCity(e.target.value); setPage(1); }}>
          {CITIES.map(c => <option key={c} value={c}>{c || 'All Cities'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">City</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Orders</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Total Spend</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Last Order</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading...</td></tr>
              ) : customers.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{c.total_orders}</td>
                  <td className="px-4 py-3 text-slate-700">₹{parseFloat(c.total_spend).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.last_order_date ? `${daysSince(c.last_order_date)}d ago` : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-400">Showing {customers.length} of {total} customers</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="text-xs text-slate-500 self-center">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={customers.length < 50} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
