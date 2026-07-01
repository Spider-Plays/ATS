import { Newspaper } from "lucide-react";
import {
  PORTAL_HOME_ABOUT,
  PORTAL_HOME_MISSION,
  PORTAL_HOME_NEWS,
  PORTAL_HOME_VALUES,
} from "@/pages/candidate-portal/dashboard/portalHomeContent";

export function PortalCompanySections() {
  return (
    <div className="portal-dash-stack">
      <section className="portal-dash-company">
        <p className="portal-dash-company__eyebrow">{PORTAL_HOME_ABOUT.eyebrow}</p>
        <h2 className="portal-dash-company__title">{PORTAL_HOME_ABOUT.title}</h2>
        <div className="portal-dash-company__prose">
          {PORTAL_HOME_ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="portal-dash-company">
        <p className="portal-dash-company__eyebrow">{PORTAL_HOME_MISSION.eyebrow}</p>
        <h2 className="portal-dash-company__title">{PORTAL_HOME_MISSION.title}</h2>
        <div className="portal-dash-company__prose">
          {PORTAL_HOME_MISSION.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="portal-dash-company">
        <p className="portal-dash-company__eyebrow">Our values</p>
        <div className="portal-dash-values">
          {PORTAL_HOME_VALUES.map((value) => (
            <article key={value.title} className="portal-dash-value">
              <span
                className="material-symbols-outlined portal-dash-value__icon"
                aria-hidden
              >
                {value.icon}
              </span>
              <div>
                <h3 className="portal-dash-value__title">{value.title}</h3>
                <p className="portal-dash-value__text">{value.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-dash-company portal-dash-company--news">
        <div className="portal-dash-company__head">
          <div>
            <p className="portal-dash-company__eyebrow">Latest updates</p>
            <h2 className="portal-dash-company__title">Company newsletter</h2>
          </div>
          <Newspaper size={22} className="text-primary shrink-0" aria-hidden />
        </div>
        <ul className="portal-dash-news">
          {PORTAL_HOME_NEWS.map((item) => (
            <li key={item.id} className="portal-dash-news__item">
              <div className="portal-dash-news__meta">
                <span className="portal-dash-news__category">{item.category}</span>
                <span className="portal-dash-news__date">{item.date}</span>
              </div>
              <h3 className="portal-dash-news__title">{item.title}</h3>
              <p className="portal-dash-news__excerpt">{item.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
