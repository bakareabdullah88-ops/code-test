import type { Icon } from '@phosphor-icons/react';
import {
  BookOpenText, CalendarBlank, ChartBar, ChatsCircle, ChatCircleText, GearSix, HandHeart, House, IdentificationBadge,
  NotePencil, Path, SealCheck, Signpost, SquaresFour, UsersThree, Users,
} from '@phosphor-icons/react';

export type Lens = 'learn' | 'mentor' | 'lead' | 'admin';

export interface NavItem {
  key: string;
  href: string;
  /** Key within the `nav.<lens>` message namespace. */
  labelKey: string;
  icon: Icon;
  /** Exact-match only (for lens home routes). */
  exact?: boolean;
}

export const lensHome: Record<Lens, string> = { learn: '/app/today', mentor: '/mentor', lead: '/leader', admin: '/admin' };
export const lensPrefix: Record<Lens, string> = { learn: '/app', mentor: '/mentor', lead: '/leader', admin: '/admin' };

export const navByLens: Record<Lens, NavItem[]> = {
  learn: [
    { key: 'today', href: '/app/today', labelKey: 'today', icon: House },
    { key: 'journey', href: '/app/journey', labelKey: 'journey', icon: Path },
    { key: 'bible', href: '/app/bible', labelKey: 'bible', icon: BookOpenText },
    { key: 'journal', href: '/app/journal', labelKey: 'journal', icon: NotePencil },
    { key: 'community', href: '/app/community', labelKey: 'community', icon: UsersThree },
  ],
  mentor: [
    { key: 'attention', href: '/mentor', labelKey: 'attention', icon: HandHeart, exact: true },
    { key: 'mentees', href: '/mentor/mentees', labelKey: 'mentees', icon: Users },
    { key: 'feedback', href: '/mentor/feedback', labelKey: 'feedback', icon: ChatCircleText },
    { key: 'pathways', href: '/mentor/pathways', labelKey: 'pathways', icon: Signpost },
    { key: 'approvals', href: '/mentor/approvals', labelKey: 'approvals', icon: SealCheck },
  ],
  lead: [
    { key: 'groups', href: '/leader', labelKey: 'groups', icon: UsersThree, exact: true },
    { key: 'schedule', href: '/leader/schedule', labelKey: 'schedule', icon: CalendarBlank },
    { key: 'discussion', href: '/leader/discussion', labelKey: 'discussion', icon: ChatsCircle },
    { key: 'members', href: '/leader/members', labelKey: 'members', icon: IdentificationBadge },
  ],
  admin: [
    { key: 'overview', href: '/admin', labelKey: 'overview', icon: SquaresFour, exact: true },
    { key: 'members', href: '/admin/members', labelKey: 'members', icon: Users },
    { key: 'groups', href: '/admin/groups', labelKey: 'groups', icon: UsersThree },
    { key: 'reports', href: '/admin/reports', labelKey: 'reports', icon: ChartBar },
    { key: 'settings', href: '/admin/settings', labelKey: 'settings', icon: GearSix },
  ],
};

export function lensFromPathname(pathname: string): Lens {
  if (pathname.startsWith('/mentor')) return 'mentor';
  if (pathname.startsWith('/leader')) return 'lead';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'learn';
}

export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
