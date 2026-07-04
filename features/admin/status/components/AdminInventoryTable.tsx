'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AdminSeriesRowModel } from '../lib/admin-status-model';
import type { AdminDashboardCopy } from '../types/admin-status-types';

export function AdminInventoryTable({
  rows,
  loading,
  isEmpty,
  copy,
}: {
  rows: AdminSeriesRowModel[];
  loading: boolean;
  isEmpty: boolean;
  copy: AdminDashboardCopy['inventory'];
}) {
  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 ui-section-title">
          <Activity className="h-5 w-5 text-primary" />
          {copy.title}
        </h2>
        <p className="ui-body text-muted-foreground">{copy.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px] px-6 py-4 ui-metadata">{copy.cols.name}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.frequency}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.lastPoint}</TableHead>
              <TableHead className="px-6 py-4 text-right ui-metadata">
                {copy.cols.records}
              </TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.lastSync}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.health}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((seriesItem) => (
              <AdminInventoryRow key={seriesItem.id} seriesItem={seriesItem} copy={copy} />
            ))}
            {isEmpty && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center font-medium text-muted-foreground"
                >
                  {copy.empty}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function AdminInventoryRow({
  seriesItem,
  copy,
}: {
  seriesItem: AdminSeriesRowModel;
  copy: AdminDashboardCopy['inventory'];
}) {
  return (
    <TableRow className="border-border transition-colors hover:bg-muted/20">
      <TableCell className="px-6 py-5">
        <div className="text-sm font-semibold">{seriesItem.name}</div>
        <div className="mt-0.5 w-fit rounded bg-muted/50 px-1 font-mono text-[10px] text-muted-foreground">
          {seriesItem.slug}
        </div>
      </TableCell>
      <TableCell className="px-6 py-5">
        <Badge variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider">
          {seriesItem.frequency}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs font-bold">
            {seriesItem.lastDataPointDate || 'N/A'}
          </span>
          {seriesItem.hasDataGap && seriesItem.lastDataPointDate ? (
            <Badge
              variant="destructive"
              className="h-4 w-fit gap-1 px-1.5 py-0 text-[8px] font-semibold uppercase"
            >
              <AlertTriangle className="h-2 w-2" />
              {copy.health.gap}
            </Badge>
          ) : null}
          {seriesItem.isMissingData ? (
            <Badge
              variant="outline"
              className="h-4 w-fit border-warning/30 bg-warning/10 px-1.5 py-0 text-[8px] font-semibold uppercase text-warning"
            >
              {copy.health.missing}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-6 py-5 text-right font-mono text-xs font-semibold">
        {seriesItem.pointCount.toLocaleString()}
      </TableCell>
      <TableCell className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-xs font-medium">
            {seriesItem.updatedAt
              ? formatDistanceToNow(parseISO(seriesItem.updatedAt), { addSuffix: true })
              : copy.neverSynced}
          </span>
          {seriesItem.lastSyncError ? (
            <span
              className="line-clamp-1 text-[9px] font-medium text-destructive"
              title={seriesItem.lastSyncError}
            >
              {copy.health.error}: {seriesItem.lastSyncError}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-6 py-5">
        {seriesItem.health === 'healthy' ? (
          <Badge className="gap-1 border-success/30 bg-success/10 font-semibold uppercase text-[10px] text-success hover:bg-success/10">
            <CheckCircle2 className="h-3 w-3" />
            {copy.health.healthy}
          </Badge>
        ) : seriesItem.health === 'failed' ? (
          <Badge variant="destructive" className="gap-1 font-semibold uppercase text-[10px]">
            <AlertCircle className="h-3 w-3" />
            {copy.health.error}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-semibold uppercase text-[10px]">
            {copy.health.initial}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
