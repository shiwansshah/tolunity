import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PageHeader, Card, Badge } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';

const STATUS_COLORS = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
};

const CATEGORY_COLORS = {
  MAINTENANCE: 'warning',
  GARBAGE: 'success',
};

const PaymentsReportPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/admin/payments');
        const sorted = response.data.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        setPayments(sorted);
      } catch (error) {
        console.error(getApiErrorMessage(error, 'Failed to load payments'));
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const statusMatch =
      statusFilter === 'ALL' || payment.status?.toUpperCase() === statusFilter;
    const categoryMatch =
      categoryFilter === 'ALL' || payment.category?.toUpperCase() === categoryFilter;

    return statusMatch && categoryMatch;
  });

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading payments log...</div>;
  }

  const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fade-in">
      <PageHeader
        title="Community Payment Reports"
        subtitle="Ledger of maintenance and garbage bills managed by admin"
      />

      <Card className="mb-6">
        <div className="filter-section">
          <div>
            <p className="text-muted text-sm mb-2 font-bold">Status</p>
            <div className="flex gap-2">
              {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setStatusFilter(filterValue)}
                  className={`premium-btn ${statusFilter === filterValue ? '' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                >
                  {filterValue}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted text-sm mb-2 font-bold">Category</p>
            <div className="flex gap-2">
              {['ALL', 'MAINTENANCE', 'GARBAGE'].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setCategoryFilter(filterValue)}
                  className={`premium-btn ${categoryFilter === filterValue ? '' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                >
                  {filterValue}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill / Category</th>
                <th>Payee (Collector)</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="font-bold">{payment.title}</div>
                    <div className="text-sm mt-1">
                      <Badge variant={CATEGORY_COLORS[payment.category?.toUpperCase()] || 'gray'}>
                        {payment.category}
                      </Badge>
                    </div>
                  </td>
                  <td>{payment.payeeName || <span className="text-muted">ID: {payment.payeeId}</span>}</td>
                  <td>{payment.payerName || <span className="text-muted">Unassigned</span>}</td>
                  <td className="font-bold">{formatNPR(payment.amount)}</td>
                  <td className="text-sm">
                    {payment.dueDate ? format(new Date(payment.dueDate), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td>
                    <Badge variant={STATUS_COLORS[payment.status?.toUpperCase()] || 'gray'}>
                      {payment.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">
                    No payments found for this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PaymentsReportPage;
