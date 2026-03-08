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
}

const getColor = (freq: number, max: number) => {
  const ratio = freq / max;
  if (ratio > 0.75) return "hsl(0, 80%, 55%)";
  if (ratio > 0.5) return "hsl(25, 95%, 55%)";
  if (ratio > 0.25) return "hsl(45, 90%, 55%)";
  return "hsl(185, 100%, 50%)";
};

import { useState } from "react";

const CodeChurnHeatmap = ({ data = [] }: Props) => {
  const [selected, setSelected] = useState<FileData | null>(null);
  if (data.length === 0) return <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">No data</div>;
    const max = Math.max(...data.map((d) => d.change_frequency));
    const chartData = data.map((d) => ({
    ...d,
    name: d.file.split("/").pop(),
  }));

  return (
  <>
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
          onClick={(data: any) => setSelected(data.payload)}
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

  // return (
    // <ResponsiveContainer width="100%" height={400}>
      {/* <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}> */}
        {/* <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} /> */}
        {/* <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} width={120} /> */}
        {/* <Tooltip */}
          // contentStyle={{ background: "hsl(230, 20%, 10%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
          // labelStyle={{ color: "hsl(210, 40%, 93%)" }}
          // formatter={(value: number, _name: string, props: any) => {
            // const item = props.payload as FileData;
            // return [
              // `${value} commits (+${item.additions} / -${item.deletions})`,
              // item.file
            // ];
          // }}
        // />
        {/* <Bar */}
          // dataKey="change_frequency"
          // radius={[0, 4, 4, 0]}
          // onClick={(data:any)=>setSelected(data.payload)}
        // > 
          {/* {chartData.map((entry, i) => ( */}
            // <Cell key={i} fill={getColor(entry.change_frequency, max)} />
          // ))}
        {/* </Bar> */}
      {/* </BarChart> */}
    {/* </ResponsiveContainer> */}
    // {selected && (
      // <div className="mt-4 rounded-lg border border-border p-4 text-xs">
        // <p className="font-semibold">{selected.file}</p>
        // <p>Commits: {selected.change_frequency}</p>
        // <p>Additions: {selected.additions}</p>
        // <p>Deletions: {selected.deletions}</p>
        // <p>Contributors: {selected.contributors?.join(", ")}</p>
      // </div>
  // )}
  // );
};

export default CodeChurnHeatmap;
