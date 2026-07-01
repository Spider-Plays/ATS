import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Sparkles,
  Video,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PortalPipelineTracker } from "@/components/portal/PortalPipelineTracker";
import { PortalOfferCard } from "@/components/portal/PortalOfferCard";
import { PortalCompanySections } from "@/components/portal/PortalCompanySections";
import {
  PortalPageLoading,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import {
  pipelineProgressPercent,
  statusDisplayLabel,
} from "@/lib/portalWorkflow";
import clsx from "clsx";
import { format } from "date-fns";
import { PORTAL_HOME_ABOUT } from "./portalHomeContent";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const CandidateDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  const { data: openCount = 0 } = useQuery({
    queryKey: ["portal-positions"],
    queryFn: api.portal.getOpenPositions,
    select: (jobs) => jobs.length,
  });

  if (isLoading) {
    return <PortalPageLoading label="Loading your dashboard…" />;
  }

  if (!data?.linked) {
    return <Navigate to="/candidate/onboarding" replace />;
  }

  const {
    candidate,
    requirement,
    requirementHidden,
    requirementMessage,
    interviews,
    offers,
  } = data;

  const firstName = candidate.name.split(" ")[0];
  const progress = pipelineProgressPercent(candidate.status);
  const pendingOffer = offers.find((o) => o.status === "SENT");

  const upcomingInterview = interviews.find(
    (iv) => iv.status === "SCHEDULED" && new Date(iv.scheduledAt) > new Date(),
  );

  const sidebarInterviews = upcomingInterview
    ? interviews.filter((iv) => iv.id !== upcomingInterview.id)
    : interviews;

  const applicationLink = requirement?.id
    ? `/candidate/jobs/applied/${requirement.id}`
    : "/candidate/jobs?tab=applied";

  return (
    <PortalTwoColumnPage
      hero={
        <section className="portal-dash-hero">
        <div className="portal-dash-hero__inner">
          <div className="portal-dash-hero__profile">
            <UserAvatar
              name={candidate.name}
              avatar={user?.avatar}
              size="lg"
              className="portal-dash-hero__avatar"
            />
            <div className="min-w-0">
              <p className="portal-dash-hero__eyebrow">{timeGreeting()}</p>
              <h1 className="portal-dash-hero__title">Hello, {firstName}</h1>
              <p className="portal-dash-hero__subtitle">
                {PORTAL_HOME_ABOUT.title} — explore who we are, what we do, and
                the latest from our team.
              </p>
            </div>
          </div>
          <div className="portal-dash-hero__actions">
            <Link
              to="/candidate/profile"
              className="portal-dash-hero__btn portal-dash-hero__btn--primary"
            >
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
              Edit profile
            </Link>
            {requirement && (
              <Link
                to={applicationLink}
                className="portal-dash-hero__btn portal-dash-hero__btn--ghost"
              >
                Your application
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>

      }
      alert={
        pendingOffer ? (
          <div className="portal-dash-alert" role="status">
            <div>
              <p className="portal-dash-alert__title">
                You have an offer to review
              </p>
              <p className="portal-dash-alert__text">
                Please read your offer letter and accept or decline
                {pendingOffer.validUntil
                  ? ` by ${format(new Date(pendingOffer.validUntil), "PPP")}`
                  : " at your earliest convenience"}
                .
              </p>
            </div>
            <Link
              to={`/candidate/offers/${pendingOffer.id}`}
              className="portal-dash-alert__cta"
            >
              Review offer
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : undefined
      }
      main={<PortalCompanySections />}
      sidebar={
        <>
          {upcomingInterview && (
            <div className="portal-dash-interview portal-dash-interview--upcoming">
              <div className="portal-dash-interview__icon">
                <Video size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  Next interview
                </p>
                <p className="portal-dash-interview__type">
                  {upcomingInterview.type}
                </p>
                <p className="portal-dash-interview__time">
                  {format(
                    new Date(upcomingInterview.scheduledAt),
                    "EEEE, MMM d · h:mm a",
                  )}
                </p>
                {upcomingInterview.meetingLink && (
                  <a
                    href={upcomingInterview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="portal-dash-interview__join"
                  >
                    Join meeting
                    <ArrowRight size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          {requirement ? (
            <section className="portal-dash-app">
              <div className="portal-dash-app__head">
                <div className="portal-dash-app__head-top">
                  <div className="min-w-0">
                    <p className="portal-dash-app__eyebrow">Your application</p>
                    <h2 className="portal-dash-app__title">
                      {requirementHidden
                        ? "Application in progress"
                        : requirement.title}
                    </h2>
                    {!requirementHidden && (
                      <div className="portal-dash-app__meta">
                        {requirement.client && (
                          <span className="portal-dash-app__meta-item">
                            <Building2 size={14} />
                            {requirement.client}
                          </span>
                        )}
                        {requirement.department && (
                          <span className="portal-dash-app__meta-item">
                            {requirement.department}
                          </span>
                        )}
                        {requirement.location && (
                          <span className="portal-dash-app__meta-item">
                            <MapPin size={14} />
                            {requirement.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={clsx(
                      "portal-dash-app__badge",
                      candidate.status === "HIRED" &&
                        "portal-dash-app__badge--hired",
                      candidate.status === "REJECTED" &&
                        "portal-dash-app__badge--rejected",
                      candidate.status !== "HIRED" &&
                        candidate.status !== "REJECTED" &&
                        "portal-dash-app__badge--active",
                    )}
                  >
                    {statusDisplayLabel(candidate.status)}
                  </span>
                </div>

                {candidate.status !== "REJECTED" && (
                  <div className="portal-dash-app__progress-bar">
                    <div className="portal-dash-app__progress-track">
                      <div
                        className="portal-dash-app__progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="portal-dash-app__progress-labels">
                      <span>Applied</span>
                      <span>{progress}% complete</span>
                      <span>Hired</span>
                    </div>
                  </div>
                )}

                {requirementHidden && requirementMessage && (
                  <div className="portal-dash-app__notice">
                    <span className="material-symbols-outlined text-[18px] shrink-0">
                      info
                    </span>
                    {requirementMessage}
                  </div>
                )}
              </div>

              <div className="portal-dash-app__body">
                <p className="portal-dash-app__section-label">
                  Application progress
                </p>
                <PortalPipelineTracker status={candidate.status} />
                <Link to={applicationLink} className="portal-dash-app__link">
                  View full timeline
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          ) : (
            <section className="portal-dash-promo">
              <Sparkles
                className="portal-dash-promo__icon mx-auto"
                size={36}
                strokeWidth={1.5}
              />
              <h2 className="portal-dash-promo__title">
                Ready to take the next step?
              </h2>
              <p className="portal-dash-promo__text">
                {openCount > 0
                  ? `Browse ${openCount} open role${openCount !== 1 ? "s" : ""} and submit your application in minutes.`
                  : "New roles are added regularly. Check back soon or complete your profile to stand out."}
              </p>
              <Link to="/candidate/jobs" className="portal-dash-promo__btn">
                Browse open roles
                <ArrowRight size={16} />
              </Link>
            </section>
          )}

          <section className="portal-dash-panel">
            <div className="portal-dash-panel__head">
              <h2 className="portal-dash-panel__title">
                <FileText size={17} className="text-primary" />
                Offers
              </h2>
              {offers.length > 0 && (
                <Link to="/candidate/offers" className="portal-dash-panel__link">
                  View all
                </Link>
              )}
            </div>
            <div
              className={clsx(
                "portal-dash-panel__body",
                offers.length > 0 && "portal-dash-panel__body--flush",
              )}
            >
              {offers.length === 0 ? (
                <div className="portal-dash-empty">
                  <span className="material-symbols-outlined portal-dash-empty__icon">
                    card_giftcard
                  </span>
                  <p className="portal-dash-empty__title">No offers yet</p>
                  <p className="portal-dash-empty__text">
                    When the hiring team extends an offer, it will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(offers.length > 2 ? offers.slice(0, 2) : offers).map(
                    (offer) => (
                      <li key={offer.id} className="p-3">
                        <PortalOfferCard offer={offer} />
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </section>

          <section className="portal-dash-panel">
            <div className="portal-dash-panel__head">
              <h2 className="portal-dash-panel__title">
                <Calendar size={17} className="text-primary" />
                Interviews
              </h2>
            </div>
            <div className="portal-dash-panel__body">
              {interviews.length === 0 ? (
                <div className="portal-dash-empty">
                  <span className="material-symbols-outlined portal-dash-empty__icon">
                    event
                  </span>
                  <p className="portal-dash-empty__title">No interviews yet</p>
                  <p className="portal-dash-empty__text">
                    When the team schedules a round, details will appear here.
                  </p>
                </div>
              ) : sidebarInterviews.length === 0 ? (
                <div className="portal-dash-empty">
                  <span className="material-symbols-outlined portal-dash-empty__icon text-blue-400">
                    event_upcoming
                  </span>
                  <p className="portal-dash-empty__title">
                    Upcoming round highlighted
                  </p>
                  <p className="portal-dash-empty__text">
                    Your next interview is shown at the top of this column.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {sidebarInterviews.map((iv) => {
                    const isUpcoming =
                      iv.status === "SCHEDULED" &&
                      new Date(iv.scheduledAt) > new Date();
                    return (
                      <li key={iv.id}>
                        <div
                          className={clsx(
                            "portal-dash-interview",
                            isUpcoming && "portal-dash-interview--upcoming",
                          )}
                        >
                          <div className="portal-dash-interview__icon">
                            <Calendar size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2">
                              <p className="portal-dash-interview__type">
                                {iv.type}
                              </p>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {iv.status}
                              </span>
                            </div>
                            <p className="portal-dash-interview__time">
                              {format(new Date(iv.scheduledAt), "PPP p")}
                            </p>
                            {iv.meetingLink && (
                              <a
                                href={iv.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="portal-dash-interview__join"
                              >
                                Join meeting
                                <ArrowRight size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <Link to="/candidate/jobs" className="portal-dash-browse">
            <div className="flex items-center gap-3 min-w-0">
              <div className="portal-dash-browse__icon-wrap">
                <Briefcase size={20} />
              </div>
              <div className="min-w-0">
                <p className="portal-dash-browse__title">
                  {openCount > 0
                    ? `${openCount} open role${openCount !== 1 ? "s" : ""}`
                    : "Open roles"}
                </p>
                <p className="portal-dash-browse__sub">
                  Explore positions on the portal
                </p>
              </div>
            </div>
            <ArrowRight size={20} className="portal-dash-browse__arrow" />
          </Link>
        </>
      }
    />
  );
};

export default CandidateDashboard;
