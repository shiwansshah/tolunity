import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';

const STATUS_OPTIONS = ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const STATUS_COLORS = {
  OPEN: 'warning',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'gray',
};

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/admin/complaints');
      const rows = Array.isArray(response.data) ? response.data : [];
      setComplaints(rows);
      setDrafts(
        rows.reduce((acc, complaint) => {
          acc[complaint.id] = {
            status: complaint.status || 'OPEN',
            resolutionNote: complaint.resolutionNote || '',
          };
          return acc;
        }, {})
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load complaints'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateDraft = (complaintId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [complaintId]: {
        ...current[complaintId],
        [field]: value,
      },
    }));
  };

  const saveComplaint = async (complaintId) => {
    const draft = drafts[complaintId];
    setSavingId(complaintId);
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, draft);
      await fetchComplaints();
    } catch (requestError) {
      alert(getApiErrorMessage(requestError, 'Failed to update complaint'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading complaints...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Complaint Management"
        subtitle="Community complaints ranked by upvotes so common issues surface first"
      />

      {error && <div className="error-banner">{error}</div>}

      <Card>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Reporter</th>
                <th>Upvotes</th>
                <th>Status</th>
                <th>Follow Up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => {
                const draft = drafts[complaint.id] || { status: complaint.status, resolutionNote: complaint.resolutionNote };
                const contact = complaint.followUpContact || {};

                return (
                  <tr key={complaint.id}>
                    <td>
                      <div className="font-bold">{complaint.title}</div>
                      <div className="text-sm text-muted mt-1">{complaint.category}</div>
                      <div className="text-sm mt-2">{complaint.description}</div>
                      <div className="text-sm text-muted mt-2">
                        {complaint.createdAt ? format(new Date(complaint.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{complaint.createdByName}</div>
                      <div className="text-sm text-muted">ID: {complaint.createdById}</div>
                    </td>
                    <td>
                      <div className="font-bold">{complaint.upvoteCount}</div>
                      <div className="text-sm text-muted">{complaint.mediaList?.length || 0} media</div>
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <Badge variant={STATUS_COLORS[complaint.status] || 'gray'}>{complaint.status}</Badge>
                      <select
                        value={draft.status || 'OPEN'}
                        onChange={(event) => updateDraft(complaint.id, 'status', event.target.value)}
                        style={{ width: '100%', marginTop: 12 }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={draft.resolutionNote || ''}
                        onChange={(event) => updateDraft(complaint.id, 'resolutionNote', event.target.value)}
                        rows={4}
                        style={{ width: '100%', marginTop: 12 }}
                        placeholder="Add an internal/public progress note"
                      />
                    </td>
                    <td>
                      <div className="text-sm">{contact.name || 'Complaint Desk'}</div>
                      <div className="text-sm text-muted">{contact.phoneNumber}</div>
                      <div className="text-sm text-muted">{contact.email}</div>
                    </td>
                    <td>
                      <Button onClick={() => saveComplaint(complaint.id)} isLoading={savingId === complaint.id}>
                        Save Update
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">
                    No complaints found
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

export default ComplaintsPage;
