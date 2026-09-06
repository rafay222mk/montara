'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AvatarText, ConfirmDialog, DataTable, FilterBar, PageHeader, StatusBadge } from '@/components/shared';
import { StudentFeeForm } from '@/components/forms/record-forms';
import { TableCell, TableRow } from '@/components/ui/table';
import { financeApi } from '@/lib/api/finance';
import { mapApiStudentFee } from '@/lib/utils';
import { StudentFee } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeesPage() {
  const [items, setItems] = useState<StudentFee[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingFee, setDeletingFee] = useState<StudentFee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'ACCOUNTANT';
  const backHref = user?.role === 'PARENT' ? '/parent' : '/finance';
  const backLabel = user?.role === 'PARENT' ? 'Back to family portal' : 'Back to finance overview';

  const loadStudentFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus.toUpperCase().replace(' ', '_');
      }

      // Query student fees and payments concurrently
      const [feesData, paymentsData] = await Promise.all([
        financeApi.studentFees.list(filters),
        financeApi.payments.list(),
      ]);

      // Map raw API values and calculate paid amount and remaining balance
      const mapped = feesData.map((f) => {
        const feePayments = paymentsData.filter((p) => p.studentFeeId === f.id);
        const paidAmount = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Math.max(0, Number(f.amount) - paidAmount);
        
        const base = mapApiStudentFee(f);
        return {
          ...base,
          paidAmount,
          balance,
        };
      });

      setItems(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assigned student fees');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadStudentFees();
  }, [loadStudentFees]);

  const handleDeleteConfirm = async () => {
    if (!deletingFee) return;
    setDeleting(true);
    try {
      await financeApi.studentFees.delete(deletingFee.id);
      setDeletingFee(null);
      loadStudentFees();
    } catch (err: any) {
      console.error('Failed to remove student fee:', err);
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
        item.feeStructure.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery || selectedStatus !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
  };

  const statuses = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Partially Paid', value: 'Partially Paid' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'Waived', value: 'Waived' },
  ];

  const tableHeaders = canManage
    ? ['Student', 'Fee structure', 'Total amount', 'Paid amount', 'Balance', 'Status', 'Due date', 'Actions']
    : ['Student', 'Fee structure', 'Total amount', 'Paid amount', 'Balance', 'Status', 'Due date'];

  return (
    <AppShell>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      <PageHeader
        eyebrow="Finance / Student accounts"
        title="Student fees"
        description="Review balances and payment status by student."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search fees by student or fee type..."
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        {canManage && <StudentFeeForm onSuccess={loadStudentFees} />}
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
            {hasActiveFilters ? 'No student fees match your search' : 'No assigned fees'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters ? 'Try adjusting your search query or status filter.' : 'Assign a fee structure to a student to start tracking payments.'}
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
              <TableCell className="text-sm font-medium">{item.feeStructure}</TableCell>
              <TableCell className="text-sm font-medium">{fmt(item.amount)}</TableCell>
              <TableCell className="text-sm text-emerald-400 font-medium">{fmt(item.paidAmount)}</TableCell>
              <TableCell className="text-sm font-semibold text-primary">{fmt(item.balance)}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.dueDate}</TableCell>
              {canManage && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Remove fee assignment"
                    onClick={() => setDeletingFee(item)}
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
        open={!!deletingFee}
        onOpenChange={(open) => !open && setDeletingFee(null)}
        title="Remove Student Fee"
        description={deletingFee ? `Are you sure you want to remove the assigned fee "${deletingFee.feeStructure}" for ${deletingFee.studentName}?` : ''}
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  );
}
