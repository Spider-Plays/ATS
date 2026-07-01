import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/services/api";
import { PortalPipelineTracker } from "@/components/portal/PortalPipelineTracker";
import { PortalOfferCard } from "@/components/portal/PortalOfferCard";
import { BackButton } from "@/components/ui/BackButton";
import {
  PortalPageLoading,
  PortalPagePanel,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import {
  portalJobStatusLabel,
  resolvePortalJobStatus,
} from "@/lib/portalApplicationStatus";
import {
  pipelineProgressPercent,
  pipelineStepIndex,
  statusDisplayLabel,
} from "@/lib/portalWorkflow";
import type { CandidateStatus } from "@/types";
import clsx from "clsx";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Hash,
  MapPin,
  Video,
} from "lucide-react";
import "./application-updates.css";

const PortalApplicationUpdates = () => {
  const { requirementId } = useParams<{ requirementId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal-application", requirementId],
    queryFn: () => api.portal.getApplication(requirementId!),
    enabled: !!requirementId,
  });

  if (isLoading) {
    return <PortalPageLoading label="Loading application updates…" />;
  }

  if (isError || !data) {
    return (
      <div className="portal-page max-w-md mx-auto text-center space-y-4">
        <p className="text-red-600 font-medium">Application not found</p>
        <BackButton
          fallback={requirementId ? `/candidate/jobs/${requirementId}` : "/candidate/jobs"}
          to={requirementId ? `/candidate/jobs/${requirementId}` : "/candidate/jobs"}
          label="Back to jobs"
          variant="muted"
        />
      </div>
    );
  }

  const { application, updates, interviews, offers } = data;
  const isClosed =
    application.portalJobStatus === "CLOSED" ||
    resolvePortalJobStatus(
      application.requirementStatus,
      application.listedOnPortal,
      application.pipelineStatus,
    ) === "CLOSED";
  const pipelineStatus = application.pipelineStatus as CandidateStatus;
  const progress = pipelineProgressPercent(pipelineStatus);

  const upcomingInterview = interviews.find(
    (iv) => iv.status === "SCHEDULED" && new Date(iv.scheduledAt) > new Date(),
  );

  const sortedInterviews = [...interviews].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  function isUpcomingInterview(iv: (typeof interviews)[number]) {
    return iv.status === "SCHEDULED" && new Date(iv.scheduledAt) > new Date();
  }

  const interviewStepIndex = pipelineStepIndex("INTERVIEW");
  const currentStepIndex = pipelineStepIndex(pipelineStatus);
  const showOfferSidebar =
    pipelineStatus === "OFFER" || pipelineStatus === "HIRED";
  const showInterviewSidebar =
    !showOfferSidebar &&
    (pipelineStatus === "INTERVIEW" ||
      currentStepIndex === interviewStepIndex ||
      upcomingInterview != null);

  const sidebarContent = showOfferSidebar ? (
    <PortalPagePanel
      title="Offer updates"
      icon={<FileText size={17} className="text-primary" />}
      link={
        offers.length > 0 ? (
          <Link to="/candidate/offers" className="portal-dash-panel__link">
            View all
          </Link>
        ) : undefined
      }
      flush={offers.length > 0}
    >
      {offers.length === 0 ? (
        <div className="portal-dash-empty">
          <span className="material-symbols-outlined portal-dash-empty__icon">
            card_giftcard
          </span>
          <p className="portal-dash-empty__title">Offer in progress</p>
          <p className="portal-dash-empty__text">
            You&apos;re in the offer stage. Your offer letter will appear here
            once the hiring team releases it.
          </p>
          <Link to="/candidate/offers" className="portal-dash-panel__link mt-3 inline-block">
            Check offers page
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {offers.map((offer) => (
            <li key={offer.id} className="p-3">
              <PortalOfferCard offer={offer} />
            </li>
          ))}
        </ul>
      )}
    </PortalPagePanel>
  ) : showInterviewSidebar ? (
    <PortalPagePanel
      title="Interview updates"
      icon={<Calendar size={17} className="text-primary" />}
    >
      {interviews.length === 0 ? (
        <div className="portal-dash-empty">
          <span className="material-symbols-outlined portal-dash-empty__icon">
            event
          </span>
          <p className="portal-dash-empty__title">No interviews yet</p>
          <p className="portal-dash-empty__text">
            When the team schedules a round, details and a join link will appear
            here.
          </p>
        </div>
      ) : (
        <ul className="portal-app-interviews">
          {sortedInterviews.map((iv) => {
            const isNext = upcomingInterview?.id === iv.id;
            const isUpcoming = isUpcomingInterview(iv);
            return (
              <li
                key={iv.id}
                className={clsx(
                  "portal-app-interview",
                  isNext && "portal-app-interview--next",
                  isUpcoming && !isNext && "portal-app-interview--upcoming",
                )}
              >
                <div className="portal-app-interview__icon">
                  {isUpcoming ? <Video size={18} /> : <Calendar size={16} />}
                </div>
                <div className="portal-app-interview__body">
                  <div className="portal-app-interview__head">
                    <p className="portal-app-interview__type">{iv.type}</p>
                    <span
                      className={clsx(
                        "portal-app-interview__status",
                        iv.status === "COMPLETED" &&
                          "portal-app-interview__status--done",
                        iv.status === "CANCELLED" &&
                          "portal-app-interview__status--cancelled",
                      )}
                    >
                      {isNext ? "Next up" : iv.status}
                    </span>
                  </div>
                  <p className="portal-app-interview__time">
                    {format(
                      new Date(iv.scheduledAt),
                      isUpcoming ? "EEEE, MMM d · h:mm a" : "PPP p",
                    )}
                  </p>
                  {iv.location && (
                    <p className="portal-app-interview__location">
                      {iv.location}
                    </p>
                  )}
                  {isUpcoming && iv.meetingLink && (
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx(
                        "portal-app-interview__join",
                        isNext && "portal-app-interview__join--primary",
                      )}
                    >
                      {isNext ? "Quick join" : "Join meeting"}
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PortalPagePanel>
  ) : (
    <PortalPagePanel title="What's next">
      <div className="portal-dash-empty !py-8">
        <p className="portal-dash-empty__title">
          {statusDisplayLabel(pipelineStatus)} stage
        </p>
        <p className="portal-dash-empty__text">
          {pipelineStatus === "REJECTED"
            ? "This application is no longer active."
            : "We’ll post interview schedules and offer details here as you move forward in the process."}
        </p>
      </div>
    </PortalPagePanel>
  );

  return (
    <PortalTwoColumnPage
      back={{ fallback: `/candidate/jobs/${application.requirementId}` }}
      hero={{
        eyebrow: "Current updates",
        title: application.title,
        meta: (
          <>
            <span className="portal-page-hero__code">
              <Hash size={12} aria-hidden />
              {application.jobCode}
            </span>
            {application.client && (
              <span>
                <Building2 size={14} aria-hidden />
                {application.client}
              </span>
            )}
            <span>
              <Briefcase size={14} aria-hidden />
              {application.department}
            </span>
            {application.location && (
              <span>
                <MapPin size={14} aria-hidden />
                {application.location}
              </span>
            )}
          </>
        ),
        badge: (
          <span
            className={clsx(
              "portal-page-hero__badge",
              isClosed && "portal-page-hero__badge--closed",
            )}
          >
            {portalJobStatusLabel(
              application.portalJobStatus ??
                resolvePortalJobStatus(
                  application.requirementStatus,
                  application.listedOnPortal,
                  application.pipelineStatus,
                ),
            )}
          </span>
        ),
      }}
      alert={
        isClosed && application.closedReason ? (
          <div className="portal-app-updates-alert" role="status">
            <AlertCircle size={18} className="shrink-0" aria-hidden />
            <p>{application.closedReason}</p>
          </div>
        ) : undefined
      }
      main={
        <div className="portal-dash-stack">
          {!isClosed && application.isCurrent && (
            <section className="portal-dash-app">
              <div className="portal-dash-app__head">
                <div className="portal-dash-app__head-top">
                  <div className="min-w-0">
                    <p className="portal-dash-app__eyebrow">Your application</p>
                    <h2 className="portal-dash-app__title">{application.title}</h2>
                    <div className="portal-dash-app__meta">
                      {application.client && (
                        <span className="portal-dash-app__meta-item">
                          <Building2 size={14} />
                          {application.client}
                        </span>
                      )}
                      <span className="portal-dash-app__meta-item">
                        {application.department}
                      </span>
                      {application.location && (
                        <span className="portal-dash-app__meta-item">
                          <MapPin size={14} />
                          {application.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "portal-dash-app__badge",
                      pipelineStatus === "HIRED" &&
                        "portal-dash-app__badge--hired",
                      pipelineStatus === "REJECTED" &&
                        "portal-dash-app__badge--rejected",
                      pipelineStatus !== "HIRED" &&
                        pipelineStatus !== "REJECTED" &&
                        "portal-dash-app__badge--active",
                    )}
                  >
                    {statusDisplayLabel(pipelineStatus)}
                  </span>
                </div>

                {pipelineStatus !== "REJECTED" && (
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
              </div>

              <div className="portal-dash-app__body">
                <p className="portal-dash-app__section-label">
                  Application progress
                </p>
                <PortalPipelineTracker status={pipelineStatus} />
              </div>
            </section>
          )}

          <PortalPagePanel title="Update timeline" id="timeline">
            {updates.length === 0 ? (
              <div className="portal-dash-empty">
                <span className="material-symbols-outlined portal-dash-empty__icon">
                  history
                </span>
                <p className="portal-dash-empty__title">No updates yet</p>
                <p className="portal-dash-empty__text">
                  Activity for this application will appear here as your hiring
                  process moves forward.
                </p>
              </div>
            ) : (
              <ul className="portal-app-updates-timeline">
                {updates.map((update) => (
                  <li
                    key={update.id}
                    className="portal-app-updates-timeline__item"
                  >
                    <p className="portal-app-updates-timeline__date">
                      {format(new Date(update.at), "PPP p")}
                    </p>
                    <p className="portal-app-updates-timeline__summary">
                      {update.summary}
                    </p>
                    {update.performerName && (
                      <p className="portal-app-updates-timeline__by">
                        By {update.performerName}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PortalPagePanel>
        </div>
      }
      sidebar={sidebarContent}
    />
  );
};

export default PortalApplicationUpdates;
