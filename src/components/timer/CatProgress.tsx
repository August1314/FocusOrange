import React from 'react';
import { motion } from 'motion/react';
import { Cat, Flag } from 'lucide-react';

interface CatProgressProps {
  progress: number; // 0 to 1
  themeColor: string;
  isActive?: boolean;
}

export function CatProgress({ progress, themeColor, isActive }: CatProgressProps) {
  const animDuration = isActive ? 0.4 : 1.2;
  const legDuration = isActive ? 0.2 : 0.6;
  return (
    <div className="w-full h-16 relative flex items-center mb-6 px-2">
      {/* Track */}
      <div className="absolute inset-x-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
      
      {/* Start Flag */}
      <div className="absolute left-0 -top-2 flex flex-col items-center">
        <Flag className="w-4 h-4 text-slate-300" />
      </div>
      
      {/* End Flag */}
      <div className="absolute right-0 -top-2 flex flex-col items-center">
        <Flag className="w-4 h-4 text-emerald-400 opacity-50" />
      </div>

      {/* Cat Container */}
      <motion.div
        className="absolute z-10"
        style={{ left: `${progress * 100}%`, transform: 'translateX(-100%)' }}
        animate={{ left: `${progress * 100}%` }}
        transition={{ type: 'spring', stiffness: 40, damping: 20 }}
      >
        <motion.div
          animate={isActive ? {
            y: [0, -4, 0],
          } : {}}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* RunCat inspired SVG */}
          <svg 
            width="54" 
            height="32" 
            viewBox="0 0 54 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: themeColor }}
            className="drop-shadow-md"
          >
            {/* Body */}
            <path 
              d="M14 20C14 20 16 12 24 10C32 8 40 10 44 14C48 18 48 24 44 24C40 24 38 22 38 22C38 22 34 26 26 26C18 26 14 24 14 20Z" 
              fill="currentColor"
            />
            {/* Head */}
            <path 
              d="M42 16C42 16 44 8 48 8C52 8 54 12 54 16C54 20 52 24 48 24C44 24 42 20 42 16Z" 
              fill="currentColor"
            />
            {/* Ears */}
            <path d="M46 10L44 4L48 6Z" fill="currentColor" />
            <path d="M50 10L52 4L48 6Z" fill="currentColor" />
            
            {/* Tail - Bobbing animation */}
            <motion.path 
              animate={isActive ? {
                rotate: [0, -20, 0, 20, 0],
              } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ transformOrigin: '14px 20px' }}
              d="M14 20C14 20 8 22 4 18C0 14 4 8 8 10" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
            />

            {/* Front Leg Cycle */}
            <motion.path
              animate={isActive ? {
                d: [
                  "M42 22L44 28", // Frame 1: Down
                  "M42 22L40 26", // Frame 2: Back
                  "M42 22L44 24", // Frame 3: Tucked
                  "M42 22L46 26", // Frame 4: Forward
                  "M42 22L44 28", // Back to 1
                ]
              } : { d: "M42 22L44 28" }}
              transition={{ duration: legDuration, repeat: Infinity }}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Back Leg Cycle (Phase shifted) */}
            <motion.path
              animate={isActive ? {
                d: [
                  "M20 24L22 30", // Frame 1: Back
                  "M20 24L24 26", // Frame 2: Forward
                  "M20 24L18 28", // Frame 3: Extended
                  "M20 24L22 30", // Back to 1
                ]
              } : { d: "M20 24L22 30" }}
              transition={{ duration: legDuration, repeat: Infinity, delay: legDuration * 0.25 }}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Dust clouds behind */}
          {isActive && (
            <div className="absolute -left-2 bottom-0 flex gap-1">
              <motion.div
                animate={{ opacity: [0, 0.6, 0], x: [0, -15], scale: [0.4, 0.8] }}
                transition={{ duration: animDuration, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"
              />
              <motion.div
                animate={{ opacity: [0, 0.4, 0], x: [0, -25], scale: [0.3, 0.6] }}
                transition={{ duration: animDuration, repeat: Infinity, delay: 0.1 }}
                className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800"
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
