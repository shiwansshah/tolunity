import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { CircleDollarSign, Users, Wallet, Landmark } from 'lucide-react';
import api from '../services/api';
import { Banner, PageHeader, tableCellClass, tableHeaderClass } from '../components/UI';
import { getApiErrorMessage } from '../services/apiError';

const CHART_COLORS = {
  slate900: '#0f172a',
  slate600: '#475569',
  slate400: '#94a3b8',
  emerald: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  blue: '#2563eb',
};

const PIE_COLORS = [CHART_COLORS.slate900, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.slate400];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-md">
      {label && <div className="mb-1 font-medium text-slate-700">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-mono font-medium text-slate-800">{entry.value?.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Failed to fetch dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="px-4 py-6 text-[13px] text-slate-500">Loading analytics data...</div>;
  }

  if (!stats) {
    return <div className="px-4 py-6 text-[13px] text-slate-500">No dashboard data available.</div>;
  }

  const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;
  const securityUsers = stats.securityCount || 0;
  const otherUsers = Math.max(
    0,
    (stats.totalUsers || 0) - (stats.ownersCount || 0) - (stats.tenantsCount || 0) - securityUsers
  );
  const totalTrackedCapital = (stats.collectedRevenue || 0) + (stats.pendingRevenue || 0);
  const tenantPerOwner =
    stats.ownersCount > 0 ? (stats.tenantsCount / stats.ownersCount).toFixed(1) : '0.0';

  /* Chart data */
  const revenueData = [
    { name: 'Collected', value: stats.collectedRevenue || 0 },
    { name: 'Pending', value: stats.pendingRevenue || 0 },
  ];

  const userMixData = [
    { name: 'Owners', value: stats.ownersCount || 0 },
    { name: 'Tenants', value: stats.tenantsCount || 0 },
    { name: 'Security', value: securityUsers },
    { name: 'Other', value: otherUsers },
  ].filter((d) => d.value > 0);

  const feeData = [
    { name: 'Maintenance', collected: stats.maintenanceCollected || 0 },
    { name: 'Garbage', collected: stats.garbageCollected || 0 },
  ];

  const statCells = [
    { label: 'Total Users', value: stats.totalUsers || 0, accent: '#0f172a', Icon: Users },
    { label: 'Collected Revenue', value: formatNPR(stats.collectedRevenue), accent: '#059669', Icon: CircleDollarSign },
    { label: 'Pending Revenue', value: formatNPR(stats.pendingRevenue), accent: '#d97706', Icon: Wallet },
    { label: 'Charity Fund', value: formatNPR(stats.charityTotal), accent: '#2563eb', Icon: Landmark },
  ];

  return (
    <div className="text-[13px]">
      <PageHeader eyebrow="Overview" title="Dashboard" />

      {error && <Banner>{error}</Banner>}

      {/* ── KPI Cards ── */}
      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCells.map(({ label, value, accent, Icon }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
            style={{ borderTopColor: accent, borderTopWidth: '3px' }}
          >
            <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-100 p-2 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-slate-500">{label}</div>
              <div className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-slate-900">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-px border-b border-slate-200 bg-slate-200 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="bg-white p-4 shadow-sm">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Revenue Breakdown
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Amount (NPR)" radius={[3, 3, 0, 0]}>
                <Cell fill={CHART_COLORS.emerald} />
                <Cell fill={CHART_COLORS.amber} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Mix Donut */}
        <div className="bg-white p-4 shadow-sm">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            User Distribution
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={userMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {userMixData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
            {userMixData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Fee Collection Chart */}
        <div className="bg-white p-4 shadow-sm">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Fee Collection
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={feeData} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="collected" name="Collected (NPR)" fill={CHART_COLORS.slate900} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Data Tables ── */}
      <div className="grid gap-px border-b border-slate-200 bg-slate-200 xl:grid-cols-3">
        <section className="bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">User Mix</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Type</th>
                  <th className={tableHeaderClass}>Users</th>
                  <th className={tableHeaderClass}>Share</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Owners', stats.ownersCount || 0],
                  ['Tenants', stats.tenantsCount || 0],
                  ['Security', securityUsers],
                  ['Other', otherUsers],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className={tableCellClass}>{label}</td>
                    <td className={`${tableCellClass} font-mono`}>{value}</td>
                    <td className={`${tableCellClass} font-mono`}>
                      {stats.totalUsers ? `${((Number(value) / stats.totalUsers) * 100).toFixed(1)}%` : '0.0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Fee Collection</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Fee Type</th>
                  <th className={tableHeaderClass}>Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableCellClass}>Maintenance</td>
                  <td className={`${tableCellClass} font-mono`}>{formatNPR(stats.maintenanceCollected)}</td>
                </tr>
                <tr>
                  <td className={tableCellClass}>Garbage</td>
                  <td className={`${tableCellClass} font-mono`}>{formatNPR(stats.garbageCollected)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">System Metrics</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Metric</th>
                  <th className={tableHeaderClass}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableCellClass}>Total Tracked Capital</td>
                  <td className={`${tableCellClass} font-mono`}>{formatNPR(totalTrackedCapital)}</td>
                </tr>
                <tr>
                  <td className={tableCellClass}>Tenants per Owner</td>
                  <td className={`${tableCellClass} font-mono`}>{tenantPerOwner}</td>
                </tr>
                <tr>
                  <td className={tableCellClass}>Total Transactions</td>
                  <td className={`${tableCellClass} font-mono`}>{stats.totalPayments || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
