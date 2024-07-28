import React from 'react'
import IMG from '../Assets/landing.webp'
import { Link } from 'react-router-dom'

const Landing = ({toggleDarkMode, isDarkMode}) => {

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900' : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100'} flex items-center justify-center`}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`${isDarkMode ? 'bg-gray-900 border-purple-500' : 'bg-white border-purple-200'} shadow-lg rounded-2xl p-8 mt-4 border transform hover:scale-102 transition-all duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 leading-tight`}>
              Welcome to MedVoice
            </h1>
            <button
              onClick={toggleDarkMode}
              className={`${isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-4 py-2 text-sm rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md hover:shadow-lg`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
            <div className="w-full md:w-1/2">
              <img src={IMG} alt="Landing page image" className="w-full h-auto rounded-lg shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300 transform hover:scale-102" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-between">
              <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="bg-opacity-20 bg-purple-500 p-4 rounded-lg hover:bg-opacity-30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-2">Effortless Documentation</h3>
                  <p className="text-sm leading-relaxed">
                  MedVoice enables easy recording of doctor-patient conversations and instant generation of detailed prescriptions. Our AI accurately transcribes and eliminates noise for clear documentation.
                  </p>
                </div>
                <div className="bg-opacity-20 bg-pink-500 p-4 rounded-lg hover:bg-opacity-30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-2">Simplified Workflow</h3>
                  <p className="text-sm leading-relaxed">
                  MedVoice streamlines your workflow, allowing you to focus on patient care. Review and download prescriptions with a single click after conversations.
                  </p>
                </div>
                <div className="bg-opacity-20 bg-indigo-500 p-4 rounded-lg hover:bg-opacity-30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-2">Innovative Healthcare</h3>
                  <p className="text-sm leading-relaxed">
                  Experience the future of healthcare documentation with MedVoice. Enhance your practice and patient satisfaction using our cutting-edge AI technology.
                  </p>
                </div>
              </div>
              <div className="">
                <Link to="/MedVoice" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-8 text-sm rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 active:from-purple-700 active:to-pink-800">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing