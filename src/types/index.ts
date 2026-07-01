export type RequirementStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'LIVE'
    | 'ON_HOLD'
    | 'CLOSED'
    | 'CANCELLED'
    | 'REJECTED'

export type RequirementHiringStage =
    | 'SOURCING'
    | 'L1_INTERVIEW'
    | 'L2_INTERVIEW'
    | 'HR_INTERVIEW'
    | 'TO_BE_OFFERED'
    | 'OFFERED'
    | 'JOINED'

export interface ApprovalHistory {
    action:
        | 'REQUESTED'
        | 'APPROVED'
        | 'REJECTED'
        | 'CLOSED'
        | 'CANCELLED'
        | 'ON_HOLD'
        | 'RESUMED'
        | 'HIRING_STAGE_CHANGED'
        | 'RECRUITER_ASSIGNED'
        | 'RECRUITER_UNASSIGNED'
        | 'PORTAL_SHOWN'
        | 'PORTAL_HIDDEN'
        | 'REFERRAL_PORTAL_SHOWN'
        | 'REFERRAL_PORTAL_HIDDEN'
    by: string // User ID
    at: string // ISO Date
    role: string // User Role
    comments?: string
    /** Set when Admin approves/rejects on behalf of HR Head */
    onBehalfOf?: 'HR_HEAD'
    recruiterId?: string
}

export type RequirementVersionKind = 'UPDATE' | 'CANDIDATE_LINKED'

export interface RequirementVersionLinkedCandidate {
    id: string
    name: string
    email: string
    status: string
    matchScore: number
}

export interface RequirementVersionMatchingProfile {
    candidateId: string
    name: string
    matchScore: number
    alreadyLinked: boolean
    linkedToOther: boolean
}

export interface RequirementVersion {
    version: number
    changedBy: string // User ID
    changedAt: string // ISO Date
    kind?: RequirementVersionKind
    changes: Record<string, unknown>
    linkedCandidates?: RequirementVersionLinkedCandidate[]
    matchingProfiles?: RequirementVersionMatchingProfile[]
}

export interface Requirement {
    id: string
    jobCode?: string
    client?: string
    title: string
    department: string
    hiringManager: string
    accountManager?: string
    status: RequirementStatus
    hiringStage?: RequirementHiringStage
    liveAt?: string
    onHoldAt?: string
    openings: number
    filled: number
    createdAt: string
    updatedAt: string
    recruiters: string[] // User IDs
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    location?: string
    locationCity?: string
    isRemote?: boolean
    workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE'
    employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
    seniorityLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL'
    experienceMinYears?: number
    experienceMaxYears?: number
    salaryBand?: string
    targetStartDate?: string
    hiringDeadline?: string
    description?: string
    jobDescription?: string
    primarySkills?: string[]
    secondarySkills?: string[]
    createdBy?: string
    createdByRole?: string

    // Approval Workflow
    approval?: {
        decision: 'APPROVED' | 'REJECTED' | 'PENDING'
        decidedBy?: string
        decidedAt?: string
        onBehalfOf?: 'HR_HEAD'
        performedByRole?: string
    }
    approvalHistory?: ApprovalHistory[]

    // Versioning
    versions?: RequirementVersion[]
    currentVersion?: number
    visibleToCandidates?: boolean
    visibleToVendors?: boolean
    visibleToReferrals?: boolean
    referralBonusAmount?: number
    closureReason?: string
    closedAt?: string
}

export type BusinessStageKey =
    | 'INITIAL_DISCUSSION'
    | 'PROPOSAL_SENT'
    | 'NEGOTIATION'
    | 'SOW_SIGNED'
    | 'CONFIRMED'

export type BusinessRequirementStatus = 'ACTIVE' | 'OPEN_TO_HIRING' | 'CANCELLED'

export interface BusinessRequirementStageHistoryEntry {
    stage: BusinessStageKey
    percentage: number
    by: string
    at: string
    role?: string
    description?: string
}

export interface BusinessRequirement {
    id: string
    title: string
    client?: string
    department: string
    accountManager: string
    hiringManager: string
    businessStage: BusinessStageKey
    stagePercentage: number
    status: BusinessRequirementStatus
    publishedRequirementId?: string
    stageHistory: BusinessRequirementStageHistoryEntry[]
    openings: number
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    location?: string
    locationCity?: string
    isRemote?: boolean
    workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE'
    employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
    seniorityLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL'
    experienceMinYears?: number
    experienceMaxYears?: number
    salaryBand?: string
    targetStartDate?: string
    hiringDeadline?: string
    description?: string
    jobDescription?: string
    primarySkills?: string[]
    secondarySkills?: string[]
    createdBy?: string
    createdByRole?: string
    createdAt: string
    updatedAt: string
}

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface Vendor {
    id: string
    name: string
    code?: string
    email: string
    phone?: string
    website?: string
    address?: string
    contactName?: string
    status: VendorStatus
    notes?: string
    createdAt: string
    updatedAt: string
    userCount?: number
    submissionCount?: number
    assignmentCount?: number
}

