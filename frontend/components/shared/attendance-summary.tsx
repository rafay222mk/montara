import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AttendanceSummary({ total, present, absent, late, excused, rate }: { total: number; present: number; absent: number; late: number; excused: number; rate: number }) {
  const items = [{ label: 'Total', value: total, color: 'text-foreground', icon: null }, { label: 'Present', value: present, color: 'text-primary', icon: CheckCircle2 }, { label: 'Absent', value: absent, color: 'text-rose-300', icon: XCircle }, { label: 'Late', value: late, color: 'text-secondary', icon: Clock3 }, { label: 'Excused', value: excused, color: 'text-sky-300', icon: CheckCircle2 }];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{items.map(({ label, value, color, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><span className={cn('text-2xl font-semibold', color)}>{value}</span><span className="text-xs text-muted-foreground">{Icon && <Icon className={cn('mr-1 inline h-3.5 w-3.5', color)} />}{label}</span></CardContent></Card>)}<Card className="sm:col-span-2 lg:col-span-5"><CardContent className="flex items-center justify-between p-4"><span className="text-xs text-muted-foreground">Attendance rate</span><span className="text-lg font-semibold text-primary">{rate}%</span><div className="ml-4 h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${rate}%` }} /></div></CardContent></Card></div>;
}
