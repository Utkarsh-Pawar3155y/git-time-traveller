import { motion } from "framer-motion";
import { GitBranch, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalysisData } from "@/lib/mockData";
import AnimatedTimeline from "@/components/dashboard/AnimatedTimeline";
import CodeChurnHeatmap from "@/components/dashboard/CodeChurnHeatmap";
import ContributorNetwork from "@/components/dashboard/ContributorNetwork";
import ActivityCalendar from "@/components/dashboard/ActivityCalendar";
import BranchVisualization from "@/components/dashboard/BranchVisualization";
import HotspotPanel from "@/components/dashboard/HotspotPanel";
import HealthScoreMeter from "@/components/dashboard/HealthScoreMeter";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";

interface DashboardProps {
  data: AnalysisData;
}

const sectionVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Dashboard = ({ data }: DashboardProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-primary" />
            <span className="font-display text-sm font-bold tracking-wider text-foreground">
              GIT TIME TRAVELLER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:block">{data.repo}</span>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              New Repo
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6">
          {/* Row 1: Timeline full width */}
          <motion.div custom={0} variants={sectionVariant} initial="hidden" animate="visible">
            <DashboardCard title="Commit Timeline">
              <AnimatedTimeline data={data.commits_per_day} />
            </DashboardCard>
          </motion.div>

          {/* Row 2: Heatmap + Health */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div custom={1} variants={sectionVariant} initial="hidden" animate="visible" className="lg:col-span-2">
              <DashboardCard title="Code Churn Heatmap">
                <CodeChurnHeatmap
                  data={data.top_files}
                  onRangeChange={(days) => analyzeRepo(data.repo, days).then(setData)}
                />
              </DashboardCard>
            </motion.div>
            <motion.div custom={2} variants={sectionVariant} initial="hidden" animate="visible">
              <DashboardCard title="Health Score">
                <HealthScoreMeter score={data.health_score} />
              </DashboardCard>
            </motion.div>
          </div>

          {/* Row 3: Contributors + Hotspots */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div custom={3} variants={sectionVariant} initial="hidden" animate="visible">
              <DashboardCard title="Contributor Network">
                <ContributorNetwork
                  contributors={data.contributors}
                  edges={data.contributor_edges}
                  contributorFileMap={data.contributor_file_map}
                />
              </DashboardCard>
            </motion.div>
            <motion.div custom={4} variants={sectionVariant} initial="hidden" animate="visible">
              <DashboardCard title="Hotspot Panel">
                <HotspotPanel hotspots={data.hotspots} />
              </DashboardCard>
            </motion.div>
          </div>

          {/* Row 4: Activity Calendar */}
          <motion.div custom={5} variants={sectionVariant} initial="hidden" animate="visible">
            <DashboardCard title="Developer Activity Calendar">
              <ActivityCalendar data={data.activity_calendar} />
            </DashboardCard>
          </motion.div>

          {/* Row 5: Branches */}
          <motion.div custom={6} variants={sectionVariant} initial="hidden" animate="visible">
            <DashboardCard title="Branch Visualization">
              <BranchVisualization
                branches={data.branches}
                relations={data.branch_relations}
              />
            </DashboardCard>
          </motion.div>

          {/* Row 6: AI Insights */}
          <motion.div custom={7} variants={sectionVariant} initial="hidden" animate="visible">
            <DashboardCard title="AI Insights">
              <AIInsightsPanel insights={data.ai_insights} />
            </DashboardCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const DashboardCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass rounded-xl border border-border/50 p-5">
    <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-primary">
      {title}
    </h2>
    {children}
  </div>
);

export default Dashboard;
