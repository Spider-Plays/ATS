import React from 'react'
import { copyrightNotice } from '@/config/branding'
import { IGS_ASSETS, IGS_FOOTER } from './igsContent'

const FOOTER_LINKS = [
  {
    title: 'Collaboration Models',
    links: ['Independent QA', 'Integrated QA', 'Continuous Testing'],
  },
  {
    title: 'Capabilities',
    links: ['By Service', 'By Technology', 'By Industry', 'By Delivery Models', 'By Case Study'],
  },
  {
    title: 'Careers',
    links: ['Job Board', 'Culture & Benefits'],
  },
  {
    title: 'About',
    links: ['Values', 'Diversity', 'Partners', 'Leaders'],
  },
]

export function IgsFooter() {
  return (
    <footer className="igs-footer" aria-label="Site footer">
      <div className="igs-footer__surface">
        <div className="igs-footer__main">
          <div className="igs-footer__brand">
            <div className="igs-footer__logo-link">
              <img
                src={IGS_ASSETS.footerLogo}
                alt="IGS Engineering Quality Logo"
                width={150}
                height={89}
                loading="lazy"
                className="igs-footer__logo"
              />
            </div>
            <p className="igs-footer__brand-text">{IGS_FOOTER.brandDescription}</p>
            <div className="igs-footer__social">
              <span className="igs-footer__social-label">Follow us:</span>
              <span
                className="igs-footer__social-icon igs-footer__social-icon--static"
                aria-label="LinkedIn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </span>
            </div>
          </div>

          <div className="igs-footer__links">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title} className="igs-footer__col">
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((label) => (
                    <li key={label}>
                      <span className="igs-footer__link-static">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="igs-footer__locations">
            {IGS_FOOTER.locations.map((loc) => (
              <div key={loc.name} className="igs-footer__location">
                <h5>{loc.name}</h5>
                <p>{loc.address}</p>
              </div>
            ))}
            <div className="igs-footer__location igs-footer__location--contact">
              <h5>CONTACT US</h5>
              <p>
                <span>IGS India: {IGS_FOOTER.contact.india}</span>
                <span>IGS America: {IGS_FOOTER.contact.america}</span>
                <span>Email: {IGS_FOOTER.contact.email}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="igs-footer__legal">
          <span>{copyrightNotice('IGS Engineering Quality')}</span>
          <div className="igs-footer__legal-links">
            <span className="igs-footer__link-static">Terms</span>
            <span className="igs-footer__link-static">Privacy</span>
            <span className="igs-footer__link-static">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
