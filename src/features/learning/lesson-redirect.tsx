import { Navigate, useParams } from 'react-router';
import { useLesson } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Skeleton } from '@/components/ui/skeleton/skeleton';

/** Timeline items know only a lesson id; this finds its pathway and opens the lesson. */
export function LessonRedirect() {
  const { lessonId = '' } = useParams();
  const q = useLesson(lessonId);
  return <QueryState query={q} skeleton={<Skeleton className="h-24 w-full" />}>{(d) => <Navigate to={`/app/pathways/${d.lesson.pathwayId}/lessons/${d.lesson.id}`} replace />}</QueryState>;
}
