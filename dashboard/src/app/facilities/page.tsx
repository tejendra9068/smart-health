"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFacilities, createFacility } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NewFacilityForm = {
  name: string;
  facility_type: string;
  district_id: number;
  address: string;
  total_beds: number;
  occupied_beds: number;
  contact_number: string;
};

export default function FacilitiesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewFacilityForm>({
    name: '',
    facility_type: 'PHC',
    district_id: 1,
    address: '',
    total_beds: 0,
    occupied_beds: 0,
    contact_number: '',
  });

  const { data: facilities, isLoading, error } = useQuery({
    queryKey: ['facilities'],
    queryFn: fetchFacilities,
  });

  // D8 fix: wire Add Facility to mutation
  const createMutation = useMutation({
    mutationFn: createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setShowModal(false);
      setForm({ name: '', facility_type: 'PHC', district_id: 1, address: '', total_beds: 0, occupied_beds: 0, contact_number: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground mt-2">Loading facility network data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading facilities. Make sure the backend is running.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities Network</h1>
          <p className="text-muted-foreground mt-2">Manage and view all registered healthcare facilities and supply depots.</p>
        </div>
        {/* D8 fix: open Add Facility modal */}
        <Button onClick={() => setShowModal(true)}>Add Facility</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Facilities</CardTitle>
          <CardDescription>A comprehensive list of your network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities?.map((facility: any) => (
                <TableRow key={facility.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      {facility.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* D2 fix: use facility_type not facility.type */}
                    <Badge variant="secondary" className="capitalize">
                      {facility.facility_type ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* D3 fix: use address not facility.location */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {facility.address || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* D4 fix: use contact_number not facility.phone */}
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {facility.contact_number ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {facility.contact_number}
                        </div>
                      ) : (
                        'No contact info'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 w-24">
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>{facility.occupied_beds ?? 0} used</span>
                        <span>{facility.total_beds ?? 0} total</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${(facility.occupied_beds ?? 0) / (facility.total_beds || 1) > 0.9 ? 'bg-destructive' : 'bg-primary'}`} 
                          style={{ width: `${Math.min(100, ((facility.occupied_beds ?? 0) / (facility.total_beds || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        facility.is_active
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-500'
                      }
                    >
                      {facility.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {facilities?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No facilities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* D8 fix: Add Facility modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Facility</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Facility Name *</label>
                <input
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PHC Rampur Main"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.facility_type}
                  onChange={(e) => setForm({ ...form, facility_type: e.target.value })}
                >
                  <option value="PHC">PHC</option>
                  <option value="CHC">CHC</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Depot">Supply Depot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Beds</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.total_beds}
                    onChange={(e) => setForm({ ...form, total_beds: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Occupied Beds</label>
                  <input
                    type="number"
                    min={0}
                    max={form.total_beds}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.occupied_beds}
                    onChange={(e) => setForm({ ...form, occupied_beds: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-destructive text-sm">Failed to create facility. Please try again.</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Facility'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
