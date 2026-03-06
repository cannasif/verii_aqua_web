import React, { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  animationType: number; 
}

interface AuthBackgroundProps {
  isActive: boolean;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ isActive }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const count = Math.random() > 0.7 ? 2 : 1; 
      const newBubbles: Bubble[] = [];
      
      for (let i = 0; i < count; i++) {
        newBubbles.push({
          id: Date.now() + i,
          left: 10 + Math.random() * 80,
          size: 10 + Math.random() * 25,
          duration: 15 + Math.random() * 15,
          delay: Math.random() * 2,
          animationType: Math.random() > 0.5 ? 1 : 2, 
        });
      }

      setBubbles(prev => {
        return [...prev, ...newBubbles].slice(-15);
      });

    }, 6000); 

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={`fixed inset-0 z-0 transition-opacity duration-1000 overflow-hidden bg-[#010814] ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      <style>{`
        @keyframes godray1 {
          0%, 100% { transform: rotate(-12deg) translateX(-5%) scaleX(1); opacity: 0.6; }
          50% { transform: rotate(-8deg) translateX(5%) scaleX(1.2); opacity: 0.8; }
        }
        @keyframes godray2 {
          0%, 100% { transform: rotate(15deg) translateX(10%) scaleX(1.1); opacity: 0.5; }
          50% { transform: rotate(10deg) translateX(-10%) scaleX(0.9); opacity: 0.7; }
        }
        @keyframes godray3 {
          0%, 100% { transform: rotate(-5deg) translateX(0%) scaleX(0.9); opacity: 0.7; }
          50% { transform: rotate(5deg) translateX(15%) scaleX(1.3); opacity: 0.5; }
        }

        @keyframes waterPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.03); opacity: 1; }
        }

        @keyframes floatBubble1 {
          0%   { transform: translate(0, 5vh) scale(1); opacity: 0; }
          10%  { opacity: 0.25; } 
          25%  { transform: translate(30px, -20vh) scale(1.05); }
          50%  { transform: translate(-25px, -50vh) scale(1.1); opacity: 0.35; } 
          75%  { transform: translate(45px, -80vh) scale(1.15); }
          90%  { opacity: 0.2; }
          100% { transform: translate(-30px, -120vh) scale(1.2); opacity: 0; }
        }

        @keyframes floatBubble2 {
          0%   { transform: translate(0, 5vh) scale(1); opacity: 0; }
          10%  { opacity: 0.25; }
          25%  { transform: translate(-40px, -25vh) scale(1.05); }
          50%  { transform: translate(35px, -55vh) scale(1.1); opacity: 0.35; }
          75%  { transform: translate(-45px, -85vh) scale(1.15); }
          90%  { opacity: 0.2; }
          100% { transform: translate(25px, -120vh) scale(1.2); opacity: 0; }
        }
        .animate-godray-1 { animation: godray1 8s infinite ease-in-out; }
        .animate-godray-2 { animation: godray2 11s infinite ease-in-out; }
        .animate-godray-3 { animation: godray3 9s infinite ease-in-out; }
        
        .animate-water-pulse { animation: waterPulse 10s infinite ease-in-out; }
        .animate-bubble-1 { animation: floatBubble1 linear forwards; }
        .animate-bubble-2 { animation: floatBubble2 linear forwards; }
      `}</style>


      <div className="absolute inset-0 bg-gradient-to-b from-[#021631] via-[#010a17] to-[#000000] animate-water-pulse origin-center" />


      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[140%] mix-blend-screen pointer-events-none blur-[60px] flex justify-center gap-10 overflow-hidden">
        <div className="w-[25%] h-full bg-gradient-to-b from-[#ffedb3]/40 via-[#00f7ff]/10 to-transparent origin-top animate-godray-1" />
        <div className="w-[35%] h-full bg-gradient-to-b from-[#ffedb3]/30 via-[#00f7ff]/15 to-transparent origin-top animate-godray-2" />
        <div className="w-[15%] h-full bg-gradient-to-b from-[#ffedb3]/50 via-[#00f7ff]/20 to-transparent origin-top animate-godray-3" />
      </div>


      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f7ff]/20 via-[#00f7ff]/5 to-transparent opacity-60 animate-water-pulse pointer-events-none" />


      {bubbles.map(b => (
        <div
          key={b.id}
          className={`absolute bottom-[-50px] rounded-full border border-white/5 shadow-[0_0_5px_rgba(0,247,255,0.1)] bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-[2px] pointer-events-none animate-bubble-${b.animationType}`}
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_#000000_120%)] pointer-events-none opacity-80" />
      
    </div>
  );
};