"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFacilities, fetchStock, updateStock } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, ArrowRightLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StockItem = {
  id: number;
  facility_id: number;
  medicine_id: number;
  current_quantity: number;
  reorder_level: number;
  expiry_date: string | null;
  medicine: {
    name: string;
    unit: string;
    category?: string;
    is_essential: boolean;
  };
};

export default function StockPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [newExpiry, setNewExpiry] = useState<string>('');

  const { data: facilities, isLoading: isLoadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: fetchFacilities,
  });

  const { data: stock, isLoading: isLoadingStock } = useQuery({
    queryKey: ['stock', selectedFacility],
    queryFn: () => fetchStock(Number(selectedFacility)),
    enabled: !!selectedFacility,
  });

  // D9 fix: wire "Update" button to mutation
  const updateMutation = useMutation({
    mutationFn: (item: StockItem) =>
      updateStock({
        facility_id: item.facility_id,
        medicine_id: item.medicine_id,
        current_quantity: newQty,
        reorder_level: item.reorder_level,
        expiry_date: newExpiry ? new Date(newExpiry).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedFacility] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setEditItem(null);
    },
  });

  const openEdit = (item: StockItem) => {
    setEditItem(item);
    setNewQty(item.current_quantity);
    setNewExpiry(item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground mt-2">Monitor inventory levels across all facilities.</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedFacility} onValueChange={(v) => setSelectedFacility(v ?? '')}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a facility to view stock" />
            </SelectTrigger>
            <SelectContent>
              {facilities?.map((facility: any) => (
                <SelectItem key={facility.id} value={facility.id.toString()}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* D10 note: Transfer Stock is a complex feature — kept as a placeholder for now */}
          <Button disabled={!selectedFacility} variant="outline">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
          </Button>
        </div>
      </div>

      {!selectedFacility ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Facility Selected</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Please select a facility from the dropdown above to view its current inventory and manage stock.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
            <CardDescription>
              Showing stock for {facilities?.find((f: any) => f.id.toString() === selectedFacility)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStock ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Loading stock data...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Expiry Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock?.map((item: StockItem) => {
                    const isLow = item.current_quantity <= item.reorder_level;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.medicine.name}
                          {item.medicine.is_essential && (
                            <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800">
                              Essential
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {item.medicine.category || 'General'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.current_quantity}{' '}
                          <span className="text-muted-foreground text-xs font-normal">{item.medicine.unit}s</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.reorder_level}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.expiry_date ? (
                            <span className={new Date(item.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {new Date(item.expiry_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isLow ? (
                            <Badge variant="destructive" className="animate-pulse">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              Adequate
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* D9 fix: wired Update button */}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {stock?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No stock data available for this facility.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* D9 fix: Update Stock dialog */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setEditItem(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-1">Update Stock</h2>
            <p className="text-muted-foreground text-sm mb-4">{editItem.medicine.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Quantity ({editItem.medicine.unit}s)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Reorder level: {editItem.reorder_level} {editItem.medicine.unit}s
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </div>
              {newQty <= editItem.reorder_level && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> This quantity is below the reorder level — a critical alert will be created.
                </p>
              )}
              {updateMutation.isError && (
                <p className="text-destructive text-sm">Failed to update stock. Please try again.</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate(editItem)}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
