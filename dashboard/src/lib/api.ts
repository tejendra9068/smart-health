const API_BASE_URL = 'http://localhost:8000/api';

// ── Facilities ──────────────────────────────────────────────────────────────

export async function fetchFacilities() {
  const response = await fetch(`${API_BASE_URL}/facilities/`);
  if (!response.ok) throw new Error('Failed to fetch facilities');
  return response.json();
}

export async function createFacility(data: {
  name: string;
  facility_type: string;
  district_id: number;
  address?: string;
  total_beds?: number;
  contact_number?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/facilities/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create facility');
  return response.json();
}

// ── Alerts ──────────────────────────────────────────────────────────────────

export async function fetchAlerts() {
  const response = await fetch(`${API_BASE_URL}/alerts/`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

/** D12 fix: resolve a single alert */
export async function resolveAlert(alertId: number) {
  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
    method: 'PATCH',
  });
  if (!response.ok) throw new Error('Failed to resolve alert');
  return response.json();
}

// ── Stock ────────────────────────────────────────────────────────────────────

export async function fetchStock(facilityId: number) {
  const response = await fetch(`${API_BASE_URL}/stock/${facilityId}`);
  if (!response.ok) throw new Error('Failed to fetch stock');
  return response.json();
}

/** D11 fix: update (or create) a stock record */
export async function updateStock(data: {
  facility_id: number;
  medicine_id: number;
  current_quantity: number;
  reorder_level?: number;
}) {
  const response = await fetch(`${API_BASE_URL}/stock/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update stock');
  return response.json();
}
