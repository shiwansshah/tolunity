import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Activity, Search } from 'lucide-react';
import { PageHeader, Card, Badge } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import './PaymentsReportPage.css';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Failed to load activity log'));
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const actions = useMemo(() => ['ALL', ...new Set(logs.map((log) => log.actionType).filter(Boolean))], [logs]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const normalizedSearch = search.trim().toLowerCase();
    const actionMatch = actionFilter === 'ALL' || log.actionType === actionFilter;
    const searchMatch = !normalizedSearch || [
      log.actorName,
      log.summary,
      log.details,
      log.targetType,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));

    return actionMatch && searchMatch;
  }), [logs, search, actionFilter]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading activity log...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Activity Log"
        subtitle="Every admin-side update is recorded here with the acting user, target, and change summary."
      />

      {error && <div className="alert-banner alert-error">{error}</div>}

      <Card className="mb-6">
        <div className="transaction-filter-bar">
          <div className="transaction-search">
            <label htmlFor="audit-search">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
              <input
                id="audit-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, summary, or details"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div className="transaction-filter-group">
            <label>Action Type</label>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              {actions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="font-bold">{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}</div>
                    <div className="text-sm text-muted mt-1">{log.createdAt ? format(new Date(log.createdAt), 'hh:mm a') : ''}</div>
                  </td>
                  <td>
                    <div className="font-bold">{log.actorName || 'System'}</div>
                    <div className="text-sm text-muted mt-1">ID: {log.actorId || 'N/A'}</div>
                  </td>
                  <td>
                    <Badge variant="primary">{log.actionType || 'UNKNOWN'}</Badge>
                  </td>
                  <td>
                    <div className="font-bold">{log.targetType || 'N/A'}</div>
                    <div className="text-sm text-muted mt-1">ID: {log.targetId || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="flex items-start gap-2">
                      <Activity size={16} style={{ color: 'var(--primary)', marginTop: 2 }} />
                      <div>
                        <div className="font-bold">{log.summary}</div>
                        {log.details && <div className="text-sm text-muted mt-1">{log.details}</div>}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">
                    No activity entries match the current filters.
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

export default ActivityLogPage;
