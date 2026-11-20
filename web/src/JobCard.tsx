import type { Job } from "./types";
import { ageLabel, daysAgo } from "./lib";
import { BookmarkIcon, BriefcaseIcon, CalendarIcon, ChevronRight, ClockIcon, PinIcon, TrendIcon, UserIcon } from "./icons";

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

const initials = (s: string) => {
  const w = s.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? "")).toUpperCase();
};

const shortDate = (d?: string) => {
  const t = d ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? "Not listed" : new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const isIntern = (j: Job) => /intern|trainee|apprentice/i.test(j.title);

export default function JobCard({ job, saved, onSave, mark }: Props) {
  const age = daysAgo(job.posted) ?? 99;
  const place = job.location || job.city || "Location not listed";

  return (
    <article className="card">
      {age <= 2 && <p className="hiring"><TrendIcon /> Actively hiring</p>}
      <div className="card-head">
        <div className="card-head-text">
          <h2 className="card-title">
            <a href={job.url} target="_blank" rel="noopener noreferrer"><Marked text={job.title} terms={mark} /></a>
          </h2>
          <p className="card-co"><Marked text={job.company} terms={mark} /></p>
        </div>
        <div className="logo-ph" aria-hidden="true">{initials(job.company)}</div>
      </div>

      <p className="card-loc"><PinIcon /> {place}</p>

      <dl className="card-meta">
        <div><dt><BriefcaseIcon /> Role</dt><dd>{job.role ?? "Untagged"}</dd></div>
        <div><dt><CalendarIcon /> Posted on</dt><dd>{shortDate(job.posted)}</dd></div>
        <div><dt><UserIcon /> Experience</dt><dd>Fresher</dd></div>
      </dl>

      <p className="card-desc">{job.description}</p>

      <div className="card-foot">
        <span className={"chip" + (age <= 1 ? " fresh" : "")}><ClockIcon /> {ageLabel(job.posted)}</span>
        <span className="chip">{isIntern(job) ? "Internship" : "Job"}</span>
        <div className="card-actions">
          <button type="button" className={"save" + (saved ? " on" : "")} aria-pressed={saved}
            aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`} title={saved ? "Saved" : "Save"}
            onClick={() => onSave(job.id)}>
            <BookmarkIcon filled={saved} />
          </button>
          <a className="details" href={job.url} target="_blank" rel="noopener noreferrer">View details <ChevronRight /></a>
        </div>
      </div>
    </article>
  );
}
