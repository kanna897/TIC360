'use client';

import React, { useState } from 'react';

interface Slice {
  name: string;
  value: number;
  color: string;
}

interface ThreeDPieChartProps {
  data: Slice[];
  width?: number;
  height?: number;
  depth?: number;
  title?: string;
  subtitle?: string;
}

/** Darken a hex color by a factor (0–1). */
function darken(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * factor));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * factor));
  const b = Math.max(0, Math.floor((num & 0xff) * factor));
  return `rgb(${r},${g},${b})`;
}

export const ThreeDPieChart: React.FC<ThreeDPieChartProps> = ({
  data,
  width = 280,
  height = 220,
  depth = 28,
  title,
  subtitle,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const cx = width / 2;
  const topY = height * 0.42;
  const rx = Math.min(width * 0.42, 115);
  const ry = rx * 0.36; // compression → 3D tilt

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  // Build slice angles
  let angle = -Math.PI / 2;
  const slices = data.map((d, index) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const start = angle;
    const end = angle + sweep;
    const mid = angle + sweep / 2;
    angle += sweep;
    return { ...d, start, end, mid, originalIndex: index };
  });

  /** Point on the ellipse */
  const pt = (a: number, dy = 0) => ({
    x: cx + rx * Math.cos(a),
    y: topY + ry * Math.sin(a) + dy,
  });

  /** Filled pie-slice path (top or bottom face) */
  const facePath = (s: number, e: number, dy = 0) => {
    const p1 = pt(s, dy);
    const p2 = pt(e, dy);
    const large = e - s > Math.PI ? 1 : 0;
    return `M ${cx} ${topY + dy} L ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  };

  /** Side-wall arc for the visible (bottom) portion of a slice */
  const wallPath = (s: number, e: number): string | null => {
    const ws = Math.max(s, 0);
    const we = Math.min(e, Math.PI);
    if (ws >= we - 0.001) return null;
    const p1t = pt(ws, 0);
    const p2t = pt(we, 0);
    const p1b = pt(ws, depth);
    const p2b = pt(we, depth);
    const large = we - ws > Math.PI ? 1 : 0;
    return (
      `M ${p1t.x} ${p1t.y} A ${rx} ${ry} 0 ${large} 1 ${p2t.x} ${p2t.y} ` +
      `L ${p2b.x} ${p2b.y} A ${rx} ${ry} 0 ${large} 0 ${p1b.x} ${p1b.y} Z`
    );
  };

  /** Flat radial edge at angle `a` (for slice boundary in bottom half) */
  const edgePath = (a: number, color: string): React.ReactElement | null => {
    if (a <= 0.001 || a >= Math.PI - 0.001) return null;
    const top = pt(a, 0);
    const bot = pt(a, depth);
    return (
      <path
        d={`M ${cx} ${topY} L ${top.x} ${top.y} L ${bot.x} ${bot.y} L ${cx} ${topY + depth} Z`}
        fill={darken(color, 0.65)}
      />
    );
  };

  // Painter's algorithm: draw bottom-half slices last (on top visually)
  const sorted = [...slices].sort(
    (a, b) => Math.sin((a.start + a.end) / 2) - Math.sin((b.start + b.end) / 2)
  );

  return (
    <div className="flex flex-col items-center gap-3 relative">
      {/* Title */}
      {(title || subtitle) && (
        <div className="text-center">
          {title && <p className="text-xs font-bold text-slate-200">{title}</p>}
          {subtitle && <p className="text-[10px] text-slate-500 -mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* SVG 3D Chart */}
      <svg
        width={width}
        height={height}
        style={{ overflow: 'visible' }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 1. Bottom faces */}
        {sorted.map((s, i) => (
          <path key={`bot-${i}`} d={facePath(s.start, s.end, depth)} fill={darken(s.color, 0.45)} />
        ))}

        {/* 2. Side walls (arc bands) */}
        {sorted.map((s, i) => {
          const w = wallPath(s.start, s.end);
          if (!w) return null;
          return <path key={`wall-${i}`} d={w} fill={darken(s.color, 0.7)} />;
        })}

        {/* 3. Flat radial edges on slice boundaries */}
        {sorted.map((s, i) => (
          <React.Fragment key={`edges-${i}`}>
            {edgePath(((s.start % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), s.color)}
            {edgePath(((s.end % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), s.color)}
          </React.Fragment>
        ))}

        {/* 4. Top faces (Interactive) */}
        {sorted.map((s, i) => (
          <path
            key={`top-${i}`}
            d={facePath(s.start, s.end)}
            fill={s.color}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth={1.2}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            opacity={hoveredSlice !== null && hoveredSlice !== s.originalIndex ? 0.8 : 1}
            onMouseEnter={() => setHoveredSlice(s.originalIndex)}
            onMouseLeave={() => setHoveredSlice(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
          />
        ))}

        {/* Center total label */}
        <text
          x={cx}
          y={topY - ry * 0.15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fontWeight="900"
          fill="white"
          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={topY + ry * 0.25}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="rgba(255,255,255,0.6)"
          fontWeight="600"
        >
          total
        </text>
      </svg>

      {/* Floating Tooltip */}
      {hoveredSlice !== null && (
        <div
          className="absolute pointer-events-none z-10 bg-slate-900 border border-slate-700 rounded-lg shadow-xl px-2.5 py-1.5 flex flex-col items-center"
          style={{
            left: mousePos.x,
            top: mousePos.y - 35, // Position slightly above cursor
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-[11px] font-bold text-white whitespace-nowrap">
            {data[hoveredSlice].name}
          </p>
          <p className="text-[10px] text-slate-300">
            {data[hoveredSlice].value} (
            {Math.round((data[hoveredSlice].value / total) * 100)}%)
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="w-full space-y-1.5 text-xs px-1">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-slate-200 font-semibold truncate tracking-wide">{d.name}</span>
              </span>
              <span className="font-extrabold text-white shrink-0 tabular-nums text-sm">
                {d.value}
                <span className="text-slate-400 font-medium ml-1 text-xs">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
