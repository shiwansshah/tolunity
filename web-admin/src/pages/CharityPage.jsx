import React, { useEffect, useMemo, useState } from 'react';
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

const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

const CharityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showManualForm, setShowManualForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    donorName: '',
    amount: '',
    message: '',
  });

  const fetchCharity = async () => {
    try {
      const response = await api.get('/admin/charity');
      setData(response.data);
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to load charity data') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharity();
  }, []);

  const filteredDonations = useMemo(() => {
    const donations = Array.isArray(data?.donations) ? data.donations : [];
    return donations.filter((donation) => {
      const query = search.trim().toLowerCase();
      const source = (donation.entrySource || 'APP').toUpperCase();
      const createdAt = donation.createdAt ? new Date(donation.createdAt) : null;
      const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
      const sourceMatch = sourceFilter === 'ALL' || source === sourceFilter;
      const queryMatch =
        !query ||
        [donation.donorName, donation.message, source]
          .some((value) => value?.toLowerCase().includes(query));
      const fromMatch = !from || (createdAt && createdAt >= from);
      const toMatch = !to || (createdAt && createdAt <= to);
      return sourceMatch && queryMatch && fromMatch && toMatch;
    });
  }, [data, search, fromDate, toDate, sourceFilter]);

  const filteredStats = useMemo(
    () => ({
      totalFund: filteredDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0),
      totalDonations: filteredDonations.length,
      manualEntries: filteredDonations.filter(
        (donation) => (donation.entrySource || 'APP').toUpperCase() === 'MANUAL'
      ).length,
    }),
    [filteredDonations]
  );

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setSourceFilter('ALL');
  };

  const handleCreateManualEntry = async () => {
    const amount = Number(form.amount);
    if (!form.donorName.trim()) {
      setMessage({ tone: 'error', text: 'Donor name is required.' });
      return;
    }
    if (!amount || amount <= 0) {
      setMessage({ tone: 'error', text: 'Enter a valid donation amount.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/charity/manual', {
        donorName: form.donorName.trim(),
        amount,
        message: form.message.trim(),
      });
      setMessage({ tone: 'success', text: 'Manual charity entry recorded.' });
      setForm({ donorName: '', amount: '', message: '' });
      setShowManualForm(false);
      await fetchCharity();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to save manual entry') });
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const header = 'Donor,Source,Amount,Message,RecordedBy,CreatedAt';
    const lines = filteredDonations.map((donation) =>
      [
        `"${donation.donorName || ''}"`,
        (donation.entrySource || 'APP').toUpperCase(),
        donation.amount || 0,
        `"${donation.message || ''}"`,
        `"${donation.recordedByName || ''}"`,
        donation.createdAt ? format(new Date(donation.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `charity_${format(new Date(), 'yyyyMMdd')}.csv`,
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading charity data...</div>;
  }

  if (!data) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">No charity data available.</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Fund"
        title="Charity Fund"
        subtitle="Filter donation records, export the ledger, and record offline contributions."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCSV}>
              Export
            </Button>
            <Button onClick={() => setShowManualForm((current) => !current)}>
              {showManualForm ? 'Close Entry Form' : 'Add Manual Entry'}
            </Button>
          </div>
        }
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <div className="grid border-b border-slate-200 md:grid-cols-3">
        {[
          ['Filtered Fund', formatNPR(filteredStats.totalFund)],
          ['Donations In View', filteredStats.totalDonations],
          ['Manual Entries', filteredStats.manualEntries],
        ].map(([label, value], index, rows) => (
          <div
            key={label}
            className={
              index < rows.length - 1
                ? 'border-b border-slate-200 px-5 py-4 md:border-b-0 md:border-r'
                : 'px-5 py-4'
            }
          >
            <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
            <div className="mt-0.5 font-mono text-[13px] text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {showManualForm && (
        <section className="border-b border-slate-200 px-5 py-5">
          <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-500">Offline Donation</div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Donor Name">
              <input
                className={inputClass}
                value={form.donorName}
                onChange={(event) => setForm((current) => ({ ...current, donorName: event.target.value }))}
                placeholder="Community collection or donor name"
              />
            </Field>
            <Field label="Amount">
              <input
                className={inputClass}
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="500"
              />
            </Field>
            <Field label="Note" className="md:col-span-3">
              <textarea
                className={inputClass}
                rows="3"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Receipt note, campaign name, or collection details"
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setShowManualForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateManualEntry} isLoading={saving}>
              Save Entry
            </Button>
          </div>
        </section>
      )}

      <section className="border-b border-slate-200 px-5 py-5">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Search" className="md:col-span-2">
            <input
              className={inputClass}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search donor or note"
            />
          </Field>
          <Field label="From">
            <input className={inputClass} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </Field>
          <Field label="To">
            <input className={inputClass} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </Field>
          <Field label="Source">
            <select className={inputClass} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {['ALL', 'APP', 'MANUAL'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Button variant="secondary" onClick={clearFilters}>
            Reset Filters
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Donor</th>
              <th className={tableHeaderClass}>Source</th>
              <th className={tableHeaderClass}>Amount</th>
              <th className={tableHeaderClass}>Message</th>
              <th className={tableHeaderClass}>Recorded By</th>
              <th className={tableHeaderClass}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredDonations.map((donation) => (
              <tr key={donation.id}>
                <td className={tableCellClass}>{donation.donorName}</td>
                <td className={tableCellClass}>
                  <Badge variant={(donation.entrySource || 'APP').toUpperCase() === 'MANUAL' ? 'amber' : 'blue'}>
                    {(donation.entrySource || 'APP').toUpperCase()}
                  </Badge>
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{formatNPR(donation.amount)}</td>
                <td className={tableCellClass}>{donation.message || '-'}</td>
                <td className={tableCellClass}>{donation.recordedByName || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>
                  {donation.createdAt ? format(new Date(donation.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                </td>
              </tr>
            ))}
            {filteredDonations.length === 0 && (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No donations found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CharityPage;
