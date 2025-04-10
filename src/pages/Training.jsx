import { useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const totalSteps = 5;

  const handleAnswer = (answer) => {
    // Simulate exercise logic
    const isCorrect = Math.random() > 0.5;
    if (isCorrect) {
      setScore(prev => prev + 20);
      setFeedback('Correct! Well done!');
    } else {
      setFeedback('Not quite right. Try again!');
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const resetExercise = () => {
    setCurrentStep(1);
    setScore(0);
    setFeedback('');
    setIsPlaying(false);
  };

  // Add error boundary
  if (!exercise) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${difficultyColors[exercise.difficulty]}`}>
              {exercise.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {exercise.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Exercise Content */}
        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="h-full bg-primary-500"
            />
          </div>

          {/* Exercise Interface */}
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full mx-auto flex items-center justify-center"
                >
                  <SpeakerWaveIcon className="h-12 w-12 text-primary-500" />
                </motion.div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 mx-auto"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="h-5 w-5" />
                    Stop Sound
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    Play Sound
                  </>
                )}
              </motion.button>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4">
              {['Left', 'Right', 'Front', 'Back'].map((direction) => (
                <motion.button
                  key={direction}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(direction)}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                >
                  {direction}
                </motion.button>
              ))}
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg text-center ${
                  feedback.includes('Correct') 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              Score: {score}
            </span>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetExercise}
              className="px-4 py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
            >
              End Exercise
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Training() {
  const [selectedExercise, setSelectedExercise] = useState(null);

  const exercises = [
    {
      title: 'Sound Localization',
      description: 'Practice identifying the direction of sounds in a 3D environment. Perfect for improving spatial awareness.',
      duration: '10 minutes',
      difficulty: 'Beginner',
      xp: 100,
      progress: 65,
      icon: <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
              <SpeakerWaveIcon className="h-6 w-6 text-primary-500" />
            </motion.div>
    },
    {
      title: 'Frequency Recognition',
      description: 'Learn to distinguish between different frequencies. Essential for music appreciation and speech understanding.',
      duration: '15 minutes',
      difficulty: 'Intermediate',
      xp: 150,
      progress: 45,
      icon: <MusicalNoteIcon className="h-6 w-6 text-primary-500" />
    },
    {
      title: 'Speech in Noise',
      description: 'Improve your ability to understand speech in noisy environments. Practical for social situations.',
      duration: '20 minutes',
      difficulty: 'Advanced',
      xp: 200,
      progress: 30,
      icon: <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-primary-500" />
    },
    {
      title: 'Pattern Recognition',
      description: 'Train your brain to identify and remember complex sound patterns. Builds cognitive hearing skills.',
      duration: '12 minutes',
      difficulty: 'Intermediate',
      xp: 120,
      progress: 80,
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
          <TrophyIcon className="h-6 w-6 text-primary-500" />
          <span className="text-primary-600 dark:text-primary-400 font-medium">
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

export default Training;


