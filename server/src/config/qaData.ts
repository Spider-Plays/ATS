/** Minimal dataset for QA / UAT testing (`npm run db:reset-qa`). */

import { devUserEmail, devUserName, DEV_PASSWORD } from './devUsers.js'

export const QA_VENDOR_CODE = 'QA-STAFFING'

export const QA_FEATURE_TAGS = ['careers', 'employee_referral', 'mis'] as const

export const QA_CATALOGS = {
  departments: ['Engineering', 'HR', 'Product', 'Talent', 'Operations'],
  clients: ['Acme Corp'],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Product Strategy'],
} as const

export const QA_LIVE_REQUIREMENT = {
  jobCode: 'QA-REQ-LIVE-001',
  title: '[QA] Senior Software Engineer',
  department: 'Engineering',
  hiringManager: devUserName('HIRING_MANAGER'),
  client: 'Acme Corp',
  location: 'Bangalore (Hybrid)',
  priority: 'HIGH',
  openings: 2,
  status: 'LIVE' as const,
  visibleToCandidates: true,
  visibleToVendors: true,
  visibleToReferrals: true,
  primarySkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  secondarySkills: ['AWS', 'Docker'],
  description: 'QA test job — visible on candidate portal, vendor portal, and referral portal.',
  jobDescription:
    'Senior engineer with TypeScript, React, and Node.js. Used for UAT smoke and E2E flows. Prefix test data with [QA].',
}

export const QA_PENDING_REQUIREMENT = {
  jobCode: 'QA-REQ-PENDING-001',
  title: '[QA] Product Manager',
  department: 'Product',
  hiringManager: devUserName('HIRING_MANAGER'),
  client: 'Acme Corp',
  location: 'Mumbai (Remote)',
  priority: 'MEDIUM',
  openings: 1,
  status: 'PENDING_APPROVAL' as const,
  visibleToCandidates: false,
  visibleToVendors: false,
  visibleToReferrals: true,
  primarySkills: ['Product Strategy', 'Agile'],
  secondarySkills: ['SQL', 'Analytics'],
  description: 'QA test job — pending HR approval for approval-workflow tests.',
  jobDescription: 'Product manager role for requirement approval test cases (TC-REQ-*).',
}

export const QA_DRAFT_REQUIREMENT = {
  jobCode: 'QA-REQ-DRAFT-001',
  title: '[QA] Draft Data Analyst',
  department: 'Operations',
  hiringManager: devUserName('HIRING_MANAGER'),
  client: 'Acme Corp',
  location: 'Chennai',
  priority: 'LOW',
  openings: 1,
  status: 'DRAFT' as const,
  visibleToCandidates: false,
  visibleToVendors: false,
  visibleToReferrals: false,
  primarySkills: ['SQL', 'Excel'],
  secondarySkills: ['Python'],
  description: 'QA draft requirement for create/edit flow tests.',
  jobDescription: 'Draft role for hiring manager create-requirement tests.',
}

/** Primary login accounts — one per role (password: DEV_PASSWORD). */
export const QA_PRIMARY_EMAILS = {
  SUPER_ADMIN: devUserEmail('SUPER_ADMIN'),
  ADMIN: devUserEmail('ADMIN'),
  HR_HEAD: devUserEmail('HR_HEAD'),
  HR_MANAGER: devUserEmail('HR_MANAGER'),
  RECRUITER: devUserEmail('RECRUITER'),
  TEAM_LEAD: devUserEmail('TEAM_LEAD'),
  HIRING_MANAGER: devUserEmail('HIRING_MANAGER'),
  INTERVIEWER: devUserEmail('INTERVIEWER'),
  VENDOR: devUserEmail('VENDOR'),
  EMPLOYEE: devUserEmail('EMPLOYEE'),
  CANDIDATE: devUserEmail('CANDIDATE'),
} as const

export { DEV_PASSWORD }
