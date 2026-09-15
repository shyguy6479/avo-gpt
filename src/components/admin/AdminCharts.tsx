import React, { useState } from 'react';

interface DataPoint {
  date: string;
  label: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  hoverColor?: string;
  unit?: string;
}

export const BarChart30Days: React.FC<ChartProps> = ({
  data,
  height = 180,
  barColor = '#FFFFFF',
  unit = 'requests'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-xs text-zinc-500">
        No historical data recorded yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const chartHeight = height - 30; // Leave room for X labels

  return (
    <div className="relative w-full select-none">
      {/* Tooltip Overlay */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute -top-8 z-20 px-2.5 py-1 text-[11px] font-medium text-white bg-zinc-950 border border-zinc-700 rounded shadow-lg pointer-events-none transform -translate-x-1/2 transition-all duration-75"
          style={{
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
          }}
        >
          <span className="text-white font-mono font-semibold">
            {data[hoveredIdx].value.toLocaleString()}
          </span>{' '}
          {unit} · {data[hoveredIdx].label}
        </div>
      )}

      <svg
        className="w-full overflow-visible"
        viewBox={`0 0 ${data.length * 14} ${height}`}
        preserveAspectRatio="none"
        style={{ height: `${height}px` }}
      >
        {/* Subtle Horizontal Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2={data.length * 14}
              y2={y}
              stroke="#27272a"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {data.map((point, idx) => {
          const barH = Math.max((point.value / maxValue) * chartHeight, 3);
          const x = idx * 14 + 2;
          const y = chartHeight - barH;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={point.date || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible touch/hover target */}
              <rect
                x={idx * 14}
                y="0"
                width="14"
                height={height}
                fill="transparent"
              />
              {/* Visible Bar */}
              <rect
                x={x}
                y={y}
                width="10"
                height={barH}
                rx="2"
                fill={isHovered ? '#FFFFFF' : barColor}
                opacity={isHovered ? 1 : 0.85}
                className="transition-colors duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* X-Axis Date Labels */}
      <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1.5 px-1 font-mono">
        <span>{data[0]?.label || ''}</span>
        <span>{data[Math.floor(data.length / 2)]?.label || ''}</span>
        <span>{data[data.length - 1]?.label || ''}</span>
      </div>
    </div>
  );
};

export const AreaChart30Days: React.FC<ChartProps> = ({
  data,
  height = 180,
  barColor = '#FFFFFF',
  unit = 'signups'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-xs text-zinc-500">
        No trend data recorded yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 6);
  const chartHeight = height - 30;
  const totalPoints = data.length;
  const stepX = (totalPoints - 1 > 0) ? (totalPoints * 14) / (totalPoints - 1) : 14;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <div className="relative w-full select-none">
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute -top-8 z-20 px-2.5 py-1 text-[11px] font-medium text-white bg-zinc-950 border border-zinc-700 rounded shadow-lg pointer-events-none transform -translate-x-1/2 transition-all duration-75"
          style={{
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
          }}
        >
          <span className="text-white font-mono font-semibold">
            {data[hoveredIdx].value.toLocaleString()}
          </span>{' '}
          {unit} · {data[hoveredIdx].label}
        </div>
      )}

      <svg
        className="w-full overflow-visible"
        viewBox={`0 0 ${data.length * 14} ${height}`}
        preserveAspectRatio="none"
        style={{ height: `${height}px` }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2={data.length * 14}
              y2={y}
              stroke="#27272a"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={barColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={p.date || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 4.5 : 2.5}
                fill={isHovered ? '#FFFFFF' : '#E4E4E7'}
                stroke="#000000"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
              <rect
                x={p.x - 7}
                y="0"
                width="14"
                height={height}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>

      <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1.5 px-1 font-mono">
        <span>{data[0]?.label || ''}</span>
        <span>{data[Math.floor(data.length / 2)]?.label || ''}</span>
        <span>{data[data.length - 1]?.label || ''}</span>
      </div>
    </div>
  );
};
