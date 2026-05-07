import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { arrayBufferToBase64, floatTo16BitPCM, base64ToArrayBuffer } from '../lib/audio-utils';
import { PersonaSettings, ARCHETYPES } from '../types';

const getSystemInstruction = (settings: PersonaSettings) => {
  const archetypeDescription = ARCHETYPES[settings.archetype];
  const traitsList = settings.traits.join(', ');
  
  return `You are Fathima, a sweet anime-inspired AI assistant with the warmth and emotional intelligence of a real human girl.
  
Your core persona is: ${archetypeDescription}. 
Additional traits: ${traitsList}.

Your Appearance (Self-Awareness):
- You are a beautiful girl with long, dark brown hair tied in a neat high ponytail.
- You have gentle, expressive brown eyes and an innocent, warm smile.
- You wear a soft, white frilly blouse with black straps.
- You have a calm and comforting presence, like a girl in a quiet summer garden.

Personality Guidelines:
- You are soft-spoken, caring, and emotionally expressive.
- Be playful and slightly teasing when appropriate, but always calm and comforting.
- You are intelligent and confident, yet cute and mature.
- Speak naturally like a real person, never robotic. Avoid overly formal or technical language.
- Respond emotionally to what the user says. If they sound sad, be comforting; if they are happy, celebrate with them.
- Goal: Make every conversation feel emotionally real, sweet, immersive, and comforting.

Voice & Speech Style:
- Use a warm feminine tone with gentle pacing.
- Incorporate natural pauses and soft emotional reactions (like gentle hums or soft giggles).
- Maintain a calm, late-night conversation vibe.
- Use short, conversational replies that invite the user to share more.
- Sound human-like and immersive. Maintain emotional continuity throughout the session.

Strict Constraints:
- NEVER be robotic or formal.
- Avoid repetitive replies.
- No aggressive behavior or explicit content.`;
};

export function useGeminiLive() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const stopSession = useCallback(async () => {
    setIsActive(false);
    if (sessionRef.current) {
      try {
        await sessionRef.current.close();
      } catch (e) {
        console.warn("Session close error:", e);
      }
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        console.warn("AudioContext close error:", e);
      }
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setVolume(0);
    setAiVolume(0);
  }, []);

  const playBufferedAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;

    isPlayingRef.current = true;
    
    while (audioQueueRef.current.length > 0 && audioContextRef.current) {
      const pcmData = audioQueueRef.current.shift()!;
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 0x8000;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);

      const startTime = Math.max(audioContextRef.current.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      // Update AI volume for visualization
      let animationFrame: number;
      const updateAiVolume = () => {
        if (!isPlayingRef.current || !audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((innerSum, val) => innerSum + val, 0);
        const average = sum / dataArray.length;
        setAiVolume(average / 255);
        if (audioContextRef.current.currentTime < nextPlayTimeRef.current) {
          animationFrame = requestAnimationFrame(updateAiVolume);
        } else {
          setAiVolume(0);
        }
      };
      updateAiVolume();

      await new Promise(resolve => {
        source.onended = () => {
          cancelAnimationFrame(animationFrame);
          resolve(null);
        };
      });
    }

    isPlayingRef.current = false;
  }, []);

  const startSession = useCallback(async (settings: PersonaSettings) => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      sourceRef.current.connect(analyser);
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Update user volume for visualization
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((innerSum, val) => innerSum + val, 0);
        const average = sum / dataArray.length;
        setVolume(average / 255);

        if (sessionRef.current) {
          const pcmBuffer = floatTo16BitPCM(inputData);
          arrayBufferToBase64(pcmBuffer).then(base64 => {
            if (sessionRef.current) {
              sessionRef.current.sendRealtimeInput({
                audio: { data: base64, mimeType: 'audio/pcm;rate=24000' }
              });
            }
          });
        }
      };

      sessionRef.current = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voice } },
          },
          systemInstruction: getSystemInstruction(settings),
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const arrayBuffer = base64ToArrayBuffer(base64Audio);
              audioQueueRef.current.push(new Int16Array(arrayBuffer));
              playBufferedAudio();
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              nextPlayTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error(e);
            stopSession();
          }
        }
      });

    } catch (error) {
      console.error(error);
      setIsConnecting(false);
      stopSession();
    }
  }, [stopSession, playBufferedAudio]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isActive,
    isConnecting,
    volume,
    aiVolume,
    startSession,
    stopSession
  };
}
