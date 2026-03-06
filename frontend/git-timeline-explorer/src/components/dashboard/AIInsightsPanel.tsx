import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  insights: string[];
}

const AIInsightsPanel = ({ insights }: Props) => {
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4"
        >
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-foreground/90">{insight}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default AIInsightsPanel;
