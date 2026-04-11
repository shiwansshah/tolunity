import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import {
  Badge,
  Banner,
  PageHeader,
  ToolbarIconButton,
  inputClass,
  tableCellClass,
  tableHeaderClass,
} from '../components/UI';

const ACTION_BADGE = {
  CREATE: 'green',
  UPDATE: 'amber',
  DELETE: 'red',
};

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load activity log'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const actions = useMemo(
    () => ['ALL', ...new Set(logs.map((log) => log.actionType).filter(Boolean))],
    [logs]
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const query = search.trim().toLowerCase();
        const actionMatch = actionFilter === 'ALL' || log.actionType === actionFilter;
        const queryMatch =
          !query ||
          [log.actorName, log.summary, log.details, log.targetType]
            .some((value) => value?.toLowerCase().includes(query));
        return actionMatch && queryMatch;
      }),
    [logs, search, actionFilter]
  );

  const exportCSV = () => {
    const header = 'Timestamp,Actor,ActorID,Action,Target,TargetID,Summary';
    const lines = filteredLogs.map((log) =>
      [
        log.createdAt ? format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
        `"${log.actorName || 'System'}"`,
        log.actorId || '',
        log.actionType || '',
        log.targetType || '',
        log.targetId || '',
        `"${(log.summary || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `activity_${format(new Date(), 'yyyyMMdd')}.csv`,
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading activity log...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="System"
        title="Activity Log"
        subtitle="Audit actor activity, target records, and change summaries."
      />

      {error && <Banner>{error}</Banner>}

      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="w-full max-w-xs">
          <input
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search actor, target, or summary"
          />
        </div>
        <div className="font-mono text-[12px] text-slate-500">{filteredLogs.length} entries</div>
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
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="w-full max-w-[220px]">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Action Type</div>
            <select className={inputClass} value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              {actions.map((value) => (
                <option key={value} value={value}>
                  {value}
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
              <th className={tableHeaderClass}>Timestamp</th>
              <th className={tableHeaderClass}>Actor</th>
              <th className={tableHeaderClass}>Actor ID</th>
              <th className={tableHeaderClass}>Action</th>
              <th className={tableHeaderClass}>Target</th>
              <th className={tableHeaderClass}>Target ID</th>
              <th className={tableHeaderClass}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className={`${tableCellClass} font-mono text-[12px]`}>
                  {log.createdAt ? format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}
                </td>
                <td className={tableCellClass}>{log.actorName || 'System'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{log.actorId || '-'}</td>
                <td className={tableCellClass}>
                  <Badge variant={ACTION_BADGE[log.actionType?.toUpperCase()] || 'slate'}>
                    {log.actionType || 'UNKNOWN'}
                  </Badge>
                </td>
                <td className={tableCellClass}>{log.targetType || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{log.targetId || '-'}</td>
                <td className={tableCellClass}>
                  <div>{log.summary || '-'}</div>
                  {log.details && <div className="mt-1 text-[12px] text-slate-500">{log.details}</div>}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="7" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No entries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogPage;
