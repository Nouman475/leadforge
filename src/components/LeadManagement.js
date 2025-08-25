import React, { useState } from 'react';
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
  Card
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';

const { Option } = Select;
const { TextArea } = Input;

const LeadManagement = ({ leads, setLeads }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form] = Form.useForm();

  const statusOptions = [
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'contacted', label: 'Contacted', color: 'orange' },
    { value: 'qualified', label: 'Qualified', color: 'green' },
    { value: 'proposal', label: 'Proposal Sent', color: 'purple' },
    { value: 'closed', label: 'Closed', color: 'red' }
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
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
      filters: statusOptions.map(s => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
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

  const handleDelete = (id) => {
    setLeads(leads.filter(lead => lead.id !== id));
    message.success('Lead deleted successfully');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingLead) {
        // Update existing lead
        setLeads(leads.map(lead => 
          lead.id === editingLead.id 
            ? { ...lead, ...values, updatedAt: new Date().toISOString() }
            : lead
        ));
        message.success('Lead updated successfully');
      } else {
        // Add new lead
        const newLead = {
          id: uuidv4(),
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLeads([...leads, newLead]);
        message.success('Lead added successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(leads.map(lead => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      Status: lead.status,
      Notes: lead.notes,
      'Created Date': new Date(lead.createdAt).toLocaleDateString(),
      'Updated Date': new Date(lead.updatedAt).toLocaleDateString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(data, `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Leads exported to Excel successfully');
  };

  const exportToCSV = () => {
    const csvData = leads.map(lead => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      Status: lead.status,
      Notes: lead.notes,
      'Created Date': new Date(lead.createdAt).toLocaleDateString(),
      'Updated Date': new Date(lead.updatedAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(data, `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    message.success('Leads exported to CSV successfully');
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h2>Lead Management</h2>
          </Col>
          <Col>
            <Space>
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

        <Table
          columns={columns}
          dataSource={leads}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} leads`,
          }}
          className="lead-table"
        />
      </Card>

      <Modal
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'new' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter the name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter the email' },
                  { type: 'email', message: 'Please enter a valid email' }
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
                rules={[{ required: true, message: 'Please enter the phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company"
                label="Company"
              >
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select status">
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              rows={4}
              placeholder="Enter any additional notes about this lead"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadManagement;
