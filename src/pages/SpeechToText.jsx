import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

// Helper function for capability detection
const isRecognitionSupported = () => 'webkitSpeechRecognition' in window;

// Offline speech recognition fallback
class OfflineSpeechRecognizer {
  constructor(lang = 'en-US') {
    this.lang = lang;
    this.recognition = null;
    this.isListeningRef = { current: false }; // Using ref pattern for consistent state
    this.interimTranscript = '';
    this.finalTranscript = '';
    this.listeners = {
      result: [],
      error: [],
      end: []
    };
    this.restartTimeout = null;
  }

  start() {
    if (!isRecognitionSupported()) {
      this.emitError('offline_unsupported', 'Offline recognition not supported');
      return;
    }

    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      
      this.interimTranscript = interim;
      this.finalTranscript += final;
      this.emitResult({
        interimTranscript: interim,
        finalTranscript: final,
        fullTranscript: this.finalTranscript + interim
      });
    };

    this.recognition.onerror = (event) => {
      this.emitError(event.error, 'Recognition error');
    };

    this.recognition.onend = () => {
      if (this.isListeningRef.current) {
        // Debounce restart to prevent rapid cycling
        this.restartTimeout = setTimeout(() => {
          if (this.isListeningRef.current) {
            this.recognition.start();
          }
        }, 300);
      }
      this.emitEnd();
    };

    this.isListeningRef.current = true;
    this.recognition.start();
  }

  stop() {
    this.isListeningRef.current = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  setLang(lang) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  addListener(type, callback) {
    this.listeners[type].push(callback);
  }

  removeListener(type, callback) {
    this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
  }

  emitResult(data) {
    this.listeners.result.forEach(cb => cb(data));
  }

  emitError(error, message) {
    this.listeners.error.forEach(cb => cb({ error, message }));
  }

  emitEnd() {
    this.listeners.end.forEach(cb => cb());
  }
}

// More reliable mobile detection
const checkIsMobile = () => {
  // Check for touch support first
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Then check screen size and user agent
  const smallScreen = window.matchMedia('(max-width: 768px)').matches;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return hasTouch && (smallScreen || mobileUA);
};

