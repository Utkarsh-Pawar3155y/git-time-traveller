import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Zap, Search, ArrowRight, Github, Activity, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analyzeRepo } from "@/lib/api";
import { AnalysisData } from "@/lib/mockData";

const features = [
  { icon: Activity, title: "Commit Timeline", desc: "Animated history playback" },
  { icon: GitBranch, title: "Branch Graph", desc: "Interactive flow visualization" },
  { icon: Shield, title: "Health Score", desc: "Repository risk analysis" },
  { icon: Zap, title: "AI Insights", desc: "Smart pattern detection" },
];

interface LandingPageProps {
  onAnalyzed: (data: AnalysisData) => void;
}

const LandingPage = ({ onAnalyzed }: LandingPageProps) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }
    if (!repoUrl.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await analyzeRepo(repoUrl);
      onAnalyzed(data);
      navigate("/dashboard");
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background grid-bg">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="relative">
            <GitBranch className="h-10 w-10 text-primary" />
            <div className="absolute inset-0 animate-pulse-glow text-primary blur-md">
              <GitBranch className="h-10 w-10" />
            </div>
          </div>
          <span className="font-display text-xl font-bold tracking-wider text-foreground">
            GIT TIME TRAVELLER
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 text-center font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl"
        >
          Travel Through Your
          <br />
          <span className="text-glow text-primary">Git History</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12 max-w-xl text-center text-lg text-muted-foreground"
        >
          Visualize commits, branches, contributors and code health with cinematic precision.
        </motion.p>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-4 flex w-full max-w-2xl flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <Github className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="https://github.com/user/repo"
              className="h-14 w-full rounded-lg border border-border bg-card pl-12 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 glow-sm transition-all"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="group flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-display text-sm font-semibold text-primary-foreground transition-all hover:glow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Analyze
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
              className="glass flex flex-col items-center gap-2 rounded-lg p-5 text-center transition-all hover:border-glow"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <span className="font-display text-sm font-semibold text-foreground">{f.title}</span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <LoaderFull />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Loader = () => (
  <motion.div
    className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

const LoaderFull = () => (
  <div className="flex flex-col items-center gap-6">
    <div className="relative">
      <motion.div
        className="h-20 w-20 rounded-full border-2 border-primary/30"
        style={{ borderTopColor: "hsl(var(--primary))" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-accent/30"
        style={{ borderBottomColor: "hsl(var(--accent))" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <GitBranch className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
    </div>
    <div className="text-center">
      <p className="font-display text-lg font-semibold text-foreground">Analyzing Repository</p>
      <motion.p
        className="text-sm text-muted-foreground"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Scanning commits, branches & contributors...
      </motion.p>
    </div>
  </div>
);

export default LandingPage;
