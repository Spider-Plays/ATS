import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Briefcase,
  Building2,
  CalendarClock,
  MessageSquareWarning,
  Plus,
  UserPlus,
  Users,
  UsersRound,
  Video,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import {
  canApproveRequirement,
  canManageUsers,
  canViewOffers,
  isAdminRole,
  requiresHrHeadDelegationForApproval,
  scopeInterviewsForUser,
} from '@/permissions'
import {
  activityLogLink,
  formatActivityTitle,
  hrOpsMetrics,
  interviewerMetrics,
  isScheduledToday,
  pipelineSegmentsFromCandidates,
  recruiterMetrics,
  relativeTime,
  sortInterviewsChronologically,
} from '@/pages/dashboard/dashboard.utils'
import { adminSetupMetrics } from '@/pages/admin/overview/overview.utils'
import {
  candidateStatusLabel,
} from '@/pages/candidates/_shared/candidate.utils'
import {
  formatInterviewDay,
  formatInterviewTime,
  isUpcoming,
  needsFeedback,
  stageLabel,
} from '@/pages/interviews/_shared/interview.utils'
import type {
  ActivityLog,
  Candidate,
  Interview,
  InterviewPanelLevel,
  Offer,
  Requirement,
  User,
} from '@/types'
import {
  StaffHomeActionsCard,
  StaffHomeAlert,
  StaffHomeFeedCard,
  StaffHomeHero,
  StaffHomeLoading,
  StaffHomePipelineCard,
  StaffHomeRingCard,
  initials,
  type PipelineSegment,
} from '@/pages/dashboard/StaffHomeSections'
import './dashboard.css'

function roleLabel(role: string | undefined, isPlatformAdmin: boolean): string {
  if (isPlatformAdmin) return 'Administration'
  if (role === 'HR_HEAD') return 'HR Head'
  if (role === 'HR_MANAGER') return 'HR Manager'
  if (role === 'RECRUITER') return 'Recruiter workspace'
  if (role === 'INTERVIEWER') return 'Interviewer workspace'
  return role?.replace(/_/g, ' ') ?? 'Workspace'
}

function FeedRow({
  to,
  avatarText,
  avatarClass,
  name,
  meta,
  badge,
  date,
}: {
  to: string
  avatarText: string
  avatarClass?: string
  name: string
  meta: string
  badge?: string
  badgeClass?: string
  date?: string
}) {
  return (
    <li>
      <Link to={to} className="portal-home-feed-row">
        <div className={clsx('portal-home-feed-row__avatar', avatarClass)}>
          {avatarText}
        </div>
        <div className="portal-home-feed-row__body">
          <p className="portal-home-feed-row__name">{name}</p>
          <p className="portal-home-feed-row__meta">{meta}</p>
        </div>
        <div className="portal-home-feed-row__right">
          {badge && <span className="portal-home-feed-row__badge">{badge}</span>}
          {date && <span className="portal-home-feed-row__date">{date}</span>}
        </div>
      </Link>
    </li>
  )
}

