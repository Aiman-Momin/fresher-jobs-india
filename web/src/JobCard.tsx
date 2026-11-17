import type { Job } from "./types";
import { ageLabel, daysAgo } from "./lib";
import { BookmarkIcon } from "./icons";

interface Props {
  job: Job;
  saved: boolean;
  onSave: (id: string) => void;
  mark: string[];
}

function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(re).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

export default function JobCard({ job, saved, onSave, mark }: Props) {
  const fresh = (daysAgo(job.posted) ?? 99) <= 1;
  const place = job.location || job.city || "Location not listed";

  return (
    <article className="job">
      <div className="job-body">
        <h2 className="job-title">
          <a href={job.url} target="_blank" rel="noopener noreferrer"><Marked text={job.title} terms={mark} /></a>
        </h2>
        <p className="job-sub">
          <span className="company"><Marked text={job.company} terms={mark} /></span>
          <span className="sep" aria-hidden="true">·</span>
          <span>{place}</span>
        </p>
        <p className="job-desc">{job.description}</p>
        <div className="job-meta">
          {fresh && <span className="badge-new">New</span>}
          <span className="tag">{job.role ?? "Untagged"}</span>
          <span className="age">{ageLabel(job.posted)}</span>
        </div>
      </div>
      <button type="button" className={"save" + (saved ? " on" : "")} aria-pressed={saved}
        aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
        title={saved ? "Saved" : "Save"} onClick={() => onSave(job.id)}>
        <BookmarkIcon filled={saved} />
      </button>
    </article>
  );
}
