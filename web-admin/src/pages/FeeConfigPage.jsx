import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { Settings, Zap, Wrench, Trash2, Send } from 'lucide-react';
import './FeeConfigPage.css';

const FEE_TYPES = [
  { key: 'MAINTENANCE', label: 'Maintenance Fee', icon: Wrench, color: '#F59E0B' },
  { key: 'ELECTRICITY', label: 'Electricity Bill', icon: Zap, color: '#3B82F6' },
  { key: 'GARBAGE', label: 'Garbage Collection', icon: Trash2, color: '#10B981' },
];

const FeeConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState(null);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/admin/fee-config');
      setConfigs(res.data);
      // Populate form data from existing configs
      const data = {};
      res.data.forEach(c => {
        data[c.feeType] = { amount: c.amount, intervalDays: c.intervalDays, description: c.description || '' };
      });
      setFormData(data);
    } catch (err) {
      console.error('Failed to fetch fee configs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (feeType) => {
    const data = formData[feeType];
    if (!data?.amount || data.amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setSaving(feeType);
    try {
      await api.post('/admin/fee-config', {
        feeType,
        amount: parseFloat(data.amount),
        intervalDays: parseInt(data.intervalDays) || 30,
        description: data.description
      });
      setMessage({ type: 'success', text: `${feeType} fee config saved successfully!` });
      fetchConfigs();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };

  const handleGenerate = async (feeType) => {
    if (!window.confirm(`Generate ${feeType} bills for all eligible users?`)) return;
    
    setGenerating(feeType);
    try {
      const res = await api.post('/admin/generate-bills', { feeType });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to generate bills' });
    } finally {
      setGenerating(null);
    }
  };

  const updateField = (feeType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [feeType]: { ...prev[feeType], [field]: value }
    }));
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading fee configurations...</div>;

  return (
    <div className="fade-in">
      <PageHeader
        title="Fee Configuration"
        subtitle="Set amounts and intervals for system-managed fees collected by admin"
      />

      {message && (
        <div className={`alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="alert-close">&times;</button>
        </div>
      )}

      <div className="fee-grid">
        {FEE_TYPES.map(fee => {
          const data = formData[fee.key] || { amount: '', intervalDays: 30, description: '' };
          const existingConfig = configs.find(c => c.feeType === fee.key);

          return (
            <Card key={fee.key} className="fee-card">
              <div className="fee-header">
                <div className="fee-icon" style={{ background: fee.color + '20', color: fee.color }}>
                  <fee.icon size={24} />
                </div>
                <div>
                  <h3 className="fee-title">{fee.label}</h3>
                  {existingConfig ? (
                    <Badge variant="success">Configured</Badge>
                  ) : (
                    <Badge variant="gray">Not Set</Badge>
                  )}
                </div>
              </div>

              <div className="fee-form">
                <div className="input-group">
                  <label>Amount (NPR)</label>
                  <input
                    type="number"
                    value={data.amount}
                    onChange={e => updateField(fee.key, 'amount', e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="input-group">
                  <label>Interval (Days)</label>
                  <input
                    type="number"
                    value={data.intervalDays}
                    onChange={e => updateField(fee.key, 'intervalDays', e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={data.description}
                    onChange={e => updateField(fee.key, 'description', e.target.value)}
                    placeholder="Optional note"
                  />
                </div>
              </div>

              <div className="fee-actions">
                <Button onClick={() => handleSave(fee.key)} isLoading={saving === fee.key}>
                  <Settings size={14} /> Save Config
                </Button>
                {existingConfig && (
                  <Button variant="secondary" onClick={() => handleGenerate(fee.key)} isLoading={generating === fee.key}>
                    <Send size={14} /> Generate Bills
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FeeConfigPage;
