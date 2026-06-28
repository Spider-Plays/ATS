-- Stitch ATS initial schema (mirrors server/prisma/schema.prisma for Prisma compatibility)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users & auth audit
-- ---------------------------------------------------------------------------

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "themePreference" TEXT NOT NULL DEFAULT 'system',
  permissions TEXT NOT NULL DEFAULT '[]',
  avatar TEXT,
  "phoneNumber" TEXT,
  address TEXT,
  "resumeUrl" TEXT,
  "authProvider" TEXT NOT NULL DEFAULT 'local',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastLogin" TIMESTAMPTZ,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE,
  "passwordResetToken" TEXT,
  "passwordResetExpires" TIMESTAMPTZ,
  "vendorId" TEXT,
  "referralCode" TEXT UNIQUE
);

CREATE TABLE "LoginHistory" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "loggedInAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT
);

CREATE INDEX "LoginHistory_userId_loggedInAt_idx" ON "LoginHistory" ("userId", "loggedInAt");

-- ---------------------------------------------------------------------------
-- Vendors & requirements
-- ---------------------------------------------------------------------------

CREATE TABLE "Vendor" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  address TEXT,
  "contactName" TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "VendorRequirement" (
  id TEXT PRIMARY KEY,
  "vendorId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "assignedBy" TEXT,
  UNIQUE ("vendorId", "requirementId")
);

CREATE TABLE "Requirement" (
  id TEXT PRIMARY KEY,
  "jobCode" TEXT UNIQUE,
  client TEXT,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  "hiringManager" TEXT NOT NULL,
  status TEXT NOT NULL,
  "hiringStage" TEXT NOT NULL DEFAULT 'SOURCING',
  "liveAt" TIMESTAMPTZ,
  "onHoldAt" TIMESTAMPTZ,
  openings INTEGER NOT NULL,
  filled INTEGER NOT NULL DEFAULT 0,
  priority TEXT,
  location TEXT,
  "locationCity" TEXT,
  "isRemote" BOOLEAN NOT NULL DEFAULT FALSE,
  "workMode" TEXT,
  "employmentType" TEXT,
  "seniorityLevel" TEXT,
  "experienceMinYears" INTEGER,
  "experienceMaxYears" INTEGER,
  "salaryBand" TEXT,
  "targetStartDate" TIMESTAMPTZ,
  "hiringDeadline" TIMESTAMPTZ,
  description TEXT,
  "jobDescription" TEXT,
  "primarySkills" TEXT NOT NULL DEFAULT '[]',
  "secondarySkills" TEXT NOT NULL DEFAULT '[]',
  "createdBy" TEXT,
  "createdByRole" TEXT,
  recruiters TEXT NOT NULL DEFAULT '[]',
  approval TEXT,
  "approvalHistory" TEXT NOT NULL DEFAULT '[]',
  versions TEXT NOT NULL DEFAULT '[]',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "visibleToCandidates" BOOLEAN NOT NULL DEFAULT TRUE,
  "visibleToVendors" BOOLEAN NOT NULL DEFAULT FALSE,
  "visibleToReferrals" BOOLEAN NOT NULL DEFAULT TRUE,
  "referralBonusAmount" INTEGER,
  "closureReason" TEXT,
  "closedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Candidates & hiring pipeline
-- ---------------------------------------------------------------------------

CREATE TABLE "Candidate" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  "appliedDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "requirementId" TEXT,
  "jobTitle" TEXT,
  "createdBy" TEXT,
  avatar TEXT,
  "resumeUrl" TEXT,
  "resumeFileName" TEXT,
  "resumeMimeType" TEXT,
  phone TEXT,
  location TEXT,
  "linkedIn" TEXT,
  portfolio TEXT,
  "totalExperience" TEXT,
  "currentCompany" TEXT,
  "currentCTC" TEXT,
  "expectedCTC" TEXT,
  "noticePeriod" TEXT,
  pan TEXT,
  "primarySkills" TEXT NOT NULL DEFAULT '[]',
  "secondarySkills" TEXT NOT NULL DEFAULT '[]',
  "resumeText" TEXT,
  "vendorId" TEXT,
  "submittedByUserId" TEXT,
  "referredByUserId" TEXT,
  "referralRelationship" TEXT,
  "referralNotes" TEXT,
  "offerDate" TIMESTAMPTZ,
  "offerMonth" TEXT,
  "offerQuarter" TEXT,
  "expectedJoiningDate" TIMESTAMPTZ,
  "joiningDate" TIMESTAMPTZ,
  "joiningMonth" TEXT,
  "joiningQuarter" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "InterviewPlan" (
  id TEXT PRIMARY KEY,
  "requirementId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "InterviewPlanStage" (
  id TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL REFERENCES "InterviewPlan"(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  name TEXT NOT NULL,
  "interviewType" TEXT NOT NULL DEFAULT 'TECHNICAL',
  "defaultDuration" INTEGER NOT NULL DEFAULT 60,
  "defaultInterviewerIds" TEXT NOT NULL DEFAULT '[]',
  UNIQUE ("planId", "order")
);

CREATE TABLE "Interview" (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "planStageId" TEXT REFERENCES "InterviewPlanStage"(id) ON DELETE SET NULL,
  "scheduledAt" TIMESTAMPTZ NOT NULL,
  "interviewerIds" TEXT NOT NULL DEFAULT '[]',
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  "meetingLink" TEXT,
  duration INTEGER,
  location TEXT,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Feedback" (
  id TEXT PRIMARY KEY,
  "interviewId" TEXT NOT NULL,
  "interviewerId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  rating INTEGER NOT NULL,
  "technicalRating" INTEGER,
  "communicationRating" INTEGER,
  comments TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  "formData" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Offer" (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "baseSalary" DOUBLE PRECISION NOT NULL,
  equity DOUBLE PRECISION,
  bonus DOUBLE PRECISION,
  status TEXT NOT NULL,
  history TEXT NOT NULL DEFAULT '[]',
  "letterContent" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Catalogs & admin config
-- ---------------------------------------------------------------------------

CREATE TABLE "SkillCatalog" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "DepartmentCatalog" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ClientCatalog" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "InterviewPanelLevel" (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  "interviewerIds" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ActivityLog" (
  id TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  action TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "performerName" TEXT,
  "performerRole" TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "RolePageAccess" (
  role TEXT PRIMARY KEY,
  pages TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
