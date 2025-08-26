import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Progress, List, Tag, Spin } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { dashboardAPI } from '../utils/apiCalls';

const Dashboard = ({ leads, loading }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await dashboardAPI.getStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback to local calculation if API fails
    } finally {
      setStatsLoading(false);
    }
  };
  const getStatusStats = () => {
    const stats = {
      total: leads.length,
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      closed: 0
    };

    leads.forEach(lead => {
      stats[lead.status] = (stats[lead.status] || 0) + 1;
    });

    return stats;
  };

  const stats = getStatusStats();
  const conversionRate = stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : 0;

  const recentLeads = leads
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      contacted: 'orange',
      qualified: 'green',
      proposal: 'purple',
      closed: 'red'
    };
    return colors[status] || 'default';
  };

  return (
    <Spin spinning={loading || statsLoading}>
      <div>
      <Row gutter={[16, 16]} className="dashboard-stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="New Leads"
              value={stats.new}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Qualified"
              value={stats.qualified}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={conversionRate}
              suffix="%"
              prefix={<MailOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Lead Status Distribution" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>New</span>
                <span>{stats.new}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.new / stats.total) * 100 : 0} 
                strokeColor="#1890ff" 
                showInfo={false}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Contacted</span>
                <span>{stats.contacted}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0} 
                strokeColor="#faad14" 
                showInfo={false}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Qualified</span>
                <span>{stats.qualified}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.qualified / stats.total) * 100 : 0} 
                strokeColor="#52c41a" 
                showInfo={false}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Proposal Sent</span>
                <span>{stats.proposal}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.proposal / stats.total) * 100 : 0} 
                strokeColor="#722ed1" 
                showInfo={false}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Closed</span>
                <span>{stats.closed}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.closed / stats.total) * 100 : 0} 
                strokeColor="#f5222d" 
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Recent Leads" bordered={false}>
            <List
              dataSource={recentLeads}
              renderItem={lead => (
                <List.Item>
                  <List.Item.Meta
                    title={lead.name}
                    description={
                      <div>
                        <div>{lead.email}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={getStatusColor(lead.status)}>
                            {lead.status.toUpperCase()}
                          </Tag>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No leads yet. Add some leads to get started!' }}
            />
          </Card>
        </Col>
      </Row>
      </div>
    </Spin>
  );
};

export default Dashboard;
