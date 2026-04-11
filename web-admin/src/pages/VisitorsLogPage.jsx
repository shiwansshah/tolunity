import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import {
  Badge,
  Banner,
  Button,
  PageHeader,
  ToolbarIconButton,
  inputClass,
  tableCellClass,
  tableHeaderClass,
} from '../components/UI';

const PAGE_SIZES = [10, 20, 50];

const fmtDateTime = (value) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '-');

const VisitorsLogPage = () => {
  const [rows, setRows] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [creatorId, setCreatorId] = useState('ALL');
  const [visitStatus, setVisitStatus] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ totalElements: 0, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(
    async ({ showLoader = false } = {}) => {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await api.get('/admin/visitors', {
          params: {
            page: page - 1,
            size: pageSize,
            createdById: creatorId === 'ALL' ? undefined : Number(creatorId),
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
    },
    [creatorId, page, pageSize, search, visitStatus]
  );

  useEffect(() => {
    load({ showLoader: true });
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, creatorId, visitStatus, pageSize]);

  const totalPages = Math.max(1, pageMeta.totalPages);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const stats = useMemo(() => {
    const visitedCount = rows.filter((row) => row.visitStatus === 'VISITED').length;
    return {
      total: pageMeta.totalElements,
      visited: visitedCount,
      notVisited: rows.length - visitedCount,
      expired: rows.filter((row) => row.lifecycleStatus === 'EXPIRED').length,
    };
  }, [pageMeta.totalElements, rows]);

  const exportCSV = () => {
    const header = 'Visitor,Contact,CreatedBy,Type,VisitStatus,Lifecycle,ExpectedVisit,ValidFrom,ValidUntil,VisitedAt,VerifiedBy';
    const lines = rows.map((row) =>
      [
        `"${row.visitorName || ''}"`,
        `"${row.visitorContact || ''}"`,
        `"${row.createdByName || ''}"`,
        row.createdByUserType || '',
        row.visitStatus || '',
        row.lifecycleStatus || '',
        fmtDateTime(row.expectedVisitAt),
        fmtDateTime(row.validFrom),
        fmtDateTime(row.validUntil),
        fmtDateTime(row.visitedAt),
        `"${row.verifiedByName || ''}"`,
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `visitors_${format(new Date(), 'yyyyMMdd')}.csv`,
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading visitor log...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Reports"
        title="Visitors Log"
        subtitle="Track visit status, pass validity, and verification activity."
      />

      {error && <Banner>{error}</Banner>}

      <div className="grid border-b border-slate-200 md:grid-cols-4">
        {[
          ['Total Passes', stats.total],
          ['Visited', stats.visited],
          ['Not Visited', stats.notVisited],
          ['Expired', stats.expired],
        ].map(([label, value], index, items) => (
          <div
            key={label}
            className={
              index < items.length - 1
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
            placeholder="Search visitor, contact, or creator"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ToolbarIconButton title="Filter" onClick={() => setShowFilters((current) => !current)} active={showFilters}>
            <Filter className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Export" onClick={exportCSV}>
            <Download className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Refresh" onClick={() => load()}>
            <RefreshCw className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-end">
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Created By</div>
            <select className={inputClass} value={creatorId} onChange={(event) => setCreatorId(event.target.value)}>
              <option value="ALL">All</option>
              {creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Visit Status</div>
            <select className={inputClass} value={visitStatus} onChange={(event) => setVisitStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="VISITED">VISITED</option>
              <option value="NOT_VISITED">NOT_VISITED</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Visitor</th>
              <th className={tableHeaderClass}>Contact</th>
              <th className={tableHeaderClass}>Created By</th>
              <th className={tableHeaderClass}>Type</th>
              <th className={tableHeaderClass}>Visit Status</th>
              <th className={tableHeaderClass}>Lifecycle</th>
              <th className={tableHeaderClass}>Expected Visit</th>
              <th className={tableHeaderClass}>Valid From</th>
              <th className={tableHeaderClass}>Valid Until</th>
              <th className={tableHeaderClass}>Visited At</th>
              <th className={tableHeaderClass}>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={tableCellClass}>{row.visitorName}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{row.visitorContact || '-'}</td>
                <td className={tableCellClass}>{row.createdByName}</td>
                <td className={tableCellClass}>
                  <Badge variant="slate">{row.createdByUserType || '-'}</Badge>
                </td>
                <td className={tableCellClass}>
                  <Badge variant={row.visitStatus === 'VISITED' ? 'green' : 'amber'}>
                    {row.visitStatus === 'VISITED' ? 'VISITED' : 'NOT_VISITED'}
                  </Badge>
                </td>
                <td className={tableCellClass}>
                  <Badge
                    variant={
                      row.lifecycleStatus === 'EXPIRED'
                        ? 'red'
                        : row.lifecycleStatus === 'VISITED'
                          ? 'green'
                          : row.lifecycleStatus === 'UPCOMING'
                            ? 'amber'
                            : 'blue'
                    }
                  >
                    {row.lifecycleStatus || 'ACTIVE'}
                  </Badge>
                </td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDateTime(row.expectedVisitAt)}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDateTime(row.validFrom)}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDateTime(row.validUntil)}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{fmtDateTime(row.visitedAt)}</td>
                <td className={tableCellClass}>{row.verifiedByName || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="11" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No visitor records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageMeta.totalElements > 0 && (
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 text-[13px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[12px]">
            {rows.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, pageMeta.totalElements)} of {pageMeta.totalElements}
          </div>
          <div className="flex items-center gap-2">
            <select className="w-auto" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
            >
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
    </div>
  );
};

export default VisitorsLogPage;
