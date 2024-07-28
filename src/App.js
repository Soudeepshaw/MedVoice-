import './App.css';
import Landing from './frontend/landing';
import { BrowserRouter,Route, Routes } from 'react-router-dom';
import { MedVoice } from './frontend/MedVoice';
import { useState } from 'react';
function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }
  return (
    <div className={`h-screen min-h-screen bg-gradient-to-br ${isDarkMode ? 'from-purple-900 via-blue-900 to-blue-600' : 'from-yellow-300 via-green-200 to-green-500'} transition-all duration-500`}>
      <BrowserRouter>
      <Routes>
      <Route path='/' element={<Landing toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode}/>}></Route>
      <Route path='/MedVoice' element={<MedVoice toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode}/>}></Route>
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
