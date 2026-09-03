'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function FormDialog({ trigger, title, description, children, submitLabel = 'Save changes', onSubmit }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode; submitLabel?: string; onSubmit?: () => void }) { const [open, setOpen] = useState(false); return <><span onClick={() => setOpen(true)}>{trigger}</span><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader><div className="py-2">{children}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { onSubmit?.(); setOpen(false); }}>{submitLabel}</Button></DialogFooter></DialogContent></Dialog></>; }
