import { motion } from 'framer-motion';
import { ChevronRightIcon, BookOpenIcon, ShieldCheckIcon, BeakerIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function ArticleCard({ article, index }) {
  const [isHovered, setIsHovered] = useState(false);

  const categoryIcons = {
    'Basic Knowledge': BookOpenIcon,
    'Prevention': ShieldCheckIcon,
    'Management': BeakerIcon,
    'Technology': ComputerDesktopIcon,
  };

  const IconComponent = categoryIcons[article.category] || BookOpenIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <IconComponent className="h-6 w-6 text-primary-500 text-gray-300" />
          </div>
          <span className="text-sm text-gray-300 font-medium text-primary-500">
            {article.category}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-3">
          {article.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 min-h-[3rem]">
          {article.description}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 
                   text-primary-600 text-gray-300 dark:text-primary-400 rounded-lg 
                   flex items-center justify-center gap-2 
                   hover:bg-primary-100 dark:hover:bg-primary-900/50 
                   transition-colors"
        >
          Read Article
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

function Education() {
  const articles = [
    {
      title: 'Understanding Hearing Loss',
      description: 'Learn about different types of hearing loss, their causes, and early warning signs to watch for.',
      category: 'Basic Knowledge',
      readTime: '5 min read',
    },
    {
      title: 'Protecting Your Hearing',
      description: 'Essential tips and best practices for preventing hearing damage in noisy environments.',
      category: 'Prevention',
      readTime: '7 min read',
    },
    {
      title: 'Living with Tinnitus',
      description: 'Comprehensive guide to managing tinnitus symptoms and improving quality of life.',
      category: 'Management',
      readTime: '10 min read',
    },
    {
      title: 'Hearing Aid Technology',
      description: 'Explore modern hearing aid features, maintenance tips, and how to choose the right device.',
      category: 'Technology',
      readTime: '8 min read',
    },
    {
      title: 'Communication Strategies',
      description: 'Effective techniques for better communication with hearing loss in various situations.',
      category: 'Management',
      readTime: '6 min read',
    },
    {
      title: 'Workplace Hearing Safety',
      description: 'Guidelines and regulations for protecting hearing health in professional environments.',
      category: 'Prevention',
      readTime: '7 min read',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-100 mb-4">
          Education Center
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore our collection of articles and resources to better understand hearing health,
          prevention strategies, and management techniques.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard key={index} article={article} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-gray-500 dark:text-gray-400">
          New articles are added regularly. Check back often for updates!
        </p>
      </motion.div>
    </div>
  );
}

export default Education;
