import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { CalendarRange, HandCoins, Heart, Search, Wallet } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './CharityPage.css';

const SOURCE_VARIANTS = {
  APP: 'primary',
  MANUAL: 'warning',
};

const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

const CharityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [form, setForm] = useState({
    donorName: '',
    amount: '',
    message: '',
  });

  const fetchCharity = async () => {
    try {
      const response = await api.get('/admin/charity');
      setData(response.data);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load charity data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharity();
  }, []);

  useEffect(() => {
    if (!isManualOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isManualOpen]);

  const filteredDonations = useMemo(() => {
    const donations = Array.isArray(data?.donations) ? data.donations : [];
    return donations.filter((donation) => {
    const searchValue = search.trim().toLowerCase();
    const source = (donation.entrySource || 'APP').toUpperCase();
    const createdAt = donation.createdAt ? new Date(donation.createdAt) : null;
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const sourceMatch = sourceFilter === 'ALL' || source === sourceFilter;
    const searchMatch = !searchValue || [
      donation.donorName,
      donation.message,
      source,
    ].some((value) => value?.toLowerCase().includes(searchValue));
    const fromMatch = !from || (createdAt && createdAt >= from);
    const toMatch = !to || (createdAt && createdAt <= to);

    return sourceMatch && searchMatch && fromMatch && toMatch;
    });
  }, [data, search, fromDate, toDate, sourceFilter]);

  const filteredStats = useMemo(() => ({
    totalFund: filteredDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0),
    totalDonations: filteredDonations.length,
    manualEntries: filteredDonations.filter((donation) => (donation.entrySource || 'APP').toUpperCase() === 'MANUAL').length,
  }), [filteredDonations]);

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setSourceFilter('ALL');
  };

  const handleCreateManualEntry = async () => {
    const amount = Number(form.amount);
    if (!form.donorName.trim()) {
      setBanner({ type: 'error', text: 'Donor name is required.' });
      return;
    }
    if (!amount || amount <= 0) {
      setBanner({ type: 'error', text: 'Enter a valid donation amount.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/charity/manual', {
        donorName: form.donorName.trim(),
        amount,
        message: form.message.trim(),
      });
      setBanner({ type: 'success', text: 'Manual charity entry recorded.' });
      setForm({ donorName: '', amount: '', message: '' });
      setIsManualOpen(false);
      await fetchCharity();
    } catch (requestError) {
      setBanner({ type: 'error', text: getApiErrorMessage(requestError, 'Failed to save manual entry') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading charity data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-danger">Failed to load charity data</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Community Charity Fund"
        subtitle="Track donations, review contribution periods, and record offline charity entries from one place."
        action={(
          <Button onClick={() => setIsManualOpen(true)}>
            <HandCoins size={14} />
            Add Manual Entry
          </Button>
        )}
      />

      {banner && (
        <div className={`alert-banner ${banner.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {banner.text}
          <button onClick={() => setBanner(null)} className="alert-close">
            &times;
          </button>
        </div>
      )}

      {error && <div className="alert-banner alert-error">{error}</div>}

      <div className="charity-hero-grid">
        <Card className="charity-hero-card charity-hero-primary">
          <div className="charity-hero-icon">
            <Heart size={24} />
          </div>
          <div>
            <p className="charity-kpi-label">Filtered Fund Total</p>
            <h2 className="charity-kpi-value">{formatNPR(filteredStats.totalFund)}</h2>
            <p className="charity-kpi-meta">Overall lifetime fund: {formatNPR(data.totalFund)}</p>
          </div>
        </Card>

        <Card className="charity-hero-card">
          <div className="charity-hero-icon charity-hero-icon-soft">
            <Wallet size={22} />
          </div>
          <div>
            <p className="charity-kpi-label">Donations In View</p>
            <h2 className="charity-kpi-value charity-kpi-value-dark">{filteredStats.totalDonations}</h2>
            <p className="charity-kpi-meta">All recorded donations: {data.totalDonations}</p>
          </div>
        </Card>

        <Card className="charity-hero-card">
          <div className="charity-hero-icon charity-hero-icon-gold">
            <CalendarRange size={22} />
          </div>
          <div>
            <p className="charity-kpi-label">Manual Entries</p>
            <h2 className="charity-kpi-value charity-kpi-value-dark">{filteredStats.manualEntries}</h2>
            <p className="charity-kpi-meta">Offline collections recorded by admin</p>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="charity-filter-bar">
          <div className="charity-search">
            <label htmlFor="charity-search">Search</label>
            <div className="charity-search-input-wrap">
              <Search size={16} className="charity-search-icon" />
              <input
                id="charity-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search donor or note"
              />
            </div>
          </div>
          <div className="charity-filter-group">
            <label>From</label>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="charity-filter-group">
            <label>To</label>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="charity-filter-group">
            <label>Source</label>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {['ALL', 'APP', 'MANUAL'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="charity-filter-actions">
            <Button variant="secondary" onClick={clearFilters}>Reset Filters</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="charity-ledger-header">
          <div>
            <h3 className="section-title">Donation Ledger</h3>
            <p className="text-muted mt-1">Showing {filteredDonations.length} donation records.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id}>
                  <td>
                    <div className="font-bold">{donation.donorName}</div>
                    {(donation.entrySource || 'APP').toUpperCase() === 'MANUAL' && donation.recordedByName && (
                      <div className="text-sm text-muted mt-1">
                        Recorded by {donation.recordedByName}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={SOURCE_VARIANTS[(donation.entrySource || 'APP').toUpperCase()] || 'gray'}>
                      {(donation.entrySource || 'APP').toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant="success">{formatNPR(donation.amount)}</Badge>
                  </td>
                  <td className="text-muted">{donation.message || '-'}</td>
                  <td className="text-sm">
                    {donation.createdAt ? format(new Date(donation.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">
                    No donations found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isManualOpen && createPortal((
        <div className="charity-modal-overlay" onClick={() => setIsManualOpen(false)}>
          <div className="charity-modal" onClick={(event) => event.stopPropagation()}>
            <div className="charity-modal-header">
              <div>
                <p className="charity-kpi-label">Offline Donation</p>
                <h3 className="charity-modal-title">Add Manual Charity Entry</h3>
              </div>
              <button className="charity-modal-close" onClick={() => setIsManualOpen(false)}>
                &times;
              </button>
            </div>
            <div className="charity-modal-body">
              <label>
                Donor name
                <input
                  type="text"
                  value={form.donorName}
                  onChange={(event) => setForm((current) => ({ ...current, donorName: event.target.value }))}
                  placeholder="Community collection, donor, or sponsor name"
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="500"
                />
              </label>
              <label>
                Note
                <textarea
                  rows="4"
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Receipt note, campaign name, or collection details"
                />
              </label>
              <div className="charity-modal-actions">
                <Button variant="secondary" onClick={() => setIsManualOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateManualEntry} isLoading={saving}>
                  Save Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default CharityPage;
