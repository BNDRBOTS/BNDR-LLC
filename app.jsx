import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowUpRight, ExternalLink, X, Menu, Compass } from 'lucide-react';

// --- META DIRECTIVES ---
// SOURCE: bndrbots.github.io (Verified URL set)
// ZERO GUESSWORK. ZERO PHANTOM REPOS.
// PALETTE: #030303 (Charcoal Void) + #FFFFFF (Stark Glass) + #0A0A0A (Matte Depth)

const BNDR_SERVICES = [
  "SYSTEM ARCHITECTURE", 
  "SPATIAL WEB", 
  "FINANCIAL DATA UX", 
  "ARCHITECT DESIGN MIND"
];

// DATA SOURCE: User-provided verified builds. Retail (Cafe) purged.
const PROJECTS = [
  { id: 'immersion', title: 'Immersion', category: 'SPATIAL WEB', link: 'https://bndrbots.github.io/immersion/', year: '2026' },
  { id: 'volumetric', title: 'Volumetric', category: 'SYSTEM ARCHITECTURE', link: 'https://bndrbots.github.io/volumetric/', year: '2026' },
  { id: 'distortion', title: 'Distortion', category: 'SPATIAL DESIGN', link: 'https://bndrbots.github.io/distortion/', year: '2026' },
  { id: 'verdict', title: 'Verdict', category: 'SYSTEM ARCHITECTURE', link: 'https://bndrbots.github.io/verdict/', year: '2026' },
  { id: 'raymarched', title: 'Raymarched', category: 'GRAPHICS ENGINE', link: 'https://bndrbots.github.io/raymarched/', year: '2026' },
  { id: 'kinetic', title: 'Kinetic Agency', category: 'SYSTEM ARCHITECTURE', link: 'https://bndrbots.github.io/kinetic_agency/#home', year: '2026' },
  { id: 'thefeed', title: 'The Feed', category: 'DATA AGGREGATION', link: 'https://bndrbots.github.io/TheFeedUpraded/', year: '2026' },
  { id: 'reactive', title: 'Reactive Nav', category: 'UX ARCHITECTURE', link: 'https://bndrbots.github.io/reactive-navigation/', year: '2026' },
  { id: 'adrenaline', title: 'Adrenaline', category: 'SYSTEM ARCHITECTURE', link: 'https://bndrbots.github.io/adrenaline_restraint/', year: '2026' }
];

// ASYMMETRIC SPANS - Optimized for the 9-node verified array.
const DESKTOP_SPANS = [
  'md:col-span-8 md:row-span-2', // Immersion (Anchor)
  'md:col-span-4 md:row-span-1', // Volumetric
  'md:col-span-4 md:row-span-1', // Distortion
  'md:col-span-6 md:row-span-2', // Verdict
  'md:col-span-6 md:row-span-2', // Raymarched
  'md:col-span-12 md:row-span-1',// Kinetic Agency (Horizon)
  'md:col-span-4 md:row-span-1', // The Feed
  'md:col-span-4 md:row-span-1', // Reactive Nav
  'md:col-span-4 md:row-span-1'  // Adrenaline
];

