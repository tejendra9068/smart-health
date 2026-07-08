"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, resolveAlert } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  // D7 fix: resolve a single alert
  const resolveMutation = useMutation({
    mutationFn: (alertId: number) => resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // D5 fix: acknowledge all open alerts
  const handleAcknowledgeAll = () => {
    const openAlerts = alerts?.filter((a: any) => a.status === 'open') ?? [];
    openAlerts.forEach((alert: any) => resolveMutation.mutate(alert.id));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
          <p className="text-muted-foreground mt-2">Loading system alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading alerts. Make sure the backend is running and reachable.</div>;
  }

  const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical') || [];
  const warningAlerts = alerts?.filter((a: any) => a.severity === 'warning') || [];
  const infoAlerts = alerts?.filter((a: any) => a.severity === 'info') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
          <p className="text-muted-foreground mt-2">Manage and respond to automated system notifications.</p>
        </div>
        <div className="flex gap-2">
          {/* D5 fix: wired to handleAcknowledgeAll */}
          <Button
            variant="outline"
            onClick={handleAcknowledgeAll}
            disabled={resolveMutation.isPending || !alerts?.some((a: any) => a.status === 'open')}
          >
            Acknowledge All
          </Button>
          <Button>Configure Rules</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{criticalAlerts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{warningAlerts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500 flex items-center gap-2">
              <Info className="h-4 w-4" /> Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{infoAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Most recent alerts requiring attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts?.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">All Clear</h3>
                <p className="text-muted-foreground">There are no active alerts in the system.</p>
              </div>
            ) : (
              alerts?.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'border-destructive/50 bg-destructive/10'
                      : alert.severity === 'warning'
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : alert.severity === 'warning' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {alert.facility?.name ?? `Facility #${alert.facility_id}`}
                        <Badge variant="outline" className="text-xs font-normal capitalize">
                          {alert.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          {/* D1 fix: use created_time instead of created_at */}
                          {alert.created_time
                            ? new Date(alert.created_time).toLocaleString()
                            : 'Unknown time'}
                        </Badge>
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          alert.severity === 'critical' ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* D7 fix: Resolve button wired to mutation */}
                    <Button
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      size="sm"
                      disabled={alert.status !== 'open' || resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate(alert.id)}
                    >
                      {alert.status === 'open' ? 'Resolve' : 'Resolved'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
