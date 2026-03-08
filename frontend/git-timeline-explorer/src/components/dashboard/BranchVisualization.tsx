import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface Branch {
  name: string;
  commits: number;
}

interface Relation {
  source: string;
  target: string;
}

interface Props {
  branches: Branch[];
  relations: Relation[];
}

const COLORS = [
  "hsl(185, 100%, 50%)",
  "hsl(265, 90%, 60%)",
  "hsl(145, 80%, 50%)",
  "hsl(25, 95%, 55%)",
  "hsl(215, 100%, 60%)",
  "hsl(0, 80%, 55%)",
  "hsl(45, 90%, 55%)",
];

const BranchVisualization = ({ branches = [], relations = [] }: Props) => {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = branches.map((b, i) => ({
      id: b.name,
      position: { x: 80 + (i % 4) * 220, y: 60 + Math.floor(i / 4) * 140 },
      data: { label: `${b.name} (${b.commits})` },
      style: {
        background: "hsl(230, 20%, 12%)",
        color: "hsl(210, 40%, 93%)",
        border: `2px solid ${COLORS[i % COLORS.length]}`,
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 12,
        fontFamily: "JetBrains Mono",
        boxShadow: `0 0 12px ${COLORS[i % COLORS.length]}33`,
      },
    }));

    const edges: Edge[] = relations.map((r, i) => ({
      id: `edge-${i}`,
      source: r.source,
      target: r.target,
      animated: true,
      style: { stroke: "hsl(185, 100%, 50%)", strokeWidth: 2 },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [branches, relations]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (branches.length === 0)
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );

  return (
    <div
      className="h-[350px] w-full rounded-lg"
      style={{ background: "hsl(230, 25%, 6%)" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(230, 15%, 15%)" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};

export default BranchVisualization;