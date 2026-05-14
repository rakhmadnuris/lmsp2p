'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/participant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, avatar })
      });
      if (res.ok) {
        alert('Settings updated successfully!');
        setPassword('');
        window.location.reload(); // Reload to reflect avatar globally if needed
      } else {
        alert('Failed to update settings. File might be too large.');
      }
    } catch (err) {
      alert('Error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/dashboard" className="btn" style={{ display: 'inline-block', marginBottom: '2rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)' }}>
        ← Back to Dashboard
      </Link>
      
      <h1 style={{ marginBottom: '2rem' }}>Profile Settings</h1>
      
      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {avatar && <img src={avatar} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="input-field" 
                style={{ padding: '0.5rem' }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose an image from your device.</p>
          </div>
          
          <div className="input-group" style={{ marginTop: '2rem' }}>
            <label className="input-label">New Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Leave blank to keep current password" 
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || (!password && !avatar)}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
