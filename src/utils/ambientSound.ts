// Ambient background sound for immersive atmosphere
import apocalypseSound from '@/assets/apocalypse.mp3';

let audioContext: AudioContext | null = null;
let isPlaying = false;
let audioNodes: AudioScheduledSourceNode[] = [];
let gainNodes: GainNode[] = [];

export const playApocalypseSound = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  try {
    const response = await fetch(apocalypseSound);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    source.buffer = audioBuffer;
    gainNode.gain.value = 1;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
    
    // Track the source so it can be stopped
    audioNodes.push(source);
    gainNodes.push(gainNode);
    
    console.log('Apocalypse sound effect playing');
  } catch (error) {
    console.error('Error playing apocalypse sound:', error);
  }
};

export const playAmbientSound = () => {
  // Prevent multiple simultaneous plays
  if (isPlaying) {
    console.log('Audio already playing');
    return;
  }
  
  // Create audio context if it doesn't exist
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  console.log('Starting ambient sound, audio context state:', audioContext.state);
  isPlaying = true;
  const now = audioContext.currentTime;
  
  // Create deep space ambient drone with multiple layers
  const frequencies = [55, 82.5, 110, 165]; // Deep bass frequencies (A1, E2, A2, E3)
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext!.createOscillator();
    const gainNode = audioContext!.createGain();
    const filter = audioContext!.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    
    // Lowpass filter for warmth
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    
    // Increased volume for better audibility
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08 / (index + 1), now + 3); // Louder and slow 3-second fade in
    
    // Add slow modulation for movement
    const lfo = audioContext!.createOscillator();
    const lfoGain = audioContext!.createGain();
    lfo.frequency.value = 0.1 + (index * 0.05); // Very slow modulation
    lfoGain.gain.value = 0.01; // Subtle
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext!.destination);
    
    oscillator.start(now);
    lfo.start(now);
    
  // Track gain nodes globally for volume control
  audioNodes.push(oscillator);
  audioNodes.push(lfo);
  gainNodes.push(gainNode);
  
  // Store gain nodes globally
  (window as any).__audioGainNodes = gainNodes;
  });
  
  // Add subtle noise layer for texture
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.03;
  }
  
  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 200;
  
  const noiseGain = audioContext.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.02, now + 4); // Slightly louder
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  
  noiseSource.start(now);
  audioNodes.push(noiseSource);
  gainNodes.push(noiseGain);
  
  // Store gain nodes globally
  (window as any).__audioGainNodes = gainNodes;
  
  console.log('Ambient sound started with', audioNodes.length, 'audio nodes');
};

export const stopAmbientSound = () => {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  
  // Fade out all sounds
  gainNodes.forEach(gainNode => {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5); // Fast fade out
  });
  
  // Stop all audio nodes after fade out
  setTimeout(() => {
    audioNodes.forEach(node => {
      try {
        node.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    audioNodes = [];
    gainNodes = [];
    isPlaying = false;
  }, 500);
};

// Export gain nodes for volume control
export const getAudioGainNodes = () => gainNodes;

// Initialize audio context on user interaction (required by browsers)
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('Audio context created:', audioContext.state);
  }
  
  // Resume if suspended (some browsers suspend audio contexts)
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('Audio context resumed:', audioContext?.state);
    });
  }
};
