import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  data: { date: string; count: number }[];
}

const ActivityCalendar = ({ data = [] }: Props) => {
  const weeks = useMemo(() => {
    const last52 = data.slice(-364);
    const grid: { date: string; count: number }[][] = [];
    for (let i = 0; i < last52.length; i += 7) {
      grid.push(last52.slice(i, i + 7));
    }
    return grid;
  }, [data]);

  const max = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "hsl(230, 15%, 12%)";
    const ratio = count / max;
    if (ratio > 0.75) return "hsl(185, 100%, 50%)";
    if (ratio > 0.5) return "hsl(185, 80%, 40%)";
    if (ratio > 0.25) return "hsl(185, 60%, 28%)";
    return "hsl(185, 40%, 18%)";
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-[3px]" style={{ minWidth: weeks.length * 15 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: wi * 0.01 + di * 0.005 }}
                title={`${day.date}: ${day.count} contributions`}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getColor(day.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityCalendar;
