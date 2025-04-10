import { useState, useEffect, useRef } from 'react';

const SOUND_PROFILES = {
  default: { bass: 0, mid: 0, treble: 0, volume: 1 },
  speech: { bass: -3, mid: 6, treble: 3, volume: 1.2 },
  music: { bass: 3, mid: 0, treble: 2, volume: 1 },
  outdoor: { bass: -2, mid: 4, treble: 4, volume: 1.4 },
};

function SoundAmplifier() {
  const [isAmplifying, setIsAmplifying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [bassGain, setBassGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [trebleGain, setTrebleGain] = useState(0);
  const [currentProfile, setCurrentProfile] = useState('default');
  const [mediaStream, setMediaStream] = useState(null);
  const [micError, setMicError] = useState(null);
  
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const bassFilterRef = useRef(null);
  const midFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);

  const cleanupAudioResources = () => {
    // First, stop all tracks in the media stream
    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      tracks.forEach(track => {
        track.stop();
        mediaStream.removeTrack(track);
      });
      setMediaStream(null);
    }
    
    // Cancel any ongoing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect all audio nodes before closing the context
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
    if (bassFilterRef.current) {
      bassFilterRef.current.disconnect();
    }
    if (midFilterRef.current) {
      midFilterRef.current.disconnect();
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.disconnect();
    }
    if (analyzerRef.current) {
      analyzerRef.current.disconnect();
    }

    // Close the audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear all node references
    sourceNodeRef.current = null;
    gainNodeRef.current = null;
    bassFilterRef.current = null;
    midFilterRef.current = null;
    trebleFilterRef.current = null;
    analyzerRef.current = null;

    // Clear the canvas if it exists
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  const drawVisualizer = () => {
    if (!analyzerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(1, '#818CF8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const initializeAudio = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      gainNodeRef.current = audioContextRef.current.createGain();

      // Create analyzer node
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;

      // Create filters
      bassFilterRef.current = audioContextRef.current.createBiquadFilter();
      bassFilterRef.current.type = 'lowshelf';
      bassFilterRef.current.frequency.value = 200;

      midFilterRef.current = audioContextRef.current.createBiquadFilter();
      midFilterRef.current.type = 'peaking';
      midFilterRef.current.frequency.value = 1000;
      midFilterRef.current.Q.value = 1;

      trebleFilterRef.current = audioContextRef.current.createBiquadFilter();
      trebleFilterRef.current.type = 'highshelf';
      trebleFilterRef.current.frequency.value = 3000;

      // Connect nodes
      sourceNodeRef.current
        .connect(bassFilterRef.current)
        .connect(midFilterRef.current)
        .connect(trebleFilterRef.current)
        .connect(gainNodeRef.current)
        .connect(analyzerRef.current)
        .connect(audioContextRef.current.destination);

      // Set initial values
      gainNodeRef.current.gain.value = volume;
      bassFilterRef.current.gain.value = bassGain;
      midFilterRef.current.gain.value = midGain;
      trebleFilterRef.current.gain.value = trebleGain;

      drawVisualizer();
    } catch (error) {
      setMicError(error.message);
      setIsAmplifying(false);
      console.error('Error accessing microphone:', error);
    }
  };

  const applyProfile = (profileName) => {
    const profile = SOUND_PROFILES[profileName];
    setCurrentProfile(profileName);
    setVolume(profile.volume);
    setBassGain(profile.bass);
    setMidGain(profile.mid);
    setTrebleGain(profile.treble);

    if (gainNodeRef.current) gainNodeRef.current.gain.value = profile.volume;
    if (bassFilterRef.current) bassFilterRef.current.gain.value = profile.bass;
    if (midFilterRef.current) midFilterRef.current.gain.value = profile.mid;
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = profile.treble;
  };

  const toggleAmplifier = async () => {
    if (!isAmplifying) {
      try {
        await initializeAudio();
        setIsAmplifying(true);
      } catch (error) {
        console.error('Failed to start amplifier:', error);
      }
    } else {
      cleanupAudioResources();
      setIsAmplifying(false);
    }
  };

  const updateVolume = (value) => {
    setVolume(value);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value;
    }
  };

  const updateBass = (value) => {
    setBassGain(value);
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = value;
    }
  };

  const updateMid = (value) => {
    setMidGain(value);
    if (midFilterRef.current) {
      midFilterRef.current.gain.value = value;
    }
  };

  const updateTreble = (value) => {
    setTrebleGain(value);
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = value;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sound Amplifier
        </h1>
        <button
          onClick={toggleAmplifier}
          className={`px-4 py-2 rounded-lg ${
            isAmplifying
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-primary-500 hover:bg-primary-600'
          } text-white transition-colors`}
        >
          {isAmplifying ? 'Stop' : 'Start'} Amplifying
        </button>
      </div>

      {/* Sound Profiles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Sound Profiles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(SOUND_PROFILES).map((profile) => (
            <button
              key={profile}
              onClick={() => applyProfile(profile)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentProfile === profile
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {profile.charAt(0).toUpperCase() + profile.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Visualizer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Audio Visualizer
        </h2>
        <canvas
          ref={canvasRef}
          width="800"
          height="200"
          className="w-full h-[200px] rounded-lg bg-gray-900"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Master Volume */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Master Volume
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={volume}
            onChange={(e) => updateVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>0%</span>
            <span>{Math.round(volume * 100)}%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Equalizer */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Equalizer
          </h2>
          
          {/* Bass */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bass
            </label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={bassGain}
              onChange={(e) => updateBass(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>-12dB</span>
              <span>{bassGain}dB</span>
              <span>+12dB</span>
            </div>
          </div>

          {/* Mid */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mid
            </label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={midGain}
              onChange={(e) => updateMid(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>-12dB</span>
              <span>{midGain}dB</span>
              <span>+12dB</span>
            </div>
          </div>

          {/* Treble */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Treble
            </label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={trebleGain}
              onChange={(e) => updateTreble(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>-12dB</span>
              <span>{trebleGain}dB</span>
              <span>+12dB</span>
            </div>
          </div>
        </div>
      </div>
      {micError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Microphone Error: </strong>
          <span className="block sm:inline">{micError}</span>
        </div>
      )}
    </div>
  );
}

export default SoundAmplifier;




