"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchFacilities, fetchAlerts } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, AlertTriangle, Building } from 'lucide-react';

export default function DashboardOverview() {
  const { data: facilities, isLoading: isLoadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: fetchFacilities,
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  if (isLoadingFacilities || isLoadingAlerts) {
    return <div className="p-8">Loading dashboard metrics...</div>;
  }

  const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Here's what's happening across your facilities today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Critical Alerts</h2>
      <div className="space-y-4">
        {criticalAlerts.length === 0 ? (
          <p className="text-muted-foreground">No critical alerts at this time.</p>
        ) : (
          criticalAlerts.slice(0, 5).map((alert: any) => (
            <Alert variant="destructive" key={alert.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Alert (Facility ID: {alert.facility_id})</AlertTitle>
              <AlertDescription>
                {alert.message}
              </AlertDescription>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
}
