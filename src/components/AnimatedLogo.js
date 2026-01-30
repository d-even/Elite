




import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';

/**
 * Uniform Thickness Constants
 * 20px for all strokes.
 */
const STROKE_THICKNESS = "20px";

/**
 * Recalculated for Radius 200px (Diameter 400px)
 * Inner Diameter = 400px - (20px * 2) = 360px.
 * (360px - 20px center - 72px total gaps) / 4 letters = 67px per letter.
 */
const LETTER_WIDTH_MD = "67px";
const LETTER_HEIGHT_MD = "100px"; // Increased from 70px

const LogoE = ({ style = {}, flipX = false }) => (
  <div 
    style={{ ...style, transform: `${style.transform || ''} ${flipX ? 'scaleX(-1)' : ''}` }}
    className="relative w-12 h-14 md:w-[67px] md:h-[100px]"
  >
    <div style={{ height: STROKE_THICKNESS }} className="w-full bg-current absolute top-0" />
    <div style={{ height: STROKE_THICKNESS }} className="w-full bg-current absolute top-1/2 -translate-y-1/2" />
    <div style={{ height: STROKE_THICKNESS }} className="w-full bg-current absolute bottom-0" />
    <div style={{ width: STROKE_THICKNESS }} className="absolute left-0 top-0 bottom-0 bg-current" />
  </div>
);

const LogoL = ({ style = {}, flipX = false, flipY = false }) => (
  <div 
    style={{ ...style, transform: `${style.transform || ''} ${flipX ? 'scaleX(-1)' : ''} ${flipY ? 'scaleY(-1)' : ''}` }}
    className="relative w-12 h-14 md:w-[67px] md:h-[100px]"
  >
    <div style={{ width: STROKE_THICKNESS }} className="absolute left-0 top-0 bottom-0 bg-current" />
    <div style={{ height: STROKE_THICKNESS }} className="absolute left-0 bottom-0 right-0 bg-current" />
  </div>
);

const AnimatedLogo = () => {
  const containerRef = useRef(null);
  const [percent, setPercent] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001
  });

  useMotionValueEvent(progress, "change", (latest) => {
    setPercent(Math.round(latest * 100));
  });

  const circleScale = useTransform(progress, [0, 0.2], [0.8, 1]);
  const circleOpacity = useTransform(progress, [0, 0.1], [0, 1]);
  
  const entryDist = 400;

  const e1X = useTransform(progress, [0.1, 0.6], [-entryDist, 0]);
  const l1X = useTransform(progress, [0.18, 0.65], [-entryDist / 2, 0]);
  const l2X = useTransform(progress, [0.18, 0.65], [entryDist / 2, 0]);
  const e2X = useTransform(progress, [0.1, 0.6], [entryDist, 0]);

  const iScaleY = useTransform(progress, [0.5, 0.8], [0, 1]);

  return (
    <div ref={containerRef} className="relative bg-black text-white" style={{ height: '400vh' }}>
      
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Radius 200px (400px diameter) Container */}
        <motion.div 
          style={{ 
            scale: circleScale, 
            opacity: circleOpacity,
            boxShadow: useTransform(progress, [0.8, 1], ["0px 0px 0px white", "0px 0px 60px rgba(255,255,255,0.1)"])
          }}
          className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-[10px] md:border-[20px] border-white flex items-center justify-center overflow-hidden"
        >
          
          <div 
            style={{ 
              transform: 'scaleY(-1)',
              width: '100%',
              maxWidth: '360px' 
            }}
            className="flex items-center justify-center md:gap-[18px] gap-2"
          >
            <motion.div style={{ x: e1X, opacity: useTransform(progress, [0.1, 0.2], [0, 1]) }}>
              <LogoE />
            </motion.div>

            <motion.div style={{ x: l1X, opacity: useTransform(progress, [0.2, 0.3], [0, 1]) }}>
              <LogoL flipY={true} />
            </motion.div>

            <motion.div 
              style={{ 
                scaleY: iScaleY,
                width: STROKE_THICKNESS 
              }}
              className="h-14 md:h-[100px] bg-white relative z-20 shrink-0"
            />

            <motion.div style={{ x: l2X, opacity: useTransform(progress, [0.2, 0.3], [0, 1]) }}>
              <LogoL flipX={true} />
            </motion.div>

            <motion.div style={{ x: e2X, opacity: useTransform(progress, [0.1, 0.2], [0, 1]) }}>
              <LogoE flipX={true} />
            </motion.div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="w-[1px] h-full bg-white" />
            <div className="w-full h-[1px] bg-white" />
          </div>

        </motion.div>

        <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none uppercase font-mono text-[10px] tracking-[0.4em] text-white/30">
          <div className="flex justify-between">
            <span>Compact.v3.Radius200</span>
            <span>{percent}%</span>
          </div>
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
             <div className="space-y-1">
               <p>Geometric_Sync: Ready</p>
               <div className="w-32 h-[1px] bg-white/10 overflow-hidden">
                 <motion.div style={{ scaleX: progress }} className="h-full bg-white origin-left" />
               </div>
             </div>
             <span className="text-white/10 italic">ELITE_SYMMETRY</span>
          </div>
        </div>

      </div>

      <section className="h-screen bg-black" />
    </div>
  );
};

export default AnimatedLogo;