// --- GRAVITATIONAL KINETIC FIELD ---
const GravitationalField = ({ mouseCoords, isMobile }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    let width, height, dpr;
    let grid = [];
    const spacing = isMobile ? 40 : 35; 
    const radius = isMobile ? 150 : 350;
    const tension = 0.05;
    const dampening = 0.8;

    const init = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      grid = [];
      for (let x = 0; x < width + spacing; x += spacing) {
        for (let y = 0; y < height + spacing; y += spacing) {
          grid.push({ ox: x, oy: y, x: x, y: y, vx: 0, vy: 0 });
        }
      }
    };

    const animate = () => {
      ctx.fillStyle = '#030303'; 
      ctx.fillRect(0, 0, width, height);
      const mx = mouseCoords.current.x;
      const my = mouseCoords.current.y;

      grid.forEach(point => {
        const dx = mx - point.ox;
        const dy = my - point.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let targetX = point.ox;
        let targetY = point.oy;

        if (dist < radius) {
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          targetX = point.ox - Math.cos(angle) * force * 50;
          targetY = point.oy - Math.sin(angle) * force * 50;
        }

        point.vx += (targetX - point.x) * tension;
        point.vy += (targetY - point.y) * tension;
        point.vx *= dampening;
        point.vy *= dampening;
        point.x += point.vx;
        point.y += point.vy;

        const distanceToCurrent = Math.sqrt(Math.pow(mx - point.x, 2) + Math.pow(my - point.y, 2));
        const intensity = Math.max(0, 1 - distanceToCurrent / (radius * 1.5));
        const baseAlpha = 0.03;
        const activeAlpha = baseAlpha + (intensity * 0.5);
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1 + (intensity * 1.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${activeAlpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();
    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />;
};

// --- IMMACULATE I-FRAME RENDERER ---
const OpticalIframe = ({ url, isHovered }) => {
  return (
    <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden rounded-[inherit]">
      <iframe
        src={url}
        title="BNDR LLC Live Interface"
        className={`w-full h-full border-0 transition-all duration-[1.2s] ease-[0.16,1,0.3,1] 
          ${isHovered ? 'opacity-100 scale-[0.45] grayscale-0 blur-0' : 'opacity-40 scale-[0.42] grayscale blur-[2px]'}
        `}
        style={{ width: '250%', height: '250%', transformOrigin: 'top left', pointerEvents: 'none' }}
        loading="lazy"
        tabIndex="-1"
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent transition-opacity duration-[1.2s] ${isHovered ? 'opacity-40' : 'opacity-100'}`} />
    </div>
  );
};

// --- ASYMMETRIC CELL ---
const BentoNode = React.forwardRef(({ project, index, onClick }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const spanClass = DESKTOP_SPANS[index % DESKTOP_SPANS.length];

  return (
    <motion.article
      ref={ref}
      layoutId={`node-${project.id}`}
      initial={{ opacity: 0, y: 80, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(project)}
      className={`group relative cursor-pointer overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all duration-[0.8s] ${spanClass} min-h-[400px] md:min-h-0 isolate`}
    >
      <OpticalIframe url={project.link} isHovered={isHovered} />
      <div className={`absolute inset-4 rounded-[1.5rem] md:rounded-[2.2rem] border transition-colors duration-700 pointer-events-none ${isHovered ? 'border-white/10' : 'border-transparent'}`} />
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-20 pointer-events-none">
        <header className="flex justify-between items-start">
          <div className="bg-[#030303]/90 backdrop-blur-2xl text-[10px] md:text-xs font-mono px-5 py-2.5 rounded-full text-white/80 border border-white/10 uppercase tracking-[0.2em] transform transition-all duration-700 ease-[0.16,1,0.3,1] group-hover:bg-white group-hover:text-black group-hover:border-transparent">
            {project.category}
          </div>
          <div className="text-white/30 group-hover:text-black transition-all duration-700 ease-[0.16,1,0.3,1] bg-white/5 group-hover:bg-white p-4 rounded-full backdrop-blur-2xl border border-white/5 group-hover:rotate-45">
            <ArrowUpRight size={22} strokeWidth={1.5} />
          </div>
        </header>
        <footer>
          <h3 className="text-4xl md:text-5xl lg:text-7xl font-light text-white tracking-tight mix-blend-difference group-hover:mix-blend-normal transition-all duration-700 ease-[0.16,1,0.3,1] transform group-hover:translate-x-2">
            {project.title}
          </h3>
          <div className="overflow-hidden mt-4 h-0 group-hover:h-auto transition-all duration-700">
            <p className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100">
              SYS.ID // {project.id.toUpperCase()} // VOL {project.year}
            </p>
          </div>
        </footer>
      </div>
    </motion.article>
  );
});

// --- STRATOSPHERIC IMMERSION LAYER ---
const OrbitalTakeover = ({ project, onClose }) => {
  if (!project) return null;
  return (
    <motion.section
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030303]/80 p-3 md:p-6"
      onClick={onClose}
    >
      <motion.div
        layoutId={`node-${project.id}`}
        className="w-full h-full bg-[#0A0A0A] border border-white/10 relative flex flex-col overflow-hidden rounded-[2.5rem] md:rounded-[4rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 p-4 md:p-5 bg-[#030303]/50 text-white rounded-full hover:bg-white hover:text-black transition-all duration-500 z-50 backdrop-blur-2xl border border-white/10">
          <X size={24} strokeWidth={1.5} />
        </button>
        <div className="w-full h-full relative overflow-hidden bg-[#030303] isolate">
           <iframe src={project.link} className="w-full h-full relative z-10" title={project.title} />
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 gap-6">
             <Compass size={48} strokeWidth={0.5} className="text-white/20 animate-spin" />
             <span className="text-white/40 font-mono text-[10px] tracking-[0.4em] animate-pulse">ESTABLISHING DIRECT UPLINK</span>
           </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

// --- MAIN ARCHITECTURE ---
export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [systemPhase, setSystemPhase] = useState("Ready for Business");
  const [isMobile, setIsMobile] = useState(false);
  const mouseCoords = useRef({ x: 0, y: 0 });
  const [hudCoords, setHudCoords] = useState({ x: 0, y: 0 });

  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { damping: 20, stiffness: 100 });
  const headlineScale = useTransform(smoothScroll, [0, 800], [1, 0.85]);
  const headlineOpacity = useTransform(smoothScroll, [0, 800], [1, 0]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handlePointerMove = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      mouseCoords.current = { x, y };
      setHudCoords({ x, y });
    };
    
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const phases = ["Global: Yes", "Personalized: Absolutely", "Cookie-Cutter: False", "Attention to Detail: Absolutely"];
    let i = 0;
    const interval = setInterval(() => setSystemPhase(phases[i++ % phases.length]), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white selection:text-black">
      <GravitationalField mouseCoords={mouseCoords} isMobile={isMobile} />
      
      <header className="fixed top-10 left-10 z-40 pointer-events-none mix-blend-difference">
        <div className="font-mono text-xs tracking-[0.4em] font-bold">BNDR LLC</div>
      </header>

      <footer className="fixed bottom-10 left-10 z-40 pointer-events-none font-mono text-[10px] text-white/30 tracking-[0.3em] mix-blend-difference">
        PHASE: <span className="text-white/80">{systemPhase}</span>
      </footer>

      <main className="relative z-10 w-full px-4 md:px-10 max-w-[2000px] mx-auto pb-40">
        <motion.section 
          className="h-screen flex flex-col justify-center items-center text-center"
          style={{ scale: headlineScale, opacity: headlineOpacity }}
        >
          <h2 className="text-[20vw] leading-[0.8] font-light mix-blend-difference">BNDR</h2>
          <p className="mt-12 font-mono text-xs tracking-[0.5em] text-white/50 uppercase">
            Phoenix Metro Based // Personalized Design
          </p>
        </motion.section>

        <section className="grid grid-cols-1 md:grid-cols-12 auto-rows-[400px] gap-6">
          {PROJECTS.map((project, i) => (
            <BentoNode key={project.id} index={i} project={project} onClick={setSelectedProject} />
          ))}
        </section>
      </main>

      <AnimatePresence>
        {selectedProject && <OrbitalTakeover project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </AnimatePresence>
    </div>
  );
}