function AdminDashboard({
  requirements,
  candidates,
  activityLogs,
  users,
  interviews,
  departments,
  clients,
  skills,
  panelLevels,
  user,
}: {
  requirements: Requirement[]
  candidates: Candidate[]
  activityLogs: ActivityLog[]
  users: User[]
  interviews: Interview[]
  departments: { name: string }[]
  clients: { name: string }[]
  skills: { id: string }[]
  panelLevels: InterviewPanelLevel[]
  user: User | null
}) {
  const isPlatformAdmin = isAdminRole(user?.role)

  const setupKpis = useMemo(
    () =>
      adminSetupMetrics(
        users,
        departments.map((d) => d.name),
        clients.map((c) => c.name),
        skills,
        panelLevels,
      ),
    [users, departments, clients, skills, panelLevels],
  )

  const hrKpis = useMemo(
    () => hrOpsMetrics(requirements, candidates, interviews),
    [requirements, candidates, interviews],
  )

  const pending = useMemo(
    () => requirements.filter((r) => r.status === 'PENDING_APPROVAL').length,
    [requirements],
  )

  const segments = useMemo(
    () => pipelineSegmentsFromCandidates(candidates),
    [candidates],
  )

  const inPipeline = useMemo(
    () => candidates.filter((c) => c.status !== 'HIRED' && c.status !== 'REJECTED').length,
    [candidates],
  )

  const hired = useMemo(
    () => candidates.filter((c) => c.status === 'HIRED').length,
    [candidates],
  )

  const rejected = useMemo(
    () => candidates.filter((c) => c.status === 'REJECTED').length,
    [candidates],
  )

  const hireRate =
    candidates.length > 0 ? Math.round((hired / candidates.length) * 100) : 0

  const heroStats = isPlatformAdmin
    ? [
        { icon: Users, value: setupKpis.staffTotal, label: 'Staff' },
        { icon: Briefcase, value: setupKpis.departments + setupKpis.clients, label: 'Catalogs' },
        { icon: UsersRound, value: setupKpis.panelInterviewers, label: 'Panelists', accent: true },
      ]
    : [
        { icon: Briefcase, value: hrKpis.live, label: 'Live roles' },
        { icon: Users, value: hrKpis.candidates, label: 'Candidates' },
        { icon: CalendarClock, value: hrKpis.upcoming, label: 'Upcoming', accent: true },
      ]

  const actions = isPlatformAdmin
    ? [
        { to: '/admin/users', icon: UserPlus, label: 'Manage team', hint: `${setupKpis.staffTotal} staff`, tone: 'primary' as const },
        { to: '/admin', icon: Building2, label: 'Admin hub', hint: 'Configuration', tone: 'blue' as const },
        { to: '/requirements', icon: Briefcase, label: 'Requirements', hint: 'All roles', tone: 'violet' as const },
        { to: '/admin/interview-panels', icon: UsersRound, label: 'Panels', hint: 'Interviewers', tone: 'amber' as const },
      ]
    : [
        { to: '/requirements', icon: Briefcase, label: 'Requirements', hint: `${hrKpis.live} live`, tone: 'primary' as const },
        { to: '/candidates', icon: Users, label: 'Candidates', hint: `${hrKpis.candidates} total`, tone: 'blue' as const },
        { to: '/interviews', icon: Video, label: 'Interviews', hint: `${hrKpis.upcoming} upcoming`, tone: 'violet' as const },
        { to: '/offers', icon: Zap, label: 'Offers', hint: 'Manage offers', tone: 'amber' as const },
      ]

  return (
    <div className="portal-home">
      <StaffHomeHero
        name={user?.name ?? 'there'}
        avatar={user?.avatar}
        roleLabel={roleLabel(user?.role, isPlatformAdmin)}
        tagline={
          isPlatformAdmin
            ? 'Staff access, catalogs, interview panels, and workspace configuration at a glance.'
            : 'Track live roles, approvals, interviews, and hiring progress across your scope.'
        }
        stats={heroStats}
      />

      {pending > 0 && (
        <StaffHomeAlert
          title={`${pending} requirement${pending === 1 ? '' : 's'} awaiting approval`}
          text={
            canApproveRequirement(user?.role)
              ? requiresHrHeadDelegationForApproval(user?.role)
                ? 'Approve on behalf of HR Head to publish roles.'
                : 'Review and approve to publish roles.'
              : 'These roles are waiting for HR Head approval.'
          }
          linkTo="/requirements"
          linkLabel="Review queue"
        />
      )}

      <div className="portal-home-bento">
        <StaffHomePipelineCard
          title="Candidate pipeline"
          linkTo="/pipeline"
          linkLabel="Open pipeline"
          segments={segments}
          metrics={[
            { value: inPipeline, label: 'Active' },
            { value: hired, label: 'Hired', tone: 'success' },
            { value: rejected, label: 'Rejected', tone: 'muted' },
          ]}
          emptyTitle="No candidates yet"
          emptyText="Add candidates or open a job pipeline to see stage breakdown."
          emptyCta="View candidates"
          emptyCtaTo="/candidates"
        />

        <StaffHomeRingCard
          title="Hire rate"
          rate={hireRate}
          rateLabel="Hired"
          caption={`${hired} of ${candidates.length} candidates hired successfully`}
        />

        <StaffHomeFeedCard
          title="Recent activity"
          linkTo="/notifications"
          linkLabel="View all"
          emptyText="Actions across the ATS will appear here."
        >
          {activityLogs.slice(0, 6).map((log) => (
            <FeedRow
              key={log.id}
              to={activityLogLink(log) ?? '/notifications'}
              avatarText={(log.performerName ?? log.entityType).charAt(0).toUpperCase()}
              name={formatActivityTitle(log)}
              meta={`${log.performerName || 'System'}${log.performerRole ? ` · ${log.performerRole.replace(/_/g, ' ')}` : ''}`}
              date={relativeTime(log.timestamp)}
            />
          ))}
        </StaffHomeFeedCard>

        <StaffHomeActionsCard actions={actions} />
      </div>
    </div>
  )
}

