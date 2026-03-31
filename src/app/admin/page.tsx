'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// ForceGraph2D requires browser canvas — must be dynamically imported (no SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
  id: string;
  name?: string;
  label?: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function AdminGraphDashboard() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ users: 0, posts: 0, relationships: 0 });

  useEffect(() => {
    async function loadGraph() {
      try {
        const res = await fetch('/api/admin/graph');
        
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        
        const data = await res.json();
        if (data.success && data.data) {
          const { nodes, links } = data.data;
          setGraphData({ nodes: nodes || [], links: links || [] });
          setStats({
            users: (nodes || []).filter((n: GraphNode) => n.label === 'User').length,
            posts: (nodes || []).filter((n: GraphNode) => n.label === 'Post').length,
            relationships: (links || []).length,
          });
        } else {
          setError(data.error || 'Failed to load graph');
        }
      } catch (err) {
        console.error('Graph load error:', err);
        setError('Could not connect to API');
      } finally {
        setIsLoading(false);
      }
    }
    loadGraph();
  }, []);

  const nodeColor = useCallback((node: any) => {
    if (node.label === 'User') return '#8b5cf6';
    if (node.label === 'Post') return '#d946ef';
    return '#94a3b8';
  }, []);

  const linkColor = useCallback((link: any) => {
    if (link.label === 'FOLLOWS') return 'rgba(56,189,248,0.7)';
    if (link.label === 'LIKES') return 'rgba(239,68,68,0.7)';
    if (link.label === 'CREATED') return 'rgba(168,85,247,0.7)';
    return 'rgba(148,163,184,0.5)';
  }, []);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.label === 'User' ? 6 : 4;
    const color = node.label === 'User' ? '#8b5cf6' : '#d946ef';

    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    const fontSize = Math.max(3, 10 / globalScale);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(node.name || node.id, node.x, node.y + size + fontSize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050508]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="ml-3 text-white text-lg">Loading Neo4j Graph...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050508] flex-col gap-4">
        <div className="text-red-400 text-xl font-bold">⚠ Graph Error</div>
        <div className="text-gray-400">{error}</div>
        <div className="text-gray-500 text-sm">Make sure the Neo4j Docker container is running and the app server is reachable.</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative bg-[#050508] overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-5 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(5,5,8,0.95), transparent)' }}>
        <h1 className="text-3xl font-bold" style={{
          background: 'linear-gradient(135deg, #a78bfa, #e879f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Nexus Admin — Neo4j Graph
        </h1>
        <p className="text-gray-400 text-sm mt-1">Live visualization of the social network graph database</p>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 left-5 z-20 flex gap-3">
        {[
          { label: 'Users', value: stats.users, color: '#8b5cf6' },
          { label: 'Posts', value: stats.posts, color: '#d946ef' },
          { label: 'Relationships', value: stats.relationships, color: '#38bdf8' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-2 text-sm font-semibold"
               style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}40`, color: s.color }}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-5 right-5 z-20 rounded-2xl p-4 flex flex-col gap-2 text-sm"
           style={{ background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
        <div className="text-gray-300 font-semibold mb-1 text-xs uppercase tracking-wider">Legend</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500" /><span className="text-gray-300">User</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-500" /><span className="text-gray-300">Post</span></div>
        <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.08)' }}/>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-sky-400" /><span className="text-gray-300">FOLLOWS</span></div>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-red-400" /><span className="text-gray-300">LIKES</span></div>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-purple-400" /><span className="text-gray-300">CREATED</span></div>
      </div>

      {/* Force Graph Canvas */}
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node: any) => `${node.label}: ${node.name || node.id}`}
        nodeColor={nodeColor}
        linkColor={linkColor}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        backgroundColor="#050508"
        nodeRelSize={5}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.4}
        onNodeClick={(node: any) => {
          alert(`${node.label}: ${node.name || node.id}\nID: ${node.id}`);
        }}
      />

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-5xl mb-4">🕸</div>
            <div className="text-gray-300 text-xl font-semibold">No nodes found</div>
            <div className="text-gray-500 text-sm mt-2">Register some users or create posts to see the graph.</div>
          </div>
        </div>
      )}
    </div>
  );
}