function SpeechToText() {
  // State management
  const [transcript, setTranscript] = useState('');
  const [interimResult, setInterimResult] = useState('');
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [showSaved, setShowSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for stable references in callbacks
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const offlineRecognizerRef = useRef(null);

  // Languages supported
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-NG', name: 'English (Nigeria)' },
    { code: 'ha-NG', name: 'Hausa' },
    { code: 'yo-NG', name: 'Yorùbá' },
    { code: 'ig-NG', name: 'Igbo' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'ja-JP', name: 'Japanese' },
  ];

  // Cleanup all recognition resources
  const cleanupRecognition = useCallback(() => {
    if (offlineRecognizerRef.current) {
      offlineRecognizerRef.current.stop();
      offlineRecognizerRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    isListeningRef.current = false;
  }, []);

  // Initialize component
  useEffect(() => {
    // Check device type using reliable method
    setIsMobile(checkIsMobile());
    
    // Load saved transcripts
    const saved = JSON.parse(localStorage.getItem('transcripts') || '[]');
    setSavedTranscripts(saved);
    
    // Load draft if exists
    const draft = localStorage.getItem('draft-transcript');
    if (draft) setTranscript(draft);

    // Check online status
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    handleOnlineStatus();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  // Auto-save draft
  useEffect(() => {
    const timer = setInterval(() => {
      if (transcript) localStorage.setItem('draft-transcript', transcript);
    }, 5000);
    return () => clearInterval(timer);
  }, [transcript]);

  // Update statistics
  useEffect(() => {
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const chars = transcript.length;
    setStats({ words, chars });
  }, [transcript]);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    cleanupRecognition();

    if (isOffline) {
      // Offline mode
      offlineRecognizerRef.current = new OfflineSpeechRecognizer(selectedLanguage);
      
      offlineRecognizerRef.current.addListener('result', ({ interimTranscript, finalTranscript }) => {
        setInterimResult(interimTranscript);
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      });
      
      offlineRecognizerRef.current.addListener('error', ({ error }) => {
        setError(`Offline recognition error: ${error}`);
        isListeningRef.current = false;
      });
      
      return true;
    } else {
      // Online mode
      if (!isRecognitionSupported()) {
        setError('Speech recognition not supported in this browser');
        return false;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        
        setInterimResult(interim);
        if (final) {
          setTranscript(prev => prev + ' ' + final);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
        } else {
          setError(`Recognition error: ${event.error}`);
        }
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          setTimeout(() => recognition.start(), 300);
        }
      };

      recognitionRef.current = recognition;
      return true;
    }
  }, [selectedLanguage, isOffline, cleanupRecognition]);

  // Start/stop recognition
  const toggleListening = async () => {
    if (isListeningRef.current) {
      cleanupRecognition();
      return;
    }

    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsMicrophoneAvailable(true);
      
      // Initialize and start recognition
      if (initializeRecognition()) {
        isListeningRef.current = true;
        if (isOffline) {
          offlineRecognizerRef.current.start();
        } else {
          recognitionRef.current.start();
        }
        setError(null);
      }
    } catch (err) {
      setError('Could not access microphone. Please ensure permissions are granted.');
      setIsMicrophoneAvailable(false);
    }
  };

  // UI helper functions
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy text');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimResult('');
    localStorage.removeItem('draft-transcript');
  };

  const saveTranscript = () => {
    const newTranscript = {
      id: Date.now(),
      text: transcript,
      date: new Date().toISOString(),
      language: selectedLanguage,
      stats: { ...stats }
    };
    
    const updated = [newTranscript, ...savedTranscripts];
    setSavedTranscripts(updated);
    localStorage.setItem('transcripts', JSON.stringify(updated));
    setTranscript('');
    setInterimResult('');
  };

  const exportTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSavedTranscript = (id) => {
    const updated = savedTranscripts.filter(t => t.id !== id);
    setSavedTranscripts(updated);
    localStorage.setItem('transcripts', JSON.stringify(updated));
  };

  const loadSavedTranscript = (saved) => {
    setTranscript(saved.text);
    setSelectedLanguage(saved.language);
    setShowSaved(false);
  };

  const getLanguageName = (code) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const renderLanguageOptions = () => (
    <>
      <optgroup label="Nigeria">
        {languages.filter(l => l.code.endsWith('-NG')).map(lang => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </optgroup>
      <optgroup label="International">
        {languages.filter(l => !l.code.endsWith('-NG')).map(lang => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isOffline ? 'Offline ' : ''}Speech to Text
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 w-full sm:w-auto"
            disabled={isListeningRef.current}
          >
            {renderLanguageOptions()}
          </select>
          <button
            onClick={toggleListening}
            className={`px-4 py-2 rounded-lg ${
              isListeningRef.current 
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto`}
            disabled={!isMicrophoneAvailable && !isMobile}
          >
            {isListeningRef.current ? (
              <>
                <span className="inline-block mr-2">Listening...</span>
                <span className="inline-flex items-center">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </>
            ) : (
              'Start Listening'
            )}
          </button>
        </div>
      </div>

      {isMobile && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>For best results on mobile:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Use Chrome browser</li>
            <li>Hold phone close to your mouth</li>
            <li>Speak clearly in quiet environment</li>
            {isOffline && <li>Offline mode may have limited accuracy</li>}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {copySuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Copied to clipboard!</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="min-h-[200px] mb-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {transcript}
            <span className="text-gray-500 italic">{interimResult}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Words: {stats.words} | Characters: {stats.chars} | Mode: {isOffline ? 'Offline' : 'Online'}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {showSaved ? 'Hide Saved' : 'Show Saved'}
            </button>
            <button
              onClick={clearTranscript}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={saveTranscript}
              disabled={!transcript}
              className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={exportTranscript}
              disabled={!transcript}
              className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {showSaved && savedTranscripts.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Saved Transcripts</h2>
            <div className="space-y-4">
              {savedTranscripts.map((saved) => (
                <div key={saved.id} className="border rounded p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(saved.date), 'PPpp')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getLanguageName(saved.language)} | 
                        Words: {saved.stats.words} | 
                        Chars: {saved.stats.chars}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedTranscript(saved)}
                        className="text-sm px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteSavedTranscript(saved.id)}
                        className="text-sm px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mt-2">
                    {saved.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpeechToText;