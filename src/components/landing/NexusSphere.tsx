'use client';

import { useEffect, useRef } from 'react';

export default function NexusSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const numPoints = 400;
    const radius = Math.max(width, height) * 0.9;

    const points: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      points.push({ x: x * radius, y: y * radius, z: z * radius });
    }

    let rotationX = 0;
    let rotationY = 0;
    let targetRotationX = 0.002;
    let targetRotationY = 0.002;

    const handleMouseMove = (e: MouseEvent) => {
      targetRotationY = (e.clientX - width / 2) * 0.000002;
      targetRotationX = (e.clientY - height / 2) * 0.000002;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const fov = 800;

    const render = () => {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);
      rotationX += targetRotationX - rotationX * 0.01;
      rotationY += targetRotationY - rotationY * 0.01;
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      const projected = points.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        p.x = x1;
        p.y = y1;
        p.z = z2;
        const scale = fov / (fov + z2);
        return {
          x: x1 * scale + width / 2,
          y: y1 * scale + height / 2,
          z: z2,
          scale,
        };
      });

      projected.sort((a, b) => b.z - a.z);

      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.z > 200) continue;
        ctx.fillStyle = `rgba(226,232,240,${Math.max(0.1, p1.scale * 0.8)})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.scale * 2.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < Math.min(i + 5, projected.length); j++) {
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100 * p1.scale) {
            ctx.strokeStyle = `rgba(148,163,184,${Math.max(0.05, (1 - dist / 100) * p1.scale * 0.3)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 bg-[#050508]"
      style={{ opacity: 0.85 }}
    />
  );
}
