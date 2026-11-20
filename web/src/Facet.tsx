import { useId, useState } from "react";

interface Props {
  title: string;
  items: [string, number][];
  selected: string[];
  onToggle: (v: string) => void;
  initial?: number;
}

export default function Facet({ title, items, selected, onToggle, initial = 6 }: Props) {
  const [all, setAll] = useState(false);
  const id = useId();
  // keep selected options visible even when collapsed
  const shown = all ? items : items.filter(([name], i) => i < initial || selected.includes(name));
  const hidden = items.length - shown.length;

  return (
    <div className="fgroup" role="group" aria-labelledby={id}>
      <h3 id={id} className="flabel">{title}</h3>
      {shown.map(([name, n]) => {
        const on = selected.includes(name);
        return (
          <label key={name} className={"opt" + (on ? " on" : "") + (n === 0 && !on ? " empty" : "")}>
            <input type="checkbox" checked={on} onChange={() => onToggle(name)} />
            <span className="opt-label">{name}</span>
            <span className="opt-n">{n}</span>
          </label>
        );
      })}
      {(hidden > 0 || all) && items.length > initial && (
        <button type="button" className="link" onClick={() => setAll(!all)}>
          {all ? "View less" : `View ${hidden} more`}
        </button>
      )}
    </div>
  );
}
