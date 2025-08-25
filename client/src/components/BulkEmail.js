import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Table, 
  Space, 
  Typography, 
  Row, 
  Col, 
  message,
  Progress,
  Modal,
  Input,
  Checkbox,
  Tag,
  Alert,
  Divider,
  Statistic
} from 'antd';
import { 
  MailOutlined, 
  SendOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const BulkEmail = ({ leads }) => {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLead, setPreviewLead] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load saved templates and email history
  useEffect(() => {
    const templates = localStorage.getItem('emailTemplates');
    if (templates) {
      setSavedTemplates(JSON.parse(templates));
    }

    const history = localStorage.getItem('emailHistory');
    if (history) {
      setEmailHistory(JSON.parse(history));
    }
  }, []);

  // Save email history
  useEffect(() => {
    localStorage.setItem('emailHistory', JSON.stringify(emailHistory));
  }, [emailHistory]);

  const statusOptions = [
    { value: 'all', label: 'All Leads' },
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'contacted', label: 'Contacted', color: 'orange' },
    { value: 'qualified', label: 'Qualified', color: 'green' },
    { value: 'proposal', label: 'Proposal Sent', color: 'purple' },
    { value: 'closed', label: 'Closed', color: 'red' }
  ];

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus);

  const columns = [
    {
      title: 'Select',
      key: 'select',
      render: (_, record) => (
        <Checkbox
          checked={selectedLeads.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedLeads([...selectedLeads, record.id]);
            } else {
              setSelectedLeads(selectedLeads.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = statusOptions.find(s => s.value === status);
        return (
          <Tag color={statusConfig?.color || 'default'}>
            {statusConfig?.label || status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showPreview(record)}
        >
          Preview
        </Button>
      ),
    },
  ];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = savedTemplates.find(t => t.id === parseInt(templateId));
    if (template) {
      setEmailContent(template.content);
      // Extract subject from template content
      const subjectMatch = template.content.match(/Subject:\s*(.+)/);
      if (subjectMatch) {
        setEmailSubject(subjectMatch[1]);
        // Remove subject line from content
        setEmailContent(template.content.replace(/Subject:\s*.+\n\n?/, ''));
      }
    }
    setSelectedTemplate(templateId);
  };

  const personalizeEmail = (content, lead) => {
    return content
      .replace(/\[Name\]/g, lead.name)
      .replace(/\[Company Name\]/g, lead.company || 'your company')
      .replace(/\[Email\]/g, lead.email)
      .replace(/\[Phone\]/g, lead.phone || '')
      .replace(/\[Your Name\]/g, 'Your Name') // This should be configurable
      .replace(/\[Your Company\]/g, 'Your Company') // This should be configurable
      .replace(/\[Your Title\]/g, 'Your Title') // This should be configurable
      .replace(/\[Your Contact Information\]/g, 'Your Contact Info'); // This should be configurable
  };

  const showPreview = (lead) => {
    setPreviewLead(lead);
    setPreviewVisible(true);
  };

  const simulateBulkSend = async () => {
    if (selectedLeads.length === 0) {
      message.warning('Please select at least one lead');
      return;
    }

    if (!emailContent.trim() || !emailSubject.trim()) {
      message.warning('Please enter email subject and content');
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
    const totalEmails = selectedLeadData.length;

    // Simulate sending emails with progress
    for (let i = 0; i < totalEmails; i++) {
      const lead = selectedLeadData[i];
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to email history
      const emailRecord = {
        id: Date.now() + i,
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        subject: personalizeEmail(emailSubject, lead),
        content: personalizeEmail(emailContent, lead),
        sentAt: new Date().toISOString(),
        status: Math.random() > 0.1 ? 'sent' : 'failed' // 90% success rate simulation
      };

      setEmailHistory(prev => [emailRecord, ...prev]);
      setSendProgress(((i + 1) / totalEmails) * 100);
    }

    setIsSending(false);
    message.success(`Successfully sent ${totalEmails} emails!`);
    setSelectedLeads([]);
  };

  const getEmailStats = () => {
    const total = emailHistory.length;
    const sent = emailHistory.filter(e => e.status === 'sent').length;
    const failed = emailHistory.filter(e => e.status === 'failed').length;
    
    return { total, sent, failed };
  };

  const stats = getEmailStats();

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Bulk Email Campaign">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Filter by Status:</Text>
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Text strong>Email Template:</Text>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateSelect}
                    style={{ width: '100%', marginTop: 8 }}
                    placeholder="Select a saved template"
                  >
                    {savedTemplates.map(template => (
                      <Option key={template.id} value={template.id.toString()}>
                        {template.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <div>
                <Text strong>Email Subject:</Text>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>Email Content:</Text>
                <TextArea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Enter email content or select a template above..."
                  rows={8}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Use placeholders: [Name], [Company Name], [Email], [Phone], [Your Name], [Your Company], [Your Title]
                </Text>
              </div>

              <Alert
                message="Email Personalization"
                description="Emails will be automatically personalized with lead information using the placeholders in your template."
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Campaign Stats">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Sent"
                  value={stats.total}
                  prefix={<MailOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Successful"
                  value={stats.sent}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Failed"
                  value={stats.failed}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>

          {isSending && (
            <Card title="Sending Progress" style={{ marginTop: 16 }}>
              <Progress
                percent={Math.round(sendProgress)}
                status={sendProgress === 100 ? 'success' : 'active'}
              />
              <Text type="secondary">
                Sending emails... {Math.round(sendProgress)}% complete
              </Text>
            </Card>
          )}
        </Col>
      </Row>

      <Card title="Select Recipients" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Checkbox
              checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
              indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All ({filteredLeads.length} leads)
            </Checkbox>
            <Text type="secondary">
              {selectedLeads.length} selected
            </Text>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={simulateBulkSend}
              disabled={selectedLeads.length === 0 || isSending}
              loading={isSending}
            >
              Send Bulk Email ({selectedLeads.length})
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredLeads}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title={`Email Preview - ${previewLead?.name}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {previewLead && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>To: </Text>
              <Text>{previewLead.email}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Subject: </Text>
              <Text>{personalizeEmail(emailSubject, previewLead)}</Text>
            </div>
            <Divider />
            <div style={{ 
              background: '#f9f9f9', 
              padding: 16, 
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Arial, sans-serif'
            }}>
              {personalizeEmail(emailContent, previewLead)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BulkEmail;
