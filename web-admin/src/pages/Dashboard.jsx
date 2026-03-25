import React, { useEffect, useState } from 'react';
import { Users, Banknote, Activity, Heart } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { Card, PageHeader } from '../components/UI';
import { getApiErrorMessage } from '../services/apiError';
import './Dashboard.css';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        setError(getApiErrorMessage(error, 'Failed to fetch dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="p-8 text-danger">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  const userDistributionData = [
    { name: 'Owners', value: stats.ownersCount },
    { name: 'Tenants', value: stats.tenantsCount },
    { name: 'Other', value: stats.totalUsers - stats.ownersCount - stats.tenantsCount },
  ].filter((item) => item.value > 0);

  const feeBreakdownData = [
    { name: 'Maintenance', amount: stats.maintenanceCollected || 0, fill: '#F59E0B' },
    { name: 'Garbage', amount: stats.garbageCollected || 0, fill: '#10B981' },
  ];

  const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fade-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time overview of users, community fee collections, and charity fund"
      />

      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-icon gradient-primary">
            <Users size={24} color="#FFF" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Total Users</p>
            <h3 className="kpi-value">{stats.totalUsers}</h3>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon gradient-success">
            <Banknote size={24} color="#FFF" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Collected Revenue</p>
            <h3 className="kpi-value text-success">{formatNPR(stats.collectedRevenue)}</h3>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon gradient-warning">
            <Activity size={24} color="#FFF" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Pending Revenue</p>
            <h3 className="kpi-value text-danger">{formatNPR(stats.pendingRevenue)}</h3>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #E11D48, #F43F5E)' }}>
            <Heart size={24} color="#FFF" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Charity Fund</p>
            <h3 className="kpi-value" style={{ color: '#E11D48' }}>
              {formatNPR(stats.charityTotal)}
            </h3>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid mt-6">
        <Card className="col-span-1">
          <h3 className="section-title mb-6">User Distribution</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-2">
          <h3 className="section-title mb-6">Community Fee Collection Breakdown (Paid)</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeBreakdownData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `Rs ${value}`} />
                <RechartsTooltip formatter={(value) => formatNPR(value)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {feeBreakdownData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="section-title mb-6">System Health Report</h3>
        <div className="stats-comparison">
          <div className="stat-box border-r">
            <p className="text-muted text-sm uppercase">Total Tracked Capital</p>
            <h2 className="mt-1">
              {formatNPR((stats.collectedRevenue || 0) + (stats.pendingRevenue || 0))}
            </h2>
          </div>
          <div className="stat-box border-r">
            <p className="text-muted text-sm uppercase">Tenants per Owner</p>
            <h2 className="mt-1">
              {stats.ownersCount > 0 ? (stats.tenantsCount / stats.ownersCount).toFixed(1) : 0}
            </h2>
          </div>
          <div className="stat-box">
            <p className="text-muted text-sm uppercase">Total Transactions</p>
            <h2 className="mt-1">{stats.totalPayments}</h2>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
