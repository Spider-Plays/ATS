import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Download, X } from "lucide-react";
import { portalService } from "@/services/http/portal";
import { useConfirm } from "@/hooks/useConfirm";
import { useToastStore } from "@/store/toastStore";
import { ApiError } from "@/lib/apiClient";
import { OfferLetterFrame } from "@/components/offers/OfferLetterFrame";
import {
  PortalPageLoading,
  PortalPagePanel,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import clsx from "clsx";

const PortalOfferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const confirm = useConfirm();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["portal-offer", id],
    queryFn: () => portalService.getOffer(id!),
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      action === "accept"
        ? portalService.acceptOffer(id!)
        : portalService.declineOffer(id!),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["portal-offer", id] });
      queryClient.invalidateQueries({ queryKey: ["portal-me"] });
      addToast(
        action === "accept" ? "Offer accepted" : "Offer declined",
        "success",
      );
    },
    onError: (err: unknown) => {
      addToast(
        err instanceof ApiError ? err.message : "Could not update offer",
        "error",
      );
    },
  });

  const handleAccept = async () => {
    const ok = await confirm({
      title: "Accept offer",
      message: "Confirm that you accept this offer and employment agreement.",
      confirmLabel: "Accept offer",
    });
    if (ok) respondMutation.mutate("accept");
  };

  const handleDecline = async () => {
    const ok = await confirm({
      title: "Decline offer",
      message: "Are you sure you want to decline this offer?",
      confirmLabel: "Decline",
      variant: "danger",
    });
    if (ok) respondMutation.mutate("decline");
  };

  const downloadLetter = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const blob = await portalService.downloadOfferLetterPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "offer-letter.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(
        err instanceof ApiError ? err.message : "Failed to download PDF",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <PortalPageLoading label="Loading offer…" />;
  }

  if (!data) {
    return (
      <div className="portal-page text-center">
        <p className="text-slate-600">Offer not found.</p>
      </div>
    );
  }

  const { offer, letterHtml } = data;
  const canRespond = offer.status === "SENT";
  const ctc = offer.annualCtc ?? offer.baseSalary;

  return (
    <PortalTwoColumnPage
      back={{ fallback: "/candidate/offers" }}
      hero={{
        eyebrow: "Offer",
        title: "Your offer letter",
        subtitle:
          "Review the details below and accept or decline when you are ready.",
        meta: (
          <span>
            Annual CTC:{" "}
            <strong>Rs. {ctc.toLocaleString("en-IN")}/-</strong>
          </span>
        ),
        badge: (
          <span className="portal-page-hero__badge">
            {offer.status.replace(/_/g, " ")}
          </span>
        ),
      }}
      sidebar={
        <>
          <PortalPagePanel title="Offer status">
            <div className="space-y-4">
              <div className="portal-offer-status">
                <span className="portal-offer-status__label">Status</span>
                <span className="portal-offer-status__value">
                  {offer.status.replace(/_/g, " ")}
                </span>
                {offer.validUntil && (
                  <span className="portal-offer-status__deadline">
                    Respond by{" "}
                    {new Date(offer.validUntil).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>

              <div className="portal-offer-actions">
                <button
                  type="button"
                  onClick={downloadLetter}
                  disabled={busy}
                  className="portal-offer-actions__btn"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                {canRespond && (
                  <>
                    <button
                      type="button"
                      onClick={handleDecline}
                      disabled={respondMutation.isPending}
                      className={clsx(
                        "portal-offer-actions__btn",
                        "portal-offer-actions__btn--decline",
                      )}
                    >
                      <X size={16} />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={respondMutation.isPending}
                      className={clsx(
                        "portal-offer-actions__btn",
                        "portal-offer-actions__btn--accept",
                      )}
                    >
                      <Check size={16} />
                      Accept offer
                    </button>
                  </>
                )}
              </div>
            </div>
          </PortalPagePanel>

          {letterHtml ? (
            <OfferLetterFrame
              html={letterHtml}
              title="Your offer letter"
              className="border-slate-200 rounded-2xl overflow-hidden"
            />
          ) : (
            <PortalPagePanel title="Offer letter">
              <p className="text-sm text-slate-500 text-center py-8">
                Offer letter is not available yet.
              </p>
            </PortalPagePanel>
          )}
        </>
      }
    />
  );
};

export default PortalOfferDetail;
