'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCcw, Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SeriesStatus {
  id: string;
  name: string;
  slug: string;
  frequency: string;
  lastDataPointDate: string | null;
  pointCount: number;
  updatedAt: string | null;
  lastSyncStatus: string | null;
}

interface StatusData {
  series: SeriesStatus[];
  systemTime: string;
  env: string;
}

export default function AdminStatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/status', {
        headers: {
          'Authorization': `Bearer ${secret}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized. Please enter valid SYNC_SECRET.');
        throw new Error('Failed to fetch system status');
      }
      const result = await response.json();
      setData(result.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSecret = localStorage.getItem('SYNC_SECRET');
    if (savedSecret) {
      setSecret(savedSecret);
    }
  }, []);

  const handleSaveSecret = () => {
    localStorage.setItem('SYNC_SECRET', secret);
    fetchStatus();
  };

  if (!data && !loading && error?.includes('Unauthorized')) {
    return (
      <div className="container mx-auto py-20 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Enter SYNC_SECRET to view system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="password" 
              className="w-full p-2 border rounded" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)} 
              placeholder="Enter Secret"
            />
            <Button className="w-full" onClick={handleSaveSecret}>Unlock Status</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <header className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-400" />
            System Status
          </h1>
          <p className="text-slate-400 font-medium">Data freshness and synchronization health</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20" onClick={fetchStatus}>
                <RefreshCcw className={loading ? "animate-spin mr-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                Refresh
            </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 font-bold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Series Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{data?.series?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">
              {data?.series?.reduce((acc: number, s: SeriesStatus) => acc + s.pointCount, 0).toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              System Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg font-black uppercase">{data?.env || 'unknown'}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Series Inventory
          </CardTitle>
          <CardDescription>Status of all synchronized economic and market indicators</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="font-black uppercase text-[10px]">Series Name</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Frequency</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Last Point</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Points</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Last Sync</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.series?.map((s: SeriesStatus) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold">
                    <div>{s.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-black uppercase">{s.frequency}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.lastDataPointDate || '---'}</TableCell>
                  <TableCell className="font-bold">{s.pointCount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.updatedAt ? formatDistanceToNow(parseISO(s.updatedAt), { addSuffix: true }) : 'never'}
                  </TableCell>
                  <TableCell>
                    {s.lastSyncStatus === 'success' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Success
                      </Badge>
                    ) : s.lastSyncStatus === 'failed' ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Failed
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unknown</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
