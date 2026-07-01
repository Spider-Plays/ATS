import { Navigate, useParams } from "react-router-dom";
import "./applied-jobs.css";

/** Redirect legacy /candidate/applied routes to unified jobs page */
export default function PortalAppliedJobs() {
  const { requirementId } = useParams();
  if (requirementId) {
    return <Navigate to={`/candidate/jobs/applied/${requirementId}`} replace />;
  }
  return <Navigate to="/candidate/jobs?tab=applied" replace />;
}
