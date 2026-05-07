/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Sparkles, Heart, Coffee, Moon, Sun, 
  Settings, X, Palette, User, Music, Check, ChevronRight,
  Cpu, Zap, Radio
} from 'lucide-react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { PersonaSettings, Archetype, ARCHETYPES } from './types';

const Particles = ({ 
  intensity, 
  style = 'cosmic',
  isActive 
}: { 
  intensity: number; 
  style?: string;
  isActive: boolean;
}) => {
  const getParticleConfig = (style: string) => {
    switch(style) {
      case 'sakura': return { colors: ['#ffb7c5', '#ff91a4'], size: [4, 8], speed: 1 };
      case 'garden': return { colors: ['#fde68a', '#fbbf24', '#34d399'], size: [3, 6], speed: 0.8 };
      case 'neon': return { colors: ['#a855f7', '#d946ef'], size: [2, 4], speed: 2 };
      case 'minimal': return { colors: ['#ffffff33', '#ffffff55'], size: [1, 2], speed: 0.5 };
      default: return { colors: ['#a855f7', '#7c3aed'], size: [1, 3], speed: 1 };
    }
  };

  const config = getParticleConfig(style);
  
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
      left: `${Math.random() * 100}%`,
      duration: (Math.random() * 10 + 10) / (config.speed * (isActive ? 1.5 : 1)),
      delay: Math.random() * 10,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
    }));
  }, [style, isActive]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle absolute rounded-full"
          animate={{
            y: [-20, -1200],
            x: intensity > 0.1 ? [0, (Math.random() - 0.5) * 100, 0] : 0,
            scale: intensity > 0.1 ? [1, 1.2, 1] : 1,
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: p.duration / (1 + intensity),
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            background: p.color,
            filter: `blur(${p.size / 2}px)`,
          }}
        />
      ))}
    </div>
  );
};