export interface VendorAssignment {
    id: string
    requirementId: string
    assignedAt: string
    title?: string
    jobCode?: string | null
    status?: string
    department?: string
}

export interface VendorDetail extends Vendor {
    users: User[]
    assignments: VendorAssignment[]
    submissions: {
        id: string
        name: string
        email: string
        status: string
        jobTitle?: string | null
        requirementId?: string | null
        createdAt: string
    }[]
}

export type CandidateStatus =
  | 'ADDED'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'

export interface Candidate {
    id: string
    name: string
    email: string
    role: string
    status: CandidateStatus
    matchScore: number
    source: string
    appliedDate: string
    requirementId?: string // Link to specific job requirement
    jobTitle?: string // Denormalized for display
    reqId?: string // Requirement job code
    client?: string
    createdBy?: string
    recruiterName?: string
    avatar?: string
    resumeFileName?: string
    resumeMimeType?: string
    resumeUrl?: string
    hasResume?: boolean
    phone?: string
    location?: string
    linkedIn?: string
    portfolio?: string
    totalExperience?: string
    currentCompany?: string
    currentCTC?: string
    expectedCTC?: string
    noticePeriod?: string
    pan?: string
    vendorId?: string
    submittedByUserId?: string
    referredByUserId?: string
    referredByName?: string
    referredByEmail?: string
    referredByDepartment?: string
    referredByReferralCode?: string
    referralRelationship?: string
    referralNotes?: string
    primarySkills?: string[]
    secondarySkills?: string[]
    offerDate?: string
    offerMonth?: string
    offerQuarter?: string
    expectedJoiningDate?: string
    joiningDate?: string
    joiningMonth?: string
    joiningQuarter?: string
    createdAt?: string
    updatedAt?: string
}

export interface ProfileMatchBreakdown {
    primaryScore: number
    secondaryScore: number
    jdScore: number
    matchedPrimary: string[]
    matchedSecondary: string[]
}

export interface MatchingProfile {
    candidateId: string
    matchScore: number
    breakdown: ProfileMatchBreakdown
    alreadyLinked: boolean
    linkedToOther: boolean
    candidate: Candidate
}

export interface InterviewPlanStage {
    id: string
    order: number
    name: string
    interviewType: Interview['type']
    defaultDuration: number
    defaultInterviewerIds: string[]
}

export interface InterviewPlan {
    id: string
    requirementId: string
    stages: InterviewPlanStage[]
}

export interface InterviewPanelLevel {
    id: string
    order: number
    name: string
    interviewerIds: string[]
}

export type InterviewStageProgressStatus =
    | 'locked'
    | 'available'
    | 'scheduled'
    | 'awaiting_feedback'
    | 'completed'
    | 'failed'

export interface InterviewStageProgress {
    id: string
    order: number
    name: string
    interviewType: Interview['type']
    defaultDuration: number
    defaultInterviewerIds: string[]
    allowedInterviewerIds: string[]
    usesCombinedPanel: boolean
    panelRestrictionLabel: string
    status: InterviewStageProgressStatus
    canSchedule: boolean
    interviewId?: string
}

export interface CandidateInterviewProgress {
    planId: string
    requirementId: string
    candidateId: string
    candidateInInterviewStage: boolean
    stages: InterviewStageProgress[]
    nextSchedulableStageId: string | null
}

export interface Interview {
    id: string
    candidateId: string
    requirementId: string
    planStageId?: string
    stageName?: string
    stageOrder?: number
    scheduledAt: string
    interviewerIds: string[] // Array of user IDs
    type: 'SCREENING' | 'TECHNICAL' | 'CULTURAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL'
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    meetingLink?: string
    duration?: number // in minutes
    location?: string
    description?: string
    candidateName?: string
    candidateRole?: string
    candidateEmail?: string
    candidateHasResume?: boolean
    hasFeedback?: boolean
    feedbackRecommendation?: Feedback['recommendation']
}

