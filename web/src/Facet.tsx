interface Props {
  title: string;
  items: [string, number][];
  selected: string[];
  onToggle: (v: string) => void;
}

export default function Facet({ title, items, selected, onToggle }: Props) {
  return (
    <fieldset className="facet">
      <legend>{title}</legend>
      {items.map(([name, n]) => {
        const on = selected.includes(name);
        return (
          <label key={name} className={"opt" + (n === 0 && !on ? " empty" : "")}>
            <input type="checkbox" checked={on} onChange={() => onToggle(name)} />
            <span className="opt-label">{name}</span>
            <span className="n">{n}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