const Waveform = ({ volume, type = 'user', style = 'cosmic' }: { volume: number; type?: 'user' | 'ai'; style?: string }) => {
  const bars = Array.from({ length: 20 });
  const isGarden = style === 'garden';
  
  const color = type === 'user' 
    ? (isGarden ? 'bg-emerald-400' : 'bg-purple-400') 
    : (isGarden ? 'bg-amber-400' : 'bg-white');
    
  const glow = type === 'user' 
    ? (isGarden ? 'shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'shadow-[0_0_10px_rgba(168,85,247,0.5)]') 
    : (isGarden ? 'shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'shadow-[0_0_10px_rgba(255,255,255,0.5)]');

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: `${Math.max(4, volume * 100 * (0.5 + Math.sin(i * 0.4 + Date.now() / 100) * 0.5))}px`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-1.5 rounded-full ${color} ${glow} opacity-60`}
        />
      ))}
    </div>
  );
};

export default function App() {
  const { isActive, isConnecting, volume, aiVolume, startSession, stopSession } = useGeminiLive();
  const [greeting, setGreeting] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<PersonaSettings>({
    archetype: 'Classic Fathima',
    traits: ['Empathetic', 'Soft-spoken', 'Playful'],
    voice: 'Kore',
    avatarStyle: 'garden'
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 22) setGreeting('Good night... I was waiting for you.');
    else if (hour < 12) setGreeting('Good morning. You look lovely today.');
    else if (hour < 18) setGreeting('Good afternoon. Let\'s have a sweet time together.');
    else setGreeting('Good evening. Tell me about your day.');
  }, []);

  const handleToggleSession = useCallback(() => {
    if (isActive) {
      stopSession();
    } else {
      startSession(settings);
    }
  }, [isActive, startSession, stopSession, settings]);

  const toggleTrait = (trait: string) => {
    setSettings(prev => ({
      ...prev,
      traits: prev.traits.includes(trait) 
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden transition-colors duration-1000 ${
      settings.avatarStyle === 'sakura' ? 'bg-[#1a0b1a]' : 
      settings.avatarStyle === 'garden' ? 'bg-[#fdfcf0]' :
      settings.avatarStyle === 'minimal' ? 'bg-[#0a0a0a]' : 'bg-[#0d0d1a]'
    }`}>
      <Particles intensity={aiVolume + volume} style={settings.avatarStyle} isActive={isActive} />
      
      {/* Aesthetic Robotics Lab Glows / Garden Warmth */}
      <motion.div 
        animate={{
          scale: 1 + aiVolume * 0.4,
          opacity: 0.15 + aiVolume * 0.2
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[140px] rounded-full pointer-events-none ${
          settings.avatarStyle === 'garden' ? 'bg-orange-200/40' : 'bg-purple-600/20'
        }`} 
      />
      
      <main className="relative z-10 w-full max-w-lg flex flex-col items-center space-y-10">
        {/* Header Section with Holographic Glow */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-purple-300" />
            </motion.div>
            <h1 className={`text-4xl sm:text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] ${
              settings.avatarStyle === 'garden' ? 'text-gray-800' : 'text-white'
            }`}>
              Fathima <span className={settings.avatarStyle === 'garden' ? 'text-emerald-600' : 'text-purple-400'}>AI</span>
            </h1>
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-purple-200" />
            </motion.div>
          </div>
          <p className={`font-medium italic text-sm tracking-wide ${
            settings.avatarStyle === 'garden' ? 'text-gray-500' : 'text-purple-200/60'
          }`}>
            {isConnecting ? 'Initializing Neural Links...' : isActive ? 'Listening to your frequency...' : greeting}
          </p>
        </motion.div>

        {/* Holographic Avatar Container */}
        <div className="relative">
          {/* Ambient Floating Orbs (Idle State Only) */}
          {!isActive && (
            <div className="absolute inset-0 z-0 overflow-visible pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 0.4, 0],
                    scale: [0.5, 1, 0.5],
                    x: [0, (i % 2 === 0 ? 100 : -100) * Math.sin(i), 0],
                    y: [0, (i % 2 === 0 ? -100 : 100) * Math.cos(i), 0]
                  }}
                  transition={{ 
                    duration: 8 + i * 2, 
                    repeat: Infinity, 
                    delay: i * 1.5,
                    ease: "easeInOut"
                  }}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full blur-[2px] ${
                    settings.avatarStyle === 'garden' ? 'bg-amber-400/40' :
                    settings.avatarStyle === 'sakura' ? 'bg-pink-400/40' : 'bg-purple-400/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* External Tech Rings */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: isActive ? 1.05 : [1, 1.02, 1],
              opacity: isActive ? 0.3 : [0.1, 0.2, 0.1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`absolute -inset-8 border rounded-full ${
              settings.avatarStyle === 'garden' ? 'border-amber-500/20' : 'border-white/5'
            }`}
          />
          <motion.div 
            animate={{ 
              rotate: -360,
              scale: isActive ? 1.1 : [1, 1.05, 1],
              opacity: isActive ? 0.2 : [0.05, 0.15, 0.05]
            }}
            transition={{ 
              rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`absolute -inset-12 border rounded-full ${
              settings.avatarStyle === 'garden' ? 'border-emerald-500/10' : 'border-purple-500/10'
            }`}
          />

          <motion.div
            animate={{
              scale: isActive ? [1, 1.02, 1] : [1, 1.01, 1],
              borderColor: isActive 
                ? (settings.avatarStyle === 'garden' ? 'rgba(52, 211, 153, 0.6)' : 'rgba(168, 85, 247, 0.6)') 
                : (settings.avatarStyle === 'garden' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.1)')
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`w-72 h-72 rounded-full flex items-center justify-center relative z-10 overflow-hidden glass-card transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 ${
              isActive ? 'ring-4 ring-purple-500/20' : ''
            }`}
          >
            {/* Avatar Image Placeholder / Fathima Visual */}
            <motion.div 
              animate={{
                y: isActive ? [0, -2, 0] : [0, -4, 0],
                rotate: isActive ? [0, 0.5, -0.5, 0] : [0, 1, -1, 0],
                scale: 1 + (aiVolume * 0.05)
              }}
              transition={{
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="absolute inset-0 z-0"
            >
              <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${
                settings.avatarStyle === 'garden' ? 'via-orange-100/10 to-orange-200/40' : 'via-purple-900/10 to-purple-900/40'
              }`} />
              
              {/* Main Character Image */}
              <motion.div 
                className={`w-full h-full bg-cover bg-center transition-all duration-1000 ${
                  settings.avatarStyle === 'garden' 
                    ? "bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop')] opacity-80" 
                    : "bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop')] opacity-40 mix-blend-overlay grayscale-[20%]"
                }`} 
              />

              {/* Blinking Animation Overlay */}
              <motion.div
                animate={{
                  height: ["0%", "0%", "0%", "100%", "0%", "0%"]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  times: [0, 0.9, 0.92, 0.93, 0.95, 1],
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-black/5 pointer-events-none z-10 origin-top"
              />

              {settings.avatarStyle === 'garden' && (
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523438097201-512ae7d59c44?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-soft-light" />
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {!isActive ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="relative z-10 flex flex-col items-center gap-3"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <Heart className="w-8 h-8 text-purple-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase text-purple-200/40 px-4 py-1 rounded-full border border-purple-200/10 bg-purple-200/5">
                    Holographic Assistant
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 flex flex-col items-center gap-4 w-full h-full justify-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Waveform volume={aiVolume} type="ai" style={settings.avatarStyle} />
                    <Waveform volume={volume} type="user" style={settings.avatarStyle} />
                  </div>
                  
                  {/* Floating Tech Icons */}
                  <div className="flex gap-4 mt-2">
                    {[Sparkles, Coffee, Moon].map((Icon, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.4 }}
                      >
                        <Icon className="w-4 h-4 text-purple-300" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Control Interface */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: settings.avatarStyle === 'garden' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
              className={`w-14 h-14 rounded-2xl glass-card flex items-center justify-center transition-all shadow-lg ${
                settings.avatarStyle === 'garden' ? 'text-gray-400 hover:text-gray-800' : 'text-purple-200/60 hover:text-white'
              }`}
            >
              <Settings className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleSession}
              disabled={isConnecting}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative
                ${isActive 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                }
                ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isConnecting ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isActive ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
              
              {!isActive && !isConnecting && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-purple-500/30 rounded-full"
                />
              )}
            </motion.button>

            <div className="w-12 h-12" /> {/* Spacer */}
          </div>

          <div className={`flex items-center gap-4 py-2 px-6 rounded-full border backdrop-blur-sm ${
            settings.avatarStyle === 'garden' ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
            <span className={`text-xs font-semibold tracking-widest uppercase ${
              settings.avatarStyle === 'garden' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {isConnecting ? 'Connecting...' : isActive ? 'Connected to your heart' : 'Fathima is waiting'}
            </span>
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg glass-card p-8 border-white/10 max-h-[85vh] overflow-y-auto relative shadow-[0_0_100px_rgba(168,85,247,0.2)]"
            >
              {/* Decorative Tech Corner */}
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-purple-500/30 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-purple-500/30 rounded-bl-3xl" />

              <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <User className="w-6 h-6 text-purple-300" />
                    </div>
                    System Persona
                  </h2>
                  <p className="text-purple-200/40 text-xs mt-1 font-mono uppercase tracking-widest">Neural Configuration Module</p>
                </div>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-10 relative z-10">
                {/* Archetypes */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Core Archetype</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(ARCHETYPES) as Archetype[]).map((arch) => (
                      <button
                        key={arch}
                        onClick={() => setSettings(s => ({ ...s, archetype: arch }))}
                        className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold flex flex-col items-start gap-1 group overflow-hidden relative ${
                          settings.archetype === arch 
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {arch}
                        {settings.archetype === arch && (
                          <motion.div layoutId="active-arch" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Personality Traits */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Neural Traits</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Playful', 'Soft-spoken', 'Empathetic', 'Teasing', 'Supportive', 'Confident', 'Analytical'].map((trait) => (
                      <button
                        key={trait}
                        onClick={() => toggleTrait(trait)}
                        className={`px-5 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 ${
                          settings.traits.includes(trait)
                            ? 'bg-white/10 border-purple-400 text-white shadow-inner' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {settings.traits.includes(trait) ? <Check className="w-3 h-3 text-purple-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                        {trait}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Global Aesthetics */}
                <div className="grid grid-cols-2 gap-8">
                  <section>
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4 block">Synthesizer</label>
                    <div className="relative group">
                      <select 
                        value={settings.voice}
                        onChange={(e) => setSettings(s => ({ ...s, voice: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 appearance-none transition-all"
                      >
                        {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map(v => (
                          <option key={v} value={v} className="bg-[#1a0b2e] text-white">{v} Engine</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4 block">Visual Style</label>
                    <div className="flex gap-3 p-2 bg-black/20 rounded-2xl border border-white/5">
                      {(['cosmic', 'sakura', 'neon', 'minimal', 'garden'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setSettings(s => ({ ...s, avatarStyle: style }))}
                          className={`flex-1 aspect-square rounded-xl border-2 transition-all relative group overflow-hidden ${
                            settings.avatarStyle === style ? 'border-purple-400 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            background: style === 'sakura' ? 'linear-gradient(135deg, #ffb7c5, #ff91a4)' : 
                                       style === 'garden' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' :
                                       style === 'minimal' ? '#1a1a1a' : 
                                       style === 'neon' ? 'linear-gradient(45deg, #b026ff, #ff26b0)' : 
                                       'radial-gradient(circle, #4c1d95 0%, #0d0d1a 100%)'
                          }}
                        >
                          {settings.avatarStyle === style && (
                            <motion.div layoutId="active-style" className="absolute inset-0 border-2 border-white/40 rounded-xl" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(168,85,247,0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSettings(false)}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-white uppercase tracking-[0.2em] shadow-xl relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    Deploy Profile
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="fixed bottom-8 text-center px-4">
        <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.2em] opacity-40">
          Powered by Gemini 3.1 Flash Live • Voice to Voice AI
        </p>
      </footer>
    </div>
  );
}

