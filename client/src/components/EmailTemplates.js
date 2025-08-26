import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Input, 
  Space, 
  Typography, 
  Row, 
  Col, 
  message,
  Divider,
  Tag,
  Modal,
  Form,
  List,
  Spin
} from 'antd';
import { 
  RobotOutlined, 
  CopyOutlined, 
  SaveOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { templateAPI } from '../utils/apiCalls';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const EmailTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState('introduction');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Load saved templates from API
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getAll();
      const templates = response.data.data?.templates || [];
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error(`Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'introduction', label: 'Introduction/Cold Outreach' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'proposal', label: 'Proposal Submission' },
    { value: 'meeting', label: 'Meeting Request' },
    { value: 'thankyou', label: 'Thank You' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'custom', label: 'Custom' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'persuasive', label: 'Persuasive' }
  ];

  const aiTemplates = {
    introduction: {
      professional: `Subject: Partnership Opportunity with [Company Name]

Dear [Name],

I hope this email finds you well. My name is [Your Name] from [Your Company], and I'm reaching out because I believe there's a valuable opportunity for collaboration between our organizations.

[Your Company] specializes in [Your Service/Product], and I noticed that [Company Name] has been [specific observation about their business/recent achievement]. This caught my attention because [reason for relevance].

I'd love to schedule a brief 15-minute call to discuss how we might be able to help [Company Name] achieve [specific goal/benefit]. Would you be available for a quick conversation this week or next?

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`,
      
      friendly: `Subject: Quick question about [Company Name]

Hi [Name]!

Hope you're having a great day! I'm [Your Name] from [Your Company], and I came across [Company Name] while researching [industry/topic].

I was really impressed by [specific achievement/project], and it got me thinking about how we might be able to help you [specific benefit/goal].

Would you be up for a quick 10-minute chat sometime this week? I promise to keep it brief and valuable!

Looking forward to hearing from you,
[Your Name]`
    },
    
    followup: {
      professional: `Subject: Following up on our conversation

Dear [Name],

I wanted to follow up on our conversation from [date/context] regarding [topic discussed].

As promised, I've attached [relevant materials/information] that should help address the points we discussed about [specific topic].

I'm excited about the potential to work together and would love to schedule our next steps. Are you available for a call [specific time frame]?

Please let me know if you need any additional information.

Best regards,
[Your Name]`,
      
      friendly: `Subject: Quick follow-up!

Hi [Name],

Thanks again for taking the time to chat with me [when]. I really enjoyed our conversation about [topic]!

I've put together some information that I think you'll find helpful regarding [specific topic]. Take a look when you get a chance.

What do you think about hopping on a quick call next week to discuss the next steps?

Talk soon!
[Your Name]`
    },
    
    proposal: {
      professional: `Subject: Proposal for [Project Name] - [Company Name]

Dear [Name],

Thank you for the opportunity to submit a proposal for [project/service]. Based on our discussions, I've prepared a comprehensive solution that addresses your specific needs.

Key highlights of our proposal:
• [Key benefit 1]
• [Key benefit 2]
• [Key benefit 3]

The attached proposal includes detailed information about our approach, timeline, and investment required. I believe this solution will help [Company Name] achieve [specific goal/outcome].

I'm available to discuss any questions you might have and would be happy to present the proposal in person or via video call.

Looking forward to your feedback.

Best regards,
[Your Name]`
    },
    
    meeting: {
      professional: `Subject: Meeting Request - [Purpose]

Dear [Name],

I hope this email finds you well. I would like to schedule a meeting to discuss [specific purpose/topic].

The meeting would cover:
• [Agenda item 1]
• [Agenda item 2]
• [Agenda item 3]

I estimate we'll need approximately [duration] for our discussion. Would you be available [suggest 2-3 time slots]?

Please let me know what works best for your schedule, and I'll send a calendar invitation with all the details.

Best regards,
[Your Name]`
    }
  };

  const generateTemplate = () => {
    if (selectedCategory === 'custom' && !customPrompt.trim()) {
      message.warning('Please enter a custom prompt for template generation');
      return;
    }

    let template = '';
    
    if (selectedCategory === 'custom') {
      // For custom prompts, create a basic structure
      template = `Subject: [Subject Line]

Dear [Name],

${customPrompt}

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`;
    } else {
      template = aiTemplates[selectedCategory]?.[selectedTone] || 
                aiTemplates[selectedCategory]?.professional || 
                'Template not available for this combination.';
    }

    setGeneratedTemplate(template);
    message.success('Email template generated successfully!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedTemplate);
    message.success('Template copied to clipboard!');
  };

  const saveTemplate = () => {
    if (!generatedTemplate.trim()) {
      message.warning('No template to save');
      return;
    }
    
    setEditingTemplate(null);
    form.setFieldsValue({
      name: `${categories.find(c => c.value === selectedCategory)?.label} - ${tones.find(t => t.value === selectedTone)?.label}`,
      category: selectedCategory,
      tone: selectedTone,
      content: generatedTemplate
    });
    setIsModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTemplate) {
        await templateAPI.update(editingTemplate.id, values);
        message.success('Template updated successfully');
      } else {
        await templateAPI.create(values);
        message.success('Template saved successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      loadTemplates(); // Reload templates from API
    } catch (error) {
      console.error('Error saving template:', error);
      message.error('Failed to save template');
    }
  };

  const editTemplate = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setIsModalVisible(true);
  };

  const deleteTemplate = async (id) => {
    try {
      await templateAPI.delete(id);
      message.success('Template deleted successfully');
      loadTemplates(); // Reload templates from API
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
    }
  };


  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="AI Email Template Generator" extra={<RobotOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>Email Category:</Text>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Select email category"
                >
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>Tone:</Text>
                <Select
                  value={selectedTone}
                  onChange={setSelectedTone}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Select tone"
                >
                  {tones.map(tone => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {selectedCategory === 'custom' && (
                <div>
                  <Text strong>Custom Prompt:</Text>
                  <TextArea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe what you want the email to accomplish..."
                    rows={3}
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}

              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={generateTemplate}
                block
              >
                Generate Template
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Generated Template" 
            extra={
              generatedTemplate && (
                <Space>
                  <Button
                    type="default"
                    icon={<CopyOutlined />}
                    onClick={copyToClipboard}
                    size="small"
                  >
                    Copy
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveTemplate}
                    size="small"
                  >
                    Save
                  </Button>
                </Space>
              )
            }
          >
            <TextArea
              value={generatedTemplate}
              onChange={(e) => setGeneratedTemplate(e.target.value)}
              placeholder="Generated email template will appear here..."
              rows={15}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="Saved Templates" extra={<PlusOutlined />}>
        <Spin spinning={loading}>
          <List
            dataSource={savedTemplates}
            renderItem={template => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => editTemplate(template)}
                >
                  Edit
                </Button>,
                <Button
                  type="link"
                  onClick={() => {
                    setGeneratedTemplate(template.content);
                    setSelectedCategory(template.category);
                    setSelectedTone(template.tone);
                    message.success('Template loaded for editing');
                  }}
                >
                  Use
                </Button>,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteTemplate(template.id)}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={
                  <div>
                    <Tag color="blue">{template.category}</Tag>
                    <Tag color="green">{template.tone}</Tag>
                    <Text type="secondary">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
            )}
            locale={{ emptyText: 'No saved templates yet. Generate and save some templates!' }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingTemplate ? 'Edit Template' : 'Save Template'}
        open={isModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter a template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select category">
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tone"
                label="Tone"
                rules={[{ required: true, message: 'Please select a tone' }]}
              >
                <Select placeholder="Select tone">
                  {tones.map(tone => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Template Content"
            rules={[{ required: true, message: 'Please enter template content' }]}
          >
            <TextArea rows={10} placeholder="Enter template content" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailTemplates;
