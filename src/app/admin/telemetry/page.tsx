'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, ServerCog, Activity, DatabaseZap } from 'lucide-react';

export default function TelemetryDashboard() {
  const [logs, setLogs] = useState<{ id: number, time: string, level: string, msg: string }[]>([]);

  useEffect(() => {
    // Simulate real-time Cloud Telemetry stream (Syllabus #9)
    const initLogs = [
      { id: 1, time: new Date().toISOString(), level: 'INFO', msg: 'Vercel Serverless Edge deployed' },
      { id: 2, time: new Date().toISOString(), level: 'INFO', msg: 'Neo4j Graph Database routing active' },
      { id: 3, time: new Date().toISOString(), level: 'WARN', msg: 'High latency detected in us-east region' }
    ];
    setLogs(initLogs);

    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = {
          id: Date.now(),
          time: new Date().toISOString(),
          level: Math.random() > 0.8 ? 'WARN' : 'INFO',
          msg: [
            'API request processing completed (200 OK)',
            'Pusher WebSocket connection established',
            'Cloudinary media asset verification passed',
            'Database generic traversal overhead (450ms)',
            'Scaling edge instances to handle traffic spike'
          ][Math.floor(Math.random() * 5)]
        };
        const newArr = [newLog, ...prev];
        if (newArr.length > 20) newArr.pop();
        return newArr;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] p-6 font-mono text-cyan-400">
      <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
        <h1 className="text-3xl font-bold border-b border-cyan-500/30 pb-4 mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8" /> Vertex Cloud Telemetry & Tracing Node
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-cyan-500/20 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <ServerCog className="w-10 h-10 mb-2 text-indigo-400" />
            <h2 className="text-lg text-white font-sans">Edge Compute</h2>
            <p className="text-2xl font-bold mt-2">12 Active Nodes</p>
          </div>
          <div className="bg-[#111] border border-emerald-500/20 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <DatabaseZap className="w-10 h-10 mb-2 text-emerald-400" />
            <h2 className="text-lg text-white font-sans">Graph Throughput</h2>
            <p className="text-2xl font-bold mt-2 font-mono">{(Math.random() * 120 + 80).toFixed(0)} Ops/s</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-10 h-10 mb-2 text-red-500" />
            <h2 className="text-lg text-white font-sans">AES-256 Firewall</h2>
            <p className="text-2xl text-red-400 font-bold mt-2">0 Breaches</p>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0a0f] border border-cyan-500/20 rounded-xl p-4 overflow-hidden flex flex-col">
          <h2 className="text-white font-bold mb-4 font-sans border-b border-cyan-500/20 pb-2">Live Orchestration Logs</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs md:text-sm border-l-2 border-cyan-500 pl-3 py-1 flex items-start gap-4 hover:bg-cyan-500/5 transition-colors">
                <span className="text-gray-500 whitespace-nowrap">{new Date(log.time).toLocaleTimeString()}</span>
                <span className={log.level === 'WARN' ? 'text-yellow-400 font-bold w-12' : 'text-blue-400 font-bold w-12'}>{log.level}</span>
                <span className="text-gray-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
