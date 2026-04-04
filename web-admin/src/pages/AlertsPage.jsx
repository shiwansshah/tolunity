import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { TriangleAlert, Image as ImageIcon, Video } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './AlertsPage.css';

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
  reader.readAsDataURL(file);
});

const mediaTypeForFile = (file) => (file.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE');

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.isRead).length,
    [alerts]
  );

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/alerts');
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    try {
      const nextAttachments = await Promise.all(files.map(async (file) => ({
        id: `${file.name}-${file.lastModified}`,
        fileName: file.name,
        mediaType: mediaTypeForFile(file),
        mediaUrl: await toDataUrl(file),
      })));

      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to prepare selected files'));
    } finally {
      event.target.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const submitAlert = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post('/alerts', {
        title: title.trim(),
        description: description.trim(),
        mediaList: attachments.map(({ mediaType, mediaUrl }) => ({ mediaType, mediaUrl })),
      });

      setTitle('');
      setDescription('');
      setAttachments([]);
      await fetchAlerts();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to broadcast alert'));
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      await fetchAlerts();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to update alert status'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/alerts/read-all');
      await fetchAlerts();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to update alerts'));
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Emergency Alerts"
        subtitle="Broadcast urgent incidents to the entire society. Push notifications only contain the title and description."
        action={unreadCount > 0 ? <Button variant="secondary" onClick={markAllAsRead}>Mark All Read</Button> : null}
      />

      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      <div className="alerts-grid">
        <Card className="alert-compose-card">
          <div className="compose-header">
            <div>
              <h3>Raise Alert</h3>
              <p>Use this only for emergencies. Attach images or videos when they help residents respond faster.</p>
            </div>
            <Badge variant="danger">Emergency</Badge>
          </div>

          <div className="form-field">
            <label htmlFor="alert-title">Title</label>
            <input
              id="alert-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fire in Block B"
            />
          </div>

          <div className="form-field">
            <label htmlFor="alert-description">Description</label>
            <textarea
              id="alert-description"
              rows="5"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the emergency, exact location, and any immediate safety instruction."
            />
          </div>

          <div className="form-field">
            <label htmlFor="alert-files">Photos / Videos</label>
            <input
              id="alert-files"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesSelected}
            />
          </div>

          {attachments.length > 0 && (
            <div className="attachment-list">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-chip">
                  <span>{attachment.mediaType === 'VIDEO' ? 'Video' : 'Image'}: {attachment.fileName}</span>
                  <button type="button" onClick={() => removeAttachment(attachment.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="compose-actions">
            <Button onClick={submitAlert} isLoading={saving}>
              Broadcast Alert
            </Button>
          </div>
        </Card>

        <div className="alert-feed">
          {loading ? (
            <Card>
              <div className="text-center p-8 text-muted">Loading alerts...</div>
            </Card>
          ) : alerts.length === 0 ? (
            <Card>
              <div className="empty-alerts">
                <TriangleAlert size={40} />
                <p>No emergency alerts have been raised.</p>
              </div>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className={`alert-item ${alert.isRead ? '' : 'alert-item-unread'}`}>
                <div className="alert-item-top">
                  <div>
                    <div className="alert-kicker-row">
                      <Badge variant="danger">Alert</Badge>
                      {!alert.isRead && <Badge variant="warning">Unread</Badge>}
                    </div>
                    <h3>{alert.title}</h3>
                    <p className="alert-meta">
                      Raised by {alert.createdByName} on {alert.createdAt ? format(new Date(alert.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                    </p>
                  </div>
                  {!alert.isRead && (
                    <Button variant="secondary" onClick={() => markAsRead(alert.id)}>
                      Mark Read
                    </Button>
                  )}
                </div>

                <p className="alert-description">{alert.description}</p>

                {alert.mediaList?.length > 0 && (
                  <div className="alert-media-grid">
                    {alert.mediaList.map((media) => (
                      <div key={media.id} className="alert-media-card">
                        {media.mediaType === 'VIDEO' ? (
                          <div className="alert-media-placeholder">
                            <Video size={18} />
                            <span>Video attached</span>
                          </div>
                        ) : (
                          <>
                            <img src={media.mediaUrl} alt={`${alert.title} attachment`} />
                            <div className="alert-media-label">
                              <ImageIcon size={14} />
                              <span>Image attached</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
