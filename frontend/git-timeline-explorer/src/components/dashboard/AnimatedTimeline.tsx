import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Play, Pause } from "lucide-react";

interface Props {
  data: { date: string; count: number }[];
  onScrub?: (date: string) => void;
}

const AnimatedTimeline = ({ data = [], onScrub }: Props) => {
  const [sliceIndex, setSliceIndex] = useState(data.length);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleData = data.slice(0, sliceIndex);

  const play = useCallback(() => {
    setSliceIndex(1);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setSliceIndex((prev) => {
          if (prev >= data.length) {
            setPlaying(false);
            return data.length;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, data.length]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={playing ? () => setPlaying(false) : play}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <input
          type="range"
          min={1}
          max={data.length}
          value={sliceIndex}
          onChange={(e) => {
            setPlaying(false);
            const index = Number(e.target.value);
            setSliceIndex(index);

            if (onScrub && data[index - 1]) {
              onScrub(data[index - 1].date);
            }
          }}
          className="flex-1 accent-[hsl(var(--primary))]"
        />
        <span className="text-xs text-muted-foreground">{sliceIndex}/{data.length} days</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={visibleData}>
          <defs>
            <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} interval={Math.floor(data.length / 6)} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: "hsl(230, 20%, 10%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "hsl(210, 40%, 93%)" }}
            itemStyle={{ color: "hsl(185, 100%, 50%)" }}
          />
          <Area type="monotone" dataKey="count" stroke="hsl(185, 100%, 50%)" fill="url(#commitGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedTimeline;
