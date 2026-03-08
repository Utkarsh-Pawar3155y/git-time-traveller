import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data?: Record<string, { date: string; size: number }[]>;
}

const colors = [
  "hsl(185,100%,50%)",
  "hsl(25,95%,55%)",
  "hsl(260,80%,65%)",
  "hsl(120,60%,50%)",
  "hsl(0,80%,60%)"
];

const FileEvolution = ({ data }: Props) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
        No file evolution data
      </div>
    );
  }

  const files = Object.keys(data);

  // merge all file timelines into one dataset
  const merged: any[] = [];

  files.forEach((file) => {
    data[file].forEach((point) => {
      let existing = merged.find((m) => m.date === point.date);

      if (!existing) {
        existing = { date: point.date };
        merged.push(existing);
      }

      existing[file] = point.size;
    });
  });

  // sort by date
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={merged}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />

        {files.map((file, i) => (
          <Line
            key={file}
            type="monotone"
            dataKey={file}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={false}
            name={file.split("/").pop()}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FileEvolution;