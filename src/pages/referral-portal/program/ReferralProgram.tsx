import React from "react";
import { Link } from "react-router-dom";
import { Gift, CheckCircle2, HelpCircle } from "lucide-react";
import "./program.css";

const TIERS = [
  {
    role: "Individual contributor",
    bonus: "₹25,000 – ₹50,000",
    note: "Per successful hire",
  },
  {
    role: "Senior / niche skills",
    bonus: "₹50,000 – ₹1,00,000",
    note: "Roles marked with bonus on job card",
  },
  {
    role: "Leadership / critical hires",
    bonus: "Up to ₹1,50,000",
    note: "As approved by HR",
  },
];

const FAQ = [
  {
    q: "When do I receive my referral bonus?",
    a: "Bonuses are processed after your referral completes joining and passes the probation period defined by HR (typically 90 days).",
  },
  {
    q: "Can I refer someone already in our ATS?",
    a: "Each email can only exist once in the system. If they already applied or were referred, submit a different contact or ask HR.",
  },
  {
    q: "Do I need to know the candidate personally?",
    a: "Yes — select an accurate relationship. Misrepresentation may affect bonus eligibility.",
  },
  {
    q: "What if my referral applies to multiple roles?",
    a: "Submit them for the best-fit open role. Recruiters may reassign if another role is a stronger match.",
  },
];

const ReferralProgram = () => (
  <div className="max-w-3xl mx-auto space-y-8">
    <header className="space-y-2">
      <span className="portal-page-eyebrow">Rewards</span>
      <h1 className="text-page-title">Referral rewards program</h1>
      <p className="text-page-desc">
        How referrals work, bonus tiers, and eligibility at a glance.
      </p>
    </header>

    <div className="portal-promo-card p-8 relative overflow-hidden">
      <div
        className="login-hero-grid absolute inset-0 opacity-40 pointer-events-none"
        aria-hidden
      />
      <Gift size={32} className="mb-4 opacity-90 relative z-10" />
      <h2 className="text-xl font-black relative z-10">
        Refer great people. Get rewarded.
      </h2>
      <p className="mt-2 text-white/80 max-w-lg relative z-10">
        Our employee referral program pays cash bonuses for hires that come
        through your introduction. Bonus amounts are shown on each job when HR
        has configured them.
      </p>
      <Link
        to="/referral-portal/jobs"
        className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-white text-primary text-sm font-bold hover:bg-white/90 relative z-10"
      >
        Browse open roles
      </Link>
    </div>

    <section className="space-y-4">
      <h2 className="font-bold text-lg text-foreground">Bonus tiers</h2>
      <ul className="space-y-3">
        {TIERS.map((t) => (
          <li key={t.role} className="app-card p-4 flex gap-4">
            <CheckCircle2 className="text-primary shrink-0" size={22} />
            <div>
              <p className="font-bold text-foreground">{t.role}</p>
              <p className="text-primary font-black">{t.bonus}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
        <HelpCircle size={20} className="text-primary" /> FAQ
      </h2>
      <dl className="space-y-3">
        {FAQ.map((item) => (
          <div key={item.q} className="app-card p-4">
            <dt className="font-bold text-foreground">{item.q}</dt>
            <dd className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>

    <p className="text-xs text-muted-foreground">
      Program terms are managed by HR. Bonus amounts on job postings override
      general tiers when shown.
    </p>
  </div>
);

export default ReferralProgram;
