import { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';

function TinnitusRelief() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('white');
  const [volume, setVolume] = useState(0.5);
  const [timer, setTimer] = useState(0); // in minutes, 0 means no timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const sounds = [
    { 
      id: 'white', 
      name: 'White Noise',
      description: 'Consistent broadband sound that can help mask tinnitus',
      url: '/sounds/white-noise.mp3'
    },
    { 
      id: 'pink', 
      name: 'Pink Noise',
      description: 'Balanced frequency noise that is often found more soothing than white noise',
      url: '/sounds/pink-noise.mp3'
    },
    { 
      id: 'brown', 
      name: 'Brown Noise',
      description: 'Deep, low-frequency noise that can be particularly calming',
      url: '/sounds/brown-noise.mp3'
    },
    { 
      id: 'nature', 
      name: 'Ocean Waves',
      description: 'Gentle ocean waves to promote relaxation',
      url: '/sounds/ocean-waves.mp3'
    },
    { 
      id: 'rain', 
      name: 'Rainfall',
      description: 'Steady rainfall sounds for ambient relief',
      url: '/sounds/rainfall.mp3'
    },
    { 
      id: 'stream', 
      name: 'Stream',
      description: 'Flowing water sounds for natural masking',
      url: '/sounds/stream.mp3'
    },
  ];

  const timerOptions = [
    { value: 0, label: 'Continuous' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
  ];

  useEffect(() => {
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Initialize audio with optimizations for mobile
    const selectedSoundData = sounds.find(s => s.id === selectedSound);
    if (selectedSoundData) {
      // Use Howler.js for better cross-platform audio performance
      const sound = new Howl({
        src: [selectedSoundData.url],
        html5: true, // Force HTML5 Audio to avoid lagging
        loop: true,
        volume: volume,
        preload: true,
        onload: () => {
          console.log("Sound loaded successfully");
        },
        onloaderror: (id, err) => {
          console.error("Sound loading error:", err);
        }
      });
      
      audioRef.current = sound;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.unload();
        audioRef.current = null;
      }
    };
  }, [selectedSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopSound();
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  const toggleSound = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setIsPlaying(true);
      if (timer > 0) {
        setTimeRemaining(timer * 60);
      }
    }
  };

  const startSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      if (timer > 0) {
        setTimeRemaining(timer * 60);
      }
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setTimeRemaining(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleTimerChange = (minutes) => {
    setTimer(minutes);
    if (isPlaying) {
      setTimeRemaining(minutes * 60);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tinnitus Relief
        </h1>
        <div className="flex items-center gap-4">
          {timeRemaining > 0 && (
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {formatTime(timeRemaining)}
            </span>
          )}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            } text-white transition-colors`}
          >
            {isPlaying ? (
              <><PauseIcon className="h-5 w-5" /> Stop</>
            ) : (
              <><PlayIcon className="h-5 w-5" /> Play</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sounds.map((sound) => (
          <button
            key={sound.id}
            onClick={() => {
              setSelectedSound(sound.id);
              if (isPlaying) {
                stopSound();
                setTimeout(startSound, 100);
              }
            }}
            className={`p-4 rounded-lg text-left transition-colors ${
              selectedSound === sound.id
                ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {sound.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {sound.description}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Volume
            </label>
            <button 
              onClick={() => setVolume(v => v === 0 ? 0.5 : 0)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {volume === 0 ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Timer
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {timerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimerChange(option.value)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  timer === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TinnitusRelief;



