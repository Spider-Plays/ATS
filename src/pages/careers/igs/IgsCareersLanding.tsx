import React from 'react'
import { Link } from 'react-router-dom'
import { portalAuthPath } from '@/lib/portalReturnTo'
import { CareersOpenRolesSection } from '../CareersOpenRolesSection'
import { useCareersOpenRoles } from '../theme/useCareersOpenRoles'
import { IGS_ASSETS, IGS_HERO } from './igsContent'
import './igs.css'

export function IgsCareersLanding() {
  const roles = useCareersOpenRoles()

  return (
    <div className="igs-careers">
      <div className="igs-page-pad">
        <section className="igs-hero-card" aria-label="Careers hero">
          <div className="igs-hero-card__copy">
            <h1>{IGS_HERO.title}</h1>
            <p>{IGS_HERO.subtitle}</p>
            <Link to={portalAuthPath('/candidate/signup', null)} className="igs-btn-capabilities">
              {IGS_HERO.primaryCta}
            </Link>
          </div>
          <div className="igs-hero-card__visual" aria-hidden>
            <img
              src={IGS_ASSETS.heroImage}
              alt=""
              width={1600}
              height={1066}
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      </div>

      <CareersOpenRolesSection themeId="igs" {...roles} />
    </div>
  )
}
