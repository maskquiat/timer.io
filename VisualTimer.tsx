
import React from 'react';
import { Activity } from '../types';

interface VisualTimerProps {
  activities: Activity[];
  currentIndex: number;
  isRunning: boolean;
  now: Date;
}

const VisualTimer: React.FC<VisualTimerProps> = ({ 
  activities, 
  currentIndex,
  isRunning,
  now
}) => {
  const radius = 100;
  const viewBoxSize = 240;
  const center = viewBoxSize / 2;
  
  // Calculate hand rotations based on wall clock time
  const seconds = now.getSeconds();
  const currentMinutes = now.getMinutes() + seconds / 60;
  const currentHours = (now.getHours() % 12) + currentMinutes / 60;

  const getCoordinatesForPercent = (percent: number, r: number = radius) => {
    const x = Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x * r + center, y * r + center];
  };

  const hourScale = 60; // 1 full rotation = 60 minutes for visual familiarity

  // Start drawing wedges from the current minute position
  let cumulativeMinutesOffset = currentMinutes;

  return (
    <div 
      className="relative w-full max-w-md mx-auto aspect-square" 
      role="img" 
      aria-label={`Visual clock showing time and ${activities.length} tasks scheduled.`}
    >
      <svg 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
        className="w-full h-full drop-shadow-2xl"
      >
        <title>Visual Focus Clock</title>
        <desc>An analog-style clock face where task durations are shown as colored segments starting from the current minute.</desc>

        {/* Clock Face Background */}
        <circle 
          cx={center} cy={center} r={radius + 8} 
          className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" 
          strokeWidth="2" 
        />

        {/* Minute Hashes */}
        {[...Array(60)].map((_, i) => {
          const angle = (i * 6 * Math.PI) / 180;
          const innerR = i % 5 === 0 ? radius - 8 : radius - 4;
          const outerR = radius;
          return (
            <line
              key={i}
              x1={Math.cos(angle - Math.PI / 2) * innerR + center}
              y1={Math.sin(angle - Math.PI / 2) * innerR + center}
              x2={Math.cos(angle - Math.PI / 2) * outerR + center}
              y2={Math.sin(angle - Math.PI / 2) * outerR + center}
              className={i % 5 === 0 ? "stroke-slate-400" : "stroke-slate-200"}
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          );
        })}

        {/* Clock Numbers 1-12 */}
        {[...Array(12)].map((_, i) => {
          const num = i + 1;
          const angle = (num * 30 * Math.PI) / 180;
          const textR = radius - 22; // Inset from hashes
          const x = Math.cos(angle - Math.PI / 2) * textR + center;
          const y = Math.sin(angle - Math.PI / 2) * textR + center;
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 dark:fill-slate-400 font-bold text-[10px] select-none"
            >
              {num}
            </text>
          );
        })}

        {/* Activity Wedges */}
        {activities.map((activity, index) => {
          let wedgeDurationMinutes = 0;
          if (activity.completed) {
            wedgeDurationMinutes = 0;
          } else if (isRunning && index === currentIndex) {
            wedgeDurationMinutes = activity.remainingSeconds / 60;
          } else if (isRunning && index < currentIndex) {
            wedgeDurationMinutes = 0;
          } else {
            wedgeDurationMinutes = activity.duration;
          }

          if (wedgeDurationMinutes <= 0) return null;

          const startPercent = cumulativeMinutesOffset / hourScale;
          const endPercent = (cumulativeMinutesOffset + wedgeDurationMinutes) / hourScale;
          
          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          
          const largeArcFlag = wedgeDurationMinutes / hourScale > 0.5 ? 1 : 0;
          const pathData = [
            `M ${center} ${center}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');

          cumulativeMinutesOffset += wedgeDurationMinutes;

          return (
            <path
              key={activity.id}
              d={pathData}
              fill={activity.color}
              className="transition-all duration-300 opacity-60 hover:opacity-80"
              stroke="white"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Hour Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + Math.cos((currentHours * 30 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.5)}
          y2={center + Math.sin((currentHours * 30 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.5)}
          className="stroke-slate-800 dark:stroke-slate-200"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Minute Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + Math.cos((currentMinutes * 6 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.8)}
          y2={center + Math.sin((currentMinutes * 6 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.8)}
          className="stroke-indigo-600 dark:stroke-indigo-400"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Second Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + Math.cos((seconds * 6 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.9)}
          y2={center + Math.sin((seconds * 6 * Math.PI) / 180 - Math.PI / 2) * (radius * 0.9)}
          className="stroke-red-500"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Center Pin */}
        <circle cx={center} cy={center} r="4" className="fill-slate-800 dark:fill-white" />
        <circle cx={center} cy={center} r="1.5" className="fill-red-500" />
      </svg>
    </div>
  );
};

export default VisualTimer;
