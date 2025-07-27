import React, { useState } from 'react';

const App = () => {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);



  const analyzeResume = async () => {
    if (!resumeText || !resumeText.trim()) {
      setError('Please enter your resume content');
      return;
    }

    if (resumeText.trim().length < 10) {
      setError('Please enter a more substantial resume content');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('https://resume-review-backend-ekfp.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: resumeText.trim() }),
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const requiredFields = ['id', 'word_count', 'sentence_count', 'readability_score', 'passive_voice_ratio', 'skills', 'feedback'];
      for (const field of requiredFields) {
        if (!(field in result)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Failed to analyze resume: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setError('');
    
    try {
      const response = await fetch('https://resume-review-backend-ekfp.onrender.com/history');
      
      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result || !Array.isArray(result.history)) {
        throw new Error('Invalid history data format');
      }
      
      setHistory(result.history);
      setShowHistory(true);
    } catch (err) {
      console.error('History error:', err);
      setError(`Failed to load history: ${err.message}`);
    }
  };

  const clearResults = () => {
    setAnalysis(null);
    setShowHistory(false);
    setError('');
  };

  const getFeedbackColor = (status) => {
    if (!status) return 'text-gray-700 bg-gray-100 border-gray-300';
    
    switch (status) {
      case 'success': return 'text-green-700 bg-green-100 border-green-300';
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'error': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getScoreColor = (score, type) => {
    if (score === null || score === undefined) return 'text-gray-600';
    
    if (type === 'passive_voice') {
      if (score < 0.05) return 'text-green-600';
      if (score <= 0.20) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (type === 'readability') {
      if (score > 70) return 'text-green-600';
      if (score >= 50) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    return 'text-blue-600';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 font-sans text-gray-800 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            AI Resume Reviewer
          </h1>
          <p className="text-md text-gray-600 max-w-md mx-auto leading-relaxed">
            Get instant feedback on your resume's clarity, readability, and impact
          </p>
        </div>

        {/* Main content */}
         <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste your resume content here:
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Copy and paste your resume text here..."
              className="block w-full h-44 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50 text-gray-900 text-base shadow-sm transition-shadow duration-200"
              disabled={loading}
            />
            <div className="mt-2 text-xs text-gray-500 select-none">
              {resumeText.trim().length} characters
            </div>
          </div>

          {/* buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={analyzeResume}
              disabled={loading || !resumeText.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Resume'
              )}
            </button>
            
            <button
              onClick={loadHistory}
              disabled={loading}
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
            >
              View History
            </button>

            {(analysis || showHistory) && (
              <button
                onClick={clearResults}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Clear Results
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Analysis Results
              </h2>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-xl p-5 flex flex-col items-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.word_count || 0}
                  </div>
                  <div className="text-sm text-blue-600">Words</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-5 flex flex-col items-center shadow-sm">

                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.sentence_count || 0}
                  </div>
                  <div className="text-sm text-purple-600">Sentences</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-5 flex flex-col items-center shadow-sm">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.readability_score, 'readability')}`}>
                    {analysis.readability_score ? analysis.readability_score.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-green-600">Readability</div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-5 flex flex-col items-center shadow-sm">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.passive_voice_ratio, 'passive_voice')}`}>
                    {analysis.passive_voice_ratio ? (analysis.passive_voice_ratio * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-orange-600">Passive Voice</div>
                </div>
              </div>

              {/* Feedback */}
              {analysis.feedback && Object.keys(analysis.feedback).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Detailed Feedback</h3>
                  
                  {Object.entries(analysis.feedback).map(([key, feedback]) => (
                    <div
                      key={key}
                      className={`p-5 border rounded-xl shadow-sm ${getFeedbackColor(feedback?.status)}`}
                    >
                      <div className="font-semibold capitalize mb-2 text-gray-800">
                        {key.replace('_', ' ')}
                      </div>
                      <div>{feedback?.message || 'No feedback available'}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills*/}
              {analysis.skills && analysis.skills.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Extracted Skills ({analysis.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* id of analysis*/}
              <div className="text-sm text-gray-400 pt-6 border-t border-gray-200">
                Analysis ID: {analysis.id}
              </div>
            </div>
          )}

          {/* history*/}
          {showHistory && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Recent Analyses
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
                >
                  Hide
                </button>
              </div>
              
              {history.length === 0 ? (
                <p className="text-gray-500">No previous analyses found.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            {formatDate(item.created_at)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{item.word_count || 0}</span> words • 
                            <span className="font-medium ml-1">{item.readability_score ? item.readability_score.toFixed(1) : '0.0'}</span> readability • 
                            <span className="font-medium ml-1">{item.passive_voice_ratio ? (item.passive_voice_ratio * 100).toFixed(1) : '0.0'}%</span> passive
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 select-text">
                          ID: {item.id ? item.id.slice(-8) : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;