function RecruiterDashboard({
  requirements,
  candidates,
  interviews,
  offers,
  user,
}: {
  requirements: Requirement[]
  candidates: Candidate[]
  interviews: Interview[]
  offers: Offer[]
  user: User | null
}) {
  const metrics = useMemo(
    () => recruiterMetrics(requirements, candidates, interviews, offers),
    [requirements, candidates, interviews, offers],
  )

  const segments = useMemo(
    () => pipelineSegmentsFromCandidates(candidates),
    [candidates],
  )

  const inPipeline = useMemo(
    () => candidates.filter((c) => c.status !== 'HIRED' && c.status !== 'REJECTED').length,
    [candidates],
  )

  const hired = metrics.hires
  const rejected = useMemo(
    () => candidates.filter((c) => c.status === 'REJECTED').length,
    [candidates],
  )

  const hireRate =
    candidates.length > 0 ? Math.round((hired / candidates.length) * 100) : 0

  const recentCandidates = useMemo(
    () =>
      [...candidates]
        .sort((a, b) => {
          const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return tb - ta
        })
        .slice(0, 6),
    [candidates],
  )

  return (
    <div className="portal-home">
      <StaffHomeHero
        name={user?.name ?? 'there'}
        avatar={user?.avatar}
        roleLabel={roleLabel(user?.role, false)}
        tagline="Track open roles, upcoming interviews, and pipeline momentum for today."
        stats={[
          { icon: Briefcase, value: metrics.live, label: 'Live roles' },
          { icon: Users, value: metrics.candidates, label: 'Candidates' },
          { icon: CalendarClock, value: metrics.upcoming, label: 'Upcoming', accent: true },
        ]}
      />

      <div className="portal-home-bento">
        <StaffHomePipelineCard
          title="Pipeline health"
          linkTo="/pipeline"
          linkLabel="Pipeline view"
          segments={segments}
          metrics={[
            { value: inPipeline, label: 'Active' },
            { value: hired, label: 'Hired', tone: 'success' },
            { value: rejected, label: 'Rejected', tone: 'muted' },
          ]}
          emptyTitle="No candidates yet"
          emptyText="Add candidates to your assigned roles to see pipeline analytics."
          emptyCta="Add candidate"
          emptyCtaTo="/candidates/new"
        />

        <StaffHomeRingCard
          title="Hire rate"
          rate={hireRate}
          rateLabel="Hired"
          caption={`${hired} of ${candidates.length} candidates hired successfully`}
        />

        <StaffHomeFeedCard
          title="Recent updates"
          linkTo="/candidates"
          linkLabel="View all"
          emptyText="Candidate stage changes will appear here."
        >
          {recentCandidates.map((c) => (
            <FeedRow
              key={c.id}
              to={`/candidates/${c.id}`}
              avatarText={initials(c.name)}
              name={c.name}
              meta={`Moved to ${candidateStatusLabel(c.status)}`}
              badge={candidateStatusLabel(c.status)}
              date={c.updatedAt ? relativeTime(c.updatedAt) : undefined}
            />
          ))}
        </StaffHomeFeedCard>

        <StaffHomeActionsCard
          actions={[
            { to: '/candidates/new', icon: Plus, label: 'Add candidate', hint: 'New profile', tone: 'primary' },
            { to: '/interviews/new', icon: Video, label: 'Schedule', hint: 'Interview', tone: 'blue' },
            { to: '/requirements', icon: Briefcase, label: 'Requirements', hint: `${metrics.live} live`, tone: 'violet' },
            { to: '/offers', icon: Zap, label: 'Offers', hint: `${metrics.offers} total`, tone: 'amber' },
          ]}
        />
      </div>
    </div>
  )
}

