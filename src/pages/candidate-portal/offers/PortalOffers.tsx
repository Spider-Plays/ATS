import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PortalOfferCard } from "@/components/portal/PortalOfferCard";
import {
  PortalPageLoading,
  PortalPagePanel,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";

const PortalOffers = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  if (isLoading) {
    return <PortalPageLoading label="Loading offers…" />;
  }

  if (!data?.linked) {
    return <Navigate to="/candidate/onboarding" replace />;
  }

  const offers = data.offers ?? [];
  const pendingCount = offers.filter((o) => o.status === "SENT").length;

  return (
    <PortalTwoColumnPage
      hero={{
        eyebrow: "Careers",
        title: "Offers",
        subtitle:
          pendingCount > 0
            ? "Review your offer letter and accept or decline before the deadline."
            : "View offer letters shared with you by the hiring team.",
      }}
      sidebar={
        <PortalPagePanel title="Your offers" flush={offers.length > 0}>
          {offers.length === 0 ? (
            <div className="portal-dash-empty">
              <span className="material-symbols-outlined portal-dash-empty__icon">
                card_giftcard
              </span>
              <p className="portal-dash-empty__title">No offers yet</p>
              <p className="portal-dash-empty__text">
                When the hiring team releases an offer, it will appear here for
                you to review and respond.
              </p>
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
      }
    />
  );
};

export default PortalOffers;
