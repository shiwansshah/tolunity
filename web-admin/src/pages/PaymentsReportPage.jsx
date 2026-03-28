import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock3, Landmark, RefreshCcw } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './PaymentsReportPage.css';

const STATUS_COLORS = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
};

const CATEGORY_COLORS = {
  MAINTENANCE: 'warning',
  GARBAGE: 'success',
  RENT: 'primary',
};

const PAYMENT_METHOD_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ESEWA', label: 'eSewa' },
  { value: 'KHALTI', label: 'Khalti' },
];
const PAGE_SIZE_OPTIONS = [4, 6, 10];

const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;
const formatDateTime = (value) => (value ? format(new Date(value), 'MMM dd, yyyy hh:mm a') : 'N/A');
const formatDate = (value) => (value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A');
const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDrafts = (rows) => rows.reduce((acc, payment) => {
  acc[payment.id] = {
    status: payment.status || 'Pending',
    gatewayProvider: payment.gatewayProvider || '',
    gatewayStatus: payment.gatewayStatus || '',
    gatewayReferenceId: payment.gatewayReferenceId || '',
    transactionNote: payment.transactionNote || '',
    paidDate: toDateInputValue(payment.paidDate),
  };
  return acc;
}, {});

const PaymentsReportPage = () => {
  const [payments, setPayments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [activePaymentId, setActivePaymentId] = useState(null);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      const rows = Array.isArray(response.data) ? response.data : [];
      const sorted = rows.sort((left, right) => {
        const leftDate = new Date(left.statusUpdatedAt || left.paidDate || left.dueDate || 0).getTime();
        const rightDate = new Date(right.statusUpdatedAt || right.paidDate || right.dueDate || 0).getTime();
        return rightDate - leftDate;
      });
      setPayments(sorted);
      setDrafts(buildDrafts(sorted));
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Failed to load transaction report') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const normalizedSearch = search.trim().toLowerCase();
    const statusMatch = statusFilter === 'ALL' || payment.status?.toUpperCase() === statusFilter;
    const categoryMatch = categoryFilter === 'ALL' || payment.category?.toUpperCase() === categoryFilter;
    const providerValue = payment.gatewayProvider?.toUpperCase() || 'UNSET';
    const providerMatch = providerFilter === 'ALL'
      || (providerFilter === 'UNSET' ? !payment.gatewayProvider : providerValue === providerFilter);
    const searchMatch = !normalizedSearch || [
      payment.title,
      payment.category,
      payment.payerName,
      payment.payeeName,
      payment.gatewayStatus,
      payment.gatewayReferenceId,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));

    return statusMatch && categoryMatch && providerMatch && searchMatch;
  }), [payments, search, statusFilter, categoryFilter, providerFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, providerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, pageSize, safeCurrentPage]);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const stats = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'Paid');
    const pending = payments.filter((payment) => payment.status === 'Pending');
    const overdue = payments.filter((payment) => payment.status === 'Overdue');

    return {
      total: payments.length,
      paidAmount: paid.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }, [payments]);

  const activePayment = useMemo(
    () => payments.find((payment) => payment.id === activePaymentId) || null,
    [payments, activePaymentId]
  );
  const activeDraft = activePayment ? drafts[activePayment.id] || {} : {};

  useEffect(() => {
    if (!activePayment) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activePayment]);

  const updateDraft = (paymentId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [paymentId]: {
        ...current[paymentId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (paymentId) => {
    setSavingId(paymentId);
    setMessage(null);

    try {
      const draft = drafts[paymentId];
      const payload = {
        ...draft,
        paidDate: draft.paidDate || null,
      };
      const response = await api.put(`/admin/payments/${paymentId}/transaction`, payload);
      const updatedPayment = response.data;

      setPayments((current) => current.map((payment) => (
        payment.id === paymentId ? updatedPayment : payment
      )));
      setDrafts((current) => ({
        ...current,
        [paymentId]: {
          status: updatedPayment.status || 'Pending',
          gatewayProvider: updatedPayment.gatewayProvider || '',
          gatewayStatus: updatedPayment.gatewayStatus || '',
          gatewayReferenceId: updatedPayment.gatewayReferenceId || '',
          transactionNote: updatedPayment.transactionNote || '',
          paidDate: toDateInputValue(updatedPayment.paidDate),
        },
      }));
      setMessage({ type: 'success', text: `Transaction #${paymentId} updated.` });
      setActivePaymentId(null);
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Failed to update transaction') });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading transaction center...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Transaction Center"
        subtitle="Review gateway verification states, track manual collections, and reconcile maintenance or garbage payments."
        action={(
          <Button variant="secondary" onClick={fetchPayments}>
            <RefreshCcw size={14} />
            Refresh
          </Button>
        )}
      />

      {message && (
        <div className={`alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="alert-close">
            &times;
          </button>
        </div>
      )}

      <div className="transaction-stat-grid">
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-primary">
            <Landmark size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Tracked Transactions</p>
            <h3 className="transaction-stat-value">{stats.total}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-success">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Paid Volume</p>
            <h3 className="transaction-stat-value">{formatNPR(stats.paidAmount)}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-warning">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Pending</p>
            <h3 className="transaction-stat-value">{stats.pendingCount}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-danger">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Overdue</p>
            <h3 className="transaction-stat-value">{stats.overdueCount}</h3>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="transaction-filter-bar">
          <div className="transaction-search">
            <label htmlFor="transaction-search">Search</label>
            <input
              id="transaction-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by resident, bill, or reference id"
            />
          </div>
          <div className="transaction-filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="transaction-filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {['ALL', 'MAINTENANCE', 'GARBAGE', 'RENT'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="transaction-filter-group">
            <label>Method</label>
            <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              {['ALL', 'UNSET', 'MANUAL', 'CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {filteredPayments.length > 0 && (
        <Card className="mb-6 transaction-pagination-card">
          <div className="transaction-pagination-bar">
            <div className="transaction-pagination-summary">
              Showing {(safeCurrentPage - 1) * pageSize + 1}-
              {Math.min(safeCurrentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} transactions
            </div>
            <div className="transaction-pagination-controls">
              <label className="transaction-page-size">
                Rows per page
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>
                Previous
              </Button>
              <div className="transaction-page-indicator">
                Page {safeCurrentPage} of {totalPages}
              </div>
              <Button variant="secondary" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="transaction-report-list">
        {paginatedPayments.map((payment) => {
          const readOnly = !payment.adminManaged;

          return (
            <Card key={payment.id} className="transaction-report-card">
              <div className="transaction-report-grid transaction-report-grid-compact">
                <div>
                  <div className="transaction-card-header">
                    <div>
                      <h3 className="transaction-card-title">{payment.title}</h3>
                      <p className="transaction-card-subtitle">
                        {payment.payerName || 'Unassigned payer'} to {payment.payeeName || 'System collector'}
                      </p>
                    </div>
                    <div className="transaction-card-badges">
                      <Badge variant={CATEGORY_COLORS[payment.category?.toUpperCase()] || 'gray'}>
                        {payment.category}
                      </Badge>
                      <Badge variant={STATUS_COLORS[payment.status?.toUpperCase()] || 'gray'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="transaction-meta-grid">
                    <div className="transaction-meta-block">
                      <span className="transaction-meta-label">Amount</span>
                      <strong>{formatNPR(payment.amount)}</strong>
                    </div>
                    <div className="transaction-meta-block">
                      <span className="transaction-meta-label">Due date</span>
                      <strong>{formatDate(payment.dueDate)}</strong>
                    </div>
                    <div className="transaction-meta-block">
                      <span className="transaction-meta-label">Paid date</span>
                      <strong>{formatDate(payment.paidDate)}</strong>
                    </div>
                    <div className="transaction-meta-block">
                      <span className="transaction-meta-label">Last status update</span>
                      <strong>{formatDateTime(payment.statusUpdatedAt)}</strong>
                    </div>
                  </div>

                  <div className="transaction-ledger-box">
                    <div className="transaction-ledger-row">
                      <span>Method</span>
                      <strong>{payment.gatewayProvider || 'Not recorded'}</strong>
                    </div>
                    <div className="transaction-ledger-row">
                      <span>Gateway status</span>
                      <strong>{payment.gatewayStatus || 'Not recorded'}</strong>
                    </div>
                    <div className="transaction-ledger-row">
                      <span>Reference id</span>
                      <strong>{payment.gatewayReferenceId || 'Not recorded'}</strong>
                    </div>
                    <div className="transaction-ledger-row">
                      <span>Updated by</span>
                      <strong>{payment.statusUpdatedByName || 'System / Gateway'}</strong>
                    </div>
                  </div>

                  {payment.transactionNote && (
                    <div className="transaction-note-box">
                      <span className="transaction-meta-label">Transaction note</span>
                      <p>{payment.transactionNote}</p>
                    </div>
                  )}
                </div>
                <div className="transaction-action-panel">
                  <div className="transaction-editor-header">
                    <h4>{readOnly ? 'View transaction' : 'Reconcile transaction'}</h4>
                    <p>{readOnly ? 'Open the record to inspect details.' : 'Open the dialog to update manual or failed verification details.'}</p>
                  </div>
                  <Button onClick={() => setActivePaymentId(payment.id)}>
                    {readOnly ? 'Open Details' : 'Open Action'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredPayments.length === 0 && (
          <Card>
            <div className="text-center py-8 text-muted">No transactions match the current filters.</div>
          </Card>
        )}
      </div>

      {activePayment && createPortal((
        <div className="transaction-modal-overlay" onClick={() => setActivePaymentId(null)}>
          <div className="transaction-modal" onClick={(event) => event.stopPropagation()}>
            <div className="transaction-modal-header">
              <div>
                <p className="transaction-meta-label">Transaction Record</p>
                <h3 className="transaction-card-title">{activePayment.title}</h3>
                <p className="transaction-card-subtitle">
                  {activePayment.payerName || 'Unassigned payer'} to {activePayment.payeeName || 'System collector'}
                </p>
              </div>
              <button className="transaction-modal-close" onClick={() => setActivePaymentId(null)}>
                &times;
              </button>
            </div>

            <div className="transaction-modal-body">
              <div className="transaction-ledger-box">
                <div className="transaction-ledger-row">
                  <span>Category</span>
                  <strong>{activePayment.category}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Status</span>
                  <strong>{activePayment.status}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Amount</span>
                  <strong>{formatNPR(activePayment.amount)}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Due date</span>
                  <strong>{formatDate(activePayment.dueDate)}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Paid date</span>
                  <strong>{formatDate(activePayment.paidDate)}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Method</span>
                  <strong>{activePayment.gatewayProvider || 'Not recorded'}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Gateway status</span>
                  <strong>{activePayment.gatewayStatus || 'Not recorded'}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Reference id</span>
                  <strong>{activePayment.gatewayReferenceId || 'Not recorded'}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Updated by</span>
                  <strong>{activePayment.statusUpdatedByName || 'System / Gateway'}</strong>
                </div>
              </div>

              {!activePayment.adminManaged ? (
                <div className="transaction-readonly-box">
                  Rent transactions are visible for reporting, but only maintenance and garbage fees can be updated from admin.
                </div>
              ) : (
                <div className="transaction-editor transaction-editor-modal">
                  <div className="transaction-editor-header">
                    <h4>Reconcile transaction</h4>
                    <p>Use this for manual collection entries or failed verification follow-up.</p>
                  </div>

                  <div className="transaction-editor-form">
                    <label>
                      Status
                      <select
                        value={activeDraft.status || 'Pending'}
                        onChange={(event) => updateDraft(activePayment.id, 'status', event.target.value)}
                      >
                        {['Pending', 'Paid', 'Overdue'].map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Collection method
                      <select
                        value={activeDraft.gatewayProvider || ''}
                        onChange={(event) => updateDraft(activePayment.id, 'gatewayProvider', event.target.value)}
                      >
                        <option value="">Keep current</option>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Transaction status
                      <input
                        type="text"
                        value={activeDraft.gatewayStatus || ''}
                        onChange={(event) => updateDraft(activePayment.id, 'gatewayStatus', event.target.value)}
                        placeholder="MANUALLY_CONFIRMED or VERIFICATION_FAILED"
                      />
                    </label>

                    <label>
                      Reference id
                      <input
                        type="text"
                        value={activeDraft.gatewayReferenceId || ''}
                        onChange={(event) => updateDraft(activePayment.id, 'gatewayReferenceId', event.target.value)}
                        placeholder="Bank voucher, receipt no, or manual ref"
                      />
                    </label>

                    <label>
                      Paid date
                      <input
                        type="date"
                        value={activeDraft.paidDate || ''}
                        onChange={(event) => updateDraft(activePayment.id, 'paidDate', event.target.value)}
                      />
                    </label>

                    <label>
                      Internal note
                      <textarea
                        rows="4"
                        value={activeDraft.transactionNote || ''}
                        onChange={(event) => updateDraft(activePayment.id, 'transactionNote', event.target.value)}
                        placeholder="Explain manual collection, gateway failure follow-up, or supporting details"
                      />
                    </label>

                    <div className="transaction-modal-actions">
                      <Button variant="secondary" onClick={() => setActivePaymentId(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleSave(activePayment.id)} isLoading={savingId === activePayment.id}>
                        Save Transaction
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default PaymentsReportPage;
