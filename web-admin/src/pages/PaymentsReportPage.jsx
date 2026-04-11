import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import {
  Badge,
  Banner,
  Button,
  Field,
  PageHeader,
  ToolbarIconButton,
  inputClass,
  tableCellClass,
  tableHeaderClass,
} from '../components/UI';

const STATUS_BADGE = {
  PAID: 'green',
  PENDING: 'amber',
  OVERDUE: 'red',
};

const PAYMENT_METHODS = ['MANUAL', 'CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI'];
const PAGE_SIZES = [10, 20, 50];

const fmtNPR = (value) => `NPR ${(value || 0).toLocaleString('en-IN')}`;
const fmtDate = (value) => (value ? format(new Date(value), 'yyyy-MM-dd') : '-');
const fmtDateTime = (value) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '-');
const toInputDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const buildDrafts = (rows) =>
  rows.reduce((accumulator, payment) => {
    accumulator[payment.id] = {
      status: payment.status || 'Pending',
      gatewayProvider: payment.gatewayProvider || '',
      gatewayStatus: payment.gatewayStatus || '',
      gatewayReferenceId: payment.gatewayReferenceId || '',
      transactionNote: payment.transactionNote || '',
      paidDate: toInputDate(payment.paidDate),
    };
    return accumulator;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeId, setActiveId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    try {
      const response = await api.get('/admin/payments');
      const rows = Array.isArray(response.data) ? response.data : [];
      const sorted = rows.sort((a, b) => {
        const first = new Date(a.statusUpdatedAt || a.paidDate || a.dueDate || 0).getTime();
        const second = new Date(b.statusUpdatedAt || b.paidDate || b.dueDate || 0).getTime();
        return second - first;
      });
      setPayments(sorted);
      setDrafts(buildDrafts(sorted));
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to load payments') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const query = search.trim().toLowerCase();
        const statusMatch = statusFilter === 'ALL' || payment.status?.toUpperCase() === statusFilter;
        const categoryMatch =
          categoryFilter === 'ALL' || payment.category?.toUpperCase() === categoryFilter;
        const providerValue = payment.gatewayProvider?.toUpperCase() || 'UNSET';
        const providerMatch =
          providerFilter === 'ALL' ||
          (providerFilter === 'UNSET' ? !payment.gatewayProvider : providerValue === providerFilter);
        const queryMatch =
          !query ||
          [payment.title, payment.category, payment.payerName, payment.payeeName, payment.gatewayReferenceId]
            .some((value) => value?.toLowerCase().includes(query));

        return statusMatch && categoryMatch && providerMatch && queryMatch;
      }),
    [payments, search, statusFilter, categoryFilter, providerFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, providerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(
    () => filteredPayments.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredPayments, pageSize, safePage]
  );

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const stats = useMemo(() => {
    const paidRows = payments.filter((payment) => payment.status === 'Paid');
    return {
      total: payments.length,
      volume: paidRows.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      pending: payments.filter((payment) => payment.status === 'Pending').length,
      overdue: payments.filter((payment) => payment.status === 'Overdue').length,
    };
  }, [payments]);

  const activePayment = useMemo(
    () => payments.find((payment) => payment.id === activeId) || null,
    [payments, activeId]
  );

  const activeDraft = activePayment ? drafts[activePayment.id] || {} : {};

  const setDraft = (id, field, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        [field]: value,
      },
    }));
  };

  const save = async (id) => {
    setSavingId(id);
    try {
      const draft = drafts[id];
      const response = await api.put(`/admin/payments/${id}/transaction`, {
        ...draft,
        paidDate: draft.paidDate || null,
      });
      const updated = response.data;
      setPayments((currentPayments) =>
        currentPayments.map((payment) => (payment.id === id ? updated : payment))
      );
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [id]: {
          status: updated.status || 'Pending',
          gatewayProvider: updated.gatewayProvider || '',
          gatewayStatus: updated.gatewayStatus || '',
          gatewayReferenceId: updated.gatewayReferenceId || '',
          transactionNote: updated.transactionNote || '',
          paidDate: toInputDate(updated.paidDate),
        },
      }));
      setMessage({ tone: 'success', text: `Transaction #${id} updated.` });
      setActiveId(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to update transaction') });
    } finally {
      setSavingId(null);
    }
  };

  const exportCSV = () => {
    const header = 'ID,Title,Payer,Category,Amount,Status,Due,Paid,Method,Reference';
    const lines = filteredPayments.map((payment) =>
      [
        payment.id,
        `"${payment.title || ''}"`,
        `"${payment.payerName || ''}"`,
        payment.category || '',
        payment.amount || 0,
        payment.status || '',
        fmtDate(payment.dueDate),
        fmtDate(payment.paidDate),
        payment.gatewayProvider || '',
        payment.gatewayReferenceId || '',
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `payments_${format(new Date(), 'yyyyMMdd')}.csv`,
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading transaction data...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Reports"
        title="Community Payments"
        subtitle="Review transaction volume, export the ledger, and update admin-managed payment records."
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <div className="grid border-b border-slate-200 md:grid-cols-4">
        {[
          ['Transactions', stats.total],
          ['Paid Volume', fmtNPR(stats.volume)],
          ['Pending', stats.pending],
          ['Overdue', stats.overdue],
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

      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="w-full max-w-xs">
          <input
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, payer, payee, or reference"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ToolbarIconButton title="Filter" onClick={() => setShowFilters((current) => !current)} active={showFilters}>
            <Filter className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Export" onClick={exportCSV}>
            <Download className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Refresh" onClick={load}>
            <RefreshCw className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-end">
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Status</div>
            <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Category</div>
            <select className={inputClass} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="GARBAGE">GARBAGE</option>
              <option value="RENT">RENT</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Method</div>
            <select className={inputClass} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="UNSET">UNSET</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>ID</th>
              <th className={tableHeaderClass}>Title</th>
              <th className={tableHeaderClass}>Payer</th>
              <th className={tableHeaderClass}>Category</th>
              <th className={tableHeaderClass}>Amount</th>
              <th className={tableHeaderClass}>Status</th>
              <th className={tableHeaderClass}>Due</th>
              <th className={tableHeaderClass}>Paid</th>
              <th className={tableHeaderClass}>Method</th>
              <th className={tableHeaderClass}>Reference</th>
              <th className={tableHeaderClass}>Updated</th>
              <th className={tableHeaderClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((payment) => (
              <tr key={payment.id}>
                <td className={`${tableCellClass} font-mono text-[12px]`}>#{payment.id}</td>
                <td className={tableCellClass}>{payment.title}</td>
                <td className={tableCellClass}>{payment.payerName || '-'}</td>
                <td className={tableCellClass}>
                  <Badge variant={payment.category?.toUpperCase() === 'RENT' ? 'blue' : 'slate'}>
                    {payment.category || '-'}
                  </Badge>
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtNPR(payment.amount)}</td>
                <td className={tableCellClass}>
                  <Badge variant={STATUS_BADGE[payment.status?.toUpperCase()] || 'slate'}>
                    {payment.status || 'UNKNOWN'}
                  </Badge>
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDate(payment.dueDate)}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDate(payment.paidDate)}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{payment.gatewayProvider || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{payment.gatewayReferenceId || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDateTime(payment.statusUpdatedAt)}</td>
                <td className={tableCellClass}>
                  <Button variant="secondary" onClick={() => setActiveId(payment.id)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan="12" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No transactions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredPayments.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 text-[13px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[12px]">
            {filteredPayments.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredPayments.length)} of {filteredPayments.length}
          </div>
          <div className="flex items-center gap-2">
            <select className="w-auto" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="font-mono text-[12px] text-slate-700">
              {safePage} / {totalPages}
            </div>
            <Button
              variant="secondary"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {activePayment && (
        <section className="border-b border-slate-200">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Update Transaction</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">{activePayment.title}</div>
              <div className="mt-1 font-mono text-[12px] text-slate-500">
                #{activePayment.id} {activePayment.payerName || 'Unassigned'} to {activePayment.payeeName || 'System'}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setActiveId(null)}>
              Close
            </Button>
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={tableHeaderClass}>Field</th>
                    <th className={tableHeaderClass}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Category', activePayment.category || '-'],
                    ['Status', activePayment.status || '-'],
                    ['Amount', fmtNPR(activePayment.amount)],
                    ['Due Date', fmtDate(activePayment.dueDate)],
                    ['Paid Date', fmtDate(activePayment.paidDate)],
                    ['Method', activePayment.gatewayProvider || '-'],
                    ['Gateway Status', activePayment.gatewayStatus || '-'],
                    ['Reference', activePayment.gatewayReferenceId || '-'],
                    ['Updated By', activePayment.statusUpdatedByName || 'System'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className={tableCellClass}>{label}</td>
                      <td className={`${tableCellClass} font-mono text-[12px]`}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activePayment.adminManaged ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={activeDraft.status || 'Pending'}
                    onChange={(event) => setDraft(activePayment.id, 'status', event.target.value)}
                  >
                    {['Pending', 'Paid', 'Overdue'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Collection Method">
                  <select
                    className={inputClass}
                    value={activeDraft.gatewayProvider || ''}
                    onChange={(event) => setDraft(activePayment.id, 'gatewayProvider', event.target.value)}
                  >
                    <option value="">Keep current</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Transaction Status">
                  <input
                    className={inputClass}
                    value={activeDraft.gatewayStatus || ''}
                    onChange={(event) => setDraft(activePayment.id, 'gatewayStatus', event.target.value)}
                    placeholder="MANUALLY_CONFIRMED"
                  />
                </Field>

                <Field label="Reference ID">
                  <input
                    className={inputClass}
                    value={activeDraft.gatewayReferenceId || ''}
                    onChange={(event) => setDraft(activePayment.id, 'gatewayReferenceId', event.target.value)}
                    placeholder="Voucher or receipt"
                  />
                </Field>

                <Field label="Paid Date">
                  <input
                    className={inputClass}
                    type="date"
                    value={activeDraft.paidDate || ''}
                    onChange={(event) => setDraft(activePayment.id, 'paidDate', event.target.value)}
                  />
                </Field>

                <Field label="Internal Note" className="md:col-span-2">
                  <textarea
                    className={inputClass}
                    rows="3"
                    value={activeDraft.transactionNote || ''}
                    onChange={(event) => setDraft(activePayment.id, 'transactionNote', event.target.value)}
                    placeholder="Collection notes"
                  />
                </Field>

                <div className="flex gap-2 md:col-span-2">
                  <Button variant="secondary" onClick={() => setActiveId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => save(activePayment.id)} isLoading={savingId === activePayment.id}>
                    Save Update
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-slate-500">
                Rent transactions are read-only. Only maintenance and garbage fees can be updated by admin.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default PaymentsReportPage;
