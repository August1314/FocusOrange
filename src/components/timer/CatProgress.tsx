import React from 'react';
import { motion } from 'motion/react';
import { Flag, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CatProgressProps {
  progress: number;
  themeColor: string;
  isActive?: boolean;
  className?: string;
}

type CatFrame = {
  solid: Array<[number, number, number]>;
  mid: Array<[number, number, number]>;
  soft: Array<[number, number, number]>;
};

const RUN_CAT_FRAMES: CatFrame[] = [
  {
    solid: [[22, 8, 1], [25, 8, 1], [23, 9, 2], [23, 10, 4], [20, 11, 3], [25, 11, 1], [20, 12, 3], [19, 13, 9], [13, 14, 14], [8, 15, 18], [6, 16, 3], [11, 16, 13], [3, 17, 4], [11, 17, 13], [1, 18, 3], [12, 18, 12], [12, 19, 7], [20, 19, 4], [12, 20, 5], [21, 20, 2], [12, 21, 5], [21, 21, 2], [12, 22, 1], [15, 22, 2], [21, 22, 1], [12, 23, 2], [13, 24, 1]],
    mid: [[25, 7, 1], [21, 8, 1], [23, 8, 2], [21, 9, 2], [25, 9, 1], [20, 10, 3], [23, 11, 2], [26, 11, 2], [19, 12, 1], [24, 12, 2], [27, 12, 2], [14, 13, 5], [28, 13, 1], [12, 14, 1], [27, 14, 1], [7, 15, 1], [26, 15, 1], [5, 16, 1], [9, 16, 2], [24, 16, 1], [0, 17, 3], [24, 17, 1], [0, 18, 1], [4, 18, 1], [11, 18, 1], [24, 18, 1], [11, 19, 1], [19, 19, 1], [11, 20, 1], [17, 20, 1], [20, 20, 1], [23, 20, 1], [11, 21, 1], [20, 21, 1], [11, 22, 1], [13, 22, 2], [17, 22, 1], [20, 22, 1], [14, 23, 1], [16, 23, 2], [12, 24, 1], [14, 24, 1], [13, 25, 2]],
    soft: [[21, 7, 4], [26, 7, 1], [26, 8, 1], [20, 9, 1], [26, 9, 1], [27, 10, 1], [19, 11, 1], [28, 11, 1], [23, 12, 1], [26, 12, 1], [13, 13, 1], [9, 14, 3], [28, 14, 1], [6, 15, 1], [27, 15, 1], [4, 16, 1], [25, 16, 1], [7, 17, 1], [10, 17, 1], [5, 18, 1], [10, 18, 1], [10, 19, 1], [24, 19, 1], [10, 20, 1], [24, 20, 1], [17, 21, 1], [23, 21, 1], [22, 22, 1], [11, 23, 1], [15, 23, 1], [18, 23, 1], [15, 24, 1], [15, 25, 1]],
  },
  {
    solid: [[24, 7, 1], [26, 8, 2], [25, 9, 4], [23, 10, 2], [27, 10, 1], [22, 11, 3], [20, 12, 10], [14, 13, 16], [3, 14, 25], [1, 15, 3], [11, 15, 16], [12, 16, 16], [10, 17, 19], [8, 18, 13], [25, 18, 5], [7, 19, 8], [27, 19, 1], [6, 20, 8], [6, 21, 2], [10, 21, 2], [10, 22, 2], [10, 23, 1]],
    mid: [[27, 6, 2], [25, 7, 4], [23, 8, 3], [28, 8, 1], [23, 9, 2], [29, 9, 1], [22, 10, 1], [25, 10, 2], [28, 10, 2], [21, 11, 1], [25, 11, 1], [27, 11, 4], [16, 12, 4], [30, 12, 1], [6, 13, 5], [13, 13, 1], [2, 14, 1], [28, 14, 1], [0, 15, 1], [4, 15, 4], [9, 15, 2], [11, 16, 1], [28, 16, 1], [9, 17, 1], [29, 17, 1], [21, 18, 1], [24, 18, 1], [15, 19, 3], [26, 19, 1], [28, 19, 1], [14, 20, 1], [5, 21, 1], [9, 21, 1], [12, 21, 1], [9, 22, 1], [9, 23, 1]],
    soft: [[24, 6, 3], [29, 6, 1], [23, 7, 1], [29, 7, 1], [22, 8, 1], [29, 8, 1], [22, 9, 1], [30, 9, 1], [21, 10, 1], [30, 10, 1], [26, 11, 1], [15, 12, 1], [4, 13, 2], [11, 13, 2], [30, 13, 1], [1, 14, 1], [29, 14, 1], [8, 15, 1], [27, 15, 1], [1, 16, 1], [10, 16, 1], [29, 16, 1], [8, 17, 1], [30, 17, 1], [7, 18, 1], [22, 18, 1], [30, 18, 1], [6, 19, 1], [18, 19, 2], [25, 19, 1], [29, 19, 1], [5, 20, 1], [8, 21, 1], [13, 21, 1], [6, 22, 1], [12, 22, 1], [11, 23, 1], [9, 24, 2]],
  },
  {
    solid: [[26, 9, 1], [29, 9, 1], [4, 10, 6], [27, 10, 1], [10, 11, 2], [24, 11, 6], [12, 12, 2], [15, 12, 4], [23, 12, 3], [13, 13, 13], [13, 14, 18], [12, 15, 18], [10, 16, 18], [8, 17, 21], [7, 18, 24], [7, 19, 2], [11, 19, 4], [25, 19, 4], [11, 20, 2], [26, 20, 3], [11, 21, 1], [28, 21, 2]],
    mid: [[26, 8, 1], [25, 9, 1], [27, 9, 2], [3, 10, 1], [10, 10, 1], [24, 10, 3], [28, 10, 2], [3, 11, 2], [8, 11, 2], [12, 11, 1], [23, 11, 1], [30, 11, 1], [11, 12, 1], [14, 12, 1], [19, 12, 1], [26, 12, 5], [12, 13, 1], [26, 13, 1], [28, 13, 1], [12, 14, 1], [31, 14, 1], [11, 15, 1], [30, 15, 1], [9, 16, 1], [28, 16, 1], [7, 17, 1], [29, 17, 1], [6, 18, 1], [6, 19, 1], [9, 19, 2], [15, 19, 1], [24, 19, 1], [29, 19, 2], [10, 20, 1], [13, 20, 1], [25, 20, 1], [29, 20, 1], [10, 21, 1], [12, 21, 1], [27, 21, 1]],
    soft: [[25, 8, 1], [27, 8, 4], [4, 9, 5], [24, 9, 1], [30, 9, 1], [2, 10, 1], [11, 10, 1], [30, 10, 1], [2, 11, 1], [5, 11, 3], [13, 11, 1], [10, 12, 1], [20, 12, 1], [22, 12, 1], [31, 12, 1], [11, 13, 1], [27, 13, 1], [29, 13, 3], [11, 14, 1], [10, 15, 1], [31, 15, 1], [8, 16, 1], [29, 16, 1], [30, 17, 1], [31, 18, 1], [16, 19, 8], [31, 19, 1], [7, 20, 1], [14, 20, 1], [24, 20, 1], [9, 21, 1], [13, 21, 1], [26, 21, 1], [30, 21, 1], [10, 22, 2], [28, 22, 2]],
  },
  {
    solid: [[5, 9, 5], [10, 10, 2], [12, 11, 1], [26, 11, 1], [13, 12, 1], [29, 12, 1], [13, 13, 5], [27, 13, 2], [13, 14, 6], [23, 14, 7], [12, 15, 14], [12, 16, 14], [11, 17, 19], [11, 18, 19], [11, 19, 16], [12, 20, 2], [20, 20, 7], [12, 21, 2], [22, 21, 6], [13, 22, 1], [23, 22, 6], [13, 23, 1], [24, 23, 1], [24, 24, 2], [25, 25, 1]],
    mid: [[5, 8, 4], [4, 9, 1], [10, 9, 1], [9, 10, 1], [11, 11, 1], [27, 11, 1], [12, 12, 1], [14, 12, 1], [24, 12, 5], [30, 12, 1], [12, 13, 1], [18, 13, 1], [24, 13, 3], [29, 13, 1], [12, 14, 1], [19, 14, 1], [30, 14, 1], [28, 15, 3], [11, 16, 1], [26, 16, 3], [30, 16, 1], [10, 17, 1], [30, 17, 1], [10, 18, 1], [30, 18, 1], [27, 19, 2], [11, 20, 1], [14, 20, 1], [18, 20, 2], [28, 21, 1], [12, 22, 1], [22, 22, 1], [29, 22, 1], [12, 23, 1], [23, 23, 1], [25, 23, 1], [23, 24, 1], [26, 24, 1], [24, 25, 1], [26, 25, 1]],
    soft: [[4, 8, 1], [9, 8, 1], [11, 9, 1], [7, 10, 2], [12, 10, 1], [10, 11, 1], [13, 11, 1], [25, 11, 1], [28, 11, 3], [11, 12, 1], [15, 12, 3], [19, 13, 1], [23, 13, 1], [30, 13, 1], [20, 14, 1], [22, 14, 1], [11, 15, 1], [26, 15, 2], [31, 15, 1], [10, 16, 1], [29, 16, 1], [31, 16, 1], [31, 17, 1], [10, 19, 1], [29, 19, 1], [10, 20, 1], [15, 20, 1], [17, 20, 1], [27, 20, 1], [11, 21, 1], [14, 21, 1], [21, 21, 1], [29, 21, 1], [11, 22, 1], [14, 22, 1], [14, 23, 1], [22, 23, 1], [26, 23, 3], [12, 24, 2], [27, 25, 1]],
  },
  {
    solid: [[23, 10, 1], [26, 10, 1], [24, 11, 2], [13, 12, 4], [21, 12, 6], [11, 13, 12], [25, 13, 2], [9, 14, 14], [1, 15, 3], [5, 15, 23], [3, 16, 4], [12, 16, 16], [12, 17, 14], [12, 18, 11], [13, 19, 9], [13, 20, 9], [14, 21, 8], [16, 22, 3], [20, 22, 2], [21, 23, 1], [21, 24, 1]],
    mid: [[23, 9, 1], [22, 10, 1], [24, 10, 2], [27, 10, 1], [21, 11, 3], [26, 11, 1], [12, 12, 1], [17, 12, 1], [20, 12, 1], [27, 12, 1], [10, 13, 1], [23, 13, 2], [27, 13, 1], [1, 14, 1], [8, 14, 1], [23, 14, 1], [25, 14, 2], [4, 15, 1], [28, 15, 1], [2, 16, 1], [7, 16, 1], [11, 16, 1], [11, 17, 1], [26, 17, 1], [23, 18, 1], [12, 19, 1], [22, 19, 1], [22, 20, 1], [13, 21, 1], [22, 21, 1], [15, 22, 1], [19, 22, 1], [22, 22, 1], [16, 23, 2], [20, 23, 1], [22, 23, 1], [20, 24, 1], [22, 24, 1]],
    soft: [[22, 9, 1], [24, 9, 1], [26, 9, 2], [21, 10, 1], [20, 11, 1], [27, 11, 1], [11, 12, 1], [18, 12, 1], [9, 13, 1], [28, 13, 1], [0, 14, 1], [2, 14, 1], [7, 14, 1], [24, 14, 1], [27, 14, 2], [0, 15, 1], [1, 16, 1], [8, 16, 3], [28, 16, 1], [4, 17, 2], [10, 17, 1], [27, 17, 1], [11, 18, 1], [24, 18, 1], [23, 19, 1], [12, 20, 1], [23, 20, 1], [12, 21, 1], [15, 23, 1], [18, 23, 2], [23, 23, 1], [23, 24, 1], [21, 25, 2]],
  },
];

const CAT_REAR_FOOT_OFFSET_PX = 26;
const CELEBRATION_PARTICLES = [
  { x: -24, y: -36 },
  { x: 18, y: -42 },
  { x: -32, y: -12 },
  { x: 28, y: -18 },
  { x: -10, y: -50 },
  { x: 34, y: -4 },
];

function PixelRects({
  rects,
  opacity,
}: {
  rects: Array<[number, number, number]>;
  opacity: number;
}) {
  return rects.map(([x, y, width], index) => (
    <rect
      key={`${x}-${y}-${width}-${index}`}
      x={x}
      y={y}
      width={width}
      height={1}
      fill="currentColor"
      opacity={opacity}
    />
  ));
}

function RunCatVector({
  frame,
  themeColor,
}: {
  frame: CatFrame;
  themeColor: string;
}) {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block overflow-visible drop-shadow-md"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      <g style={{ color: themeColor }}>
        <PixelRects rects={frame.soft} opacity={0.18} />
        <PixelRects rects={frame.mid} opacity={0.42} />
        <PixelRects rects={frame.solid} opacity={1} />
      </g>
    </svg>
  );
}

