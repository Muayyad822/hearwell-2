import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRightIcon, 
  ClockIcon, 
  StarIcon,
  SpeakerWaveIcon,
  TrophyIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  MusicalNoteIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800'
};

function ExerciseCard({ exercise, index, onStart }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[exercise.difficulty]}`}>
              {exercise.difficulty}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {exercise.icon}
          </motion.div>
        </div>

        <motion.h2 
          className="text-xl font-semibold text-gray-800 dark:text-white mb-2"
          animate={{ color: isHovered ? '#4F46E5' : '' }}
        >
          {exercise.title}
        </motion.h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {exercise.description}
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-5 w-5 mr-1" />
            {exercise.duration}
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <StarIcon className="h-5 w-5 mr-1" />
            {exercise.xp} XP
          </div>
        </div>

        {exercise.progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-gray-800 dark:text-gray-200">{exercise.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${exercise.progress}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full bg-primary-500"
              />
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStart(exercise)}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg 
                   flex items-center justify-center gap-2 transition-colors"
        >
          Start Exercise
          <motion.div
            animate={isHovered ? { x: [0, 5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

function ExerciseModal({ exercise, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({
    correct: 0,
    total: 0,
    streak: 0
  });

  useEffect(() => {
    // Initialize audio and cache it for offline use
    const audio = new Audio(exercise.audioSets[currentSetIndex].audio);
    setAudioElement(audio);
    
    // Cache audio for offline use
    if ('caches' in window) {
      caches.open('audio-cache').then(cache => {
        cache.add(exercise.audioSets[currentSetIndex].audio);
      });
    }

    setIsLoading(false);

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [currentSetIndex, exercise]);

  const handlePlayAudio = () => {
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play();
      setIsPlaying(true);
      audioElement.onended = () => setIsPlaying(false);
    }
  };

  const handleAnswer = (answer) => {
    const currentSet = exercise.audioSets[currentSetIndex];
    const isCorrect = exercise.type === 'word-identification' 
      ? answer === currentSet.word 
      : answer === currentSet.sentence;

    setSelectedAnswer(answer);
    
    // Update progress
    setProgress(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    // Set feedback
    setFeedback(isCorrect ? 
      `Correct! ${progress.streak > 1 ? `Streak: ${progress.streak + 1}` : ''}` : 
      `Not quite. The correct answer was: ${exercise.type === 'word-identification' ? currentSet.word : currentSet.sentence}`
    );

    // Update score
    if (isCorrect) {
      setScore(prev => prev + (10 + progress.streak));
    }

    // Move to next set after delay
    setTimeout(() => {
      if (currentSetIndex < exercise.audioSets.length - 1) {
        setCurrentSetIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setFeedback('');
      } else {
        // Exercise completed
        saveProgress();
      }
    }, 2000);
  };

  const saveProgress = () => {
    const progressData = {
      exerciseId: exercise.id,
      date: new Date().toISOString(),
      score,
      progress,
      difficulty: exercise.difficulty
    };

    // Save to localStorage for offline access
    const savedProgress = JSON.parse(localStorage.getItem('training-progress') || '[]');
    savedProgress.push(progressData);
    localStorage.setItem('training-progress', JSON.stringify(savedProgress));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{exercise.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2">
            <ProgressBar progress={(currentSetIndex / exercise.audioSets.length) * 100} />
          </div>
        </div>

        {/* Exercise Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Audio Player */}
              <div className="flex justify-center mb-8">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className="p-4 rounded-full bg-primary-100 hover:bg-primary-200 
                           transition-colors disabled:opacity-50"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-8 w-8 text-primary-600" />
                  ) : (
                    <PlayIcon className="h-8 w-8 text-primary-600" />
                  )}
                </button>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-4">
                {exercise.audioSets[currentSetIndex].options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? selectedAnswer === exercise.audioSets[currentSetIndex].word
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-primary-500'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Feedback */}
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-lg text-center ${
                    feedback.includes('Correct')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {feedback}
                </motion.div>
              )}

              {/* Score */}
              <div className="mt-4 text-center text-gray-600">
                Score: {score} | Correct: {progress.correct}/{progress.total}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Training() {
  const [selectedExercise, setSelectedExercise] = useState(null);

  const exercises = [
    {
      id: 'word-quiet',
      title: 'Word Identification (Quiet)',
      description: 'Identify spoken words in a quiet environment. Start here if you are new to auditory training.',
      duration: '10 minutes',
      difficulty: 'Beginner',
      xp: 100,
      type: 'word-identification',
      environment: 'quiet',
      audioSets: [
        {
          word: 'house',
          audio: '/audio/quiet/house.mp3',
          options: ['house', 'mouse', 'mouth', 'south']
        },
        // Add more word sets
      ],
      icon: <SpeakerWaveIcon className="h-6 w-6 text-primary-500" />
    },
    {
      id: 'word-noise',
      title: 'Word Identification (Noise)',
      description: 'Challenge yourself by identifying words with background noise. Great for real-world preparation.',
      duration: '15 minutes',
      difficulty: 'Intermediate',
      xp: 150,
      type: 'word-identification',
      environment: 'noisy',
      audioSets: [
        {
          word: 'book',
          audio: '/audio/noisy/book.mp3',
          options: ['book', 'look', 'took', 'cook']
        },
        // Add more word sets
      ],
      icon: <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-primary-500" />
    },
    {
      id: 'sentence-quiet',
      title: 'Sentence Comprehension',
      description: 'Listen and identify complete sentences. Builds overall comprehension skills.',
      duration: '20 minutes',
      difficulty: 'Intermediate',
      xp: 200,
      type: 'sentence',
      environment: 'quiet',
      audioSets: [
        {
          sentence: 'The weather is nice today',
          audio: '/audio/quiet/sentence1.mp3',
          options: [
            'The weather is nice today',
            'The weather is rice today',
            'The leather is nice today',
            'The weather is mice today'
          ]
        },
        // Add more sentence sets
      ],
      icon: <MusicalNoteIcon className="h-6 w-6 text-primary-500" />
    },
    {
      id: 'sentence-noise',
      title: 'Sentences in Noise',
      description: 'Master understanding sentences in noisy environments. Simulates real-world conditions.',
      duration: '20 minutes',
      difficulty: 'Advanced',
      xp: 250,
      type: 'sentence',
      environment: 'noisy',
      audioSets: [
        {
          sentence: 'Please open the window',
          audio: '/audio/noisy/sentence1.mp3',
          options: [
            'Please open the window',
            'Please open the meadow',
            'Please open the pillow',
            'Please open the shadow'
          ]
        },
        // Add more sentence sets
      ],
      icon: <ChartBarIcon className="h-6 w-6 text-primary-500" />
    }
  ];

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    // Additional logic for starting the exercise
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <motion.h1 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Hearing Training
          </motion.h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Improve your hearing abilities with personalized exercises
          </p>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900 p-3 rounded-lg"
        >
          <TrophyIcon className="h-6 w-6 text-primary-500 text-white" />
          <span className="text-primary-600 dark:text-primary-400 text-white font-medium">
            Total XP: 1,250
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.title}
            exercise={exercise}
            index={index}
            onStart={handleStartExercise}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedExercise && (
          <ExerciseModal 
            exercise={selectedExercise} 
            onClose={() => setSelectedExercise(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-primary-500"
      />
    </div>
  );
}

export default Training;

