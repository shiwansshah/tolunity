import React, { useEffect, useState } from 'react';
import { Settings, Wrench, Trash2, Send } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './FeeConfigPage.css';

const FEE_TYPES = [
  { key: 'MAINTENANCE', label: 'Maintenance Fee', icon: Wrench, color: '#F59E0B' },
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
      const response = await api.get('/admin/fee-config');
      setConfigs(response.data);

      const nextFormData = {};
      response.data.forEach((config) => {
        nextFormData[config.feeType] = {
          amount: config.amount,
          intervalDays: config.intervalDays,
          description: config.description || '',
        };
      });
      setFormData(nextFormData);
    } catch (error) {
      console.error(getApiErrorMessage(error, 'Failed to fetch fee configs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

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
        intervalDays: parseInt(data.intervalDays, 10) || 30,
        description: data.description,
      });
      setMessage({ type: 'success', text: `${feeType} fee config saved successfully` });
      fetchConfigs();
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Failed to save') });
    } finally {
      setSaving(null);
    }
  };

  const handleGenerate = async (feeType) => {
    if (!window.confirm(`Generate ${feeType} bills for all eligible users?`)) {
      return;
    }

    setGenerating(feeType);
    try {
      const response = await api.post('/admin/generate-bills', { feeType });
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getApiErrorMessage(error, 'Failed to generate bills'),
      });
    } finally {
      setGenerating(null);
    }
  };

  const updateField = (feeType, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [feeType]: {
        ...currentFormData[feeType],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading fee configurations...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Fee Configuration"
        subtitle="Set amounts and intervals for maintenance and garbage fees managed by admin"
      />

      {message && (
        <div className={`alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="alert-close">
            &times;
          </button>
        </div>
      )}

      <div className="fee-grid">
        {FEE_TYPES.map((fee) => {
          const data = formData[fee.key] || { amount: '', intervalDays: 30, description: '' };
          const existingConfig = configs.find((config) => config.feeType === fee.key);

          return (
            <Card key={fee.key} className="fee-card">
              <div className="fee-header">
                <div className="fee-icon" style={{ background: `${fee.color}20`, color: fee.color }}>
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
                    onChange={(event) => updateField(fee.key, 'amount', event.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="input-group">
                  <label>Interval (Days)</label>
                  <input
                    type="number"
                    value={data.intervalDays}
                    onChange={(event) => updateField(fee.key, 'intervalDays', event.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={data.description}
                    onChange={(event) => updateField(fee.key, 'description', event.target.value)}
                    placeholder="Optional note"
                  />
                </div>
              </div>

              <div className="fee-actions">
                <Button onClick={() => handleSave(fee.key)} isLoading={saving === fee.key}>
                  <Settings size={14} />
                  Save Config
                </Button>
                {existingConfig && (
                  <Button
                    variant="secondary"
                    onClick={() => handleGenerate(fee.key)}
                    isLoading={generating === fee.key}
                  >
                    <Send size={14} />
                    Generate Bills
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
