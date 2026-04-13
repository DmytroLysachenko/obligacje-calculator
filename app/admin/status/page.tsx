'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCcw, Activity, AlertCircle, CheckCircle2, Clock, Play, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, parseISO, differenceInMonths, isAfter } from 'date-fns';

interface SeriesStatus {
  id: string;
  name: string;
  slug: string;
  frequency: string;
  lastDataPointDate: string | null;
  pointCount: number;
  updatedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

interface StatusData {
  series: SeriesStatus[];
  systemTime: string;
  env: string;
}

export default function AdminStatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
      setData(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (mode: string = 'full-sync') => {
    if (!confirm(`Are you sure you want to trigger a ${mode}? This may take a few minutes.`)) return;
    
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode })
      });
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized. Please enter valid SYNC_SECRET.');
        const errData = await response.json();
        throw new Error(errData.error || 'Sync failed');
      }
      
      await fetchStatus();
      alert('Sync completed successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const savedSecret = localStorage.getItem('SYNC_SECRET');
    if (savedSecret) {
      setSecret(savedSecret);
      // We'll fetch after state is set in handleSaveSecret or similar
    }
  }, []);

  // Trigger initial fetch when secret is set from localStorage
  useEffect(() => {
    if (secret && !data && loading) {
      fetchStatus();
    }
  }, [secret]);

  const handleSaveSecret = () => {
    localStorage.setItem('SYNC_SECRET', secret);
    fetchStatus();
  };

  const isDataGap = (lastDateStr: string | null) => {
    if (!lastDateStr) return true;
    try {
      const lastDate = parseISO(lastDateStr);
      const monthsDiff = differenceInMonths(new Date(), lastDate);
      return monthsDiff >= 2;
    } catch (e) {
      return true;
    }
  };

  if (!data && !loading && error?.includes('Unauthorized')) {
    return (
      <div className="container mx-auto py-20 max-w-md">
        <Card className="border-2 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Admin Access Required
            </CardTitle>
            <CardDescription>Enter SYNC_SECRET to view system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="password" 
              className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)} 
              placeholder="Enter Secret"
            />
            <Button className="w-full font-bold" onClick={handleSaveSecret}>Unlock Status</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8 max-w-7xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-2xl gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-400" />
            Sync Health Dashboard
          </h1>
          <p className="text-slate-400 font-medium">Real-time data freshness and system synchronization monitor</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white" 
              onClick={fetchStatus}
              disabled={loading || syncing}
            >
                <RefreshCcw className={loading ? "animate-spin mr-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                Refresh Status
            </Button>
            <Button 
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold" 
              onClick={() => handleSync('full-sync')}
              disabled={loading || syncing}
            >
                {syncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                Trigger Manual Sync
            </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 font-bold animate-pulse">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {syncing && (
        <div className="bg-blue-500/10 border-2 border-blue-500/20 text-blue-600 p-4 rounded-xl flex items-center gap-3 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" />
          Manual synchronization in progress... please do not close this window.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Series Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black tracking-tighter">{data?.series?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Active data streams in database</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              Total Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black tracking-tighter">
              {data?.series?.reduce((acc: number, s: SeriesStatus) => acc + s.pointCount, 0).toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total historical records stored</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Badge variant="outline" className="text-lg font-black uppercase px-3">{data?.env || 'unknown'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Server runtime mode</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-lg overflow-hidden rounded-3xl">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <Activity className="h-5 w-5 text-primary" />
                Data Health Inventory
              </CardTitle>
              <CardDescription className="font-medium">Detailed status and freshness of financial data series</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-black uppercase text-[10px] w-[250px] px-6 py-4">Series Name & Source</TableHead>
                  <TableHead className="font-black uppercase text-[10px] px-6 py-4">Frequency</TableHead>
                  <TableHead className="font-black uppercase text-[10px] px-6 py-4">Last Data Point</TableHead>
                  <TableHead className="font-black uppercase text-[10px] px-6 py-4 text-right">Records</TableHead>
                  <TableHead className="font-black uppercase text-[10px] px-6 py-4">Last Sync Attempt</TableHead>
                  <TableHead className="font-black uppercase text-[10px] px-6 py-4">Health Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.series?.map((s: SeriesStatus) => {
                  const hasGap = isDataGap(s.lastDataPointDate);
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="font-black text-sm">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 w-fit px-1 rounded mt-0.5">{s.slug}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider">{s.frequency}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-bold">{s.lastDataPointDate || 'N/A'}</span>
                          {hasGap && s.lastDataPointDate && (
                            <Badge variant="destructive" className="w-fit text-[8px] h-4 font-black uppercase py-0 px-1.5 gap-1">
                              <AlertTriangle className="h-2 w-2" /> Gap Detected
                            </Badge>
                          )}
                          {!s.lastDataPointDate && (
                            <Badge variant="outline" className="w-fit text-[8px] h-4 font-black uppercase py-0 px-1.5 bg-amber-50 text-amber-600 border-amber-200">
                              Missing Data
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono font-bold text-xs">
                        {s.pointCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {s.updatedAt ? formatDistanceToNow(parseISO(s.updatedAt), { addSuffix: true }) : 'Never synced'}
                          </span>
                          {s.lastSyncError && (
                            <span className="text-[9px] text-destructive font-medium line-clamp-1" title={s.lastSyncError}>
                              Error: {s.lastSyncError}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {s.lastSyncStatus === 'success' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 hover:bg-emerald-100 font-black text-[10px] uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Healthy
                          </Badge>
                        ) : s.lastSyncStatus === 'failed' ? (
                          <Badge variant="destructive" className="gap-1 font-black text-[10px] uppercase">
                            <AlertCircle className="h-3 w-3" /> Error
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-black text-[10px] uppercase">
                            Initial
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!data?.series || data.series.length === 0) && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                      No data series found. Click &quot;Trigger Manual Sync&quot; to initialize the database.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
