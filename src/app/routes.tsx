import { createHashRouter, Navigate, Outlet } from 'react-router';
import { useRouteError } from 'react-router';
import { AppShell } from '@/features/shell/app-shell';
import { PersonaPicker } from '@/features/persona/persona-picker';
import { TodayPage } from '@/features/learning/today-page';
import { JourneyPage } from '@/features/learning/journey-page';
import { PathwaysTab } from '@/features/learning/pathways-tab';
import { PathwayPage } from '@/features/learning/pathway-page';
import { LessonPage } from '@/features/learning/lesson-page';
import { LessonRedirect } from '@/features/learning/lesson-redirect';
import { TimelineList } from '@/features/growth/timeline';
import { MilestonesTab } from '@/features/growth/milestones-tab';
import { JournalPage } from '@/features/reflections/journal-page';
import { NewReflectionPage } from '@/features/reflections/new-reflection-page';
import { ReflectionPage } from '@/features/reflections/reflection-page';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { MentorDashboardPage } from '@/features/mentoring/dashboard-page';
import { MenteesPage } from '@/features/mentoring/mentees-page';
import { MenteePage } from '@/features/mentoring/mentee-page';
import { FeedbackInboxPage } from '@/features/mentoring/feedback-inbox-page';
import { FeedbackPage } from '@/features/mentoring/feedback-page';
import { PathwaysLibraryPage } from '@/features/builder/pathways-library-page';
import { BuilderPage } from '@/features/builder/builder-page';
import { LessonEditorPage } from '@/features/builder/lesson-editor-page';
import { SettingsPage } from '@/features/shell/settings-page';
import { ComingSoon } from '@/features/shell/coming-soon';
import { DesignGallery } from '@/features/design/gallery';
import { ErrorState } from '@/components/patterns/error-state/error-state';
import { useT } from '@/lib/i18n';

function RouteError() {
  const t = useT();
  const err = useRouteError();
  return <div className="grid min-h-dvh place-items-center"><ErrorState title={t('states.errorTitle')} description={t('states.errorBody')} retryLabel={t('actions.retry')} onRetry={() => window.location.reload()} details={{ label: t('states.showDetails'), requestId: String((err as Error)?.message ?? 'unknown').slice(0, 80) }} /></div>;
}

export const router = createHashRouter([
  { path: '/', element: <PersonaPicker />, errorElement: <RouteError /> },
  { path: '/design', element: <DesignGallery /> },
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: 'app', element: <Navigate to="/app/today" replace /> },
      { path: 'app/today', element: <TodayPage /> },
      { path: 'app/journey', element: <JourneyPage />, children: [{ index: true, element: <PathwaysTab /> }, { path: 'timeline', element: <TimelineList /> }, { path: 'milestones', element: <MilestonesTab /> }] },
      { path: 'app/pathways/:pathwayId', element: <PathwayPage /> },
      { path: 'app/pathways/:pathwayId/lessons/:lessonId', element: <LessonPage /> },
      { path: 'app/lessons/:lessonId', element: <LessonRedirect /> },
      { path: 'app/journal', element: <JournalPage /> },
      { path: 'app/journal/new', element: <NewReflectionPage /> },
      { path: 'app/journal/:reflectionId', element: <ReflectionPage /> },
      { path: 'app/bible/*', element: <ComingSoon /> },
      { path: 'app/community/*', element: <ComingSoon /> },
      { path: 'app/groups/*', element: <ComingSoon /> },
      { path: 'mentor', element: <MentorDashboardPage /> },
      { path: 'mentor/mentees', element: <MenteesPage /> },
      { path: 'mentor/mentees/:menteeId', element: <MenteePage /> },
      { path: 'mentor/feedback', element: <FeedbackInboxPage /> },
      { path: 'mentor/feedback/:reflectionId', element: <FeedbackPage /> },
      { path: 'mentor/approvals', element: <ComingSoon /> },
      { path: 'mentor/pathways', element: <PathwaysLibraryPage /> },
      { path: 'mentor/pathways/:pathwayId', element: <BuilderPage /> },
      { path: 'mentor/pathways/:pathwayId/lessons/:lessonId', element: <LessonEditorPage /> },
      { path: 'leader/*', element: <ComingSoon /> },
      { path: 'admin/*', element: <ComingSoon /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function NotFound() {
  const t = useT();
  return <ErrorState title={t('states.notFoundTitle')} description={t('states.notFoundBody')} />;
}
export { Outlet };
