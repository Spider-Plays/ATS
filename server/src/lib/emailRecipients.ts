import { prisma } from './prisma.js'

export async function getUserEmailsByIds(userIds: string[]): Promise<Array<{ id: string; email: string; name: string }>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return []
  const users = await prisma.user.findMany({
    where: { id: { in: unique }, status: 'ACTIVE' },
    select: { id: true, email: true, name: true },
  })
  return users
}

export async function getRequirementRecruiterEmails(requirementId: string | null | undefined): Promise<
  Array<{ email: string; name: string }>
> {
  if (!requirementId) return []
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: { recruiters: true, createdBy: true, hiringManager: true },
  })
  if (!requirement) return []

  const recruiterIds: string[] = JSON.parse(requirement.recruiters || '[]')
  const ids = [...new Set([...recruiterIds, requirement.createdBy, requirement.hiringManager].filter(Boolean) as string[])]
  const users = await getUserEmailsByIds(ids)
  return users.map((u) => ({ email: u.email, name: u.name }))
}

export async function getInterviewerUsers(interviewerIdsJson: string): Promise<Array<{ email: string; name: string }>> {
  let ids: string[] = []
  try {
    ids = JSON.parse(interviewerIdsJson || '[]')
  } catch {
    ids = []
  }
  const users = await getUserEmailsByIds(ids)
  return users.map((u) => ({ email: u.email, name: u.name }))
}

export async function getVendorUserEmails(vendorId: string): Promise<Array<{ email: string; name: string }>> {
  const users = await prisma.user.findMany({
    where: { vendorId, status: 'ACTIVE', role: 'VENDOR' },
    select: { email: true, name: true },
  })
  return users
}

export async function getUserEmailsByRoles(
  roles: string[]
): Promise<Array<{ email: string; name: string }>> {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, status: 'ACTIVE' },
    select: { email: true, name: true },
  })
  return users
}

/** Hiring manager, account manager, and super admins for business requirement stage alerts. */
export async function getBusinessRequirementStageNotificationRecipients(businessReq: {
  accountManager: string
  hiringManager: string
}): Promise<Array<{ email: string; name: string }>> {
  const stakeholderIds = [businessReq.accountManager, businessReq.hiringManager].filter(Boolean)
  const [stakeholders, superAdmins] = await Promise.all([
    getUserEmailsByIds(stakeholderIds),
    getUserEmailsByRoles(['SUPER_ADMIN']),
  ])
  const seen = new Set<string>()
  const out: Array<{ email: string; name: string }> = []
  for (const u of [...stakeholders, ...superAdmins]) {
    if (!u.email || seen.has(u.email)) continue
    seen.add(u.email)
    out.push({ email: u.email, name: u.name })
  }
  return out
}