function InterviewerDashboard({
  interviews,
  user,
}: {
  interviews: Interview[]
  user: User | null
}) {
  const metrics = useMemo(() => interviewerMetrics(interviews), [interviews])

  const feedbackQueue = useMemo(
    () => sortInterviewsChronologically(interviews.filter(needsFeedback)),
    [interviews],
  )

  const upcomingInterviews = useMemo(
    () =>
      sortInterviewsChronologically(interviews.filter(isUpcoming)).slice(0, 6),
    [interviews],
  )

  const segments = useMemo((): PipelineSegment[] => {
    const upcoming = interviews.filter(isUpcoming).length
    const feedback = interviews.filter(needsFeedback).length
    const decided = metrics.decided
    const rows = [
      { key: 'upcoming', label: 'Upcoming', count: upcoming, color: '#3b82f6' },
      { key: 'feedback', label: 'Needs feedback', count: feedback, color: '#f59e0b' },
      { key: 'decided', label: 'Decided', count: decided, color: '#10b981' },
    ].filter((r) => r.count > 0)
    const total = rows.reduce((s, r) => s + r.count, 0)
    return rows.map((r) => ({
      ...r,
      pct: total > 0 ? (r.count / total) * 100 : 0,
    }))
  }, [interviews, metrics.decided])

  const feedbackRate =
    interviews.length > 0
      ? Math.round((metrics.decided / interviews.length) * 100)
      : 0

  return (
    <div className="portal-home">
      <StaffHomeHero
        name={user?.name ?? 'there'}
        avatar={user?.avatar}
        roleLabel={roleLabel(user?.role, false)}
        tagline="Your assigned interviews, feedback tasks, and candidate profiles in one place."
        stats={[
          { icon: CalendarClock, value: metrics.today, label: 'Today' },
          { icon: Video, value: metrics.upcoming, label: 'Upcoming' },
          { icon: MessageSquareWarning, value: metrics.feedback, label: 'Feedback', accent: true },
        ]}
      />

      {feedbackQueue.length > 0 && (
        <StaffHomeAlert
          title={`${feedbackQueue.length} interview${feedbackQueue.length === 1 ? '' : 's'} need your feedback`}
          text="Submit feedback after each session so recruiting can move candidates forward."
          linkTo="/interviews"
          linkLabel="View all"
        />
      )}

      <div className="portal-home-bento">
        <StaffHomePipelineCard
          title="Interview workload"
          linkTo="/interviews"
          linkLabel="My interviews"
          segments={segments}
          metrics={[
            { value: metrics.upcoming, label: 'Upcoming' },
            { value: metrics.feedback, label: 'Feedback', tone: 'warn' },
            { value: metrics.decided, label: 'Decided', tone: 'success' },
          ]}
          emptyTitle="No interviews yet"
          emptyText="When you are assigned to interviews, workload breakdown will appear here."
          emptyCta="View interviews"
          emptyCtaTo="/interviews"
        />

        <StaffHomeRingCard
          title="Completion rate"
          rate={feedbackRate}
          rateLabel="Decided"
          caption={`${metrics.decided} of ${interviews.length} interviews completed with a decision`}
        />

        <StaffHomeFeedCard
          title="Upcoming sessions"
          linkTo="/interviews"
          linkLabel="Calendar"
          emptyText="Upcoming interviews assigned to you will appear here."
        >
          {upcomingInterviews.map((iv) => (
            <FeedRow
              key={iv.id}
              to={`/interviews/${iv.id}/resume`}
              avatarText={initials(iv.candidateName ?? 'C')}
              name={iv.candidateName ?? 'Candidate'}
              meta={`${stageLabel(iv)}${iv.candidateRole ? ` · ${iv.candidateRole}` : ''}`}
              badge={formatInterviewTime(new Date(iv.scheduledAt))}
              date={formatInterviewDay(new Date(iv.scheduledAt))}
            />
          ))}
        </StaffHomeFeedCard>

        <StaffHomeActionsCard
          actions={[
            { to: '/interviews', icon: Video, label: 'My interviews', hint: `${metrics.upcoming} upcoming`, tone: 'primary' },
            { to: '/interviews', icon: MessageSquareWarning, label: 'Feedback', hint: `${metrics.feedback} pending`, tone: 'amber' },
            { to: '/notifications', icon: Activity, label: 'Notifications', hint: 'Stay updated', tone: 'blue' },
            { to: '/interviews', icon: CalendarClock, label: 'Today', hint: `${metrics.today} sessions`, tone: 'violet' },
          ]}
        />
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const role = user?.role || 'RECRUITER'
  const isInterviewer = role === 'INTERVIEWER'
  const isPlatformAdmin = isAdminRole(role)
  const isHrLeadership = role === 'HR_HEAD' || role === 'HR_MANAGER'
  const isAdminOrHR = isPlatformAdmin || isHrLeadership

  const { data: requirements = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
    enabled: !isInterviewer,
  })
  const { data: candidates = [], isLoading: loadingCands } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
    enabled: !isInterviewer,
  })
  const { data: interviews = [], isLoading: loadingInts } = useQuery({
    queryKey: ['interviews'],
    queryFn: api.interviews.list,
    enabled: isInterviewer || !isPlatformAdmin,
  })
  const { data: offers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: api.offers.list,
    enabled: canViewOffers(role) && !isPlatformAdmin,
  })
  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activityLogs', 'dashboard'],
    queryFn: () => api.activityLogs.list(20),
    enabled: isAdminOrHR,
  })
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: api.users.list,
    enabled: isPlatformAdmin,
  })
  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
    enabled: isPlatformAdmin,
  })
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['client-catalog'],
    queryFn: api.clients.list,
    enabled: isPlatformAdmin,
  })
  const { data: skills = [], isLoading: loadingSkills } = useQuery({
    queryKey: ['skill-catalog'],
    queryFn: api.skills.list,
    enabled: isPlatformAdmin,
  })
  const { data: panelLevels = [], isLoading: loadingPanels } = useQuery({
    queryKey: ['interview-panels'],
    queryFn: api.interviewPanels.list,
    enabled: isPlatformAdmin,
  })

  const scopedInterviews = useMemo(
    () => scopeInterviewsForUser(interviews, role, user?.uid),
    [interviews, role, user?.uid],
  )

  const isLoading = isInterviewer
    ? loadingInts
    : isAdminOrHR
      ? isPlatformAdmin
        ? loadingReqs ||
          loadingCands ||
          loadingLogs ||
          loadingUsers ||
          loadingDepts ||
          loadingClients ||
          loadingSkills ||
          loadingPanels
        : loadingReqs || loadingCands || loadingLogs || loadingInts
      : loadingReqs || loadingCands || loadingInts || loadingOffers

  if (isLoading) {
    return <StaffHomeLoading />
  }

  if (isInterviewer) {
    return <InterviewerDashboard interviews={scopedInterviews} user={user} />
  }

  if (isAdminOrHR) {
    return (
      <AdminDashboard
        requirements={requirements}
        candidates={candidates}
        activityLogs={activityLogs}
        users={users}
        interviews={scopedInterviews}
        departments={departments}
        clients={clients}
        skills={skills}
        panelLevels={panelLevels}
        user={user}
      />
    )
  }

  return (
    <RecruiterDashboard
      requirements={requirements}
      candidates={candidates}
      interviews={scopedInterviews}
      offers={offers}
      user={user}
    />
  )
}

export default Dashboard