export function CatProgress({ progress, themeColor, isActive, className }: CatProgressProps) {
  const animDuration = isActive ? 0.4 : 1.2;
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (!isActive) {
      setFrameIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % RUN_CAT_FRAMES.length);
    }, 90);

    return () => {
      window.clearInterval(timer);
    };
  }, [isActive]);

  const isComplete = progress >= 1;

  return (
    <div className={cn("w-full h-16 relative flex items-center mb-6 px-2", className)}>
      {/* Background track */}
      <div className="absolute inset-x-0 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        {/* Animated gradient track */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${themeColor}40, transparent)`,
            backgroundSize: '200% 100%',
          }}
          animate={isActive ? { backgroundPosition: ['200% 0%', '-200% 0%'] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Progress fill */}
      <motion.div
        className="absolute left-0 h-2 rounded-full"
        style={{ backgroundColor: themeColor }}
        animate={{ width: `${progress * 100}%` }}
        initial={false}
        transition={{ type: 'spring', stiffness: 40, damping: 20 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full blur-md"
          style={{ backgroundColor: themeColor }}
          animate={isActive ? { opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] } : { opacity: 0.3 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Start marker */}
      <div className="absolute left-0 -top-2 flex flex-col items-center">
        <Flag className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>

      {/* End marker */}
      <div className="absolute right-0 -top-2 flex flex-col items-center">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
          </motion.div>
        ) : (
          <Flag className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-50" />
        )}
      </div>

      {/* Cat character */}
      <motion.div
        className="absolute z-10"
        style={{ left: `${progress * 100}%`, transform: `translateX(-${CAT_REAR_FOOT_OFFSET_PX}px)` }}
        animate={{ left: `${progress * 100}%` }}
        transition={{ type: 'spring', stiffness: 40, damping: 20 }}
      >
        <motion.div
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{
            duration: 0.38,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <RunCatVector frame={RUN_CAT_FRAMES[frameIndex]} themeColor={themeColor} />

          {/* Dust particles */}
          {isActive && (
            <div className="absolute -left-2 bottom-0 flex gap-1">
              <motion.div
                animate={{ opacity: [0, 0.7, 0], x: [0, -20], scale: [0.4, 0.9], y: [0, -5] }}
                transition={{ duration: animDuration, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `${themeColor}40` }}
              />
              <motion.div
                animate={{ opacity: [0, 0.5, 0], x: [0, -30], scale: [0.3, 0.7], y: [0, -8] }}
                transition={{ duration: animDuration, repeat: Infinity, delay: 0.1 }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `${themeColor}30` }}
              />
              <motion.div
                animate={{ opacity: [0, 0.3, 0], x: [0, -40], scale: [0.2, 0.5], y: [0, -12] }}
                transition={{ duration: animDuration, repeat: Infinity, delay: 0.2 }}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: `${themeColor}20` }}
              />
            </div>
          )}

          {/* Celebration particles on complete */}
          {isComplete && (
            <div className="absolute inset-0 pointer-events-none">
              {CELEBRATION_PARTICLES.map((particle, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: themeColor,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: [0, particle.x],
                    y: [0, particle.y],
                  }}
                  transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Progress percentage */}
      <motion.div
        className="absolute -bottom-6 right-0 text-[10px] font-bold text-slate-400"
        animate={{ opacity: isActive ? [0.5, 1, 0.5] : 0.5 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(progress * 100)}%
      </motion.div>
    </div>
  );
}
