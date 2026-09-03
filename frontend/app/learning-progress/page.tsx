'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowUpRight, Award, BarChart3, BookOpenCheck, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AreaBadge, PageHeader, ProgressBar, ProgressRing, SectionHeader, StatCard, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { assessmentsApi } from '@/lib/api/assessments';
import { mapApiAssessment } from '@/lib/utils';
import { AreaProgress, Assessment, AssessmentLevel, MontessoriArea } from '@/types';

export default function LearningProgressPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    assessmentsApi.list()
      .then((data) => {
        setItems(data.map(mapApiAssessment));
      })
      .catch((err) => {
        console.error('Failed to load school assessments for progress views:', err);
        setError('Could not calculate learning progress snapshot.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const computeSchoolProgress = (itemsList: Assessment[]) => {
    if (itemsList.length === 0) {
      return {
        areas: [] as AreaProgress[],
        summary: {
          overallScore: 0,
          strongestArea: 'Practical Life' as MontessoriArea,
          totalAssessments: 0,
          areasNeedingAttention: [] as MontessoriArea[],
        }
      };
    }

    const grouped: Record<MontessoriArea, { sum: number; count: number; levels: Record<AssessmentLevel, number> }> = {} as any;
    
    itemsList.forEach((item) => {
      const area = item.area;
      if (!grouped[area]) {
        grouped[area] = { sum: 0, count: 0, levels: { Beginning: 0, Developing: 0, Proficient: 0, Advanced: 0 } };
      }
      grouped[area].sum += item.score;
      grouped[area].count += 1;
      grouped[area].levels[item.level] = (grouped[area].levels[item.level] || 0) + 1;
    });

    const areasList = Object.keys(grouped).map((areaKey) => {
      const area = areaKey as MontessoriArea;
      const { sum, count, levels } = grouped[area];
      const score = Math.round(sum / count);
      
      let maxLevel: AssessmentLevel = 'Beginning';
      let maxCount = -1;
      (Object.keys(levels) as AssessmentLevel[]).forEach((lvl) => {
        if (levels[lvl] > maxCount) {
          maxCount = levels[lvl];
          maxLevel = lvl;
        }
      });

      const notes: Record<MontessoriArea, string> = {
        'Practical Life': 'Strong independence and care of environment.',
        'Sensorial': 'Material exploration is deepening.',
        'Language': 'Vocabulary and expression are growing.',
        'Mathematics': 'More repetition will support fluency.',
        'Cultural': 'New invitations prepared this week.',
        'Art': 'Creative expression is unfolding.',
        'Music': 'Rhythmic awareness is developing.',
        'Movement': 'Gross motor control and coordination.',
        'Social Emotional': 'Strong peer collaboration.',
      };

      return {
        area,
        score,
        level: maxLevel,
        assessmentCount: count,
        note: notes[area] || 'Continuing exploration.',
      };
    });

    const overallScore = Math.round(areasList.reduce((sum, a) => sum + a.score, 0) / areasList.length);
    const sorted = [...areasList].sort((a, b) => b.score - a.score);
    const strongestArea = sorted[0]?.area || ('Practical Life' as MontessoriArea);
    const areasNeedingAttention = areasList.filter((a) => a.score < 70).map((a) => a.area);

    return {
      areas: areasList,
      summary: {
        overallScore,
        strongestArea,
        totalAssessments: itemsList.length,
        areasNeedingAttention,
      }
    };
  };

  const { areas, summary } = computeSchoolProgress(items);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Learning / Aggregated view"
        title="Learning progress"
        description="See how children are developing across Montessori areas."
      />

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
          <Award className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No progress snapshot calculated</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Learning progress aggregates will display once assessments are recorded.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Overall average" value={`${summary.overallScore}%`} change="6.1%" icon={BarChart3} />
            <StatCard label="Strongest area" value={summary.strongestArea} change={`${areas.find(a => a.area === summary.strongestArea)?.score || 0}% average`} icon={Award} tone="amber" />
            <StatCard label="Assessments recorded" value={`${summary.totalAssessments}`} change="12 this month" icon={BookOpenCheck} tone="blue" />
            <StatCard label="Areas to nurture" value={`${summary.areasNeedingAttention.length}`} change="Needs attention" icon={Target} tone="rose" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">School development snapshot</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">A balanced view of the whole community</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-8 pt-4">
                <ProgressRing value={summary.overallScore} label="school average" />
                <p className="mt-5 max-w-xs text-center text-xs leading-5 text-muted-foreground">
                  Children are building strong independence. The next invitations focus on mathematical fluency and cultural exploration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Progress by Montessori area</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Average score and latest assessment level</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {areas.map((item) => (
                  <div key={item.area}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AreaBadge area={item.area} />
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {item.assessmentCount} assessments
                        </span>
                      </div>
                      <StatusBadge status={item.level} />
                    </div>
                    <ProgressBar value={item.score} showValue />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <SectionHeader title="Areas needing attention" />
            <div className="grid gap-4 sm:grid-cols-2">
              {areas
                .filter((item) => item.score < 70)
                .map((item) => (
                  <Card key={item.area} className="border-secondary/20 bg-secondary/[0.03]">
                    <CardContent className="flex items-start gap-4 p-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.area}</p>
                          <span className="text-sm font-semibold text-secondary">{item.score}%</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                        <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          Explore invitations <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
