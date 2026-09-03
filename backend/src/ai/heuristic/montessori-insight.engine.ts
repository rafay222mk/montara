 export interface SuggestedActivity {
  title: string;
  area: string;
  reason: string;
}

export interface StudentDevelopmentInsight {
  summary: string;
  strengths: string[];
  areasNeedingAttention: string[];
  nextSteps: string[];
  suggestedActivities: SuggestedActivity[];
}

export function generateHeuristicInsight(
  student: any,
  observations: any[],
  assessments: any[],
  attendance: any[],
): StudentDevelopmentInsight {
  const studentName = `${student.firstName} ${student.lastName}`;

  // 1. Calculate Attendance Rate
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE',
  ).length;
  const attendanceRate =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

  // 2. Aggregate Assessments and Observations by Area
  const areaData: Record<string, { totalScore: number; count: number; masteries: number; needsWork: number }> = {};

  // Seed default areas
  const areas = [
    'PRACTICAL_LIFE',
    'SENSORIAL',
    'LANGUAGE',
    'MATHEMATICS',
    'CULTURAL',
    'ART',
    'MUSIC',
    'MOVEMENT',
    'SOCIAL_EMOTIONAL',
  ];
  areas.forEach((area) => {
    areaData[area] = { totalScore: 0, count: 0, masteries: 0, needsWork: 0 };
  });

  assessments.forEach((a) => {
    const area = a.area;
    if (areaData[area]) {
      areaData[area].totalScore += a.score || 75;
      areaData[area].count += 1;
      if (a.level === 'ADVANCED' || (a.score && a.score >= 85)) {
        areaData[area].masteries += 1;
      }
      if (a.level === 'BEGINNING' || (a.score && a.score < 60)) {
        areaData[area].needsWork += 1;
      }
    }
  });

  observations.forEach((o) => {
    const area = o.area;
    if (areaData[area]) {
      if (o.progress === 'MASTERED') {
        areaData[area].masteries += 1;
      }
      if (o.progress === 'NOT_STARTED' || o.progress === 'INTRODUCED') {
        areaData[area].needsWork += 1;
      }
    }
  });

  // 3. Determine Strengths and Attention Areas
  const strengths: string[] = [];
  const areasNeedingAttention: string[] = [];

  Object.keys(areaData).forEach((area) => {
    const data = areaData[area];
    const avgScore = data.count > 0 ? data.totalScore / data.count : null;

    if (data.masteries > 0 || (avgScore !== null && avgScore >= 80)) {
      strengths.push(mapAreaToLabel(area));
    }
    if (data.needsWork > 0 || (avgScore !== null && avgScore < 65)) {
      areasNeedingAttention.push(mapAreaToLabel(area));
    }
  });

  // Default fallbacks if empty
  if (strengths.length === 0) strengths.push('Practical Life');
  if (areasNeedingAttention.length === 0) areasNeedingAttention.push('Mathematics');

  // 4. Suggested Activities Catalog
  const activityCatalog: Record<string, SuggestedActivity[]> = {
    PRACTICAL_LIFE: [
      { title: 'Flower Arranging', area: 'Practical Life', reason: 'Refines motor control and promotes order/beauty.' },
      { title: 'Polishing Silver', area: 'Practical Life', reason: 'Develops deep coordination and multi-step sequencing.' }
    ],
    SENSORIAL: [
      { title: 'Color Tablets Box 3', area: 'Sensorial', reason: 'Encourages visual discrimination of chromatic grading.' },
      { title: 'Geometric Cabinet', area: 'Sensorial', reason: 'Refines muscular memory of shapes and pre-writing preparation.' }
    ],
    LANGUAGE: [
      { title: 'Sandpaper Letters', area: 'Language', reason: 'Connects muscle touch pathways with phonetic sounds.' },
      { title: 'Moveable Alphabet', area: 'Language', reason: 'Allows composition of words without mechanical writing stress.' }
    ],
    MATHEMATICS: [
      { title: 'Introduction to Golden Beads', area: 'Mathematics', reason: 'Introduces decimal place values concrete representations.' },
      { title: 'Spindle Boxes', area: 'Mathematics', reason: 'Reinforces count tracking and the concept of zero.' }
    ],
    CULTURAL: [
      { title: 'Puzzle Map of South America', area: 'Cultural', reason: 'Refines spatial awareness and geographical familiarity.' }
    ],
    SOCIAL_EMOTIONAL: [
      { title: 'Grace and Courtesy Roleplay', area: 'Social Emotional', reason: 'Nurtures respect, greeting rules, and group harmony.' }
    ]
  };

  const suggestedActivities: SuggestedActivity[] = [];
  // Pick from strengths to challenge, and attention to reinforce
  const strengthAreaKey = strengths[0].toUpperCase().replace(' ', '_');
  const attentionAreaKey = areasNeedingAttention[0].toUpperCase().replace(' ', '_');

  if (activityCatalog[strengthAreaKey]) {
    suggestedActivities.push(activityCatalog[strengthAreaKey][0]);
  }
  if (activityCatalog[attentionAreaKey]) {
    suggestedActivities.push(activityCatalog[attentionAreaKey][0]);
  }
  // Safe backups
  if (suggestedActivities.length < 2) {
    suggestedActivities.push({ title: 'Silent Game', area: 'Sensorial', reason: 'Promotes self-regulation and auditory discrimination.' });
  }

  // 5. Next Steps Recommendations
  const nextSteps: string[] = [];
  nextSteps.push(`Introduce next level sequence presentations in ${strengths[0]}.`);
  nextSteps.push(`Schedule repeat materials invitations for ${areasNeedingAttention[0]} using concrete manipulatives.`);
  if (attendanceRate < 90) {
    nextSteps.push('Coordinate with parent to encourage consistent attendance for developmental rhythm.');
  }

  // 6. Summary Narrative
  const rhythmText = attendanceRate >= 95 ? 'excellent' : attendanceRate >= 90 ? 'stable' : 'disrupted';
  const strengthListText = strengths.slice(0, 2).join(' and ');
  const attentionListText = areasNeedingAttention.slice(0, 2).join(' and ');

  const summary = `${studentName} is displaying good work cycle engagement. They have shown notable focus and concentration within ${strengthListText}, where they have mastered basic skills. Areas including ${attentionListText} would benefit from more frequent three-period lesson presentations. The student's attendance is ${attendanceRate.toFixed(1)}%, indicating a ${rhythmText} routine which directly supports classroom integration.`;

  return {
    summary,
    strengths,
    areasNeedingAttention,
    nextSteps,
    suggestedActivities,
  };
}

function mapAreaToLabel(area: string): string {
  const mapping: Record<string, string> = {
    PRACTICAL_LIFE: 'Practical Life',
    SENSORIAL: 'Sensorial',
    LANGUAGE: 'Language',
    MATHEMATICS: 'Mathematics',
    CULTURAL: 'Cultural',
    ART: 'Art',
    MUSIC: 'Music',
    MOVEMENT: 'Movement',
    SOCIAL_EMOTIONAL: 'Social Emotional',
  };
  return mapping[area] || area;
}
