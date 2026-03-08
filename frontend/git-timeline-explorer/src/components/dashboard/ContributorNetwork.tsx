import { motion } from "framer-motion";
import { useState, useMemo } from "react";

interface Contributor {
  name: string;
  commits: number;
  commit_share_pct?: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface Props {
  contributors: Contributor[];
  edges: Edge[];
}

const COLORS = [
  "hsl(185, 100%, 50%)",
  "hsl(265, 90%, 60%)",
  "hsl(145, 80%, 50%)",
  "hsl(25, 95%, 55%)",
  "hsl(215, 100%, 60%)",
  "hsl(0, 80%, 55%)",
  "hsl(50, 90%, 55%)",
  "hsl(310, 80%, 55%)",
];

const ContributorNetwork = ({ contributors = [], edges = [] }: Props) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const count = contributors.length;
  const isLarge = count > 10;

  const maxCommits = useMemo(
    () => Math.max(...contributors.map((c) => c.commits), 1),
    [contributors]
  );

  const sorted = useMemo(
    () => [...contributors].sort((a, b) => b.commits - a.commits),
    [contributors]
  );

  const viewW = isLarge ? 700 : 500;
  const viewH = isLarge ? 500 : 380;
  const cx = viewW / 2;
  const cy = viewH / 2;
  const innerRadius = isLarge ? 120 : 0;
  const outerRadius = Math.min(cx, cy) - (isLarge ? 60 : 50);

  const rings = useMemo(() => {
    if (!isLarge) return [{ items: sorted, radius: outerRadius - 20 }];
    const mid = Math.ceil(sorted.length / 2);
    return [
      { items: sorted.slice(0, mid), radius: outerRadius },
      { items: sorted.slice(mid), radius: innerRadius + (outerRadius - innerRadius) * 0.45 },
    ];
  }, [sorted, isLarge, outerRadius, innerRadius]);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number; color: string; commits: number; name: string }> = {};
    let colorIdx = 0;
    rings.forEach((ring) => {
      ring.items.forEach((c, i) => {
        const angle = (2 * Math.PI * i) / ring.items.length - Math.PI / 2;
        map[c.name] = {
          x: cx + ring.radius * Math.cos(angle),
          y: cy + ring.radius * Math.sin(angle),
          color: COLORS[colorIdx % COLORS.length],
          commits: c.commits,
          name: c.name,
        };
        colorIdx++;
      });
    });
    return map;
  }, [rings, cx, cy]);

  const connectedTo = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    edges.forEach((e) => {
      if (!m[e.source]) m[e.source] = new Set();
      if (!m[e.target]) m[e.target] = new Set();
      m[e.source].add(e.target);
      m[e.target].add(e.source);
    });
    return m;
  }, [edges]);

  if (count === 0)
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );

  const isHighlighted = (name: string) => {
    if (!hovered) return true;
    if (name === hovered) return true;
    return connectedTo[hovered]?.has(name) ?? false;
  };

  const nodeRadius = (commits: number) => {
    const norm = commits / maxCommits;
    const base = isLarge ? 6 : 8;
    const scale = isLarge ? 12 : 16;
    return base + norm * scale;
  };

  const displayName = (name: string) => {
    if (!isLarge) return name;
    return name.length > 12 ? name.slice(0, 11) + "…" : name;
  };

  return (
    <div className="flex items-center justify-center overflow-hidden">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-[400px] w-full" style={{ maxWidth: viewW }}>
        {/* Decorative rings */}
        {rings.map((ring, i) => (
          <circle key={i} cx={cx} cy={cy} r={ring.radius} fill="none" stroke="hsl(185, 100%, 50%)" strokeOpacity={0.06} strokeWidth={1} />
        ))}

        {/* Edges */}
        {edges.map((e, i) => {
          const s = positions[e.source];
          const t = positions[e.target];
          if (!s || !t) return null;
          const active = isHighlighted(e.source) && isHighlighted(e.target);
          return (
            <motion.line
              key={i}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={s.color}
              strokeOpacity={active ? 0.15 + e.weight / 60 : 0.03}
              strokeWidth={active ? 1 + e.weight / 25 : 0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
            />
          );
        })}

        {/* Nodes */}
        {Object.values(positions).map((p, i) => {
          const r = nodeRadius(p.commits);
          const active = isHighlighted(p.name);
          const isFocused = hovered === p.name;
          return (
            <motion.g
              key={p.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: active ? 1 : 0.2, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.03, type: "spring", stiffness: 200 }}
              onMouseEnter={() => setHovered(p.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {isFocused && (
                <circle cx={p.x} cy={p.y} r={r + 8} fill="none" stroke={p.color} strokeOpacity={0.3} strokeWidth={2} />
              )}
              <circle cx={p.x} cy={p.y} r={r} fill={p.color} fillOpacity={isFocused ? 0.25 : 0.1} stroke={p.color} strokeWidth={isFocused ? 2 : 1} />
              <circle cx={p.x} cy={p.y} r={Math.max(3, r * 0.35)} fill={p.color} />
              {(!isLarge || active) && (
                <>
                  <text x={p.x} y={p.y + r + 14} textAnchor="middle" fill="hsl(210, 40%, 93%)" fontSize={isLarge ? 9 : 11} fontFamily="Space Grotesk" opacity={active ? 1 : 0.5}>
                    {displayName(p.name)}
                  </text>
                  {(!isLarge || isFocused) && (
                    <text x={p.x} y={p.y + r + (isLarge ? 24 : 28)} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize={isLarge ? 8 : 9} fontFamily="JetBrains Mono">
                      {p.commits} commits ({contributors.find(c => c.name === p.name)?.commit_share_pct ?? 0}%)
                    </text>
                  )}
                </>
              )}
            </motion.g>
          );
        })}

        {/* Center count */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="hsl(185, 100%, 50%)" fontSize={14} fontFamily="Space Grotesk" opacity={0.4}>
          {count}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize={9} fontFamily="JetBrains Mono" opacity={0.4}>
          contributors
        </text>
      </svg>
    </div>
  );
};

export default ContributorNetwork;
