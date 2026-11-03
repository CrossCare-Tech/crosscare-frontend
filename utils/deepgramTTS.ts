import { Audio } from 'expo-av';
import { CONFIG } from '@/constants/config';

interface DeepgramTTSOptions {
  model?: string;
  voice?: string;
  encoding?: string;
  sample_rate?: number;
}

class DeepgramTTSService {
  private currentSound: Audio.Sound | null = null;
  private isPlaying: boolean = false;

  async speak(
    text: string, 
    options: DeepgramTTSOptions = {},
    callbacks?: {
      onStart?: () => void;
      onComplete?: () => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stop();

      // Default options
      const defaultOptions = {
        model: 'aura-2-thalia-en',
        ...options
      };

      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(defaultOptions).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      // Make request to Deepgram TTS API
      const response = await fetch(
        `https://api.deepgram.com/v1/speak?${queryParams.toString()}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${CONFIG.DEEPGRAM_API}`,
            'Content-Type': 'text/plain',
          },
          body: text,
        }
      );

      if (!response.ok) {
        throw new Error(`Deepgram TTS API error: ${response.status} ${response.statusText}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Convert blob to base64 for expo-av
      const audioBase64 = await this.blobToBase64(audioBlob);
      const audioUri = `data:audio/mp3;base64,${audioBase64}`;

      // Set up audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );

      this.currentSound = sound;
      this.isPlaying = true;

      // Call onStart callback
      callbacks?.onStart?.();

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            this.isPlaying = false;
            callbacks?.onComplete?.();
          }
        }
      });

    } catch (error) {
      console.error('Error in Deepgram TTS:', error);
      this.isPlaying = false;
      callbacks?.onError?.(error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      this.currentSound = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:audio/mp3;base64, prefix if it exists
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export a singleton instance
export const deepgramTTS = new DeepgramTTSService();

// Helper function for backward compatibility
export const speakWithDeepgram = async (
  text: string,
  options?: {
    language?: string;
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: any) => void;
  }
) => {
  // Map language to Deepgram model if needed
  const getDeepgramModel = (language?: string) => {
    switch (language) {
      case 'es':
        return 'aura-2-luna-es'; // Spanish
      case 'pt':
        return 'aura-2-luna-en'; // Portuguese (use English model as fallback)
      case 'ht':
        return 'aura-2-luna-en'; // Haitian Creole (use English model as fallback)
      default:
        return 'aura-2-thalia-en'; // English
    }
  };

  await deepgramTTS.speak(text, {
    model: getDeepgramModel(options?.language),
  }, {
    onStart: options?.onStart,
    onComplete: options?.onComplete,
    onError: options?.onError,
  });
}; 