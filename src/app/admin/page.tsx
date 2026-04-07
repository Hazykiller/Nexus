'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Cloud } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

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
  const [stats, setStats] = useState({ users: 0, posts: 0, relationships: 0, securityEvents: 0 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadGraph() {
      try {
        const res = await fetch('/api/admin/graph');
        
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await res.json();
        if (data.success && data.data) {
          const { nodes, links } = data.data;
          setGraphData({ nodes: nodes || [], links: links || [] });
          setStats({
            users: (nodes || []).filter((n: GraphNode) => n.label === 'User').length,
            posts: (nodes || []).filter((n: GraphNode) => n.label === 'Post').length,
            securityEvents: (nodes || []).filter((n: GraphNode) => n.label === 'SecurityEvent').length,
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

    // Auto-refresh the admin graph every 5 seconds for real-time monitoring
    const interval = setInterval(loadGraph, 5000);
    return () => clearInterval(interval);
  }, []);

  const nodeColor = useCallback((node: any) => {
    if (node.label === 'User') return '#06b6d4'; // Cyan
    if (node.label === 'Post') return '#10b981'; // Emerald
    if (node.label === 'SecurityEvent') return '#ef4444'; // Red
    return '#94a3b8';
  }, []);

  const linkColor = useCallback((link: any) => {
    if (link.label === 'FOLLOWS') return 'rgba(56,189,248,0.7)';
    if (link.label === 'LIKES') return 'rgba(239,68,68,0.7)';
    if (link.label === 'CREATED') return 'rgba(168,85,247,0.7)';
    return 'rgba(148,163,184,0.5)';
  }, []);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    let size = 4;
    let color = '#94a3b8';
    if (node.label === 'User') { size = 6; color = '#06b6d4'; }
    if (node.label === 'Post') { size = 4; color = '#10b981'; }
    if (node.label === 'SecurityEvent') { size = 7; color = '#ef4444'; }

    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = node.label === 'SecurityEvent' ? 20 : 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    const fontSize = Math.max(3, 10 / globalScale);
    ctx.font = `${node.label === 'SecurityEvent' ? 'bold' : ''} ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = node.label === 'SecurityEvent' ? '#ef4444' : 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(node.name || node.id, node.x, node.y + size + fontSize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050508]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
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
          background: 'linear-gradient(135deg, #22d3ee, #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Vertex Admin — Neo4j Global Operations
        </h1>
        <p className="text-gray-400 text-sm mt-1">Live visualization of the social network graph database</p>
        <Link
          href="/admin/telemetry"
          className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all pointer-events-auto"
        >
          <Cloud className="w-3.5 h-3.5" /> Cloud Monitor
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 left-5 z-20 flex flex-col gap-3">
        <div className="flex gap-3">
          {[
            { label: 'Users', value: stats.users, color: '#06b6d4' },
            { label: 'Posts', value: stats.posts, color: '#10b981' },
            { label: 'Relationships', value: stats.relationships, color: '#38bdf8' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-2 text-sm font-semibold backdrop-blur-md"
                 style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}40`, color: s.color }}>
              {s.value} {s.label}
            </div>
          ))}
        </div>

        {/* Global Security Monitor */}
        <div className="rounded-xl px-4 py-3 min-w-[280px] backdrop-blur-xl border border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Security Health
            </span>
            <span className="text-red-400 font-mono text-sm font-bold">{stats.securityEvents} Alerts</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min(100, (stats.securityEvents / 10) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Active logging of unauthorized 403 API breaches.</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-5 right-5 z-20 rounded-2xl p-4 flex flex-col gap-2 text-sm"
           style={{ background: 'rgba(5,5,10,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
        <div className="text-gray-300 font-semibold mb-1 text-xs uppercase tracking-wider">Telemetry Legend</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-400" /><span className="text-gray-300">User Node</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-gray-300">Post Node</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /><span className="text-gray-300 font-bold text-red-400">Security Breach</span></div>
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
        onNodeClick={(node: any) => setSelectedNode(node)}
      />

      {/* Admin Node Action Context Menu */}
      {selectedNode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-2xl flex flex-col items-center gap-4 bg-black/90 border border-red-500/50 shadow-2xl shadow-red-500/20 backdrop-blur-xl min-w-[300px]">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Moderate {selectedNode.label}
          </h2>
          <div className="text-gray-300 text-sm text-center w-full break-all mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <strong>ID:</strong> {selectedNode.id}
            {selectedNode.name && <><br/><strong>Name:</strong> {selectedNode.name}</>}
          </div>

          <p className="text-red-400 text-xs text-center px-4 mb-2 font-bold max-w-[250px]">
            WARNING: This will permanently wipe this node and all of its relationships from the Neo4j graph! This cannot be undone.
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setSelectedNode(null)}
              className="px-4 py-2 border border-white/20 rounded-xl text-white flex-1 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  const res = await fetch('/api/admin/moderate', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetId: selectedNode.id, nodeType: selectedNode.label })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert('Target successfully eradicated.');
                    window.location.reload(); // Refresh the graph
                  } else {
                    alert('Moderation Failed: ' + data.error);
                  }
                } catch (e: any) {
                  alert('Network error executing deletion.');
                } finally {
                  setIsDeleting(false);
                  setSelectedNode(null);
                }
              }}
              className="px-4 py-2 bg-red-600 rounded-xl text-white flex-1 hover:bg-red-500 transition-colors flex items-center justify-center font-bold"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ERADICATE'}
            </button>
          </div>
        </div>
      )}

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
