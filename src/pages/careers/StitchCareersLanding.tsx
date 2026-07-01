import React from 'react'
import { Link } from 'react-router-dom'
import { portalAuthPath } from '@/lib/portalReturnTo'
import {
  CAREERS_BOTTOM_CTA,
  CAREERS_HERO,
  CAREERS_PERKS,
  CAREERS_VALUES,
  CAREERS_WHY_JOIN,
} from './careersContent'
import { CareersOpenRolesSection } from './CareersOpenRolesSection'
import { useCareersOpenRoles } from './theme/useCareersOpenRoles'
import './careers.css'

export function StitchCareersLanding() {
  const roles = useCareersOpenRoles()

  const scrollToRoles = () => {
    document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="careers-page">
      <section className="careers-hero careers-section">
        <div className="careers-hero__grid" aria-hidden />
        <div className="careers-hero__orb careers-hero__orb--a" aria-hidden />
        <div className="careers-hero__orb careers-hero__orb--b" aria-hidden />

        <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="login-hero-badge">{CAREERS_HERO.eyebrow}</span>
            <h1 className="text-[2.35rem] md:text-[2.75rem] leading-[1.12] font-bold tracking-tight text-white">
              {CAREERS_HERO.title}
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl">
              {CAREERS_HERO.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button type="button" onClick={scrollToRoles} className="careers-hero-btn-primary">
                {CAREERS_HERO.primaryCta}
              </button>
              <Link
                to={portalAuthPath('/candidate/signup', null)}
                className="careers-hero-btn-secondary"
              >
                {CAREERS_HERO.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-4">
            {CAREERS_VALUES.slice(0, 4).map((v) => (
              <div key={v.title} className="careers-hero-card space-y-2">
                <span className="material-symbols-outlined text-white/90">{v.icon}</span>
                <p className="font-bold text-white text-sm">{v.title}</p>
                <p className="text-xs text-white/70 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="careers-section bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-page-title">{CAREERS_WHY_JOIN.title}</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed text-left md:text-center">
            {CAREERS_WHY_JOIN.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="text-m3-body">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="careers-section careers-values-grid">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="badge-eyebrow mx-auto">Our values</span>
            <h2 className="text-page-title">How we work together</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAREERS_VALUES.map((v) => (
              <div key={v.title} className="app-card p-5 space-y-3">
                <span className="material-symbols-outlined text-primary text-3xl">{v.icon}</span>
                <h3 className="text-m3-title font-bold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="careers-section bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="badge-eyebrow mx-auto">Life at Stitch</span>
            <h2 className="text-page-title">Perks & benefits</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAREERS_PERKS.map((p) => (
              <div key={p.title} className="app-card-inset p-5 space-y-2">
                <span className="material-symbols-outlined text-primary">{p.icon}</span>
                <h3 className="font-bold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CareersOpenRolesSection themeId="stitch" {...roles} />

      <section className="careers-bottom-cta careers-section">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-page-title">{CAREERS_BOTTOM_CTA.title}</h2>
          <p className="text-page-desc mx-auto">{CAREERS_BOTTOM_CTA.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={portalAuthPath('/candidate/signup', null)} className="btn-filled">
              {CAREERS_BOTTOM_CTA.primaryCta}
            </Link>
            <Link to={portalAuthPath('/candidate/login', null)} className="btn-outlined">
              {CAREERS_BOTTOM_CTA.secondaryCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
