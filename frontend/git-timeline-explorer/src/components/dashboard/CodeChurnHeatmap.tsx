import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FileData {
  file: string
  change_frequency: number
  additions: number
  deletions: number
  contributors: string[]
  last_modified: string
}

interface Props {
  data: FileData[];
  onRangeChange?: (days?: number) => void;
}

const getColor = (freq: number, max: number) => {
  const ratio = freq / max;
  if (ratio > 0.75) return "hsl(0, 80%, 55%)";
  if (ratio > 0.5) return "hsl(25, 95%, 55%)";
  if (ratio > 0.25) return "hsl(45, 90%, 55%)";
  return "hsl(185, 100%, 50%)";
};

import { useState } from "react";

const CodeChurnHeatmap = ({ data = [], onRangeChange }: Props) => {
  const [selected, setSelected] = useState<FileData | null>(null);
  const [range, setRange] = useState<"30d" | "90d" | "1y" | "all">("all");
  if (data.length === 0) return <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">No data</div>;
  // Filter files by last_modified date
  const now = new Date();

  const filteredData = data.filter((file) => {
    if (range === "all") return true;
    if (!file.last_modified) return true;

    const modified = new Date(file.last_modified);
    const diffDays = (now.getTime() - modified.getTime()) / (1000 * 60 * 60 * 24);

    if (range === "30d") return diffDays <= 30;
    if (range === "90d") return diffDays <= 90;
    if (range === "1y") return diffDays <= 365;

    return true;
  });

  const max = Math.max(...filteredData.map((d) => d.change_frequency), 1);
  const chartData = filteredData
    .sort((a, b) => b.change_frequency - a.change_frequency)
    .map((d) => ({
      ...d,
      name: d.file.split("/").pop(),
    }));

  return (
    <>
      <div className="flex gap-2 mb-3 text-xs">
        <button
          onClick={() => {
            setRange("30d");
            onRangeChange?.(30);
          }}
          className={`px-2 py-1 border rounded ${range === "30d" ? "bg-primary text-black" : "border-border"}`}
        >
          30 Days
        </button>

        <button
          onClick={() => {
            setRange("90d");
            onRangeChange?.(90);
          }}
          className={`px-2 py-1 border rounded ${range === "90d" ? "bg-primary text-black" : "border-border"}`}
        >
          90 Days
        </button>

        <button
          onClick={() => {
            setRange("1y");
            onRangeChange?.(365);
          }}
          className={`px-2 py-1 border rounded ${range === "1y" ? "bg-primary text-black" : "border-border"}`}
        >
          1 Year
        </button>

        <button
          onClick={() => {
            setRange("all");
            onRangeChange?.(undefined);
          }}
          className={`px-2 py-1 border rounded ${range === "all" ? "bg-primary text-black" : "border-border"}`}
        >
          All
        </button>
      </div>





      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
            tickLine={false}
            axisLine={false}
            width={120}
          />

          <Tooltip
            contentStyle={{
              background: "hsl(230, 20%, 10%)",
              border: "1px solid hsl(230, 15%, 18%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(210, 40%, 93%)" }}
            formatter={(value: number, _name: string, props: any) => {
              const item = props.payload as FileData;
              return [
                `${value} commits (+${item.additions} / -${item.deletions})`,
                item.file,
              ];
            }}
          />

          <Bar
            dataKey="change_frequency"
            radius={[0, 4, 4, 0]}
            onClick={(bar: any) => {
              const original = data.find(f => f.file === bar.payload.file);
              setSelected(original || bar.payload);
            }}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.change_frequency, max)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {selected && (
        <div className="mt-4 rounded-lg border border-border p-4 text-xs">
          <p className="font-semibold">{selected.file}</p>
          <p>Commits: {selected.change_frequency}</p>
          <p>Additions: {selected.additions}</p>
          <p>Deletions: {selected.deletions}</p>
          <p>Contributors: {selected.contributors?.join(", ")}</p>
        </div>
      )}
    </>
  );

};

export default CodeChurnHeatmap;
