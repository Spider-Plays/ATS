import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import type { Offer } from "@/types";
import clsx from "clsx";

function offerStatusLabel(status: Offer["status"]): string {
  switch (status) {
    case "SENT":
      return "Action required";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return status.replace(/_/g, " ");
  }
}

function offerStatusClass(status: Offer["status"]): string {
  switch (status) {
    case "SENT":
      return "bg-amber-100 text-amber-800";
    case "ACCEPTED":
      return "bg-primary-container text-on-primary-container";
    case "DECLINED":
      return "bg-rose-100 text-rose-800";
    case "WITHDRAWN":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

type PortalOfferCardProps = {
  offer: Offer;
};

export function PortalOfferCard({ offer }: PortalOfferCardProps) {
  const ctc = offer.annualCtc ?? offer.baseSalary;
  const needsResponse = offer.status === "SENT";

  return (
    <Link
      to={`/candidate/offers/${offer.id}`}
      className={clsx(
        "block rounded-2xl border p-5 md:p-6 transition-colors",
        needsResponse
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300"
          : "border-slate-200 bg-white hover:border-primary/25",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                offerStatusClass(offer.status),
              )}
            >
              {offerStatusLabel(offer.status)}
            </span>
            {needsResponse && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary text-white">
                Review offer
              </span>
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-primary shrink-0" />
            Offer letter
          </h2>
          <p className="text-sm text-slate-600">
            Annual CTC:{" "}
            <strong className="text-slate-900">
              Rs. {ctc.toLocaleString("en-IN")}/-
            </strong>
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {offer.sentAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                Sent {format(new Date(offer.sentAt), "PPP")}
              </span>
            )}
            {offer.validUntil && needsResponse && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                Respond by {format(new Date(offer.validUntil), "PPP")}
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary shrink-0">
          {needsResponse ? "View & respond" : "View offer"}
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
