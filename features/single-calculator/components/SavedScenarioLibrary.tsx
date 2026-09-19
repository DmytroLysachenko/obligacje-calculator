'use client';

import { Copy, Download, Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { BondInputs } from '@/features/bond-core/types';
import { downloadJsonFile } from '@/shared/lib/csv-utils';
import {
  createSingleScenarioPackage,
  isSinglePortableScenario,
  parseScenarioPackage,
  serializeScenarioPackage,
} from '@/shared/lib/scenario-codec';

import {
  createSavedScenario,
  deleteSavedScenario,
  duplicateSavedScenario,
  getSavedScenarioLoadReport,
  MAX_SCENARIOS,
  SavedScenarioRecord,
  saveScenarioRecord,
  ScenarioCapacityError,
  updateSavedScenario,
} from '../lib/scenario-storage';

type SavedScenarioLibraryProps = {
  isDirty: boolean;
  onRestore: (inputs: BondInputs) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function SavedScenarioLibrary({ isDirty, onRestore, t }: SavedScenarioLibraryProps) {
  const [records, setRecords] = useState<SavedScenarioRecord[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<SavedScenarioRecord | null>(null);
  const [pendingRestore, setPendingRestore] = useState<SavedScenarioRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    const report = getSavedScenarioLoadReport();
    setRecords(report.records);
    setNotice(
      report.unsupportedCount
        ? t('bonds.saved_library.unsupported', { count: report.unsupportedCount })
        : null,
    );
  }, [t]);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'obligacje.saved-single-scenarios.v1') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const visibleRecords = records.filter((record) => {
    const needle = query.trim().toLocaleLowerCase();
    return (
      !needle ||
      [record.name, record.description, ...record.tags].join(' ').toLowerCase().includes(needle)
    );
  });
  const restore = (record: SavedScenarioRecord) => {
    if (isDirty) {
      setPendingRestore(record);
      return;
    }
    onRestore(record.inputs);
  };
  const mutate = (operation: () => void) => {
    try {
      operation();
      refresh();
    } catch (error) {
      setNotice(
        error instanceof ScenarioCapacityError
          ? t('bonds.saved_library.capacity', { count: MAX_SCENARIOS })
          : t('bonds.saved_library.storage_error'),
      );
    }
  };

  return (
    <section className="border-y border-border py-4" aria-labelledby="saved-scenarios-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="saved-scenarios-title" className="text-sm font-semibold text-foreground">
            {t('bonds.saved_library.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('bonds.saved_library.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file
                .text()
                .then((text) => {
                  const decoded = parseScenarioPackage(text);
                  if (!decoded.ok) {
                    setNotice(t('bonds.saved_library.import_error'));
                    return;
                  }
                  const scenario = decoded.scenario;
                  if (!isSinglePortableScenario(scenario)) {
                    setNotice(t('bonds.saved_library.import_error'));
                    return;
                  }
                  mutate(() => saveScenarioRecord(createSavedScenario(scenario.intent)));
                })
                .catch(() => setNotice(t('bonds.saved_library.import_error')))
                .finally(() => {
                  event.target.value = '';
                });
            }}
          />
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />
            {t('bonds.saved_library.import')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {records.length}/{MAX_SCENARIOS}
          </span>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium" htmlFor="saved-scenario-search">
        {t('bonds.saved_library.search')}
      </label>
      <input
        id="saved-scenario-search"
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {notice ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
      {pendingRestore ? (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
          <p>{t('bonds.saved_library.restore_dirty', { name: pendingRestore.name })}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onRestore(pendingRestore.inputs);
                setPendingRestore(null);
              }}
            >
              {t('bonds.saved_library.restore_confirm')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingRestore(null)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {visibleRecords.map((record) => (
          <article key={record.id} className="rounded-md border border-border p-3">
            {editing?.id === record.id ? (
              <ScenarioEditor
                record={editing}
                onCancel={() => setEditing(null)}
                onSave={(update) =>
                  mutate(() => {
                    updateSavedScenario(record.id, update);
                    setEditing(null);
                  })
                }
                t={t}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{record.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{record.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{record.tags.join(' · ')}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('bonds.saved_library.restore')}
                      onClick={() => restore(record)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('bonds.saved_library.edit')}
                      onClick={() => setEditing(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('bonds.saved_library.duplicate')}
                      onClick={() => mutate(() => duplicateSavedScenario(record.id))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('bonds.saved_library.export')}
                      onClick={() =>
                        downloadJsonFile(
                          JSON.parse(
                            serializeScenarioPackage(createSingleScenarioPackage(record.inputs)),
                          ),
                          `${record.name.replace(/\s+/g, '-').toLowerCase()}.scenario.json`,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('bonds.saved_library.delete')}
                      onClick={() => mutate(() => deleteSavedScenario(record.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </article>
        ))}
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('bonds.saved_library.empty')}</p>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t('bonds.saved_library.local_only')}</p>
    </section>
  );
}

function ScenarioEditor({
  record,
  onCancel,
  onSave,
  t,
}: {
  record: SavedScenarioRecord;
  onCancel: () => void;
  onSave: (update: { name: string; description: string; tags: string[] }) => void;
  t: SavedScenarioLibraryProps['t'];
}) {
  const [name, setName] = useState(record.name);
  const [description, setDescription] = useState(record.description);
  const [tags, setTags] = useState(record.tags.join(', '));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: name.trim(),
          description: description.trim(),
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        });
      }}
      className="space-y-2"
    >
      <label className="block text-xs font-medium">
        {t('bonds.saved_library.name')}
        <input
          className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label className="block text-xs font-medium">
        {t('bonds.saved_library.notes')}
        <input
          className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-sm"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="block text-xs font-medium">
        {t('bonds.saved_library.tags')}
        <input
          className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-sm"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" type="submit">
          {t('common.save')}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
