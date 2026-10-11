import type { Group, Id, Membership, Organisation, Role, User } from '@/types';

export const uid = (k: string) => `usr_${k}` as Id<'usr'>;
export const ORG_A = 'org_lanternhill' as Id<'org'>;
export const ORG_B = 'org_northgate' as Id<'org'>;

type P = [key: string, name: string, country: string, locale: User['locale'], tz: string, bio: string];
const people: P[] = [
  ['helena', 'Helena Costa', 'AO', 'pt', 'Africa/Luanda', 'Coordinates ministry life at Lantern Hill. Likes spreadsheets and long walks.'],
  ['grace', 'Grace Wanjiru', 'KE', 'en', 'Africa/Nairobi', 'Elder and mentor. Works in logistics by day; mentors six people on weekday evenings.'],
  ['daniel', 'Daniel Osei', 'GH', 'en', 'Africa/Accra', 'Retired schoolteacher who mentors young adults.'],
  ['esperance', 'Esperance Uwase', 'RW', 'en', 'Africa/Kigali', 'Nurse and mentor. Prays on night shifts.'],
  ['marcos', 'Marcos Almeida', 'BR', 'pt', 'America/Sao_Paulo', 'Engineer, mentor and amateur guitarist.'],
  ['kwabena', 'Kwabena Mensah', 'GH', 'en', 'Africa/Accra', 'Campus student and cell group leader.'],
  ['sofia', 'Sofía Ramírez', 'MX', 'en', 'America/Mexico_City', 'Designer and leader of the Sunday Seekers.'],
  ['thandiwe', 'Thandiwe Dlamini', 'ZA', 'en', 'Africa/Johannesburg', 'Teacher and leader of Riverside Prayer.'],
  ['adaeze', 'Adaeze Okafor', 'NG', 'en', 'Africa/Lagos', 'Completing national service in Lagos. New to faith, full of questions.'],
  ['tomas', 'Tomás Ferreira', 'MZ', 'pt', 'Africa/Maputo', 'Lifelong churchgoer who wants to read more carefully.'],
  ['jinwoo', 'Jin-woo Park', 'KR', 'en', 'Asia/Seoul', 'Graduate student studying in Accra.'],
  ['mateus', 'Mateus Silva', 'BR', 'pt', 'America/Sao_Paulo', 'Software developer in São Paulo.'],
  ['fatima', 'Fatima Bello', 'NG', 'ha', 'Africa/Lagos', 'Pharmacist from Kano.'],
  ['olumide', 'Olumide Adeyemi', 'NG', 'yo', 'Africa/Lagos', 'Architect in Ibadan.'],
  ['ngozi', 'Ngozi Nwosu', 'NG', 'ig', 'Africa/Lagos', 'Primary school teacher in Enugu.'],
  ['salma', 'Salma Hassan', 'EG', 'en', 'Africa/Cairo', 'Doctoral researcher in Cairo.'],
  ['maria', 'Maria Santos', 'PH', 'en', 'Asia/Manila', 'Nurse working abroad, joining online.'],
  ['ananya', 'Ananya Iyer', 'IN', 'en', 'Asia/Kolkata', 'Data analyst in Chennai.'],
  ['oliver', 'Oliver Bennett', 'GB', 'en', 'Europe/London', 'Carpenter from Leeds.'],
  ['wanjiku', 'Wanjiku Kamau', 'KE', 'en', 'Africa/Nairobi', 'University student in Nairobi.'],
  ['yaw', 'Yaw Boateng', 'GH', 'en', 'Africa/Accra', 'Taxi driver and father of three.'],
  ['amina', 'Amina Yusuf', 'NG', 'ha', 'Africa/Lagos', 'Nursing student.'],
  ['chidi', 'Chidi Eze', 'NG', 'en', 'Africa/Lagos', 'Bank clerk in Abuja.'],
  ['esther', 'Esther Mwangi', 'KE', 'en', 'Africa/Nairobi', 'Shop owner in Eldoret.'],
  ['joao', 'João Pereira', 'AO', 'pt', 'Africa/Luanda', 'Mechanic in Luanda.'],
  ['lindiwe', 'Lindiwe Khumalo', 'ZA', 'en', 'Africa/Johannesburg', 'Nurse in Durban.'],
  ['sipho', 'Sipho Ndlovu', 'ZA', 'en', 'Africa/Johannesburg', 'Electrician in Bulawayo.'],
  ['priya', 'Priya Nair', 'IN', 'en', 'Asia/Kolkata', 'Exploring on her own for now.'],
  ['ravi', 'Ravi Menon', 'IN', 'en', 'Asia/Kolkata', 'Campus fellowship coordinator at Northgate.'],
  ['hannah', 'Hannah Lindqvist', 'SE', 'en', 'Europe/Stockholm', 'Exchange student.'],
];

export const users: User[] = people.map(([key, name, country, locale, tz, bio]) => ({
  id: uid(key), displayName: name, email: `${key}@example.org`, avatarUrl: null, bio, country, locale, timeZone: tz, createdAt: '2026-04-01T08:00:00Z',
}));

