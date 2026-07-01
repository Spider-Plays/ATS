import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { RequireAuth } from './components/RequireAuth'
import { RequireChannelReports } from './components/RequireChannelReports'
import { RequireSuperAdmin } from './components/RequireSuperAdmin'
import { lazyPage } from './lib/lazyRoute'
import { REFERRAL_PORTAL_ROLES } from '@/permissions'

import CandidatePortalLayout from './layouts/CandidatePortalLayout'
import CareersLayout from './layouts/CareersLayout'
import VendorPortalLayout from './layouts/VendorPortalLayout'
import ReferralPortalLayout from './layouts/ReferralPortalLayout'

const Dashboard = lazyPage(() => import('./pages/dashboard/Dashboard'))
const Login = lazyPage(() => import('./pages/auth/login/Login'))
const SetPassword = lazyPage(() => import('./pages/auth/set-password/SetPassword'))
const Signup = lazyPage(() => import('./pages/auth/signup/Signup'))
const NewCandidate = lazyPage(() => import('./pages/candidates/new/NewCandidate'))
const CandidateDetail = lazyPage(() => import('./pages/candidates/profile/CandidateProfile'))
const CandidatesList = lazyPage(() => import('./pages/candidates/list/CandidatesList'))
const Pipeline = lazyPage(() => import('./pages/pipeline/board/Pipeline'))
const RequirementDetail = lazyPage(() => import('./pages/requirements/detail/RequirementDetail'))
const EditRequirement = lazyPage(() => import('./pages/requirements/edit/EditRequirement'))
const RequirementMatchingProfiles = lazyPage(
  () => import('./pages/requirements/matching-profiles/RequirementMatchingProfiles')
)
const RequirementLinkedCandidates = lazyPage(
  () => import('./pages/requirements/linked-candidates/RequirementLinkedCandidates')
)
const NewRequirement = lazyPage(() => import('./pages/requirements/new/NewRequirement'))
const BusinessRequirementsList = lazyPage(
  () => import('./pages/business-requirements/list/BusinessRequirementsList')
)
const NewBusinessRequirement = lazyPage(
  () => import('./pages/business-requirements/new/NewBusinessRequirement')
)
const BusinessRequirementDetail = lazyPage(
  () => import('./pages/business-requirements/detail/BusinessRequirementDetail')
)
const EditBusinessRequirement = lazyPage(
  () => import('./pages/business-requirements/edit/EditBusinessRequirement')
)
const RequirementsList = lazyPage(() => import('./pages/requirements/list/RequirementsList'))
const UserManagement = lazyPage(() => import('./pages/admin/users/UserManagement'))
const UserDetail = lazyPage(() => import('./pages/admin/user-detail/UserDetail'))
const RoleAccessEditor = lazyPage(() => import('./pages/admin/role-access/RoleAccessEditor'))
const AdminOverview = lazyPage(() => import('./pages/admin/overview/AdminOverview'))
const AdminDepartments = lazyPage(() => import('./pages/admin/departments/AdminDepartments'))
const AdminClients = lazyPage(() => import('./pages/admin/clients/AdminClients'))
const AdminSkills = lazyPage(() => import('./pages/admin/skills/AdminSkills'))
const AdminInterviewPanels = lazyPage(() => import('./pages/admin/interview-panels/AdminInterviewPanels'))
const CandidateDashboard = lazyPage(() => import('./pages/candidate-portal/dashboard/CandidateDashboard'))
const PortalJobDetail = lazyPage(() => import('./pages/candidate-portal/job-detail/PortalJobDetail'))
const PortalOnboarding = lazyPage(() => import('./pages/candidate-portal/onboarding/PortalOnboarding'))
const PortalJobs = lazyPage(() => import('./pages/candidate-portal/jobs/PortalJobs'))
const PortalAppliedJobs = lazyPage(() => import('./pages/candidate-portal/applied-jobs/PortalAppliedJobs'))
const PortalApplicationUpdates = lazyPage(
  () => import('./pages/candidate-portal/application-updates/PortalApplicationUpdates')
)
const PortalOfferDetail = lazyPage(
  () => import('./pages/candidate-portal/offers/PortalOfferDetail')
)
const PortalOffers = lazyPage(() => import('./pages/candidate-portal/offers/PortalOffers'))
const CandidateLogin = lazyPage(() => import('./pages/candidate-portal/login/CandidateLogin'))
const CandidateSignup = lazyPage(() => import('./pages/candidate-portal/signup/CandidateSignup'))
const PortalIndexRedirect = lazyPage(
  () => import('./pages/candidate-portal/index-redirect/PortalIndexRedirect').then((m) => ({
    default: m.PortalIndexRedirect,
  }))
)
const LegacyPortalRedirect = lazyPage(
  () =>
    import('./pages/candidate-portal/legacy-redirect/LegacyPortalRedirect').then((m) => ({
      default: m.LegacyPortalRedirect,
    }))
)
const PortalProfileGate = lazyPage(() =>
  import('./components/portal/PortalProfileGate').then((m) => ({ default: m.PortalProfileGate }))
)
const Interviews = lazyPage(() => import('./pages/interviews/list/Interviews'))
const ScheduleInterview = lazyPage(() => import('./pages/interviews/schedule/ScheduleInterview'))
const InterviewCandidateResume = lazyPage(
  () => import('./pages/interviews/resume/InterviewCandidateResume')
)
const FeedbackForm = lazyPage(() => import('./pages/feedback/form/FeedbackForm'))
const Offers = lazyPage(() => import('./pages/offers/list/Offers'))
const NewOffer = lazyPage(() => import('./pages/offers/new/NewOffer'))
const OfferDetail = lazyPage(() => import('./pages/offers/detail/OfferDetail'))
const OfferCompensationConfig = lazyPage(
  () => import('./pages/offers/compensation-config/OfferCompensationConfig')
)
const OfferLetterTemplate = lazyPage(() => import('./pages/offers/letter-template/OfferLetterTemplate'))
const Notifications = lazyPage(() => import('./pages/notifications/list/Notifications'))
const Settings = lazyPage(() => import('./pages/settings/account/Settings'))
const NotFound = lazyPage(() => import('./pages/not-found/NotFound'))
const VendorDashboard = lazyPage(() => import('./pages/vendor-portal/dashboard/VendorDashboard'))
const VendorPositions = lazyPage(() => import('./pages/vendor-portal/positions/VendorPositions'))
const VendorJobDetail = lazyPage(() => import('./pages/vendor-portal/job-detail/VendorJobDetail'))
const VendorJobSubmit = lazyPage(() => import('./pages/vendor-portal/submit/VendorJobSubmit'))
const VendorSubmissions = lazyPage(() => import('./pages/vendor-portal/submissions/VendorSubmissions'))
const VendorSubmissionDetail = lazyPage(
  () => import('./pages/vendor-portal/submission-detail/VendorSubmissionDetail')
)
const VendorReport = lazyPage(() => import('./pages/vendor-portal/report/VendorReport'))
const VendorsList = lazyPage(() => import('./pages/vendors/list/VendorsList'))
const VendorDetail = lazyPage(() => import('./pages/vendors/detail/VendorDetail'))
const NewVendor = lazyPage(() => import('./pages/vendors/new/NewVendor'))
const CareersCandidates = lazyPage(() => import('./pages/features/careers/CareersCandidates'))
const EmployeeReferralCandidates = lazyPage(
  () => import('./pages/features/employee-referral/EmployeeReferralCandidates')
)
const MisDashboard = lazyPage(() => import('./pages/features/mis/MisDashboard'))
const HiringReport = lazyPage(() => import('./pages/reports/hiring-report/HiringReport'))
const ReportsLayout = lazyPage(() => import('./pages/reports/ReportsLayout'))
const ReferralReport = lazyPage(() => import('./pages/reports/referral-report/ReferralReport'))
const StaffVendorReport = lazyPage(() => import('./pages/reports/vendor-report/StaffVendorReport'))
const ReferralLogin = lazyPage(() => import('./pages/referral-portal/login/ReferralLogin'))
const ReferralDashboard = lazyPage(() => import('./pages/referral-portal/dashboard/ReferralDashboard'))
const ReferralJobs = lazyPage(() => import('./pages/referral-portal/jobs/ReferralJobs'))
const ReferralJobDetail = lazyPage(() => import('./pages/referral-portal/job-detail/ReferralJobDetail'))
const ReferralJobSubmit = lazyPage(() => import('./pages/referral-portal/submit/ReferralJobSubmit'))
const ReferralList = lazyPage(() => import('./pages/referral-portal/list/ReferralList'))
const ReferralDetail = lazyPage(() => import('./pages/referral-portal/detail/ReferralDetail'))
const ReferralProgram = lazyPage(() => import('./pages/referral-portal/program/ReferralProgram'))
const CareersLanding = lazyPage(() => import('./pages/careers/CareersLanding'))
const CareersJobDetail = lazyPage(() => import('./pages/careers/CareersJobDetail'))

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/referral-portal/login" element={<ReferralLogin />} />
      <Route
        path="/referral-portal"
        element={
          <RequireAuth allowedRoles={[...REFERRAL_PORTAL_ROLES]} skipPageCheck>
            <ReferralPortalLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<ReferralDashboard />} />
        <Route path="jobs" element={<ReferralJobs />} />
        <Route path="jobs/:id/submit" element={<ReferralJobSubmit />} />
        <Route path="jobs/:id" element={<ReferralJobDetail />} />
        <Route path="referrals" element={<ReferralList />} />
        <Route path="referrals/:id" element={<ReferralDetail />} />
        <Route path="program" element={<ReferralProgram />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/vendor-portal"
        element={
          <RequireAuth allowedRoles={['VENDOR']}>
            <VendorPortalLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="positions" element={<VendorPositions />} />
        <Route path="positions/:id/submit" element={<VendorJobSubmit />} />
        <Route path="positions/:id" element={<VendorJobDetail />} />
        <Route path="submissions" element={<VendorSubmissions />} />
        <Route path="submissions/:id" element={<VendorSubmissionDetail />} />
        <Route path="report" element={<VendorReport />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="/candidate/login" element={<CandidateLogin />} />
      <Route path="/candidate/signup" element={<CandidateSignup />} />
      <Route path="/portal/login" element={<Navigate to="/candidate/login" replace />} />
      <Route path="/portal/signup" element={<Navigate to="/candidate/signup" replace />} />
      <Route path="/portal/*" element={<LegacyPortalRedirect />} />

      <Route path="/careers" element={<CareersLayout />}>
        <Route index element={<CareersLanding />} />
        <Route path="jobs/:id" element={<CareersJobDetail />} />
      </Route>

      <Route
        path="/candidate"
        element={
          <RequireAuth allowedRoles={['CANDIDATE']}>
            <CandidatePortalLayout />
          </RequireAuth>
        }
      >
        <Route index element={<PortalIndexRedirect />} />
        <Route path="onboarding" element={<PortalOnboarding />} />
        <Route path="profile" element={<PortalOnboarding />} />
        <Route element={<PortalProfileGate />}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="jobs" element={<PortalJobs />} />
          <Route path="jobs/applied/:requirementId" element={<PortalApplicationUpdates />} />
          <Route path="jobs/:id" element={<PortalJobDetail />} />
          <Route path="offers" element={<PortalOffers />} />
          <Route path="offers/:id" element={<PortalOfferDetail />} />
          <Route path="applied/:requirementId" element={<PortalAppliedJobs />} />
          <Route path="applied" element={<PortalAppliedJobs />} />
        </Route>
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route
          path="users"
          element={
            <RequireSuperAdmin>
              <UserManagement />
            </RequireSuperAdmin>
          }
        />
        <Route
          path="users/:id"
          element={
            <RequireSuperAdmin>
              <UserDetail />
            </RequireSuperAdmin>
          }
        />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="skills" element={<AdminSkills />} />
        <Route
          path="role-access"
          element={
            <RequireSuperAdmin>
              <RoleAccessEditor />
            </RequireSuperAdmin>
          }
        />
        <Route path="interview-panels" element={<AdminInterviewPanels />} />
      </Route>

      <Route
        path="/vendors"
        element={
          <RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER']}>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<VendorsList />} />
        <Route path="new" element={<NewVendor />} />
        <Route path=":id" element={<VendorDetail />} />
      </Route>

      <Route
        path="/"
        element={
          <RequireAuth
            allowedRoles={[
              'SUPER_ADMIN',
              'ADMIN',
              'HR_HEAD',
              'HR_MANAGER',
              'FINANCE_HEAD',
              'RECRUITER',
              'TEAM_LEAD',
              'HIRING_MANAGER',
              'ACCOUNT_MANAGER',
              'INTERVIEWER',
            ]}
          >
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="business-requirements" element={<BusinessRequirementsList />} />
        <Route path="business-requirements/new" element={<NewBusinessRequirement />} />
        <Route path="business-requirements/:id/edit" element={<EditBusinessRequirement />} />
        <Route path="business-requirements/:id" element={<BusinessRequirementDetail />} />
        <Route path="requirements" element={<RequirementsList />} />
        <Route path="requirements/new" element={<NewRequirement />} />
        <Route path="requirements/:id/matching-profiles" element={<RequirementMatchingProfiles />} />
        <Route path="requirements/:id/linked-candidates" element={<RequirementLinkedCandidates />} />
        <Route path="requirements/:id/edit" element={<EditRequirement />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        <Route path="reports" element={<ReportsLayout />}>
          <Route index element={<Navigate to="hiring" replace />} />
          <Route path="hiring" element={<HiringReport />} />
          <Route
            path="referrals"
            element={
              <RequireChannelReports>
                <ReferralReport />
              </RequireChannelReports>
            }
          />
          <Route
            path="vendors"
            element={
              <RequireChannelReports>
                <StaffVendorReport />
              </RequireChannelReports>
            }
          />
        </Route>
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="candidates/new" element={<NewCandidate />} />
        <Route path="pipeline/:requirementId?" element={<Pipeline />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/new" element={<ScheduleInterview />} />
        <Route path="interviews/:id/resume" element={<InterviewCandidateResume />} />
        <Route path="interviews/:id/edit" element={<ScheduleInterview />} />
        <Route path="interviews/:id/feedback" element={<FeedbackForm />} />
        <Route path="offers" element={<Offers />} />
        <Route path="offers/compensation-config" element={<OfferCompensationConfig />} />
        <Route path="offers/letter-template" element={<OfferLetterTemplate />} />
        <Route path="offers/new" element={<NewOffer />} />
        <Route path="offers/:id" element={<OfferDetail />} />
        <Route path="features/careers" element={<CareersCandidates />} />
        <Route path="features/employee-referral" element={<EmployeeReferralCandidates />} />
        <Route path="features/mis" element={<MisDashboard />} />
      </Route>

      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
