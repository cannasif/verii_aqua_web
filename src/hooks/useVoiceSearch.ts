import { useState, useCallback, useEffect } from 'react';

interface UseVoiceSearchOptions {
  onResult: (text: string) => void;
  language?: string;
}

export const useVoiceSearch = ({ onResult, language = 'tr-TR' }: UseVoiceSearchOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const getSpeechRecognition = (): (new () => SpeechRecognition) | null => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition;
    return SpeechRecognition ?? null;
  };

  useEffect(() => {
    const checkSupport = () => {
      setIsSupported(!!getSpeechRecognition());
    };
    checkSupport();
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Tarayıcınız sesli aramayı desteklemiyor');
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Tarayıcınız sesli aramayı desteklemiyor');
      return;
    }
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('Ses algılanamadı');
      } else if (event.error === 'not-allowed') {
        setError('Mikrofon izni verilmedi');
      } else {
        setError('Sesli arama hatası: ' + event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setError('Sesli arama başlatılamadı');
      setIsListening(false);
    }
  }, [isSupported, language, onResult]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
  };
};

