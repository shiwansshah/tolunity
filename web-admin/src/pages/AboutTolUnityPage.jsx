import React, { useCallback, useEffect, useState } from 'react';
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

const AboutTolUnityPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchContent = useCallback(async () => {
    try {
      const response = await api.get('/admin/mobile-about');
      const data = response.data || {};
      setTitle(data.title || '');
      setDescription(data.description || '');
      setMediaItems(Array.isArray(data.mediaItems) ? data.mediaItems : []);
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to load mobile About content') });
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
      const nextItems = await Promise.all(
        files.map(async (file) => ({
          id: `${file.name}-${file.lastModified}`,
          mediaType,
          mediaUrl: await toDataUrl(file),
        }))
      );
      setMediaItems((current) => [...current, ...nextItems]);
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to prepare selected files') });
    } finally {
      event.target.value = '';
    }
  };

  const removeMediaItem = (itemId) => {
    setMediaItems((current) => current.filter((item) => item.id !== itemId));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ tone: 'error', text: 'Title is required.' });
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/mobile-about', {
        title: title.trim(),
        description: description.trim(),
        mediaItems,
      });
      setMessage({ tone: 'success', text: 'Mobile About content updated.' });
      await fetchContent();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to save mobile About content') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading mobile About content...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Mobile"
        title="About TolUnity"
        subtitle="Edit the mobile About page title, description, and media inventory."
        actions={
          <Button onClick={handleSave} isLoading={saving}>
            Save Changes
          </Button>
        }
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <section className="border-b border-slate-200 px-5 py-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <input
              className={inputClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="About TolUnity"
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              className={inputClass}
              rows="6"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the app, community mission, or how residents should use TolUnity."
            />
          </Field>
          <Field label="Add Images">
            <input className={inputClass} type="file" accept="image/*" multiple onChange={(event) => addMediaFiles(event, 'IMAGE')} />
          </Field>
          <Field label="Add Videos">
            <input className={inputClass} type="file" accept="video/*" multiple onChange={(event) => addMediaFiles(event, 'VIDEO')} />
          </Field>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Type</th>
              <th className={tableHeaderClass}>Preview</th>
              <th className={tableHeaderClass}>URL</th>
              <th className={tableHeaderClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {mediaItems.map((item) => (
              <tr key={item.id}>
                <td className={tableCellClass}>
                  <Badge variant={item.mediaType === 'VIDEO' ? 'amber' : 'blue'}>
                    {item.mediaType}
                  </Badge>
                </td>
                <td className={tableCellClass}>
                  <div className="w-24 overflow-hidden border border-slate-200">
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} controls className="h-16 w-full object-cover" />
                    ) : (
                      <img src={item.mediaUrl} alt="About TolUnity media" className="h-16 w-full object-cover" />
                    )}
                  </div>
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>
                  <div className="max-w-[480px] truncate">{item.mediaUrl}</div>
                </td>
                <td className={tableCellClass}>
                  <Button variant="secondary" onClick={() => removeMediaItem(item.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {mediaItems.length === 0 && (
              <tr>
                <td colSpan="4" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No media items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AboutTolUnityPage;
