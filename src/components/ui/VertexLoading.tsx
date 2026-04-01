/**
 * Vertex 'Indigo Pulse' Loading Component.
 * A high-end, SVG-animated orbital loader designed for the Premium social network experience.
 * Inspired by professional developer tools and luxury tech aesthetics.
 */

export default function VertexLoading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-16 h-16">
        {/* Outer Orbital Ring */}
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
        
        {/* Animated Pulse Ring */}
        <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin [animation-duration:0.8s]" />
        
        {/* Inner Core Glow */}
        <div className="absolute inset-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase animate-pulse">
          Vertex
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          Establishing Airtight Connection...
        </span>
      </div>
    </div>
  );
}
