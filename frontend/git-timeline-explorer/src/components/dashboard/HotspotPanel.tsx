import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Hotspot {
  file: string;
  risk: number;
  reason: string;
  changes: number;
}

interface Props {
  hotspots: Hotspot[];
}

const getRiskColor = (risk: number) => {
  if (risk >= 80) return "hsl(0, 80%, 55%)";
  if (risk >= 60) return "hsl(25, 95%, 55%)";
  return "hsl(45, 90%, 55%)";
};

const HotspotPanel = ({ hotspots }: Props) => {
  return (
    <div className="space-y-3">
      {hotspots.map((h, i) => (
        <motion.div
          key={h.file}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/30 p-4"
        >
          <div
            className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${getRiskColor(h.risk)}15`, border: `1px solid ${getRiskColor(h.risk)}40` }}
          >
            <span className="font-display text-sm font-bold" style={{ color: getRiskColor(h.risk) }}>
              {h.risk}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{h.file}</span>
              {h.risk >= 80 && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />}
            </div>
            <p className="text-xs text-muted-foreground">{h.reason}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getRiskColor(h.risk) }}
                initial={{ width: 0 }}
                animate={{ width: `${h.risk}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HotspotPanel;
