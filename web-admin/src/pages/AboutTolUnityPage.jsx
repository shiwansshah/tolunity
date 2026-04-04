import React, { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Video, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './AboutTolUnityPage.css';

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
  reader.readAsDataURL(file);
});

const AboutTolUnityPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchContent = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/admin/mobile-about');
      const data = response.data || {};
      setTitle(data.title || '');
      setDescription(data.description || '');
      setMediaItems(Array.isArray(data.mediaItems) ? data.mediaItems : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load mobile About content'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const addMediaFiles = async (event, mediaType) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    try {
      const nextItems = await Promise.all(files.map(async (file) => ({
        id: `${file.name}-${file.lastModified}`,
        mediaType,
        mediaUrl: await toDataUrl(file),
      })));

      setMediaItems((current) => [...current, ...nextItems]);
      setSuccess(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to prepare selected files'));
    } finally {
      event.target.value = '';
    }
  };

  const removeMediaItem = (itemId) => {
    setMediaItems((current) => current.filter((item) => item.id !== itemId));
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put('/admin/mobile-about', {
        title: title.trim(),
        description: description.trim(),
        mediaItems,
      });
      setSuccess('Mobile About content updated successfully.');
      await fetchContent();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to save mobile About content'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading mobile About content...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Mobile About TolUnity"
        subtitle="Control the About TolUnity page shown inside the mobile app."
        action={<Button onClick={handleSave} isLoading={saving}>Save Changes</Button>}
      />

      {error && <div className="about-banner about-banner-error">{error}</div>}
      {success && <div className="about-banner about-banner-success">{success}</div>}

      <div className="about-grid">
        <Card>
          <div className="form-field">
            <label htmlFor="about-title">Title</label>
            <input
              id="about-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="About TolUnity"
            />
          </div>

          <div className="form-field">
            <label htmlFor="about-description">Description</label>
            <textarea
              id="about-description"
              rows="8"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the app, community mission, or how residents should use TolUnity."
            />
          </div>

          <div className="media-toolbar">
            <label className="upload-chip">
              <Plus size={16} />
              <span>Add Images</span>
              <input type="file" accept="image/*" multiple onChange={(event) => addMediaFiles(event, 'IMAGE')} />
            </label>
            <label className="upload-chip">
              <Plus size={16} />
              <span>Add Videos</span>
              <input type="file" accept="video/*" multiple onChange={(event) => addMediaFiles(event, 'VIDEO')} />
            </label>
          </div>
        </Card>

        <Card>
          <div className="preview-header">
            <div>
              <h3>Mobile Preview</h3>
              <p>This is the content the mobile profile menu will open.</p>
            </div>
            <Badge variant="primary">{mediaItems.length} media</Badge>
          </div>

          <div className="about-preview">
            <h2>{title || 'About TolUnity'}</h2>
            <p>{description || 'No description added yet.'}</p>

            {mediaItems.length === 0 ? (
              <div className="empty-preview">No images or videos added yet.</div>
            ) : (
              <div className="about-media-grid">
                {mediaItems.map((item) => (
                  <div key={item.id} className="about-media-card">
                    <div className="about-media-top">
                      <Badge variant={item.mediaType === 'VIDEO' ? 'warning' : 'primary'}>
                        {item.mediaType === 'VIDEO' ? 'Video' : 'Image'}
                      </Badge>
                      <button type="button" className="icon-btn" onClick={() => removeMediaItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} controls className="about-video" />
                    ) : (
                      <img src={item.mediaUrl} alt="About TolUnity media" />
                    )}

                    <div className="about-media-meta">
                      {item.mediaType === 'VIDEO' ? <Video size={16} /> : <ImageIcon size={16} />}
                      <span>{item.mediaType === 'VIDEO' ? 'Video attachment' : 'Image attachment'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutTolUnityPage;
