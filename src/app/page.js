// File: app/page.js
"use client";

import { useState, useEffect, useRef } from "react";

// Language configuration
const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Mandarin (China)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ar-SA', name: 'Arabic' },
];

// Helper function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
};

export default function Home() {
  // State variables
  const [patientLang, setPatientLang] = useState('hi-IN');
  const [providerLang, setProviderLang] = useState('en-US');
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [liveSourceTranscript, setLiveSourceTranscript] = useState("");

  // Refs
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const cumulativeTranscriptRef = useRef("");

  // Effect to keep our listening state ref in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Effect to set up speech recognition only once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    
    // --- SEPARATE LOGIC IMPLEMENTATION ---
    const isMobile = isMobileDevice();

    recog.onresult = (event) => {
      let interimTranscript = "";
      // On mobile, we only care about the newest part of the speech
      const startIndex = isMobile ? event.resultIndex : 0;
      for (let i = startIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
      }
      // On mobile, we append. On desktop, we overwrite.
      setLiveSourceTranscript(cumulativeTranscriptRef.current + interimTranscript);
    };

    recog.onend = () => {
      // This auto-restart logic will ONLY run on mobile devices
      if (isMobile && isListeningRef.current) {
        console.log("Mobile timeout detected, saving transcript and restarting...");
        // Save the full transcript so far before restarting
        cumulativeTranscriptRef.current = liveSourceTranscript + " ";
        recognitionRef.current.start();
      } else {
        // On desktop, or on manual stop, just clean up the state
        setIsListening(false);
        setCurrentSpeaker(null);
      }
    };
    
    recognitionRef.current = recog;
  }, []);

  const startListening = (speaker) => {
    if (recognitionRef.current) {
      // Reset everything for a new session
      setLiveSourceTranscript(""); 
      cumulativeTranscriptRef.current = "";
      const lang = speaker === 'patient' ? patientLang : providerLang;
      recognitionRef.current.lang = lang;
      setCurrentSpeaker(speaker);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      // Set the flag to false so the onend handler knows this was a manual stop
      setIsListening(false); 
      recognitionRef.current.stop();
      
      const finalTranscript = liveSourceTranscript;
      const finalSpeaker = currentSpeaker;

      if (finalTranscript.trim()) {
        handleFinalTranslate(finalTranscript, finalSpeaker);
      }
      
      // Reset for the next session
      setLiveSourceTranscript("");
      cumulativeTranscriptRef.current = "";
      setCurrentSpeaker(null);
    }
  };

  const handleFinalTranslate = async (text, speaker) => {
    if (!text || !speaker) return;
    const sourceLang = speaker === 'patient' ? patientLang : providerLang;
    const targetLang = speaker === 'patient' ? providerLang : patientLang;
    const sourceLangName = languages.find(l => l.code === sourceLang)?.name;
    const targetLangName = languages.find(l => l.code === targetLang)?.name;
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang: sourceLangName, targetLang: targetLangName }),
      });
      const data = await response.json();
      if (data.translatedText) {
        const newMessage = { speaker, originalText: text, translatedText: data.translatedText, targetLang: targetLang };
        setConversation(prev => [...prev, newMessage]);
        speak(data.translatedText, targetLang);
      }
    } catch (error) {
        console.error("Error in final translation", error);
    }
  };

  const speak = (text, lang) => {
    if (!text || !lang || isSpeaking) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    // The JSX (UI) part remains completely unchanged
    <main className="flex flex-col items-center min-h-screen p-4 bg-gray-100 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">AI Health Translator</h1>
          <p className="text-lg text-gray-600">Seamless Patient-Provider Communication</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg shadow-md mb-6">
          <div>
            <label htmlFor="patient-lang" className="block text-lg font-medium text-gray-700">Patient&apos;s Language</label>
            <select id="patient-lang" value={patientLang} onChange={e => setPatientLang(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="provider-lang" className="block text-lg font-medium text-gray-700">Provider&apos;s Language</label>
            <select id="provider-lang" value={providerLang} onChange={e => setProviderLang(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-around items-center p-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => startListening('patient')} disabled={isListening || isSpeaking} className="w-full sm:w-auto px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">Patient Speaks</button>
          <button onClick={() => { if (isListening) stopListening(); if (isSpeaking) stopSpeaking(); }} disabled={!isListening && !isSpeaking} className="w-full sm:w-auto px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors">STOP</button>
          <button onClick={() => startListening('provider')} disabled={isListening || isSpeaking} className="w-full sm:w-auto px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg font-semibold rounded-full text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 transition-colors">Provider Speaks</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Live Transcript</h2>
            {isListening ? (
              <div>
                <p className="font-medium text-gray-700 text-lg">Listening to <span className="font-bold capitalize">{currentSpeaker}...</span></p>
                <div className="mt-4 p-4 border-2 border-dashed rounded-lg min-h-[120px] text-gray-800">
                  {liveSourceTranscript}
                </div>
                <p className="text-sm text-gray-500 italic text-center mt-2">When you are finished speaking, press the STOP button.</p>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[160px] text-gray-500 text-center">
                <p>Click &quot;Patient Speaks&quot; or &quot;Provider Speaks&quot; to begin.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Full Conversation</h2>
            <div className="space-y-4 h-[50vh] overflow-y-auto pr-2">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.speaker === 'patient' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-md p-3 rounded-lg ${msg.speaker === 'patient' ? 'bg-blue-100' : 'bg-teal-100'}`}>
                    <p className="text-sm text-gray-500 font-medium capitalize">{msg.speaker} said:</p>
                    <p className="text-sm italic text-gray-600">&quot;{msg.originalText}&quot;</p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{msg.translatedText}</p>
                    <button onClick={() => speak(msg.translatedText, msg.targetLang)} title="Play audio" className="text-indigo-600 mt-1 text-2xl">🔊</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}