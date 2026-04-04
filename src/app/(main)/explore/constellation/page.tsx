'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Network, Users, GitBranch, ArrowLeft, Info, RefreshCw } from 'lucide-react';

// react-force-graph-2d requires browser canvas — must be dynamically imported
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface ConstellationNode {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  self?: boolean;
  mutual?: boolean;
  // ForceGraph runtime props
  x?: number;
  y?: number;
}

interface ConstellationLink {
  source: string | ConstellationNode;
  target: string | ConstellationNode;
  type: 'following' | 'follower' | 'peer';
}

interface ConstellationData {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
  selfId: string;
  mutualCount: number;
}

export default function ConstellationPage() {
  const [data, setData] = useState<ConstellationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ConstellationNode | null>(null);
  const [filter, setFilter] = useState<'all' | 'mutual' | 'following' | 'followers'>('all');
  const graphRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/constellation');
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter nodes based on current filter
  const filteredData = data ? (() => {
    if (filter === 'all') return data;

    const selfId = data.selfId;
    let nodeIds: Set<string>;

    if (filter === 'mutual') {
      nodeIds = new Set([selfId, ...data.nodes.filter(n => n.mutual).map(n => n.id)]);
    } else if (filter === 'following') {
      const followingTargets = new Set(
        data.links.filter(l => {
          const src = typeof l.source === 'string' ? l.source : l.source.id;
          return src === selfId && l.type === 'following';
        }).map(l => typeof l.target === 'string' ? l.target : l.target.id)
      );
      nodeIds = new Set([selfId, ...followingTargets]);
    } else {
      const followerSources = new Set(
        data.links.filter(l => {
          const tgt = typeof l.target === 'string' ? l.target : l.target.id;
          return tgt === selfId && l.type === 'follower';
        }).map(l => typeof l.source === 'string' ? l.source : l.source.id)
      );
      nodeIds = new Set([selfId, ...followerSources]);
    }

    return {
      ...data,
      nodes: data.nodes.filter(n => nodeIds.has(n.id)),
      links: data.links.filter(l => {
        const src = typeof l.source === 'string' ? l.source : l.source.id;
        const tgt = typeof l.target === 'string' ? l.target : l.target.id;
        return nodeIds.has(src) && nodeIds.has(tgt);
      }),
    };
  })() : null;

  const nodeColor = (node: ConstellationNode) => {
    if (node.self) return '#6366f1'; // You = Indigo
    if (node.mutual) return '#f59e0b'; // Mutual = Gold
    return '#64748b'; // Others = slate
  };

  const nodeLabel = (node: ConstellationNode) =>
    `${node.name}\n@${node.username}${node.mutual ? ' · Mutual' : ''}${node.self ? ' · You' : ''}`;

  const handleNodeClick = (node: ConstellationNode) => {
    setSelected(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 600);
      graphRef.current.zoom(3, 600);
    }
  };

  return (
    <div className="h-screen w-full bg-[#050508] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/60 backdrop-blur-xl border-b border-white/8 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Network className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Your Constellation</h1>
              <p className="text-xs text-gray-500 mt-0.5">Interactive social graph — click any node</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{data.nodes.length} connections</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <span>{data.mutualCount} mutuals</span>
            </div>
            <button onClick={fetchData} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-500">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-black/40 border-b border-white/5 shrink-0 z-20">
        {(['all', 'mutual', 'following', 'followers'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        {/* Legend */}
        <div className="ml-auto hidden sm:flex items-center gap-3 text-xs text-gray-600">
          <LegendDot color="#6366f1" label="You" />
          <LegendDot color="#f59e0b" label="Mutuals" />
          <LegendDot color="#64748b" label="Others" />
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 animate-ping absolute inset-0" />
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-400 text-sm">Mapping your constellation...</p>
          </div>
        ) : filteredData && filteredData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={{ nodes: filteredData.nodes, links: filteredData.links }}
            backgroundColor="#050508"
            nodeLabel={nodeLabel}
            nodeColor={nodeColor}
            nodeRelSize={6}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const n = node as ConstellationNode;
              const r = n.self ? 12 : n.mutual ? 9 : 6;
              const color = nodeColor(n);

              // Glow
              if (n.self || n.mutual) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
                ctx.fillStyle = color + '22';
                ctx.fill();
              }

              // Node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();

              // Label
              if (globalScale >= 1.2 || n.self) {
                const label = n.name || n.username || '?';
                const fontSize = Math.max(8 / globalScale, 4);
                ctx.font = `${n.self ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, node.x, node.y + r + fontSize + 2);
              }
            }}
            linkColor={(link: any) => {
              const l = link as ConstellationLink;
              if (l.type === 'peer') return '#ffffff08';
              if (l.type === 'following') return '#6366f140';
              return '#f59e0b30';
            }}
            linkWidth={(link: any) => {
              return link.type === 'peer' ? 0.5 : 1.5;
            }}
            linkDirectionalArrowLength={(link: any) => link.type !== 'peer' ? 6 : 0}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={(link: any) => link.type !== 'peer' ? 2 : 0}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 80)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
            <Network className="w-16 h-16 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-400">No connections yet</h3>
            <p className="text-gray-600 text-sm max-w-sm">
              Start following people and your Constellation will come to life here.
            </p>
            <Link href="/explore" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all">
              Explore People
            </Link>
          </div>
        )}
      </div>

      {/* Node Info Card */}
      {selected && !selected.self && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl min-w-[260px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {selected.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">{selected.name}</p>
            <p className="text-sm text-gray-400">@{selected.username}</p>
            {selected.mutual && <p className="text-xs text-amber-400 mt-0.5">🤝 Mutual Connection</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/profile/${selected.username}`}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
            >
              Profile
            </Link>
            <button
              onClick={() => setSelected(null)}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hint */}
      {!isLoading && data && data.nodes.length > 0 && !selected && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 text-xs text-gray-600">
          <Info className="w-3 h-3" /> Click any node to view their profile
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
