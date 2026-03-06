import { motion } from "framer-motion";

interface Props {
  score: number;
}

const HealthScoreMeter = ({ score }: Props) => {
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(145, 80%, 50%)";
    if (s >= 60) return "hsl(45, 90%, 55%)";
    return "hsl(0, 80%, 55%)";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Critical";
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220">
          {/* Track */}
          <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(230, 15%, 14%)" strokeWidth="10" />
          {/* Progress */}
          <motion.circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeOut" }}
            transform="rotate(-90 110 110)"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-display text-5xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">{getLabel(score)}</span>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreMeter;
