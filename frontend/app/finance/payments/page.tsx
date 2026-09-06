'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Download, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, ConfirmDialog, DataTable, FilterBar, PageHeader, StatusBadge } from '@/components/shared';
import { PaymentForm } from '@/components/forms/record-forms';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { financeApi } from '@/lib/api/finance';
import { mapApiPayment } from '@/lib/utils';
import { Payment, PaymentMethod } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth/auth-context';

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'ACCOUNTANT';
  const backHref = user?.role === 'PARENT' ? '/parent' : '/finance';
  const backLabel = user?.role === 'PARENT' ? 'Back to family portal' : 'Back to finance overview';

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedMethod !== 'all') {
        filters.paymentMethod = selectedMethod.toUpperCase().replace(' ', '_');
      }
      const data = await financeApi.payments.list(filters);
      setItems(data.map(mapApiPayment));
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments history');
    } finally {
      setLoading(false);
    }
  }, [selectedMethod]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;
    setDeleting(true);
    try {
      await financeApi.payments.delete(deletingPayment.id);
      setDeletingPayment(null);
      loadPayments();
    } catch (err: any) {
      console.error('Failed to void payment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery || selectedMethod !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMethod('all');
  };

  const handleExport = () => {
    if (filteredItems.length === 0) return;
    const headers = ['Student', 'Description', 'Amount', 'Method', 'Status', 'Date'];
    const rows = filteredItems.map((item) => [
      item.studentName,
      item.type,
      item.amount,
      item.method,
      item.status,
      item.date,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const methods = [
    { label: 'All methods', value: 'all' },
    { label: 'Cash', value: 'Cash' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Card', value: 'Card' },
    { label: 'Online', value: 'Online' },
  ];

  const tableHeaders = canManage
    ? ['Student', 'Description', 'Amount', 'Method', 'Status', 'Date', 'Actions']
    : ['Student', 'Description', 'Amount', 'Method', 'Status', 'Date'];

  return (
    <AppShell>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      <PageHeader
        eyebrow="Finance / Transactions"
        title="Payments"
        description="Track every payment received across the school."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search payments by student or fee type..."
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <Select value={selectedMethod} onValueChange={setSelectedMethod} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              {methods.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        <Button variant="outline" className="sm:mb-5 gap-2" onClick={handleExport} disabled={loading || filteredItems.length === 0}>
          <Download className="h-4 w-4" /> Export
        </Button>

        {canManage && <PaymentForm onSuccess={loadPayments} />}
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
            {hasActiveFilters ? 'No payments match your search' : 'No payments recorded'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters ? 'Try adjusting your search query or method filter.' : 'Record a payment receipt on an assigned student fee to track collections.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <DataTable headers={tableHeaders}>
          {filteredItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <AvatarText initials={item.initials} name={item.studentName} color={item.color} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.type}</TableCell>
              <TableCell className="text-sm font-semibold text-emerald-400">{item.formattedAmount}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.method}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
              {canManage && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Void payment receipt"
                    onClick={() => setDeletingPayment(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </DataTable>
      )}

      <ConfirmDialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
        title="Void Payment Receipt"
        description={deletingPayment ? `Are you sure you want to void the payment of ${deletingPayment.formattedAmount} for ${deletingPayment.studentName}? This will restore the student fee balance.` : ''}
        confirmLabel="Void Payment"
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  );
}
