import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { Badge, Banner, Button, PageHeader, inputClass, tableCellClass, tableHeaderClass } from '../components/UI';

const STATUS_OPTIONS = ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const STATUS_COLORS = {
  OPEN: 'amber',
  UNDER_REVIEW: 'blue',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'slate',
};

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/admin/complaints');
      const rows = Array.isArray(response.data) ? response.data : [];
      setComplaints(rows);
      setDrafts(
        rows.reduce((accumulator, complaint) => {
          accumulator[complaint.id] = {
            status: complaint.status || 'OPEN',
            resolutionNote: complaint.resolutionNote || '',
          };
          return accumulator;
        }, {})
      );
      setMessage(null);
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to load complaints') });
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
    setSavingId(complaintId);
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, drafts[complaintId]);
      setMessage({ tone: 'success', text: `Complaint #${complaintId} updated.` });
      await fetchComplaints();
    } catch (requestError) {
      setMessage({ tone: 'error', text: getApiErrorMessage(requestError, 'Failed to update complaint') });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading complaints...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Cases"
        title="Complaints"
        subtitle="Track complaint volume, review supporting context, and update case status."
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Complaint</th>
              <th className={tableHeaderClass}>Reporter</th>
              <th className={tableHeaderClass}>Votes</th>
              <th className={tableHeaderClass}>Status</th>
              <th className={tableHeaderClass}>Follow Up</th>
              <th className={tableHeaderClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const draft = drafts[complaint.id] || {
                status: complaint.status || 'OPEN',
                resolutionNote: complaint.resolutionNote || '',
              };
              const contact = complaint.followUpContact || {};

              return (
                <tr key={complaint.id}>
                  <td className={tableCellClass}>
                    <div className="font-semibold text-slate-900">{complaint.title}</div>
                    <div className="mt-1 text-[12px] text-slate-500">{complaint.category || '-'}</div>
                    <div className="mt-1">{complaint.description || '-'}</div>
                    <div className="mt-1 font-mono text-[12px] text-slate-500">
                      {complaint.createdAt ? format(new Date(complaint.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <div>{complaint.createdByName || '-'}</div>
                    <div className="mt-1 font-mono text-[12px] text-slate-500">#{complaint.createdById || '-'}</div>
                  </td>
                  <td className={tableCellClass}>
                    <div className="font-mono text-[12px]">{complaint.upvoteCount || 0}</div>
                    <div className="mt-1 text-[12px] text-slate-500">{complaint.mediaList?.length || 0} media</div>
                  </td>
                  <td className={tableCellClass}>
                    <div className="mb-2">
                      <Badge variant={STATUS_COLORS[complaint.status] || 'slate'}>
                        {complaint.status || 'UNKNOWN'}
                      </Badge>
                    </div>
                    <select
                      className={inputClass}
                      value={draft.status || 'OPEN'}
                      onChange={(event) => updateDraft(complaint.id, 'status', event.target.value)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className={`${inputClass} mt-2`}
                      rows="3"
                      value={draft.resolutionNote || ''}
                      onChange={(event) => updateDraft(complaint.id, 'resolutionNote', event.target.value)}
                      placeholder="Add an internal or public progress note"
                    />
                  </td>
                  <td className={tableCellClass}>
                    <div>{contact.name || 'Complaint Desk'}</div>
                    <div className="mt-1 font-mono text-[12px] text-slate-500">{contact.phoneNumber || '-'}</div>
                    <div className="mt-1 font-mono text-[12px] text-slate-500">{contact.email || '-'}</div>
                  </td>
                  <td className={tableCellClass}>
                    <Button onClick={() => saveComplaint(complaint.id)} isLoading={savingId === complaint.id}>
                      Save Update
                    </Button>
                  </td>
                </tr>
              );
            })}
            {complaints.length === 0 && (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintsPage;
