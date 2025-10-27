import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, X, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { getAudioGainNodes } from '@/utils/ambientSound';

interface VoiceOperatorProps {
  isActive: boolean;
  onSpeakingChange: (speaking: boolean) => void;
  onClose: () => void;
}

export const VoiceOperator = ({ isActive, onSpeakingChange, onClose }: VoiceOperatorProps) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Immediately cleanup everything when deactivated
      setTranscript('');
      setIsSpeaking(false);
      setIsListening(false);
      onSpeakingChange(false);
      
      // Force stop all audio
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {
        // Ignore errors
      }
      
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Restore background music
      const gainNodes = getAudioGainNodes();
      gainNodes.forEach(node => {
        try {
          node.gain.setTargetAtTime(0.15, node.context.currentTime, 0.3);
        } catch (e) {
          // Ignore errors
        }
      });
      
      return;
    }

    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        // Send to AI and get response
        await handleAIResponse(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not understand audio. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.error('Speech recognition not supported');
      toast({
        title: "Not Supported",
        description: "Voice recognition not supported in this browser.",
        variant: "destructive",
      });
    }

    // Greeting when activated
    speakText("Hello Nitin. I am ARIA, your AI survival companion. You can use voice commands and speak to me anytime. I will help and assist you building your human-proof profile.");

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isActive]);

  const handleAIResponse = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: { message: userMessage }
      });

      if (error) throw error;

      const aiMessage = data.message;
      await speakText(aiMessage);
      
    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: "Communication Error",
        description: "Unable to reach mission control. Please try again.",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    return new Promise<void>((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      // Small delay to ensure voices are loaded
      setTimeout(() => {

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;

      // Try to use a natural female voice
      const voices = synthRef.current.getVoices();
      const preferredVoices = [
        'Samantha', 'Karen', 'Victoria', 'Alex',
        'Google US English', 'Microsoft Zira',
        'Google UK English Female'
      ];
      
      const femaleVoice = voices.find(v => 
        preferredVoices.some(pv => v.name.includes(pv))
      ) || voices.find(v => 
        v.lang.startsWith('en-US') && v.name.includes('Female')
      ) || voices[0];

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onSpeakingChange(true);
        // Lower background music when speaking
        const gainNodes = getAudioGainNodes();
        gainNodes.forEach(node => {
          node.gain.setTargetAtTime(0.05, node.context.currentTime, 0.3);
        });
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeakingChange(false);
        // Restore background music volume
        const gainNodes = getAudioGainNodes();
        gainNodes.forEach(node => {
          node.gain.setTargetAtTime(0.15, node.context.currentTime, 0.3);
        });
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        onSpeakingChange(false);
        // Restore background music volume
        const gainNodes = getAudioGainNodes();
        gainNodes.forEach(node => {
          node.gain.setTargetAtTime(0.15, node.context.currentTime, 0.3);
        });
        resolve();
      };

      synthRef.current.speak(utterance);
      }, 100);
    });
  };

  const startListening = () => {
    // Navigate to full-screen voice chat
    navigate('/voice-chat');
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleClose = () => {
    console.log('=== CLOSE BUTTON CLICKED ===');
    onClose();
  };

  if (!isActive) return null;

  return (
    <div 
      className="fixed top-8 left-0 right-0 z-50 flex justify-center pointer-events-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-3 bg-black/80 backdrop-blur-sm p-6 rounded-lg border border-primary/30" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          {isSpeaking && <Volume2 className="w-6 h-6 text-primary animate-pulse" />}
          <h2 className="text-xl font-bold text-primary">ARIA SYSTEM</h2>
        </div>

        {transcript && (
          <p className="text-sm text-gray-300 max-w-md text-center">
            You: {transcript}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            variant="default"
            onClick={startListening}
            className="gap-2 w-24"
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            type="button"
            className="w-24"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-xs text-gray-400 text-center max-w-sm">
          {isSpeaking ? "ARIA speaking..." : "Click microphone to talk to ARIA"}
        </p>
      </div>
    </div>
  );
};
