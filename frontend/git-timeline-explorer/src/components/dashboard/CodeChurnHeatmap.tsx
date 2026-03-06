import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FileData {
  file: string;
  changes: number;
  additions: number;
  deletions: number;
}

interface Props {
  data: FileData[];
}

const getColor = (changes: number, max: number) => {
  const ratio = changes / max;
  if (ratio > 0.75) return "hsl(0, 80%, 55%)";
  if (ratio > 0.5) return "hsl(25, 95%, 55%)";
  if (ratio > 0.25) return "hsl(45, 90%, 55%)";
  return "hsl(185, 100%, 50%)";
};

const CodeChurnHeatmap = ({ data = [] }: Props) => {
  if (data.length === 0) return <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">No data</div>;
  const max = Math.max(...data.map((d) => d.changes));
  const chartData = data.map((d) => ({ ...d, name: d.file.split("/").pop() }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} width={120} />
        <Tooltip
          contentStyle={{ background: "hsl(230, 20%, 10%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(210, 40%, 93%)" }}
          formatter={(value: number, _name: string, props: any) => {
            const item = props.payload as FileData;
            return [`${value} changes (+${item.additions} / -${item.deletions})`, ""];
          }}
        />
        <Bar dataKey="changes" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.changes, max)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CodeChurnHeatmap;