export const orgA: Organisation = {
  id: ORG_A, name: 'Lantern Hill Community Church', slug: 'lantern-hill', kind: 'church', country: 'KE',
  branding: { logoUrl: null, accent: 'clay', welcomeMessage: 'You are welcome here, whatever you are carrying.' },
  settings: { defaultLocale: 'en', defaultPrayerPrivacy: 'group', attentionAfterDays: 14, reflectionResponseTargetDays: 3, aiCompanionEnabled: true, memberDirectory: 'groups' },
  createdAt: '2026-04-01T08:00:00Z',
};
export const orgB: Organisation = {
  id: ORG_B, name: 'Northgate Campus Fellowship', slug: 'northgate', kind: 'campus', country: 'GH',
  branding: { logoUrl: null, accent: 'slate', welcomeMessage: 'Pull up a chair.' },
  settings: { defaultLocale: 'en', defaultPrayerPrivacy: 'group', attentionAfterDays: 10, reflectionResponseTargetDays: 4, aiCompanionEnabled: false, memberDirectory: 'groups' },
  createdAt: '2026-05-10T08:00:00Z',
};

const roleMap: Record<string, Role[]> = {
  helena: ['admin'], grace: ['mentor'], daniel: ['mentor'], esperance: ['mentor'], marcos: ['mentor'],
  kwabena: ['student', 'leader'], sofia: ['student', 'leader'], thandiwe: ['student', 'leader'],
};
const orgAKeys = people.map((p) => p[0]).filter((k) => !['priya', 'ravi', 'hannah'].includes(k));

export function memberships(activeDays: Record<string, number | null>, daysAgo: (n: number) => string): Membership[] {
  const out: Membership[] = orgAKeys.map((k) => ({
    id: `mem_${k}_a` as Id<'mem'>, userId: uid(k), orgId: ORG_A, roles: roleMap[k] ?? ['student'], status: 'active', joinedAt: '2026-04-02T08:00:00Z',
    lastActiveAt: activeDays[k] === undefined || activeDays[k] === null ? null : daysAgo(activeDays[k] as number),
  }));
  out.push(
    { id: 'mem_ravi_b' as Id<'mem'>, userId: uid('ravi'), orgId: ORG_B, roles: ['admin', 'mentor'], status: 'active', joinedAt: '2026-05-10T08:00:00Z', lastActiveAt: daysAgo(1) },
    { id: 'mem_hannah_b' as Id<'mem'>, userId: uid('hannah'), orgId: ORG_B, roles: ['student'], status: 'active', joinedAt: '2026-05-12T08:00:00Z', lastActiveAt: daysAgo(2) },
    { id: 'mem_kwabena_b' as Id<'mem'>, userId: uid('kwabena'), orgId: ORG_B, roles: ['leader'], status: 'active', joinedAt: '2026-05-12T08:00:00Z', lastActiveAt: daysAgo(3) },
  );
  return out;
}

export const assignments: Record<string, string[]> = {
  grace: ['adaeze', 'tomas', 'fatima', 'olumide'],
  daniel: ['jinwoo', 'mateus', 'ngozi'],
  esperance: ['salma', 'maria', 'ananya', 'wanjiku'],
  marcos: ['oliver', 'yaw', 'amina', 'chidi'],
};

export interface SeedGroup { key: string; name: string; description: string; leaders: string[]; members: string[]; weekday: number; time: string; location: string; pathway?: string }
export const seedGroups: SeedGroup[] = [
  { key: 'thursday', name: 'Thursday Table', description: 'A relaxed group working through Foundations of Faith over a shared meal.', leaders: ['kwabena'], members: ['adaeze', 'tomas', 'fatima', 'olumide', 'ngozi', 'jinwoo', 'mateus'], weekday: 4, time: '18:30', location: 'Fellowship hall, back room', pathway: 'foundations' },
  { key: 'sunday', name: 'Sunday Seekers', description: 'Reading the Gospel of Mark together after the morning service.', leaders: ['sofia'], members: ['salma', 'maria', 'ananya', 'wanjiku', 'oliver', 'yaw'], weekday: 0, time: '13:00', location: 'Online (video call)', pathway: 'mark' },
  { key: 'riverside', name: 'Riverside Prayer', description: 'Midweek prayer for the church and the neighbourhood.', leaders: ['thandiwe'], members: ['amina', 'chidi', 'esther', 'joao', 'lindiwe', 'sipho', 'grace'], weekday: 3, time: '19:00', location: 'Riverside Community Centre' },
  { key: 'leaders', name: "Leaders' Circle", description: 'A monthly gathering for group leaders to learn and encourage each other.', leaders: ['helena'], members: ['kwabena', 'sofia', 'thandiwe', 'grace', 'daniel'], weekday: 6, time: '10:00', location: 'Church office', pathway: 'leading' },
];

export const groupFrom = (g: SeedGroup, pathwayId: Id<'pth'> | null, nowIso: string): Group => ({
  id: `grp_${g.key}` as Id<'grp'>, orgId: ORG_A, name: g.name, description: g.description, leaderIds: g.leaders.map(uid), privacy: 'open_to_org', pathwayId,
  schedule: { recurrence: 'weekly', weekday: g.weekday as 0, startTime: g.time, durationMin: 90, timeZone: 'Africa/Nairobi', location: g.location, videoUrl: null },
  memberCount: g.members.length + g.leaders.length, archivedAt: null, createdAt: nowIso,
});
