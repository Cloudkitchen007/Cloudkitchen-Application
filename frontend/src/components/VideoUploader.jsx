import React, { useRef, useState } from 'react';

const MAX_SEC = 60;

const VideoUploader = ({ onVideoReady }) => {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [timer, setTimer] = useState(0);
  const mediaRecorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);
  const timerInterval = useRef(null);

  const startRecording = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaRecorder.current = new MediaRecorder(stream.current);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'video/webm' });
        onVideoReady(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecording(false);
        clearInterval(timerInterval.current);
      };

      mediaRecorder.current.start();
      setRecording(true);
      let sec = 0;
      timerInterval.current = setInterval(() => {
        sec++;
        setTimer(sec);
        if (sec >= MAX_SEC) stopRecording();
      }, 1000);
    } catch (err) {
      alert('Camera/microphone access required');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    stream.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerInterval.current);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 100 * 1024 * 1024) {
      onVideoReady(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      {videoUrl ? (
        <div>
          <video src={videoUrl} controls style={{ width: '100%', borderRadius: 8, maxHeight: 280, background: '#000' }} />
          <button className="btn btn-rerecord" style={{ marginTop: 10 }} onClick={() => { setVideoUrl(null); onVideoReady(null); }}>Re-record / Change</button>
        </div>
      ) : recording ? (
        <div style={{ textAlign: 'center' }}>
          <p>Recording... {timer}s / {MAX_SEC}s</p>
          <button className="btn btn-red" onClick={stopRecording}>Stop Recording</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button className="btn btn-green" onClick={startRecording}>Record Video</button>
          <label className="btn btn-blue" style={{ cursor: 'pointer' }}>
            Upload Video
            <input type="file" accept="video/*" hidden onChange={handleFile} />
          </label>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
