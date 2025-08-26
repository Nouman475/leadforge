import React, { useState, useEffect, useCallback } from 'react';
import { emailHistoryAPI } from '../utils/apiCalls';
import './EmailHistory.css';

const EmailHistory = () => {
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    campaign_id: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [summary, setSummary] = useState({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalFailed: 0,
    openRate: 0,
    clickRate: 0
  });

  const loadEmailHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await emailHistoryAPI.getAll(filters);
      
      if (response.data.success) {
        setEmailHistory(response.data.data.emailHistory);
        setPagination(response.data.data.pagination);
        setSummary(response.data.data.summary);
      } else {
        setError('Failed to load email history');
      }
    } catch (err) {
      console.error('Error loading email history:', err);
      setError('Failed to load email history: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEmailHistory();
  }, [loadEmailHistory]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      sent: 'status-sent',
      opened: 'status-opened',
      clicked: 'status-clicked',
      failed: 'status-failed',
      bounced: 'status-bounced'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderPagination = () => {
    const pages = [];
    const maxPages = Math.min(pagination.totalPages, 5);
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === pagination.currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="email-history">
      <div className="email-history-header">
        <h2>📧 Email History</h2>
        <p>Track all sent emails and their engagement metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-number">{summary.totalSent}</div>
          <div className="stat-label">Total Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary.totalOpened}</div>
          <div className="stat-label">Opened</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary.totalClicked}</div>
          <div className="stat-label">Clicked</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary.totalFailed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary.openRate}%</div>
          <div className="stat-label">Open Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary.clickRate}%</div>
          <div className="stat-label">Click Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by email, name, or subject..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Per Page:</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <button onClick={loadEmailHistory} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Email History Table */}
      {loading ? (
        <div className="loading">Loading email history...</div>
      ) : error ? (
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={loadEmailHistory} className="retry-btn">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="email-history-table">
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Opened At</th>
                  <th>Clicked At</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No email history found
                    </td>
                  </tr>
                ) : (
                  emailHistory.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <div className="recipient-info">
                          <div className="recipient-name">{email.recipient_name}</div>
                          <div className="recipient-email">{email.recipient_email}</div>
                          {email.lead?.company && (
                            <div className="recipient-company">{email.lead.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="subject-cell">
                        <div className="subject-text" title={email.subject}>
                          {email.subject}
                        </div>
                      </td>
                      <td>
                        {email.campaign ? (
                          <div className="campaign-info">
                            <div className="campaign-name">{email.campaign.name}</div>
                            <div className="campaign-status">{email.campaign.status}</div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{getStatusBadge(email.status)}</td>
                      <td>{formatDate(email.sent_at)}</td>
                      <td>{formatDate(email.opened_at)}</td>
                      <td>{formatDate(email.clicked_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              {renderPagination()}
              <div className="pagination-info">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} emails
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailHistory;
