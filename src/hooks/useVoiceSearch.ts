import { useState, useCallback, useEffect, useRef } from "react";

export type VoiceError = "not-allowed" | "no-speech" | "unsupported" | null;

export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<VoiceError>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    setError(null);

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onend = () => setListening(false);

    recognition.onerror = (e: { error: string }) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setError("not-allowed");
      } else if (e.error === "no-speech") {
        setError("no-speech");
      }
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    };

    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { listening, supported, error, startListening, stopListening };
}
