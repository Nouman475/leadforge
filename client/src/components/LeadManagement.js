import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tag,
  message,
  Row,
  Col,
  Card,
  Spin,
  Upload,
  Alert,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { leadAPI } from "../utils/apiCalls";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
const { Dragger } = Upload;

const LeadManagement = ({ leads, setLeads, onLeadsChange, loading }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form] = Form.useForm();

  // Bulk import states
  const [bulkImportModal, setBulkImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const statusOptions = [
    { value: "new", label: "New", color: "blue" },
    { value: "contacted", label: "Contacted", color: "orange" },
    { value: "qualified", label: "Qualified", color: "green" },
    { value: "proposal", label: "Proposal Sent", color: "purple" },
    { value: "closed", label: "Closed", color: "red" },
  ];

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
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
      filters: statusOptions.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this lead?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingLead(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    form.setFieldsValue(lead);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await leadAPI.delete(id);
      message.success("Lead deleted successfully");
      onLeadsChange(); // Reload leads from API
    } catch (error) {
      console.error("Error deleting lead:", error);
      message.error("Failed to delete lead");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingLead) {
        // Update existing lead
        await leadAPI.update(editingLead.id, values);
        message.success("Lead updated successfully");
      } else {
        // Add new lead
        await leadAPI.create(values);
        message.success("Lead added successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      onLeadsChange(); // Reload leads from API
    } catch (error) {
      console.error("Error saving lead:", error);
      message.error("Failed to save lead");
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      leads.map((lead) => ({
        Name: lead.name,
        Email: lead.email,
        Phone: lead.phone,
        Company: lead.company,
        Status: lead.status,
        Notes: lead.notes,
        "Created Date": new Date(lead.createdAt).toLocaleDateString(),
        "Updated Date": new Date(lead.updatedAt).toLocaleDateString(),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, `leads_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    message.success("Leads exported to Excel successfully");
  };

  const exportToCSV = () => {
    const csvData = leads.map((lead) => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      Status: lead.status,
      Notes: lead.notes,
      "Created Date": new Date(lead.createdAt).toLocaleDateString(),
      "Updated Date": new Date(lead.updatedAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    saveAs(data, `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    message.success("Leads exported to CSV successfully");
  };

  // Handle bulk import modal
  const handleBulkImport = () => {
    setBulkImportModal(true);
    setSelectedFile(null);
  };

  // Handle file upload
  const uploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx,.xls,.csv",
    beforeUpload: (file) => {
      const isExcelOrCSV =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv";

      if (!isExcelOrCSV) {
        message.error("You can only upload Excel or CSV files!");
        return false;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("File must be smaller than 5MB!");
        return false;
      }

      setSelectedFile(file);
      return false; // Prevent auto upload
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  // Process bulk upload
  const handleUpload = async () => {
    if (!selectedFile) {
      message.error("Please select a file first");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await leadAPI.bulkCreate(formData);
      message.success("File uploaded successfully");

      // Close modal and refresh leads
      setBulkImportModal(false);
      setSelectedFile(null);
      onLeadsChange(); // Reload leads
    } catch (error) {
      console.error("Bulk upload error:", error);
      message.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset bulk import modal
  const resetBulkImport = () => {
    setBulkImportModal(false);
    setSelectedFile(null);
    setIsUploading(false);
  };

  return (
    <div>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Lead Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="default"
                icon={<UploadOutlined />}
                onClick={handleBulkImport}
              >
                Bulk Import
              </Button>
              <Button
                type="default"
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={leads.length === 0}
              >
                Export Excel
              </Button>
              <Button
                type="default"
                icon={<FilePdfOutlined />}
                onClick={exportToCSV}
                disabled={leads.length === 0}
              >
                Export CSV
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Lead
              </Button>
            </Space>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={leads}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} leads`,
            }}
            className="lead-table"
          />
        </Spin>
      </Card>

      {/* Add/Edit Lead Modal */}
      <Modal
        title={editingLead ? "Edit Lead" : "Add New Lead"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ status: "new" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter the name" }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter the email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please enter the phone number" },
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="Company">
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select status">
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={4}
              placeholder="Enter any additional notes about this lead"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Import Modal - Simplified */}
      <Modal
        title="Bulk Import Leads"
        open={bulkImportModal}
        onCancel={resetBulkImport}
        width={600}
        footer={[
          <Button key="cancel" onClick={resetBulkImport}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUpload}
            loading={isUploading}
            disabled={!selectedFile}
          >
            Upload
          </Button>,
        ]}
      >
        <Alert
          message="File Format Requirements"
          description={
            <div>
              <p>
                Please ensure your file contains the following columns
                (case-insensitive):
              </p>
              <ul>
                <li>
                  <strong>Name</strong> (required) - Full name of the lead
                </li>
                <li>
                  <strong>Email</strong> (required) - Valid email address
                </li>
                <li>
                  <strong>Phone</strong> (optional) - Contact number
                </li>
                <li>
                  <strong>Company</strong> (optional) - Company name
                </li>
                <li>
                  <strong>Status</strong> (optional) - Lead status (new,
                  contacted, qualified, proposal, closed)
                </li>
                <li>
                  <strong>Notes</strong> (optional) - Additional information
                </li>
              </ul>
              <p>
                Supported formats: Excel (.xlsx, .xls) and CSV files. Maximum
                file size: 5MB.
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for Excel (.xlsx, .xls) and CSV files. Maximum 5MB.
          </p>
        </Dragger>

        {selectedFile && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={`File selected: ${selectedFile.name} (${(
                selectedFile.size /
                1024 /
                1024
              ).toFixed(2)} MB)`}
              type="success"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadManagement;
