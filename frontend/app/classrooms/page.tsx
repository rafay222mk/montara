'use client';

import { ArrowUpRight, BookOpen, MoreHorizontal, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { classroomsApi } from '@/lib/api/classrooms';
import { mapApiClassroom } from '@/lib/utils';
import { Classroom, Role } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { ClassroomForm } from '@/components/forms/record-forms';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadClassrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classroomsApi.list();
      setRooms(data.map(mapApiClassroom));
    } catch (err: any) {
      setError(err?.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this classroom?')) return;
    try {
      await classroomsApi.delete(id);
      loadClassrooms();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete classroom');
    }
  };

  const isEditable = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Academic / Spaces</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Classrooms</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Your prepared environments and the guides who care for them.
          </p>
        </div>
        {isEditable && <ClassroomForm onSuccess={loadClassrooms} />}
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

      {!loading && !error && rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No classrooms yet</h3>
          <p className="text-xs text-muted-foreground mt-1">Create your first prepared environment room.</p>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rooms.map((room) => (
            <Card key={room.id} className="group transition-all hover:-translate-y-0.5 hover:border-primary/30 relative">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${room.tone}`}>
                  <BookOpen className="h-5 w-5" />
                </span>
                {isEditable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ClassroomForm classroomId={room.id} onSuccess={loadClassrooms} trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit details</DropdownMenuItem>
                      } />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(room.id)}>
                        Delete classroom
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                <Link href={`/classrooms/${room.id}`}>
                  <CardTitle className="text-[16px] hover:text-primary">{room.name}</CardTitle>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{room.ageRange}</p>
                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {room.studentCount} students
                  </span>
                  <span className="text-foreground">{room.capacity} max</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.min((room.studentCount / room.capacity) * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-xs text-muted-foreground">Guide</span>
                  <span className="text-xs font-medium">{room.leadTeacher}</span>
                </div>
                <div className="mt-3">
                  <StatusBadge status={room.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-primary/15 bg-primary/[0.04] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Classroom planning is coming next</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create prepared environments, assign guides, and keep your materials inventory in one calm place.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
