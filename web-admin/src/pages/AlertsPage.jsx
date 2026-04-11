import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import {
  Badge,
  Banner,
  Button,
  Field,
  PageHeader,
  inputClass,
  tableCellClass,
  tableHeaderClass,
} from '../components/UI';

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
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
  const [message, setMessage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);

  const unreadCount = useMemo(() => alerts.filter((alert) => !alert.isRead).length, [alerts]);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(Array.isArray(response.data) ? response.data : []);
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to load alerts') });
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
      const nextAttachments = await Promise.all(
        files.map(async (file) => ({
          id: `${file.name}-${file.lastModified}`,
          fileName: file.name,
          mediaType: mediaTypeForFile(file),
          mediaUrl: await toDataUrl(file),
        }))
      );
      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to prepare selected files') });
    } finally {
      event.target.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const submitAlert = async () => {
    if (!title.trim() || !description.trim()) {
      setMessage({ tone: 'error', text: 'Title and description are required.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/alerts', {
        title: title.trim(),
        description: description.trim(),
        mediaList: attachments.map(({ mediaType, mediaUrl }) => ({ mediaType, mediaUrl })),
      });
      setTitle('');
      setDescription('');
      setAttachments([]);
      setMessage({ tone: 'success', text: 'Alert broadcasted.' });
      await fetchAlerts();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to broadcast alert') });
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setMessage({ tone: 'success', text: `Alert #${alertId} marked as read.` });
      await fetchAlerts();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to update alert status') });
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/alerts/read-all');
      setMessage({ tone: 'success', text: 'All alerts marked as read.' });
      await fetchAlerts();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to update alerts') });
    }
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading alerts...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Broadcast"
        title="Emergency Alerts"
        subtitle="Create broadcast alerts with optional media and manage unread status."
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          ) : null
        }
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <section className="border-b border-slate-200 px-5 py-5">
        <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-500">Create Alert</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <input
              className={inputClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fire in Block B"
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              className={inputClass}
              rows="4"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the emergency, location, and immediate instruction."
            />
          </Field>
          <Field label="Media Files" className="md:col-span-2">
            <input className={inputClass} type="file" accept="image/*,video/*" multiple onChange={handleFilesSelected} />
          </Field>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Type</th>
                  <th className={tableHeaderClass}>File</th>
                  <th className={tableHeaderClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td className={tableCellClass}>
                      <Badge variant={attachment.mediaType === 'VIDEO' ? 'amber' : 'blue'}>
                        {attachment.mediaType}
                      </Badge>
                    </td>
                    <td className={tableCellClass}>{attachment.fileName}</td>
                    <td className={tableCellClass}>
                      <Button variant="secondary" onClick={() => removeAttachment(attachment.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3">
          <Button onClick={submitAlert} isLoading={saving}>
            Broadcast Alert
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Title</th>
              <th className={tableHeaderClass}>Raised By</th>
              <th className={tableHeaderClass}>Created At</th>
              <th className={tableHeaderClass}>Media</th>
              <th className={tableHeaderClass}>Status</th>
              <th className={tableHeaderClass}>Description</th>
              <th className={tableHeaderClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td className={tableCellClass}>{alert.title}</td>
                <td className={tableCellClass}>{alert.createdByName || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>
                  {alert.createdAt ? format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{alert.mediaList?.length || 0}</td>
                <td className={tableCellClass}>
                  <Badge variant={alert.isRead ? 'slate' : 'red'}>{alert.isRead ? 'READ' : 'UNREAD'}</Badge>
                </td>
                <td className={tableCellClass}>{alert.description}</td>
                <td className={tableCellClass}>
                  {!alert.isRead ? (
                    <Button variant="secondary" onClick={() => markAsRead(alert.id)}>
                      Mark Read
                    </Button>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan="7" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No emergency alerts have been raised.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsPage;
