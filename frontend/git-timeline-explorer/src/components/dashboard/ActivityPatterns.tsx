import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  commits?: { date: string }[];
}

const ActivityPatterns = ({ commits = [] }: Props) => {
  const [mode, setMode] = useState<"hour" | "day" | "month">("hour");

  const data = useMemo(() => {
    if (!commits.length) return [];

    if (mode === "hour") {
      const hours = Array(24).fill(0);
      commits.forEach(c => {
        const h = new Date(c.date).getHours();
        hours[h]++;
      });
      return hours.map((v, i) => ({ label: `${i}`, commits: v }));
    }

    if (mode === "day") {
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const counts = Array(7).fill(0);
      commits.forEach(c => {
        const d = new Date(c.date).getDay();
        counts[d]++;
      });
      return counts.map((v, i) => ({ label: days[i], commits: v }));
    }

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Array(12).fill(0);
    commits.forEach(c => {
      const m = new Date(c.date).getMonth();
      counts[m]++;
    });
    return counts.map((v, i) => ({ label: months[i], commits: v }));

  }, [commits, mode]);

  return (
    <div>
      <div className="flex gap-2 mb-3 text-xs">
        <button onClick={()=>setMode("hour")} className="px-2 py-1 border rounded">Hour</button>
        <button onClick={()=>setMode("day")} className="px-2 py-1 border rounded">Day</button>
        <button onClick={()=>setMode("month")} className="px-2 py-1 border rounded">Month</button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="label"/>
          <YAxis/>
          <Tooltip/>
          <Bar dataKey="commits" fill="hsl(185,100%,50%)"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityPatterns;