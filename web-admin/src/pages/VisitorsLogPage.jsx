import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { QrCode, RefreshCcw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './PaymentsReportPage.css';
import './VisitorsLogPage.css';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const formatDateTime = (value) => (value ? format(new Date(value), 'MMM dd, yyyy hh:mm a') : 'N/A');
const normalizeStatusLabel = (value) => {
  if (value === 'VISITED') return 'Visited';
  if (value === 'EXPIRED') return 'Expired';
  if (value === 'UPCOMING') return 'Upcoming';
  return 'Active';
};

const statusBadgeVariant = (value) => {
  if (value === 'VISITED') return 'success';
  if (value === 'EXPIRED') return 'danger';
  if (value === 'UPCOMING') return 'warning';
  return 'primary';
};

export default function VisitorsLogPage() {
  const [rows, setRows] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [createdById, setCreatedById] = useState('ALL');
  const [visitStatus, setVisitStatus] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({
    totalElements: 0,
    totalPages: 1,
  });

  const fetchVisitors = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/visitors', {
        params: {
          page: currentPage - 1,
          size: pageSize,
          createdById: createdById === 'ALL' ? undefined : Number(createdById),
          visitStatus: visitStatus === 'ALL' ? undefined : visitStatus,
          search: search.trim() || undefined,
        },
      });

      const data = response.data || {};
      setRows(Array.isArray(data.content) ? data.content : []);
      setCreators(Array.isArray(data.creators) ? data.creators : []);
      setPageMeta({
        totalElements: Number(data.totalElements || 0),
        totalPages: Math.max(1, Number(data.totalPages || 1)),
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load visitors log'));
    } finally {
      setLoading(false);
    }
  }, [createdById, currentPage, pageSize, search, visitStatus]);

  useEffect(() => {
    fetchVisitors({ showLoader: true });
  }, [fetchVisitors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, createdById, visitStatus, pageSize]);

  const totalPages = Math.max(1, pageMeta.totalPages);
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const summary = useMemo(() => {
    const visitedCount = rows.filter((row) => row.visitStatus === 'VISITED').length;
    const notVisitedCount = rows.length - visitedCount;
    const expiredCount = rows.filter((row) => row.lifecycleStatus === 'EXPIRED').length;

    return {
      tracked: pageMeta.totalElements,
      visitedCount,
      notVisitedCount,
      expiredCount,
    };
  }, [pageMeta.totalElements, rows]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading visitors report...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Visitors Log"
        subtitle="Community-wide visitor QR reporting with creator filter, visit outcome, and validity tracking."
        action={(
          <Button variant="secondary" onClick={() => fetchVisitors()}>
            <RefreshCcw size={14} />
            Refresh
          </Button>
        )}
      />

      {error && <div className="alert-banner alert-error">{error}</div>}

      <div className="transaction-stat-grid">
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-primary">
            <QrCode size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Tracked Passes</p>
            <h3 className="transaction-stat-value">{summary.tracked}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-success">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Visited On Page</p>
            <h3 className="transaction-stat-value">{summary.visitedCount}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-warning">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Not Visited On Page</p>
            <h3 className="transaction-stat-value">{summary.notVisitedCount}</h3>
          </div>
        </Card>
        <Card className="transaction-stat-card">
          <div className="transaction-stat-icon transaction-stat-danger">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="transaction-stat-label">Expired On Page</p>
            <h3 className="transaction-stat-value">{summary.expiredCount}</h3>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="transaction-filter-bar visitors-filter-bar">
          <div className="transaction-search">
            <label htmlFor="visitor-log-search">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
              <input
                id="visitor-log-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search visitor, contact, or creator"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div className="transaction-filter-group">
            <label>Created By</label>
            <select value={createdById} onChange={(event) => setCreatedById(event.target.value)}>
              <option value="ALL">All creators</option>
              {creators.map((creator) => (
                <option key={creator.id} value={creator.id}>{creator.name}</option>
              ))}
            </select>
          </div>
          <div className="transaction-filter-group">
            <label>Visit Status</label>
            <select value={visitStatus} onChange={(event) => setVisitStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="VISITED">Visited</option>
              <option value="NOT_VISITED">Did not visit</option>
            </select>
          </div>
          <div className="transaction-filter-group">
            <label>Rows</label>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} per page</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="mb-6 transaction-pagination-card">
        <div className="transaction-pagination-bar">
          <div className="transaction-pagination-summary">
            Showing {rows.length ? ((safeCurrentPage - 1) * pageSize) + 1 : 0}-
            {Math.min(safeCurrentPage * pageSize, pageMeta.totalElements)} of {pageMeta.totalElements} visitor passes
          </div>
          <div className="transaction-pagination-controls">
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

      <div className="visitors-log-list">
        {rows.map((row) => (
          <Card key={row.id} className="visitors-log-card">
            <div className="visitors-log-grid">
              <div>
                <div className="transaction-card-header">
                  <div>
                    <h3 className="transaction-card-title">{row.visitorName}</h3>
                    <p className="transaction-card-subtitle">{row.visitorContact}</p>
                  </div>
                  <div className="transaction-card-badges">
                    <Badge variant={row.visitStatus === 'VISITED' ? 'success' : 'warning'}>
                      {row.visitStatus === 'VISITED' ? 'Visited' : 'Did not visit'}
                    </Badge>
                    <Badge variant={statusBadgeVariant(row.lifecycleStatus)}>
                      {normalizeStatusLabel(row.lifecycleStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="transaction-meta-grid visitors-meta-grid">
                  <div className="transaction-meta-block">
                    <span className="transaction-meta-label">Created By</span>
                    <strong>{row.createdByName}</strong>
                    <div className="text-sm text-muted mt-1">{row.createdByUserType}</div>
                  </div>
                  <div className="transaction-meta-block">
                    <span className="transaction-meta-label">Visit Time</span>
                    <strong>{formatDateTime(row.expectedVisitAt)}</strong>
                  </div>
                  <div className="transaction-meta-block">
                    <span className="transaction-meta-label">Valid From</span>
                    <strong>{formatDateTime(row.validFrom)}</strong>
                  </div>
                  <div className="transaction-meta-block">
                    <span className="transaction-meta-label">Valid Until</span>
                    <strong>{formatDateTime(row.validUntil)}</strong>
                  </div>
                </div>
              </div>

              <div className="transaction-ledger-box">
                <div className="transaction-ledger-row">
                  <span>Created On</span>
                  <strong>{formatDateTime(row.createdAt)}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Visit Outcome</span>
                  <strong>{row.visitStatus === 'VISITED' ? 'Visited' : 'Did not visit'}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Verified By</span>
                  <strong>{row.verifiedByName || 'Not verified'}</strong>
                </div>
                <div className="transaction-ledger-row">
                  <span>Visited At</span>
                  <strong>{formatDateTime(row.visitedAt)}</strong>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {rows.length === 0 && (
          <Card>
            <div className="text-center py-8 text-muted">No visitor records match the current filters.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