export interface Feedback {
    id: string
    interviewId: string
    interviewerId: string
    candidateId: string
    rating: number // Overall 1-5
    technicalRating?: number
    communicationRating?: number
    comments: string
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'ON_HOLD' | 'NO_HIRE' | 'STRONG_NO_HIRE'
    formData?: import('../config/interviewFeedbackForm').InterviewFeedbackFormData
    interviewerName?: string
    createdAt: string
}

export type OfferStatus =
  | 'DRAFT'
  | 'PENDING_HR_APPROVAL'
  | 'PENDING_EXEC_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'NEGOTIATION'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN'

export type CompensationLine = {
  key: string
  label: string
  annual: number
  monthly: number
}

export type CompensationBreakdown = {
  annualCtc: number
  earnings: CompensationLine[]
  gross: CompensationLine
  employerContributions: CompensationLine[]
  totalCtc: CompensationLine
  employeeDeductions: CompensationLine[]
  totalDeduction: CompensationLine
  netPay: CompensationLine
}

export type CompensationConfig = {
  basicPercentOfCtc: number
  hraPercentOfBasic: number
  statBonusPercentOfBasic: number
  ltaPercentOfBasic: number
  mealAllowanceAnnual: number
  mobileAllowanceAnnual: number
  siteAllowanceAnnual: number
  employerPfPercentOfBasic: number
  pfAdminPercentOfBasic: number
  insuranceAnnual: number
  employerLwfAnnual: number
  employeeLwfAnnual: number
}

export type OfferLetterOrgSettings = {
  legalEntityName: string
  returnAddress: string
  timesheetAddress: string
  reportingTime: string
  acceptanceDeadlineDays: number
  annualLeaveDays: number
  noticePeriodDays: number
  reviewPeriodMonths: number
}

export type OfferLetterTemplate = {
  orgSettings: OfferLetterOrgSettings
  coverPageHtml: string
  agreementIntroHtml: string
  clausePages: string[]
  declarationPageHtml: string
}

export type OfferLetterMeta = {
  candidateAddress?: string
  positionTitle?: string
  joiningDate?: string
  clientCompanyName?: string
  clientSiteAddress?: string
  reportingTime?: string
  acceptanceDeadlineDays?: number
}

export type OfferApprovalHistoryEntry = {
  action: string
  step?: string
  by: string
  at: string
  role: string
  onBehalfOf?: string
  reason?: string
  comment?: string
}

export type OfferApprovalStage = {
  id: string
  label: string
  approverIds: string[]
}

export type OfferApprovalChain = {
  stages: OfferApprovalStage[]
}

export interface Offer {
    id: string
    candidateId: string
    requirementId: string
    baseSalary: number
    annualCtc?: number
    equity?: number
    bonus?: number
    status: OfferStatus
    history: {
        id: string
        date: string
        action: string
        description: string
        userId: string
    }[]
    letterContent?: string
    compensation?: CompensationBreakdown
    letterMeta?: OfferLetterMeta
    letterHtml?: string
    approval?: Record<string, unknown>
    approvalHistory?: OfferApprovalHistoryEntry[]
    approvalChain?: OfferApprovalStage[]
    approvalStep?: string
    rejectionReason?: string
    validUntil?: string
    sentAt?: string
    respondedAt?: string
    respondedBy?: string
    createdAt: string
    createdBy: string
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_HEAD'
  | 'HR_MANAGER'
  | 'FINANCE_HEAD'
  | 'RECRUITER'
  | 'TEAM_LEAD'
  | 'HIRING_MANAGER'
  | 'ACCOUNT_MANAGER'
  | 'INTERVIEWER'
  | 'CANDIDATE'
  | 'VENDOR'
  | 'EMPLOYEE'

export type FeatureTagKey = 'careers' | 'employee_referral' | 'mis';

export interface User {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    /** Feature module access (Careers, MIS, etc.) — assigned by admins */
    tags: FeatureTagKey[];
    themePreference: 'light' | 'dark' | 'system';
    createdAt: string;
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    resumeUrl?: string;
    status?: 'ACTIVE' | 'DISABLED';
    authProvider?: string;
    department?: string;
    lastLogin?: string;
    vendorId?: string;
    /** True after admin-created account — user must set a new password on first sign-in */
    mustChangePassword?: boolean;
}

export interface LoginHistoryEntry {
    id: string;
    userId: string;
    loggedInAt: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface ActivityLog {
    id: string
    entityType: 'REQUIREMENT' | 'CANDIDATE' | 'OFFER' | 'INTERVIEW'
    entityId: string
    action: string
    performedBy: string // User ID
    performerName?: string
    performerRole?: string
    timestamp: string
    details?: any
}
