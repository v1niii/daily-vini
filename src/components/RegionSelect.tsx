"use client";

const REGIONS = ["eu", "na", "ap", "kr", "br", "latam"] as const;

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

export default function RegionSelect({ value, onChange, id }: Props) {
  return (
    <select
      id={id}
      className="select-region"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {REGIONS.map((r) => (
        <option key={r} value={r}>
          {r.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
