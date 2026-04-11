import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { Badge, Banner, Button, PageHeader, inputClass, tableCellClass, tableHeaderClass } from '../components/UI';

const FEE_TYPES = [
  { key: 'MAINTENANCE', label: 'Maintenance Fee' },
  { key: 'GARBAGE', label: 'Garbage Collection' },
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
      const rows = Array.isArray(response.data) ? response.data : [];
      setConfigs(rows);
      const nextFormData = {};
      rows.forEach((config) => {
        nextFormData[config.feeType] = {
          amount: config.amount,
          intervalDays: config.intervalDays,
          description: config.description || '',
        };
      });
      setFormData((current) => ({ ...current, ...nextFormData }));
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to fetch fee configurations') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const updateField = (feeType, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [feeType]: {
        ...currentFormData[feeType],
        [field]: value,
      },
    }));
  };

  const handleSave = async (feeType) => {
    const data = formData[feeType];
    if (!data?.amount || Number(data.amount) <= 0) {
      setMessage({ tone: 'error', text: 'Enter a valid amount before saving.' });
      return;
    }

    setSaving(feeType);
    try {
      await api.post('/admin/fee-config', {
        feeType,
        amount: Number(data.amount),
        intervalDays: Number(data.intervalDays) || 30,
        description: data.description || '',
      });
      setMessage({ tone: 'success', text: `${feeType} configuration saved.` });
      await fetchConfigs();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to save configuration') });
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
      setMessage({ tone: 'success', text: response.data.message || `${feeType} bills generated.` });
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to generate bills') });
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading fee configuration...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Billing"
        title="Fee Configuration"
        subtitle="Manage recurring community fee amounts, intervals, and bill generation."
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Fee Type</th>
              <th className={tableHeaderClass}>State</th>
              <th className={tableHeaderClass}>Amount (NPR)</th>
              <th className={tableHeaderClass}>Interval (Days)</th>
              <th className={tableHeaderClass}>Description</th>
              <th className={tableHeaderClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {FEE_TYPES.map((fee) => {
              const data = formData[fee.key] || { amount: '', intervalDays: 30, description: '' };
              const existingConfig = configs.find((config) => config.feeType === fee.key);

              return (
                <tr key={fee.key}>
                  <td className={tableCellClass}>{fee.label}</td>
                  <td className={tableCellClass}>
                    <Badge variant={existingConfig ? 'green' : 'slate'}>
                      {existingConfig ? 'CONFIGURED' : 'NOT_SET'}
                    </Badge>
                  </td>
                  <td className={tableCellClass}>
                    <input
                      className={inputClass}
                      type="number"
                      value={data.amount}
                      onChange={(event) => updateField(fee.key, 'amount', event.target.value)}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <input
                      className={inputClass}
                      type="number"
                      value={data.intervalDays}
                      onChange={(event) => updateField(fee.key, 'intervalDays', event.target.value)}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <input
                      className={inputClass}
                      value={data.description}
                      onChange={(event) => updateField(fee.key, 'description', event.target.value)}
                      placeholder="Optional note"
                    />
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleSave(fee.key)} isLoading={saving === fee.key}>
                        Save
                      </Button>
                      {existingConfig && (
                        <Button
                          variant="secondary"
                          onClick={() => handleGenerate(fee.key)}
                          isLoading={generating === fee.key}
                        >
                          Generate Bills
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeConfigPage;
