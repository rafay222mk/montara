'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps {
  headers: string[];
  children?: React.ReactNode;
  empty?: boolean;
  pageSize?: number;
}

export function DataTable({ headers, children, empty = false, pageSize = 10 }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Convert children to array of elements for real pagination
  const rows = useMemo(() => {
    return React.Children.toArray(children).filter(Boolean);
  }, [children]);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Reset page if totalRecords shrinks below current page range
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && totalRecords > 0) {
    setCurrentPage(safePage);
  }

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const visibleRows = rows.slice(startIndex, endIndex);

  return (
    <div className="surface overflow-hidden rounded-lg border border-border/70">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/80">
              {headers.map((header) => (
                <TableHead key={header} className="whitespace-nowrap text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {empty || totalRecords === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-40 text-center text-xs text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows
            )}
          </TableBody>
        </Table>
      </div>

      {totalRecords > 0 && (
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
          <span>
            {totalRecords > pageSize
              ? `Showing ${startIndex + 1}–${endIndex} of ${totalRecords} records`
              : `Showing ${totalRecords} ${totalRecords === 1 ? 'record' : 'records'}`}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className={cn(
                  'rounded border border-border px-2 py-1 transition-colors hover:bg-muted text-foreground',
                  safePage <= 1 && 'opacity-40 pointer-events-none cursor-not-allowed',
                )}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                    safePage === pageNum
                      ? 'border-primary/30 bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className={cn(
                  'rounded border border-border px-2 py-1 transition-colors hover:bg-muted text-foreground',
                  safePage >= totalPages && 'opacity-40 pointer-events-none cursor-not-allowed',
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
