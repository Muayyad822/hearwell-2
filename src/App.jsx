import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SpeechToText from './pages/SpeechToText';
import SoundAmplifier from './pages/SoundAmplifier';
import TinnitusRelief from './pages/TinnitusRelief';
import Training from './pages/Training';
import Education from './pages/Education';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navigation />
            <main className="py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/speech-to-text" element={<SpeechToText />} />
                <Route path="/sound-amplifier" element={<SoundAmplifier />} />
                <Route path="/tinnitus-relief" element={<TinnitusRelief />} />
                <Route path="/training" element={<Training />} />
                <Route path="/education" element={<Education />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
