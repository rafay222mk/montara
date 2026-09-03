'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader, StatusBadge } from '@/components/shared';
import { FeeForm } from '@/components/forms/record-forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { financeApi } from '@/lib/api/finance';
import { mapApiFeeStructure } from '@/lib/utils';
import { FeeStructure } from '@/types';
import { Button } from '@/components/ui/button';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeeStructuresPage() {
  const [items, setItems] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this fee structure?')) return;
    try {
      await financeApi.structures.delete(id);
      loadStructures();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete fee structure');
    }
  };

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

      <div className="mb-6">
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

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No fee structures defined</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add a tuition rate or program fee to begin invoicing students.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-[15px]">{item.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{item.scope}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
    </AppShell>
  );
}
