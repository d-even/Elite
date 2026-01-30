import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useInView, useMotionValue } from 'framer-motion';
import { 
  ChevronRight, 
  Wifi,
  Zap,
  Lock,
  Smartphone,
  Globe,
  ArrowDown
} from 'lucide-react';
import Navbar from './Navbar';

/**
 * STYLING CONSTANTS
 */
const STROKE_THICKNESS = "20px";

/**
 * GEOMETRIC LOGO COMPONENTS
 */
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

/**
 * SCROLL REVEAL SECTION
 */
const ScrollRevealLogo = () => {
  const containerRef = useRef(null);
  const [percent, setPercent] = useState(0);
  const progressValue = useMotionValue(0);
  
  const smoothProgress = useSpring(progressValue, {
    stiffness: 40,
    damping: 25,
    restDelta: 0.001
  });

  const isInView = useInView(containerRef, { amount: 0.6 });

  useEffect(() => {
    const handleWheel = (e) => {
      if (isInView && percent < 95) {
        if (e.cancelable) e.preventDefault();
        const sensitivity = 2500;
        const next = Math.min(1, Math.max(0, progressValue.get() + e.deltaY / sensitivity));
        progressValue.set(next);
      }
    };

    const handleTouchMove = (e) => {
      if (isInView && percent < 95) {
        if (e.cancelable) e.preventDefault();
      }
    };

    if (isInView && percent < 95) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overflow = 'unset';
    };
  }, [isInView, percent, progressValue]);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    setPercent(Math.round(latest * 100));
  });

  const circleScale = useTransform(smoothProgress, [0, 0.2], [0.3, 1]);
  const circleOpacity = useTransform(smoothProgress, [0, 0.1], [0, 1]);
  const entryDist = 800;
  const eLeftX = useTransform(smoothProgress, [0.2, 0.45], [-entryDist, 0]);
  const eRightX = useTransform(smoothProgress, [0.2, 0.45], [entryDist, 0]);
  const eOpacity = useTransform(smoothProgress, [0.2, 0.3], [0, 1]);
  const lLeftX = useTransform(smoothProgress, [0.45, 0.7], [-entryDist / 2, 0]);
  const lRightX = useTransform(smoothProgress, [0.45, 0.7], [entryDist / 2, 0]);
  const lOpacity = useTransform(smoothProgress, [0.45, 0.55], [0, 1]);
  const iScaleY = useTransform(smoothProgress, [0.7, 0.85], [0, 1]);
  const iOpacity = useTransform(smoothProgress, [0.7, 0.75], [0, 1]);
  const finalGlow = useTransform(smoothProgress, [0.85, 1], ["0px 0px 0px white", "0px 0px 180px rgba(255,255,255,0.4)"]);

  return (
    <div ref={containerRef} className="relative bg-black h-screen w-full m-0 p-0 border-none block z-40">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <motion.div 
            style={{ scale: circleScale, opacity: circleOpacity, boxShadow: finalGlow }}
            className="relative w-[340px] h-[340px] md:w-[520px] md:h-[520px] rounded-full border-[10px] md:border-[24px] border-white flex items-center justify-center overflow-hidden bg-black z-10"
          >
            <div style={{ transform: 'scaleY(-1)' }} className="flex items-center justify-center md:gap-[20px] gap-2 text-white">
              <motion.div style={{ x: eLeftX, opacity: eOpacity }}>
                <LogoE style={{ transform: 'scaleY(-1)' }} />
              </motion.div>
              <motion.div style={{ x: lLeftX, opacity: lOpacity }}>
                <LogoL flipY={true} />
              </motion.div>
              <motion.div style={{ scaleY: iScaleY, opacity: iOpacity, width: STROKE_THICKNESS }} className="h-14 md:h-[100px] bg-white relative z-20 shrink-0" />
              <motion.div style={{ x: lRightX, opacity: lOpacity }}>
                <LogoL flipX={true} />
              </motion.div>
              <motion.div style={{ x: eRightX, opacity: eOpacity }}>
                <LogoE flipX={true} style={{ transform: 'scaleY(-1)' }} />
              </motion.div>
            </div>
          </motion.div>
        
        </div>
      </div>
    </div>
  );
};

