import React, { useState, useRef } from 'react';
import VideoUploader from '../components/VideoUploader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_GATEWAY_URL || '';

const Testimonials = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [videoBlob, setVideoBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVideoReady = (blob) => setVideoBlob(blob);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!videoBlob) { toast.error('Please record or upload a video'); return; }
    setUploading(true);
    try {
      // 1. Get pre-signed URL
      const res = await fetch(`${API_BASE}/api/testimonials/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: `testimonial-${Date.now()}.webm`, contentType: videoBlob.type })
      });
      const { url, key } = await res.json();

      // 2. Upload video
      await fetch(url, { method: 'PUT', body: videoBlob, headers: { 'Content-Type': videoBlob.type } });

      setSuccess(true);
      toast.success('Testimonial submitted!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2>Thank you! 🎉</h2>
        <p>Your testimonial has been submitted successfully.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: '40px 0' }}>
      <h1 className="section-title">Share Your Testimonial</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Record a short video (max 1 min)</p>

      <div className="form-group">
        <label>Your Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div className="form-group">
        <label>Email (optional)</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
      </div>

      <VideoUploader onVideoReady={handleVideoReady} />

      <button
        className="btn btn-primary"
        style={{ marginTop: 20, width: '100%' }}
        onClick={handleSubmit}
        disabled={uploading || !videoBlob}
      >
        {uploading ? 'Uploading...' : 'Submit Testimonial'}
      </button>
    </div>
  );
};

export default Testimonials;
