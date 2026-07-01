import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { copyrightNotice } from '@/config/branding'
import { StitchLogo } from '@/components/branding/StitchLogo'
import { portalAuthPath } from '@/lib/portalReturnTo'
import { CareersThemeProvider, useCareersTheme } from '@/pages/careers/theme/CareersThemeContext'
import { CareersThemeSwitcher } from '@/pages/careers/theme/CareersThemeSwitcher'
import { IgsFooter } from '@/pages/careers/igs/IgsFooter'
import { IGS_ASSETS } from '@/pages/careers/igs/igsContent'
import '@/pages/careers/careers.css'
import '@/pages/careers/igs/igs.css'

function NavChevron() {
  return (
    <svg
      className="igs-header-chevron"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function IgsHeader({
  isCandidate,
}: {
  isCandidate: boolean
}) {
  const navItems = [
    { label: 'Capabilities' },
    { label: 'Solutions' },
    { label: 'Insights' },
    { label: 'About Us' },
  ]

  return (
    <header className="igs-layout-header sticky top-0 z-20">
      <div className="igs-layout-header__inner">
        <Link to="/careers" className="igs-header-logo">
          <img
            src={IGS_ASSETS.logo}
            srcSet={`${IGS_ASSETS.logo} 1x, ${IGS_ASSETS.logo2x} 2x`}
            alt="IGS Engineering Quality Logo"
            width={158}
            height={60}
            className="igs-logo-img"
          />
        </Link>

        <nav className="igs-header-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <span key={item.label} className="igs-header-link igs-header-link--static">
              {item.label}
              <NavChevron />
            </span>
          ))}
        </nav>

        <div className="igs-header-actions">
          {isCandidate ? (
            <Link to="/candidate/dashboard" className="igs-btn-contact">
              My portal
            </Link>
          ) : (
            <span className="igs-btn-contact igs-btn-contact--static">Contact Us</span>
          )}
        </div>
      </div>
    </header>
  )
}

function CareersLayoutInner() {
  const { user } = useAuth()
  const { themeId } = useCareersTheme()
  const isCandidate = user?.role === 'CANDIDATE'
  const isIgs = themeId === 'igs'

  return (
    <div
      className={clsx(
        'min-h-screen flex flex-col',
        isIgs ? 'igs-careers' : 'careers-page login-page-bg'
      )}
    >
      {isIgs ? (
        <IgsHeader isCandidate={isCandidate} />
      ) : (
        <header className="careers-layout-header sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
            <Link to="/careers" className="shrink-0">
              <StitchLogo tone="primary" subtitle="Careers" />
            </Link>
            <nav className="flex items-center gap-2 sm:gap-3">
              {isCandidate ? (
                <Link to="/candidate/dashboard" className="btn-filled !h-9 !px-5 !text-sm">
                  My portal
                </Link>
              ) : (
                <>
                  <Link
                    to={portalAuthPath('/candidate/login', null)}
                    className="hidden sm:inline-flex btn-outlined !h-9 !px-5 !text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to={portalAuthPath('/candidate/signup', null)}
                    className="btn-filled !h-9 !px-5 !text-sm"
                  >
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isIgs && (
        <footer className="border-t border-outline-variant/40 bg-surface-container-lowest">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-sm">
            <p className="text-muted-foreground">{copyrightNotice()}</p>
          </div>
        </footer>
      )}

      {isIgs && (
        <div className="igs-footer-wrap">
          <IgsFooter />
        </div>
      )}

      <CareersThemeSwitcher />
    </div>
  )
}

const CareersLayout = () => (
  <CareersThemeProvider>
    <CareersLayoutInner />
  </CareersThemeProvider>
)

export default CareersLayout
