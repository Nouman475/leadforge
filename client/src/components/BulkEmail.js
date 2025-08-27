import React, { useState, useEffect } from "react";
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
  Checkbox,
  Tag,
  Statistic,
  Spin,
} from "antd";
import {
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { campaignAPI, emailHistoryAPI } from "../utils/apiCalls";

const { Option } = Select;
const { Text } = Typography;

const BulkEmail = ({ leads, loading }) => {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [emailHistory, setEmailHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewLead, setPreviewLead] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load email history from API
  useEffect(() => {
    loadEmailHistory();
  }, []);

  const loadEmailHistory = async () => {
    try {
      const response = await emailHistoryAPI.getAll();
      setEmailHistory(response.data.data.emailHistory || []);
    } catch (error) {
      console.error("Error loading email history:", error);
      // Don't show error message as this is not critical
    }
  };

  const statusOptions = [
    { value: "all", label: "All Leads" },
    { value: "new", label: "New", color: "blue" },
    { value: "contacted", label: "Contacted", color: "orange" },
    { value: "qualified", label: "Qualified", color: "green" },
    { value: "proposal", label: "Proposal Sent", color: "purple" },
    { value: "closed", label: "Closed", color: "red" },
  ];

  const categoryOptions = [
    { value: "proposal", label: "Business Proposal" },
    { value: "follow_up", label: "Follow Up" },
    { value: "introduction", label: "Introduction" },
  ];

  const toneOptions = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "formal", label: "Formal" },
  ];

  const filteredLeads =
    filterStatus === "all"
      ? leads
      : leads.filter((lead) => lead.status === filterStatus);

  const columns = [
    {
      title: "Select",
      key: "select",
      render: (_, record) => (
        <Checkbox
          checked={selectedLeads.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedLeads([...selectedLeads, record.id]);
            } else {
              setSelectedLeads(selectedLeads.filter((id) => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = statusOptions.find((s) => s.value === status);
        return (
          <Tag color={statusConfig?.color || "default"}>
            {statusConfig?.label || status.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = savedTemplates.find((t) => t.id === parseInt(templateId));
    if (template) {
      setEmailContent(template.content);
      // Extract subject from template content
      const subjectMatch = template.content.match(/Subject:\s*(.+)/);
      if (subjectMatch) {
        setEmailSubject(subjectMatch[1]);
        // Remove subject line from content
        setEmailContent(template.content.replace(/Subject:\s*.+\n\n?/, ""));
      }
    }
    setSelectedTemplate(templateId);
  };

  const personalizeEmail = (content, lead) => {
    return content
      .replace(/\[Name\]/g, lead.name)
      .replace(/\[Company Name\]/g, lead.company || "your company")
      .replace(/\[Email\]/g, lead.email)
      .replace(/\[Phone\]/g, lead.phone || "")
      .replace(/\[Your Name\]/g, "Your Name") // This should be configurable
      .replace(/\[Your Company\]/g, "Your Company") // This should be configurable
      .replace(/\[Your Title\]/g, "Your Title") // This should be configurable
      .replace(/\[Your Contact Information\]/g, "Your Contact Info"); // This should be configurable
  };

  const showPreview = (lead) => {
    setPreviewLead(lead);
    setPreviewVisible(true);
  };

  const simulateBulkSend = async () => {
    if (selectedLeads.length === 0) {
      message.warning("Please select at least one lead");
      return;
    }

    if (!category || !tone) {
      message.warning("Please select email category and tone");
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    const selectedLeadData = leads.filter((lead) =>
      selectedLeads.includes(lead.id)
    );

    try {
      // Create campaign with automatic content generation
      const campaignData = {
        name: `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } Campaign - ${new Date().toLocaleDateString()}`,
        category,
        tone,
        lead_ids: selectedLeads,
      };

      await campaignAPI.create(campaignData);

      // Simulate progress for UX
      const totalEmails = selectedLeadData.length;
      for (let i = 0; i < totalEmails; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSendProgress(((i + 1) / totalEmails) * 100);
      }

      message.success(
        `Successfully sent ${totalEmails} ${category} emails with ${tone} tone!`
      );
      setSelectedLeads([]);
      loadEmailHistory(); // Reload email history
    } catch (error) {
      console.error("Error sending bulk email:", error);
      message.error("Failed to send bulk email");
    } finally {
      setIsSending(false);
      setSendProgress(0);
    }
  };

  const getEmailStats = () => {
    const total = emailHistory.length;
    const sent = emailHistory.filter((e) =>
      ["sent", "opened", "clicked"].includes(e.status)
    ).length;
    const failed = emailHistory.filter((e) => e.status === "failed").length;

    return { total, sent, failed };
  };

  const stats = getEmailStats();

  return (
    <div>
      {/* Campaign Stats at Top */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Sent"
              value={stats.total}
              prefix={<MailOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Successful"
              value={stats.sent}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed}
              prefix={
                <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              }
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Selected"
              value={selectedLeads.length}
              prefix={<UserOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Email Configuration */}
      <Card title="Email Campaign Configuration" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Text strong>Filter by Status:</Text>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select lead status"
            >
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>
              Email Category: <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select email category"
            >
              {categoryOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>
              Email Tone: <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              value={tone}
              onChange={setTone}
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select email tone"
            >
              {toneOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {isSending && (
          <div style={{ marginTop: 16 }}>
            <Progress
              percent={Math.round(sendProgress)}
              status={sendProgress === 100 ? "success" : "active"}
            />
            <Text type="secondary">
              Sending emails... {Math.round(sendProgress)}% complete
            </Text>
          </div>
        )}
      </Card>

      <Card title="Select Recipients" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Checkbox
              checked={
                selectedLeads.length === filteredLeads.length &&
                filteredLeads.length > 0
              }
              indeterminate={
                selectedLeads.length > 0 &&
                selectedLeads.length < filteredLeads.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All ({filteredLeads.length} leads)
            </Checkbox>
            <Text type="secondary">{selectedLeads.length} selected</Text>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={simulateBulkSend}
              disabled={
                selectedLeads.length === 0 || !category || !tone || isSending
              }
              loading={isSending}
            >
              Send Bulk Email ({selectedLeads.length})
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredLeads}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Spin>
      </Card>
    </div>
  );
};

export default BulkEmail;
