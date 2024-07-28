import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import debounce from 'lodash/debounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';



const genAI = new GoogleGenerativeAI("AIzaSyCEItIAVCnm56UPvk4Vm9cvqg3RAa4GfSg");

export function MedVoice({ toggleDarkMode, isDarkMode }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hospitalName, setHospitalName] = useState('');

  const showNotification = (message) => {
    toast(message);
  };

  const updateTranscriptDebounced = useMemo(
    () =>
      debounce((text) => {
        setTranscript((prev) => prev + ' ' + text.trim());
      }, 500),
    []
  );

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      setRecognition(recognitionInstance);

      recognitionInstance.onresult = (event) => {
        
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } 
        }

        if (finalTranscript) {
          updateTranscriptDebounced(finalTranscript);
        }
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };
    }
  }, [isListening, updateTranscriptDebounced]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
      showNotification('Speech recognition started');
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      recognition.abort();
      showNotification('Speech recognition stopped');
    }
  }, [recognition]);

  const continueListening = useCallback(() => {
    if (!isListening && recognition) {
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  const restartListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  }, [recognition]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(transcript);
    showNotification('copy to clipboard');
  }, [transcript]);

  const handleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const processTranscriptWithGemini = useCallback(async () => {
    setIsProcessing(true);
    showNotification('Processing transcript with Gemini');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  
    const extractionPrompt = `
      Please rectify any mistakes in the following text or in medicine name or test name:
      ${transcript}
      
      Then extract the following details from the corrected text:
      1. Name of the person
      2. Age of the person
      3. Gender of the person
      4. Name of the doctor
      5. Past tests
      6. Recommended doses: Provide an array of objects, each containing "Medicine" and "Dosage Instructions"
      7. Medicine names: Provide an array of medicine names
      8. Symptoms

      Provide the results in the form of JSON, using the exact field names given above.
    `;
    try {
      const result = await model.generateContent(extractionPrompt);
      const text = await result.response.text();
  
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
  
      const jsonResponse = JSON.parse(jsonString);
  
      const fixedJsonResponse = {
        "Name of the person": jsonResponse["Name of the person"] || "Unknown",
        "Age of the person": jsonResponse["Age of the person"] || "Unknown",
        "Gender of the person": jsonResponse["Gender of the person"] || "Unknown",
        "Name of the doctor": jsonResponse["Name of the doctor"] || "Unknown",
        "Past tests": jsonResponse["Past tests"] || "Unknown",
        "Symptom":jsonResponse["Symptoms"] || "Unknown",
        "Recommended doses": Array.isArray(jsonResponse["Recommended doses"])
          ? jsonResponse["Recommended doses"].map(dose => `${dose.Medicine}: ${dose["Dosage Instructions"]}`).join(', ')
          : "Unknown",
        "Medicine names": Array.isArray(jsonResponse["Medicine names"])
          ? jsonResponse["Medicine names"].join(', ')
          : "Unknown"
      };
  
      setExtractedInfo(fixedJsonResponse);
      console.log('Extracted info:', fixedJsonResponse);
      showNotification('Information extracted. Please enter the hospital/clinic name before generating PDF.');
    } catch (error) {
      console.log(`Error processing with Gemini: ${error.message}`);
    } finally {
      setIsProcessing(false);
      showNotification('Gemini processing completed');
    }
  }, [transcript]);
  const generatePDF = () => {
    if(hospitalName){

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = margin;
    
      // Add hospital name and date/time
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(hospitalName || 'Medical Prescription', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleString();
      doc.text(`Date: ${currentDate}`, margin, yPos);
      yPos += 10;
    
      // Add a line separator
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    
      // Add patient information
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      ["Name of the person", "Age of the person", "Gender of the person"].forEach(key => {
        doc.text(`${key}: ${extractedInfo[key]}`, margin, yPos);
        yPos += 7;
      });
    
      yPos += 5;
    
      // Add doctor information
      doc.setFont("helvetica", "bold");
      doc.text("Doctor Information", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Name of the doctor: ${extractedInfo["Name of the doctor"]}`, margin, yPos);
      yPos += 10;
    
      // Add past tests
      doc.setFont("helvetica", "bold");
      doc.text("Past Tests", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.text(extractedInfo["Past tests"], margin, yPos);
      yPos += 10;
    
      // Add Symptoms 
      doc.setFont("helvetica", "bold");
      doc.text("Symptoms", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");

      // Ensure symptoms are in string format
      const symptomsText = Array.isArray(extractedInfo["Symptom"]) 
        ? extractedInfo["Symptom"].join(", ") 
        : String(extractedInfo["Symptom"] || "");

      // Use splitTextToSize to handle long text
      const splitSymptoms = doc.splitTextToSize(symptomsText, pageWidth - 2 * margin);
      doc.text(splitSymptoms, margin, yPos);
      yPos += splitSymptoms.length * 7;
      // Add recommended doses
      doc.setFont("helvetica", "bold");
      doc.text("Recommended Doses", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      const doses = extractedInfo["Recommended doses"].split(', ');
      doses.forEach(dose => {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(dose, margin, yPos);
        yPos += 7;
      });
    
      yPos += 5;

      
    
      // Add medicine names
      doc.setFont("helvetica", "bold");
      doc.text("Medicine Names", margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      const medicines = extractedInfo["Medicine names"].split(', ');
      medicines.forEach(medicine => {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(medicine, margin, yPos);
        yPos += 7;
      });
      const fileName = `${extractedInfo["Name of the person"]}_${extractedInfo["Name of the doctor"]}_${hospitalName}_prescription.pdf`.replace(/\s+/g, '_');
doc.save(fileName);

      
    }
    else{
      if(extractedInfo){
        showNotification('Please extract the information before generating PDF.');
        
      }
      else{
        showNotification('Please enter the hospital/clinic name before generating PDF.');
      }
      
    }
  };
  

  useEffect(() => {
    document.title = isListening ? 'Listening...' : 'Speech to Doctor Prescription';
  }, [isListening]);

  return (
    <div className={`h-screen min-h-screen bg-gradient-to-br ${isDarkMode ? 'from-purple-900 via-blue-900 to-blue-600' : 'from-yellow-300 via-green-200 to-green-500'} transition-all duration-500 font-sans`}>
      <div className={`flex flex-col md:flex-row items-start justify-start px-4 py-8 gap-8`}>
      <button className="md:hidden p-2 rounded-md bg-gray-700 hover:bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} />
        </svg>
      </button>

        <div className={`fixed md:static top-0 left-0 h-full md:h-auto w-full md:w-64 bg-gray-800 bg-opacity-50 backdrop-blur-lg transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-start items-start space-y-4 p-4 rounded-lg shadow-lg z-10`}>
        <button 
          className="md:hidden absolute top-2 right-2 p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
          <button className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-gray-400 backdrop-filter backdrop-blur-lg bg-opacity-50" onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="flex flex-col gap-4 w-full">
            <button 
              className={`px-4 py-2 rounded-md text-white font-medium shadow-md ${isListening ? 'bg-red-500' : 'bg-blue-500'} hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full flex items-center justify-center`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Stop Listening
                </>
              ) : (
                'Start Listening'
              )}
            </button>

            <button className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 w-full shadow-md"
              onClick={continueListening} disabled={isListening}>
              Continue Listening
            </button>
            <button className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 w-full shadow-md"
              onClick={restartListening} disabled={isListening}>
              Restart Listening
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-8 w-full rounded-lg p-4 bg-opacity-50 backdrop-blur-lg">
            <button className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-md"
              onClick={handleCopy}>
              Copy to Clipboard
            </button>
            <button className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white focus:outline-none focus:ring-2 focus:ring-green-400 w-full shadow-md"
              onClick={handleEdit}>
              {isEditing ? 'Save Edit' : 'Edit'}
            </button>
            <button className="px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 w-full shadow-md"
              onClick={processTranscriptWithGemini} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'extract details'}
            </button>
            <button
              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-400 w-full shadow-md mt-4"
              onClick={generatePDF}
            >
              Generate PDF
            </button>
          </div>
        </div>

        <div className="flex-1 rounded-lg shadow-lg p-4 md:p-8 md:ml-0 bg-gray-800 bg-opacity-50 backdrop-blur-lg" style={{backgroundColor: isDarkMode ? '' : ''}}>
          <div className='flex flex-col justify-center items-center gap-y-4 w-full'>
            <h1 className={`text-2xl md:text-4xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Speech to Doctor Prescription</h1>
            <textarea
                className="p-4 mb-4 rounded-md bg-gray-100 border border-gray-300 w-full min-h-[100px] max-h-[400px] overflow-y-auto"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                readOnly={!isEditing}
              />
            {Object.keys(extractedInfo).length > 0 && (
              <div className="extracted-info p-6 rounded-lg w-full">
                <h2 className="text-xl font-bold mb-4 text-white">Extracted Information</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto' style={{ maxHeight: '24rem' }}> 
                  {Object.entries(extractedInfo).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <label htmlFor={key} className={`block text-sm font-medium  ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {key}:
                      </label>
                      {Array.isArray(value) ? (
                        <textarea
                          id={key}
                          name={key}
                          value={value.join('\n')}
                          onChange={(e) => {
                            const newValue = e.target.value.split('\n');
                            setExtractedInfo(prev => ({
                              ...prev,
                              [key]: newValue
                            }))
                          }}
                          className="mt-1 p-2 border rounded-md w-full bg-opacity-50 backdrop-blur-sm bg-white text-gray-800 resize-none overflow-hidden"
                          style={{ minHeight: '2.5rem', height: 'auto' }}
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          id={key}
                          name={key}
                          value={value}
                          onChange={(e) => {
                            setExtractedInfo(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))
                          }}
                          className="mt-1 p-2 border rounded-md w-full bg-opacity-50 backdrop-blur-sm bg-white text-gray-800"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <label className={`block text-sm font-medium  ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Enter Hospital/Clinic Name 
                      </label>
                <input
                    type="text"
                    placeholder="Enter Hospital/Clinic Name"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="mt-4 p-2 border rounded-md w-full bg-opacity-50 backdrop-blur-sm bg-white text-gray-800"
                  />
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
