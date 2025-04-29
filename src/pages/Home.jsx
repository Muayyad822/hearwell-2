import { Link } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';
import {
  ChatBubbleBottomCenterTextIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

// Rainbow gradient text effect
function GradientText({ children, delay = 0 }) {
  const controls = useAnimationControls();
  
  useEffect(() => {
    controls.start({
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 5,
        repeat: Infinity,
        delay,
      },
    });
  }, []);

  return (
    <motion.span
      animate={controls}
      className="inline-block font-bold"
      style={{
        backgroundImage: 'linear-gradient(90deg, #4F46E5, #818CF8, #4F46E5)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </motion.span>
  );
}

function TypewriterText({ text, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, color: '#4F46E5' }}
          animate={{ opacity: 1, y: 0, color: 'currentColor' }}
          transition={{
            duration: 0.3,
            delay: index * 0.03,
            ease: [0.6, -0.05, 0.01, 0.99],
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

function FloatingIcon({ Icon }) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon className="h-8 w-8 text-primary-500" />
    </motion.div>
  );
}

function FeatureCard({ title, description, icon: Icon, to, actionText, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.6, -0.05, 0.01, 0.99],
      }}
      whileHover={{ scale: 1.03, rotateZ: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all transform-gpu"
      style={{
        boxShadow: isHovered ? '0 10px 30px -10px rgba(79, 70, 229, 0.3)' : undefined,
      }}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: index * 0.2 + 0.3,
            }}
          >
            <FloatingIcon Icon={Icon} />
          </motion.div>
        </div>
        <div className="flex-1">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.2 + 0.2,
              ease: "easeOut"
            }}
            className="text-xl font-semibold mb-2"
          >
            <GradientText delay={index * 0.2}>{title}</GradientText>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: index * 0.2 + 0.4,
            }}
            className="text-gray-600 dark:text-gray-300 mb-4"
          >
            <TypewriterText text={description} delay={index * 0.2 + 0.6} />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.2 + 0.8,
            }}
          >
            <Link
              to={to}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all transform-gpu"
            >
              <motion.span
                animate={isHovered ? {
                  x: [0, 5, 0],
                  transition: { duration: 0.6, repeat: Infinity }
                } : {}}
              >
                {actionText} →
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Home() {
  const features = [
    {
      title: 'Speech to Text',
      description: 'Convert speech to text in real-time with high accuracy. Perfect for meetings, lectures, or daily conversations.',
      icon: ChatBubbleBottomCenterTextIcon,
      to: '/speech-to-text',
      actionText: 'Start Converting',
    },
    {
      title: 'Sound Amplifier',
      description: 'Enhance and amplify ambient sounds with customizable settings to improve your hearing experience.',
      icon: SpeakerWaveIcon,
      to: '/sound-amplifier',
      actionText: 'Amplify Sound',
    },
    {
      title: 'Tinnitus Relief',
      description: 'Access a variety of soothing sounds and proven techniques to help manage and relieve tinnitus symptoms.',
      icon: MusicalNoteIcon,
      to: '/tinnitus-relief',
      actionText: 'Find Relief',
    },
    {
      title: 'Training',
      description: 'Improve your hearing capabilities with personalized exercises and progress tracking.',
      icon: AcademicCapIcon,
      to: '/training',
      actionText: 'Start Training',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.6, -0.05, 0.01, 0.99],
          }}
          className="mb-4"
        >
          <motion.img
            src="/soniva.png" 
            alt="Soniva Logo"
            className="h-32 mx-auto mb-6" 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05, rotate: -5 }}
          />
          <h1 className="text-4xl md:text-5xl text-white font-bold mb-4">
            Welcome to <GradientText>Soniva</GradientText>
          </h1>
        </motion.div>
        <div className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          <TypewriterText 
            text="Your comprehensive hearing assistance companion. Enhance your hearing experience with our suite of powerful tools and features."
            delay={0.5}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        whileHover={{ scale: 1.05 }}
        className="mt-8 text-center"
      >
        <Link
          to="/education"
          className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-all transform-gpu"
        >
          <motion.span
            animate={{
              x: [0, 5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Learn More About Hearing Health →
          </motion.span>
        </Link>
      </motion.div>
    </div>
  );
}

export default Home;



