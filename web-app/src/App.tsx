import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

type Tab = 'dashboard' | 'facilities' | 'alerts' | 'analytics' | 'settings';

// ── Types ────────────────────────────────────────────────────────────────────
interface Facility {
  id: number;
  name: string;
  facility_type: string;
  address?: string;
  total_beds: number;
  occupied_beds?: number;
  contact_number?: string;
  is_active: boolean;
}

interface AlertRecord {
  id: number;
  facility_id: number;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_time: string;
  facility?: { name: string };
}

// ── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPatch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Icon Components ──────────────────────────────────────────────────────────
const Icon = ({ path, className = 'w-5 h-5' }: { path: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  facility: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
  alert: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  plus: 'M12 4v16m8-8H4',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  beds: 'M3 12h18M3 6h18M3 18h18',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
};

// ── Severity Colors ──────────────────────────────────────────────────────────
function severityStyle(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
    case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
    case 'emergency': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400';
  }
}

function severityDot(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-amber-500';
    case 'emergency': return 'bg-rose-600 animate-ping';
    default: return 'bg-sky-500';
  }
}

// ── Mini Bar Chart component ─────────────────────────────────────────────────
function MiniBarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  const colors = ['bg-indigo-400', 'bg-indigo-500', 'bg-blue-500', 'bg-blue-600', 'bg-indigo-600', 'bg-indigo-700', 'bg-blue-700'];
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={`w-full rounded-t-sm ${colors[i % colors.length]} transition-all duration-700`}
              style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, positive, iconPath, color,
}: {
  label: string; value: string; sub: string; positive: boolean; iconPath: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon path={iconPath} className="w-5 h-5" />
        </div>
      </div>
      <p className="text-4xl font-black text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">{value}</p>
      <p className={`text-sm font-medium ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>{sub}</p>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
function Badge({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${className}`}>
      {text}
    </span>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // New record form
  const [newRecord, setNewRecord] = useState({ patientName: '', appointmentType: 'General Checkup', notes: '', facilityId: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Alert filter
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'critical'>('all');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      apiFetch<Facility[]>('/facilities/'),
      apiFetch<AlertRecord[]>('/alerts/'),
    ])
      .then(([facs, als]) => {
        setFacilities(facs);
        setAlerts(als);
        setBackendOnline(true);
        setLastRefresh(new Date());
      })
      .catch(() => setBackendOnline(false))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveRecord = async () => {
    if (!newRecord.patientName.trim()) { setFormError('Patient name is required.'); return; }
    setFormError('');
    setIsSaving(true);
    try {
      const facilityId = newRecord.facilityId ? Number(newRecord.facilityId) : (facilities[0]?.id ?? 1);
      await apiPost('/alerts/', {
        facility_id: facilityId,
        alert_type: 'patient_intake',
        severity: 'info',
        message: `Patient intake: ${newRecord.patientName} — ${newRecord.appointmentType}${newRecord.notes ? ` — ${newRecord.notes}` : ''}`,
        status: 'open',
      });
      setSaveSuccess(true);
      const updated = await apiFetch<AlertRecord[]>('/alerts/');
      setAlerts(updated);
      showToast('✅ Patient record saved successfully!');
      setTimeout(() => {
        setIsNewRecordOpen(false);
        setSaveSuccess(false);
        setNewRecord({ patientName: '', appointmentType: 'General Checkup', notes: '', facilityId: '' });
      }, 1000);
    } catch {
      setFormError('Failed to save. Please ensure the backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    setResolvingId(alertId);
    try {
      await apiPatch(`/alerts/${alertId}/resolve`);
      setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, status: 'resolved' } : a));
      showToast('✅ Alert resolved successfully!');
    } catch {
      showToast('❌ Failed to resolve alert.');
    } finally {
      setResolvingId(null);
    }
  };

  // Stats
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter((f) => f.is_active).length;
  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const totalBeds = facilities.reduce((s, f) => s + (f.total_beds ?? 0), 0);
  const occupiedBeds = facilities.reduce((s, f) => s + (f.occupied_beds ?? 0), 0);

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'open') return a.status === 'open';
    if (alertFilter === 'critical') return a.severity === 'critical';
    return true;
  });

  const navLinks: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { id: 'facilities', label: 'Facilities', icon: ICONS.facility },
    { id: 'alerts', label: 'Alerts', icon: ICONS.alert },
    { id: 'analytics', label: 'Analytics', icon: ICONS.analytics },
    { id: 'settings', label: 'Settings', icon: ICONS.settings },
  ];

  // Facility type distribution for chart
  const facilityTypes = ['PHC', 'CHC', 'Hospital', 'Depot'];
  const typeCount = facilityTypes.map((t) => facilities.filter((f) => f.facility_type === t).length);

  // Alert severity distribution
  const severities = ['info', 'warning', 'critical', 'emergency'];
  const severityCount = severities.map((s) => alerts.filter((a) => a.severity === s).length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 text-slate-900 font-sans">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Icon path={ICONS.shield} className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight">Smart Health</span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 tracking-widest uppercase -mt-0.5">Network Monitor</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === link.id
                    ? 'text-indigo-700 bg-indigo-50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon path={link.icon} className="w-4 h-4" />
                {link.label}
                {link.id === 'alerts' && openAlerts > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {openAlerts > 9 ? '9+' : openAlerts}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${backendOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {backendOnline ? 'Live' : 'Offline'}
            </div>
            <button
              onClick={loadData}
              title="Refresh data"
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Icon path={ICONS.refresh} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Icon path={ICONS.help} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsNewRecordOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Icon path={ICONS.plus} className="w-4 h-4" />
              <span className="hidden sm:inline">New Record</span>
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? ICONS.x : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  activeTab === link.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon path={link.icon} className="w-4 h-4" />
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 capitalize">
              {navLinks.find((n) => n.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              {activeTab === 'dashboard' && 'Live snapshot of your health network.'}
              {activeTab === 'facilities' && `${totalFacilities} facilities registered, ${activeFacilities} active.`}
              {activeTab === 'alerts' && `${openAlerts} open alerts across your network.`}
              {activeTab === 'analytics' && 'Network performance and operational metrics.'}
              {activeTab === 'settings' && 'Configure your application preferences.'}
            </p>
          </div>
          {lastRefresh && (
            <p className="text-xs text-slate-400 font-medium">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* ── DASHBOARD TAB ──────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard label="Total Facilities" value={isLoading ? '—' : String(totalFacilities)} sub={`${activeFacilities} active`} positive iconPath={ICONS.facility} color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Open Alerts" value={isLoading ? '—' : String(openAlerts)} sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : 'All clear'} positive={criticalAlerts === 0} iconPath={ICONS.alert} color={criticalAlerts > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} />
              <StatCard label="Total Beds" value={isLoading ? '—' : String(totalBeds)} sub={`${occupiedBeds} occupied`} positive iconPath={ICONS.beds} color="bg-blue-50 text-blue-600" />
              <StatCard label="Critical Alerts" value={isLoading ? '—' : String(criticalAlerts)} sub={criticalAlerts === 0 ? 'All systems normal' : 'Needs attention'} positive={criticalAlerts === 0} iconPath={ICONS.warning} color={criticalAlerts > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Alerts */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Recent Alerts</h3>
                  <button onClick={() => setActiveTab('alerts')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All →</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
                  ) : alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot(alert.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{alert.message}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{alert.facility?.name ?? `Facility #${alert.facility_id}`} · {new Date(alert.created_time).toLocaleDateString()}</p>
                      </div>
                      <Badge text={alert.severity} className={severityStyle(alert.severity)} />
                    </div>
                  ))}
                  {!isLoading && alerts.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">No alerts found.</div>
                  )}
                </div>
              </div>

              {/* Facilities Overview */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Facilities</h3>
                  <button onClick={() => setActiveTab('facilities')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All →</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
                  ) : facilities.slice(0, 4).map((f) => {
                    const pct = f.total_beds > 0 ? Math.min(100, ((f.occupied_beds ?? 0) / f.total_beds) * 100) : 0;
                    return (
                      <div key={f.id} className="px-6 py-4 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{f.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {f.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{f.occupied_beds ?? 0}/{f.total_beds}</span>
                        </div>
                      </div>
                    );
                  })}
                  {!isLoading && facilities.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">No facilities.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FACILITIES TAB ─────────────────────────────────────────────── */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: totalFacilities, color: 'text-indigo-600' },
                { label: 'Active', value: activeFacilities, color: 'text-emerald-600' },
                { label: 'Total Beds', value: totalBeds, color: 'text-blue-600' },
                { label: 'Occupied', value: occupiedBeds, color: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{isLoading ? '—' : s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Facilities cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-6" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                  </div>
                ))
              ) : facilities.map((f) => {
                const pct = f.total_beds > 0 ? Math.min(100, ((f.occupied_beds ?? 0) / f.total_beds) * 100) : 0;
                const isCritical = pct > 90;
                return (
                  <div key={f.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-6 ${isCritical ? 'border-red-200' : 'border-slate-200/80'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{f.name}</h3>
                        <span className="text-xs text-slate-500 font-medium">{f.facility_type}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${f.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {f.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>

                    {/* Bed capacity bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Bed Capacity</span>
                        <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                          {f.occupied_beds ?? 0} / {f.total_beds} ({Math.round(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isCritical ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      {f.address && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Icon path={ICONS.location} className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{f.address}</span>
                        </div>
                      )}
                      {f.contact_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Icon path={ICONS.phone} className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{f.contact_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!isLoading && facilities.length === 0 && (
                <div className="col-span-3 bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                  No facilities registered yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'open', 'critical'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${alertFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {f === 'all' ? `All (${alerts.length})` : f === 'open' ? `Open (${openAlerts})` : `Critical (${criticalAlerts})`}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400">Loading alerts...</div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Icon path={ICONS.check} className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                    <p className="font-semibold">All clear! No alerts found.</p>
                  </div>
                ) : filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${alert.status === 'resolved' ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/80'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${alert.status === 'resolved' ? 'bg-slate-300' : severityDot(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{alert.facility?.name ?? `Facility #${alert.facility_id}`}</p>
                        <Badge text={alert.alert_type.replace('_', ' ')} className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]" />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(alert.created_time).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge text={alert.severity} className={severityStyle(alert.severity)} />
                      {alert.status === 'open' ? (
                        <button
                          disabled={resolvingId === alert.id}
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {resolvingId === alert.id ? '...' : 'Resolve'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Facilities" value={String(totalFacilities)} sub={`${activeFacilities} active`} positive iconPath={ICONS.facility} color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Bed Utilisation" value={totalBeds > 0 ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : 'N/A'} sub={`${occupiedBeds}/${totalBeds} beds`} positive={occupiedBeds / totalBeds < 0.9} iconPath={ICONS.beds} color="bg-blue-50 text-blue-600" />
              <StatCard label="Total Alerts" value={String(alerts.length)} sub={`${openAlerts} still open`} positive={openAlerts === 0} iconPath={ICONS.alert} color="bg-amber-50 text-amber-600" />
              <StatCard label="Critical Alerts" value={String(criticalAlerts)} sub={criticalAlerts === 0 ? 'All resolved' : 'Needs action'} positive={criticalAlerts === 0} iconPath={ICONS.warning} color={criticalAlerts > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facility Type Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">Facilities by Type</h3>
                <MiniBarChart data={typeCount} label="PHC / CHC / Hospital / Depot" />
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {facilityTypes.map((t, i) => (
                    <div key={t} className="text-center">
                      <p className="text-lg font-black text-slate-900">{typeCount[i]}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Severity Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">Alerts by Severity</h3>
                <MiniBarChart data={severityCount} label="Info / Warning / Critical / Emergency" />
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {severities.map((s, i) => (
                    <div key={s} className="text-center">
                      <p className="text-lg font-black text-slate-900">{severityCount[i]}</p>
                      <p className="text-[10px] text-slate-400 font-medium capitalize">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bed Occupancy per facility */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">Bed Occupancy by Facility</h3>
                <div className="space-y-3">
                  {facilities.length === 0 ? (
                    <p className="text-slate-400 text-sm">No facilities found.</p>
                  ) : facilities.map((f) => {
                    const pct = f.total_beds > 0 ? Math.min(100, ((f.occupied_beds ?? 0) / f.total_beds) * 100) : 0;
                    return (
                      <div key={f.id} className="flex items-center gap-4">
                        <p className="text-sm font-semibold text-slate-700 w-40 truncate flex-shrink-0">{f.name}</p>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs font-bold text-slate-500 w-12 text-right">{Math.round(pct)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-5">
            {/* Connection Status */}
            <div className={`rounded-2xl border p-6 ${backendOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <h3 className={`font-bold text-base ${backendOnline ? 'text-emerald-800' : 'text-red-800'}`}>
                  Backend {backendOnline ? 'Connected' : 'Offline'}
                </h3>
              </div>
              <p className="text-sm font-mono text-slate-600 break-all">{API_BASE}</p>
              {!backendOnline && (
                <p className="text-sm text-red-600 mt-2">Make sure the FastAPI server is running on your Render deployment.</p>
              )}
            </div>

            {/* App Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800">Application Info</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'App Name', value: 'Smart Health Network Monitor' },
                  { label: 'Version', value: '2.0.0' },
                  { label: 'Facilities', value: String(totalFacilities) },
                  { label: 'Total Beds', value: String(totalBeds) },
                  { label: 'Open Alerts', value: String(openAlerts) },
                  { label: 'Last Refresh', value: lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Panel Link */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-1">Admin Dashboard</h3>
              <p className="text-indigo-100 text-sm mb-4">Access the full command center with stock management, facility controls, and system alerts.</p>
              <a
                href="/admin/"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-md"
              >
                <Icon path={ICONS.shield} className="w-4 h-4" />
                Open Admin Panel
              </a>
            </div>

            {/* Refresh action */}
            <button
              onClick={loadData}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Icon path={ICONS.refresh} className="w-4 h-4" />
              Refresh All Data
            </button>
          </div>
        )}
      </main>

      {/* ── New Record Modal ──────────────────────────────────────────────── */}
      {isNewRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
              <h3 className="text-lg font-black text-slate-900">New Patient Record</h3>
              <button onClick={() => setIsNewRecordOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors">
                <Icon path={ICONS.x} className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient Name *</label>
                <input
                  type="text"
                  value={newRecord.patientName}
                  onChange={(e) => setNewRecord({ ...newRecord, patientName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Enter full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Appointment Type</label>
                <select
                  value={newRecord.appointmentType}
                  onChange={(e) => setNewRecord({ ...newRecord, appointmentType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                >
                  <option>General Checkup</option>
                  <option>Consultation</option>
                  <option>Follow Up</option>
                  <option>Emergency</option>
                  <option>Therapy</option>
                  <option>Vaccination</option>
                  <option>Lab Test</option>
                </select>
              </div>
              {facilities.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Facility</label>
                  <select
                    value={newRecord.facilityId}
                    onChange={(e) => setNewRecord({ ...newRecord, facilityId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select facility…</option>
                    {facilities.filter((f) => f.is_active).map((f) => (
                      <option key={f.id} value={String(f.id)}>{f.name} ({f.facility_type})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>
              {formError && <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              {saveSuccess && <p className="text-sm text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-lg">✅ Record saved successfully!</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setIsNewRecordOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors">
                Cancel
              </button>
              <button
                disabled={isSaving || !newRecord.patientName.trim()}
                onClick={handleSaveRecord}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help Modal ────────────────────────────────────────────────────── */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon path={ICONS.info} className="w-5 h-5 text-indigo-600" />
                Help & Support
              </h3>
              <button onClick={() => setIsHelpOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                <Icon path={ICONS.x} className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>Welcome to <strong>Smart Health Network Monitor</strong> — a real-time operations dashboard for healthcare facility networks.</p>
              <div className="space-y-2">
                {[
                  { icon: ICONS.dashboard, text: 'Dashboard — Overview of key network stats and recent alerts.' },
                  { icon: ICONS.facility, text: 'Facilities — View capacity and status of each facility.' },
                  { icon: ICONS.alert, text: 'Alerts — Browse and resolve network alerts by severity.' },
                  { icon: ICONS.analytics, text: 'Analytics — Charts and metrics for operational insights.' },
                  { icon: ICONS.settings, text: 'Settings — Connection status and app configuration.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 px-4 py-3 rounded-xl">
                    <Icon path={item.icon} className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsHelpOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
