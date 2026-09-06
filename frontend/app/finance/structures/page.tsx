'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ConfirmDialog, FilterBar, PageHeader, StatusBadge } from '@/components/shared';
import { FeeForm } from '@/components/forms/record-forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { financeApi } from '@/lib/api/finance';
import { mapApiFeeStructure } from '@/lib/utils';
import { FeeStructure } from '@/types';
import { Button } from '@/components/ui/button';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeeStructuresPage() {
  const [items, setItems] = useState<FeeStructure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingStructure, setDeletingStructure] = useState<FeeStructure | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStructures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.structures.list();
      setItems(data.map(mapApiFeeStructure));
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  const handleDeleteConfirm = async () => {
    if (!deletingStructure) return;
    setDeleting(true);
    try {
      await financeApi.structures.delete(deletingStructure.id);
      setDeletingStructure(null);
      loadStructures();
    } catch (err: any) {
      console.error('Failed to delete fee structure:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.frequency.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <AppShell>
      <Link
        href="/finance"
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to finance overview
      </Link>

      <PageHeader
        eyebrow="Finance / Configuration"
        title="Fee structures"
        description="Organize recurring fees for each program and term."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search fee structures by name or program..."
          onReset={() => setSearchQuery('')}
          hasActiveFilters={Boolean(searchQuery)}
        />
        <FeeForm onSuccess={loadStructures} />
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery ? 'No fee structures match your search' : 'No fee structures defined'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search query.' : 'Add a tuition rate or program fee to begin invoicing students.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-[15px]">{item.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{item.scope}</p>
                </div>
                <div className="flex items-center gap-1">
                  <FeeForm
                    structureId={item.id}
                    onSuccess={loadStructures}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit fee structure"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Deactivate fee structure"
                    onClick={() => setDeletingStructure(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(item.amount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.frequency}</p>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge status={item.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingStructure}
        onOpenChange={(open) => !open && setDeletingStructure(null)}
        title="Deactivate Fee Structure"
        description={deletingStructure ? `Are you sure you want to deactivate "${deletingStructure.name}"? Existing student fee assignments will remain intact.` : ''}
        confirmLabel="Deactivate"
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  );
}
