import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

type Tab = 'dashboard' | 'patients' | 'analytics' | 'settings';

// ── Types ───────────────────────────────────────────────────────────────────
interface Facility {
  id: number;
  name: string;
  facility_type: string;
  address?: string;
  total_beds: number;
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

// ── API helpers (W4 fix) ─────────────────────────────────────────────────────
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on POST ${path}`);
  return res.json() as Promise<T>;
}

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // W2/W3 fix: real data from backend
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  // New record form state
  const [newRecord, setNewRecord] = useState({
    patientName: '',
    appointmentType: 'General Checkup',
    notes: '',
    facilityId: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load dashboard data from backend
  useEffect(() => {
    Promise.all([
      apiFetch<Facility[]>('/facilities/'),
      apiFetch<AlertRecord[]>('/alerts/'),
    ])
      .then(([facs, als]) => {
        setFacilities(facs);
        setAlerts(als);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleTabChange = (tab: Tab, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  // W1 fix: Save Record actually posts to backend as an alert (patient intake event)
  const handleSaveRecord = async () => {
    if (!newRecord.patientName.trim()) return;
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
      // Refresh alerts
      const updated = await apiFetch<AlertRecord[]>('/alerts/');
      setAlerts(updated);
      setTimeout(() => {
        setIsNewRecordOpen(false);
        setSaveSuccess(false);
        setNewRecord({ patientName: '', appointmentType: 'General Checkup', notes: '', facilityId: '' });
      }, 1200);
    } catch {
      alert('Failed to save record. Make sure the backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'patients', label: 'Patients' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  // W2 fix: computed stats from real data
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter((f) => f.is_active).length;
  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => handleTabChange('dashboard', e)}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-indigo-800 tracking-tight">
              Smart Health
            </h1>
          </div>
          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href="#"
                onClick={(e) => handleTabChange(link.id, e)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === link.id
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setIsNewRecordOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Record
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-slate-500 mt-2 text-lg">
              {activeTab === 'dashboard' && "Here's a live snapshot of your health network."}
              {activeTab === 'patients' && 'Manage and view all registered patient records.'}
              {activeTab === 'analytics' && 'Detailed metrics and performance data.'}
              {activeTab === 'settings' && 'Configure your application preferences.'}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
            {backendOnline ? 'Backend Connected' : 'Backend Offline'}
          </div>
        </div>

        {/* W2 fix: Stats cards from real backend data */}
        {(activeTab === 'dashboard' || activeTab === 'analytics') && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            {[
              {
                label: 'Total Facilities',
                value: isLoading ? '...' : String(totalFacilities),
                trend: `${activeFacilities} active`,
                positive: true,
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
              },
              {
                label: 'Open Alerts',
                value: isLoading ? '...' : String(openAlerts),
                trend: `${criticalAlerts} critical`,
                positive: criticalAlerts === 0,
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
              },
              {
                label: 'Critical Alerts',
                value: isLoading ? '...' : String(criticalAlerts),
                trend: criticalAlerts > 0 ? 'Needs attention' : 'All clear',
                positive: criticalAlerts === 0,
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              },
              {
                label: 'Total Beds',
                value: isLoading ? '...' : String(facilities.reduce((s, f) => s + (f.total_beds ?? 0), 0)),
                trend: 'across all facilities',
                positive: true,
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white overflow-hidden shadow-sm hover:shadow-xl rounded-2xl border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 mb-2">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.positive ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className={`text-sm font-semibold ${stat.positive ? 'text-green-600' : 'text-orange-500'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* W3 fix: Alerts/Records list from real backend data */}
        {(activeTab === 'dashboard' || activeTab === 'patients') && (
          <div className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {activeTab === 'patients' ? 'All Alerts & Records' : 'Recent Alerts'}
              </h3>
              {activeTab === 'dashboard' && (
                <button
                  onClick={(e) => handleTabChange('patients', e)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All &rarr;
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="px-8 py-10 text-center text-slate-400">Loading records...</div>
              ) : alerts.length === 0 ? (
                <div className="px-8 py-10 text-center text-slate-400">No records found.</div>
              ) : (
                (activeTab === 'dashboard' ? alerts.slice(0, 4) : alerts).map((alert) => (
                  <div
                    key={alert.id}
                    className="px-8 py-5 flex items-center justify-between hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-700 w-24 bg-slate-100 px-3 py-1.5 rounded-md text-center capitalize">
                        {alert.alert_type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                          {(alert.facility?.name ?? `F${alert.facility_id}`).charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {alert.facility?.name ?? `Facility #${alert.facility_id}`}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">{alert.message}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : alert.severity === 'warning'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow-sm rounded-2xl border border-slate-200/60 p-8 text-center max-w-2xl mx-auto mt-12">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Settings &amp; Preferences</h3>
            <p className="text-slate-500 mb-6">Manage your account settings, notifications, and application preferences here.</p>
            <p className="text-slate-400 text-sm">Backend: {backendOnline ? '✅ Connected to localhost:8000' : '❌ Offline — start the FastAPI server'}</p>
          </div>
        )}
      </main>

      {/* New Record Modal — W1 fix: actually POSTs to backend */}
      {isNewRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-xl font-bold text-slate-900">Create New Record</h3>
              <button
                onClick={() => setIsNewRecordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={newRecord.patientName}
                  onChange={(e) => setNewRecord({ ...newRecord, patientName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Type</label>
                <select
                  value={newRecord.appointmentType}
                  onChange={(e) => setNewRecord({ ...newRecord, appointmentType: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option>General Checkup</option>
                  <option>Consultation</option>
                  <option>Follow up</option>
                  <option>Therapy</option>
                </select>
              </div>
              {facilities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Facility</label>
                  <select
                    value={newRecord.facilityId}
                    onChange={(e) => setNewRecord({ ...newRecord, facilityId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={String(f.id)}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>
              {saveSuccess && (
                <p className="text-green-600 text-sm font-medium">✅ Record saved successfully!</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsNewRecordOpen(false)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                disabled={isSaving || !newRecord.patientName.trim()}
                onClick={handleSaveRecord}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help &amp; Support
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Welcome to the Smart Health Dashboard! Monitor your facilities, track supply alerts, and log patient intake events — all connected live to the backend.
              </p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Quick Actions:</h4>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                  <li>Click <strong>New Record</strong> to log a patient intake event.</li>
                  <li>Use the top navigation to switch between views.</li>
                  <li>Dashboard stats update live from the backend.</li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
