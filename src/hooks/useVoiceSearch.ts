import { useState, useCallback } from "react";

export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  }, [onResult]);

  return { listening, supported, startListening };
}
