import { useEffect, useState, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const mockLanguages = [
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'zh', label: 'Chinese (中文)' }
];

const statusStyles = {
  default: 'status',
  recording: 'status recording',
  processing: 'status processing',
  success: 'status success',
  error: 'status error'
};

function App() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready. Click the mic to start recording.');
  const [statusType, setStatusType] = useState('default');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
  const [isTranslateLoading, setIsTranslateLoading] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    checkBackendHealth();
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      if (response.ok && data.status) {
        setBackendHealthy(true);
        setStatusMessage('Backend connected. Ready to record.');
        setStatusType('default');
      }
    } catch {
      setBackendHealthy(false);
      setStatusMessage('Backend is not reachable. Start the backend on port 5000.');
      setStatusType('error');
    }
  };

  const initAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        audioChunks.current = [];
        await sendAudioToBackend(blob);
      };
      setMediaRecorder(recorder);
      return recorder;
    } catch (error) {
      setStatusMessage('Microphone access denied');
      setStatusType('error');
      return null;
    }
  };

  const handleStartRecording = async () => {
    let recorder = mediaRecorder;
    if (!recorder) {
      recorder = await initAudioRecording();
    }
    if (!recorder) {
      return;
    }
    audioChunks.current = [];
    recorder.start();
    setIsRecording(true);
    setStatusMessage('Recording...');
    setStatusType('recording');
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setStatusMessage('Processing speech...');
    setStatusType('processing');
  };

  const sendAudioToBackend = async (blob) => {
    try {
      setIsSpeechLoading(true);
      setStatusMessage('Sending audio to backend...');
      setStatusType('processing');

      const base64Audio = await blobToBase64(blob);
      const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      });
      const data = await response.json();
      if (data.success) {
        setTranscribedText(data.text);
        setTranslatedText('');
        setStatusMessage('Speech recognized successfully! Backend connected.');
        setStatusType('success');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsSpeechLoading(false);
    }
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleTranslate = async () => {
    if (!targetLanguage) {
      setStatusMessage('Please select a target language');
      setStatusType('error');
      return;
    }
    if (!transcribedText) {
      setStatusMessage('No text to translate');
      setStatusType('error');
      return;
    }
    setIsTranslateLoading(true);
    setStatusMessage('Translating...');
    setStatusType('processing');
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcribedText, targetLanguage })
      });
      const data = await response.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
        setStatusMessage('Translation complete!');
        setStatusType('success');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsTranslateLoading(false);
    }
  };

  const copyText = async (text, label) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatusMessage(`${label} copied to clipboard!`);
    setStatusType('success');
  };

  const playAudio = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.play();
    setStatusMessage('Playing recorded audio...');
    setStatusType('success');
  };

  const handleReset = () => {
    if (isRecording) return;
    setAudioBlob(null);
    setTranscribedText('');
    setTranslatedText('');
    setTargetLanguage('');
    setStatusMessage('Ready. Click the mic to start recording.');
    setStatusType('default');
  };

  return (
    <div className="container">
      <h1>🎙️ Speech-to-Text & Translation</h1>
      <section className="section">
        <div className="title">Step 1: Speech Recognition</div>
        <div className="button-group">
          <button className="btn-primary" onClick={handleStartRecording} disabled={isRecording}>
            🎤 Start Recording
          </button>
          <button className="btn-secondary" onClick={handleStopRecording} disabled={!isRecording}>
            ⏹️ Stop
          </button>
        </div>
        <p className="info">Click the mic button to start recording (Chrome/Edge with microphone access)</p>
      </section>

      <section className="section">
        <div className="title">Transcribed Text</div>
        <div className={`text-display ${transcribedText ? '' : 'empty'}`}>
          {transcribedText || 'Your speech will appear here...'}
        </div>
        <div className="button-group">
          <button className="btn-secondary" onClick={() => copyText(transcribedText, 'Text')} disabled={!transcribedText}>
            Copy Text
          </button>
          <button className="btn-secondary" onClick={playAudio} disabled={!audioBlob}>
            🔊 Play Audio
          </button>
          <button className="btn-secondary" onClick={handleReset} disabled={isRecording || (!transcribedText && !translatedText)}>
            Reset
          </button>
        </div>
      </section>

      <section className="section">
        <div className="title">Step 2: Translation</div>
        <select
          className="language-select"
          value={targetLanguage}
          onChange={(event) => setTargetLanguage(event.target.value)}
        >
          <option value="">Select target language...</option>
          {mockLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <button className="btn-success" onClick={handleTranslate} disabled={!transcribedText || isTranslateLoading || isSpeechLoading || !backendHealthy}>
          🌐 {isTranslateLoading ? 'Translating...' : 'Translate'}
        </button>
      </section>

      <section className="section">
        <div className="title">Translated Text</div>
        <div className={`text-display ${translatedText ? '' : 'empty'}`}>
          {translatedText || 'Translated text will appear here...'}
        </div>
        <button className="btn-secondary" onClick={() => copyText(translatedText, 'Translation')} disabled={!translatedText}>
          Copy Translation
        </button>
      </section>

      <div className={statusStyles[statusType] || statusStyles.default}>{statusMessage}</div>
      {backendHealthy === false && (
        <div className="status error" style={{ marginTop: '12px' }}>
          Backend unreachable. Please start the backend server on port 5000.
        </div>
      )}
    </div>
  );
}

export default App;
