'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { inventoryApi } from '@/lib/api/inventory';
import { InventoryItem, InventoryTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared';
import { InventoryItemForm, StockAdjustmentForm } from '@/components/forms/record-forms';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Pencil, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'transactions'>('catalog');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const canManage = user && hasPermission(user.role, 'inventory.manage');

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.items.list();
      setItems(data.filter(i => i.status !== 'INACTIVE'));
    } catch (err: any) {
      setError(err?.message || 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.transactions.list();
      setTransactions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchItems();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from catalog?')) return;
    try {
      await inventoryApi.items.delete(id);
      fetchItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove item.');
    }
  };

  // Stats
  const lowStockCount = items.filter((i) => i.quantity <= i.minimumStock).length;
  const outOfStockCount = items.filter((i) => i.quantity === 0).length;

  // Filters
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLowStock = !lowStockOnly || item.quantity <= item.minimumStock;
    return matchesSearch && matchesLowStock;
  });

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">School Inventory</h1>
          <p className="text-sm text-muted-foreground">Monitor supplies, learning aids, and classroom material levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={activeTab === 'catalog' ? fetchItems : fetchTransactions} disabled={loading} title="Reload list">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {canManage && activeTab === 'catalog' && (
            <InventoryItemForm onSuccess={fetchItems} />
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Supply Catalog
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Transaction History
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-[#11161a] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Catalog Items</span>
                <Package className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{items.length}</p>
              <p className="text-[10px] text-muted-foreground">Unique items registered</p>
            </div>

            <div className="rounded-xl border border-border bg-[#11161a] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Low Stock Warnings</span>
                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{lowStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Under minimum threshold</p>
            </div>

            <div className="rounded-xl border border-border bg-[#11161a] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{outOfStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Require immediate restocking</p>
            </div>
          </div>

          {/* Catalog content */}
          <div className="rounded-xl border border-border bg-[#11161a] p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2 max-w-md">
                <Input
                  placeholder="Search item name, category, storage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Low Stock Warnings Only
                </label>
              </div>
            </div>

            {error && <div className="rounded bg-destructive/10 p-4 text-xs text-destructive">{error}</div>}

            {loading ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading supply levels...</div>
            ) : filteredItems.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-sm text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-40" />
                No matching supply listings found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Min. Threshold</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity <= item.minimumStock;
                      const isOut = item.quantity === 0;
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {item.name}
                            {item.description && (
                              <span className="block text-xs font-normal text-muted-foreground">{item.description}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">{item.category}</td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className={isOut ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground'}>
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">{item.minimumStock} {item.unit}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{item.location || 'Not specified'}</td>
                          <td className="py-3.5 px-4 text-xs">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isOut
                                  ? 'bg-destructive/10 text-destructive'
                                  : isLow
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-green-500/10 text-green-500'
                              }`}
                            >
                              {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'OK'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {canManage && (
                                <>
                                  <StockAdjustmentForm
                                    item={item}
                                    type="STOCK_IN"
                                    onSuccess={fetchItems}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-8 px-2 text-green-500 hover:bg-green-500/15">
                                        Restock
                                      </Button>
                                    }
                                  />
                                  <StockAdjustmentForm
                                    item={item}
                                    type="STOCK_OUT"
                                    onSuccess={fetchItems}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-8 px-2 text-amber-500 hover:bg-amber-500/15" disabled={isOut}>
                                        Withdraw
                                      </Button>
                                    }
                                  />
                                  <InventoryItemForm
                                    itemId={item.id}
                                    onSuccess={fetchItems}
                                    trigger={
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" title="Edit details">
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/15"
                                    onClick={() => handleDelete(item.id)}
                                    title="Delete listing"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {!canManage && (
                                <span className="text-xs text-muted-foreground">View only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Transactions Logs */
        <div className="rounded-xl border border-border bg-[#11161a] p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Inventory ledger</h2>

          {error && <div className="rounded bg-destructive/10 p-4 text-xs text-destructive">{error}</div>}

          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading transaction logs...</div>
          ) : transactions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-sm text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-40" />
              No inventory adjustments logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Item Target</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Adjusted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {transactions.map((tx) => {
                    const isStockIn = tx.type === 'STOCK_IN';
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {tx.item?.name || 'Removed item'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${
                              isStockIn ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {isStockIn ? (
                              <>
                                <ArrowUpRight className="h-3 w-3" />
                                STOCK IN
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="h-3 w-3" />
                                STOCK OUT
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {isStockIn ? '+' : '-'}{tx.quantity}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{tx.reason || '-'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{tx.creator?.name || 'System / Auto'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
    </AppShell>
  );
}