const WhyChooseSection = () => {
  const features = [
    { icon: <Zap className="text-orange-400" size={24} />, title: "Instant Payments", description: "Sub-second transaction speed" },
    { icon: <Lock className="text-purple-400" size={24} />, title: "PIN Protected", description: "Secure high-value transactions" },
    { icon: <Smartphone className="text-blue-400" size={24} />, title: "No App Required", description: "Works with any RFID card" },
    { icon: <Globe className="text-cyan-400" size={24} />, title: "Blockchain Verified", description: "Immutable reward records" }
  ];

  return (
    <section className="relative min-h-screen bg-black py-40 overflow-hidden flex flex-col items-center justify-center px-6 border-t border-white/[0.05] z-10">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)]"></div>
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase font-sans">Why Choose <span className="bg-gradient-to-r from-[#4facfe] via-[#7b61ff] to-[#f093fb] bg-clip-text text-transparent font-sans">Elite Pay?</span></motion.h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {features.map((item, idx) => (
            <div key={idx} className="group relative p-12 rounded-[3.5rem] bg-[#080808] border border-white/[0.08] hover:border-white/[0.2] transition-all duration-500 text-left flex flex-col items-start h-full backdrop-blur-xl">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-10 group-hover:scale-110 transition-all">{item.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase font-sans">{item.title}</h3>
              <p className="text-zinc-500 text-base leading-relaxed">{item.description}</p>
              <div className="absolute inset-px rounded-[3.4rem] border border-white/[0.02] pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => (
  <section className="max-w-7xl mx-auto px-5 pt-12 pb-32 grid lg:grid-cols-12 gap-12 items-start relative z-10 bg-black">
    <div className="lg:col-span-6 z-10">
    
      <motion.h1 className="text-6xl md:text-[6.5rem] font-black leading-[1] mb-14 tracking-tighter text-white font-sans">Tap. Redeem. <span className="text-zinc-600 italic">Activate.</span></motion.h1>
      <div className="flex flex-wrap gap-6">
        <button className="bg-white text-black px-14 py-7 rounded-3xl font-black text-xl shadow-2xl hover:bg-zinc-100 transition-all flex items-center gap-3 font-sans">Get Started <ChevronRight size={24} /></button>
        <button className="bg-zinc-900/40 border border-zinc-800 text-zinc-300 px-14 py-7 rounded-3xl font-black text-xl backdrop-blur-md hover:bg-zinc-800 transition-all font-sans">Learn More</button>
      </div>
    </div>
    <div className="lg:col-span-6 relative flex justify-center lg:justify-center mt-12 lg:mt-[76px]">
      <div className="relative" style={{ width: '320px', height: '520px' }}>
        <div className="relative z-20 w-full h-full rounded-[56px] bg-black border-[4px] border-zinc-800 shadow-[0_50px_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col items-center justify-between py-16">
          <Wifi size={44} className="text-white rotate-90" strokeWidth={3} />
          <div className="rounded-full border-[6px] border-white w-40 h-40 flex items-center justify-center bg-transparent">
             <div className="flex items-center text-white font-black text-4xl gap-3 font-sans">
                <span>E</span>
                <span>L</span>
                <span className="px-1">I</span>
                <span style={{ transform: 'scale(-1, -1)', display: 'inline-block' }}>L</span>
                <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>E</span>
             </div>
          </div>
          <span className="text-zinc-400 font-bold text-3xl tracking-tight font-sans">myelite.page</span>
        </div>
      </div>
    </div>
  </section>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black overflow-x-hidden m-0 p-0">
      <div className="relative z-10 m-0 p-0">
        <Navbar />
        <HeroSection />
        <ScrollRevealLogo />
        <WhyChooseSection />
      </div>
    </div>
  );
};


export default Landing;


