import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge } from '../components/UI';
import api from '../services/api';
import { Heart, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import './CharityPage.css';

const CharityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharity = async () => {
      try {
        const res = await api.get('/admin/charity');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load charity data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharity();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted">Loading charity data...</div>;
  if (!data) return <div className="p-8 text-danger">Failed to load charity data</div>;

  const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fade-in">
      <PageHeader
        title="Community Charity Fund"
        subtitle="Track all donations made by community members"
      />

      <div className="charity-summary">
        <Card className="charity-total-card">
          <div className="charity-icon">
            <Heart size={32} color="white" />
          </div>
          <div>
            <p className="text-muted text-sm uppercase">Total Fund Raised</p>
            <h2 className="charity-amount">{formatNPR(data.totalFund)}</h2>
          </div>
        </Card>

        <Card className="charity-count-card">
          <div className="charity-icon-alt">
            <DollarSign size={28} color="var(--primary)" />
          </div>
          <div>
            <p className="text-muted text-sm uppercase">Total Donations</p>
            <h2 className="charity-number">{data.totalDonations}</h2>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="section-title mb-6">Donation Ledger</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Amount</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.donations && data.donations.map(d => (
                <tr key={d.id}>
                  <td className="font-bold">{d.donorName}</td>
                  <td><Badge variant="success">{formatNPR(d.amount)}</Badge></td>
                  <td className="text-muted">{d.message || '—'}</td>
                  <td className="text-sm">{d.createdAt ? format(new Date(d.createdAt), 'MMM dd, yyyy') : 'N/A'}</td>
                </tr>
              ))}
              {(!data.donations || data.donations.length === 0) && (
                <tr><td colSpan="4" className="text-center py-8 text-muted">No donations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CharityPage;
