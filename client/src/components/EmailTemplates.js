import React, { useState, useEffect } from "react";
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
  Spin,
} from "antd";
import {
  RobotOutlined,
  CopyOutlined,
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { templateAPI } from "../utils/apiCalls";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const EmailTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState("introduction");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState("");
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
      console.error("Error loading templates:", error);
      message.error(`Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "introduction", label: "Introduction/Cold Outreach" },
    { value: "followup", label: "Follow-up" },
    { value: "proposal", label: "Proposal Submission" },
    { value: "meeting", label: "Meeting Request" },
    { value: "thankyou", label: "Thank You" },
    { value: "reminder", label: "Reminder" },
    { value: "custom", label: "Custom" },
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "casual", label: "Casual" },
    { value: "formal", label: "Formal" },
    { value: "persuasive", label: "Persuasive" },
  ];

  const aiTemplates = {
    introduction: {
      professional: `Subject: Full-Stack Development Solutions for [Company Name]
  
  Dear [Name],
  
  I hope this email finds you well. My name is Muhammad Nouman, a Full-Stack MERN Developer with expertise in building scalable web and mobile applications using React.js, React Native, Node.js, and modern technologies.
  
  I noticed [Company Name] has been [specific observation about their digital presence/recent expansion], and I believe there's significant value I can provide in enhancing your digital capabilities. With my experience in developing complex platforms like MLM systems, e-commerce solutions, and performance tracking applications, I specialize in:
  
  • Custom Web & Mobile App Development (React.js/React Native)
  • E-commerce & Business Management Platforms
  • Real-time Data Processing & Analytics Systems
  • Payment Gateway Integration & Financial Systems
  • Desktop Applications using Electron.js
  
  I've successfully delivered projects for trading companies, financial services, and business management sectors - exactly the kind of digital transformation many UAE businesses are pursuing.
  
  Would you be available for a 15-minute call to discuss how custom development solutions could streamline your operations and drive growth?
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer
  +92 3028954240
  noumanthedev.netlify.app`,

      friendly: `Subject: Digital Solutions for [Company Name] 🚀
  
  Hi [Name]!
  
  Hope you're having a great day! I'm Muhammad Nouman, a MERN stack developer who helps UAE businesses build powerful web and mobile applications.
  
  I was checking out [Company Name] and was impressed by [specific achievement/service]. It got me thinking about how the right digital platform could take your business to the next level!
  
  I've built everything from crypto trading platforms to MLM systems and e-commerce stores - helping businesses automate processes, increase efficiency, and scale faster. Whether it's a custom business management system, mobile app, or complete digital transformation, I love turning ideas into reality.
  
  Would you be up for a quick 10-minute chat this week? I'd love to share some ideas on how technology could boost [Company Name]'s operations.
  
  Looking forward to connecting!
  Muhammad Nouman
  Full-Stack Developer | React.js | React Native | Node.js
  +92 3028954240`,

      casual: `Subject: Hey [Name] - Cool tech ideas for [Company Name]
  
  Hi [Name],
  
  Muhammad here! I'm a full-stack developer who builds web and mobile apps for businesses across the UAE.
  
  Saw [Company Name] online and thought - "These guys could probably use some cool tech to make their operations even smoother!" 
  
  I've built platforms for everything from trading companies to MLM businesses. Things like automated reporting systems, mobile apps for field teams, customer portals, and payment processing platforms.
  
  Quick question - are you guys looking to digitize any part of your business or build a custom app? I'd love to bounce some ideas around!
  
  Cheers,
  Nouman
  MERN Developer | React | Node.js | Mobile Apps`,
    },

    followup: {
      professional: `Subject: Following up on custom development solutions
  
  Dear [Name],
  
  I wanted to follow up on my previous email regarding custom development solutions for [Company Name].
  
  As promised, I've prepared some specific examples of how businesses in the [industry sector] have benefited from custom MERN stack applications:
  
  • **Automated Business Management**: Streamlined operations with real-time dashboards and reporting
  • **Mobile-First Solutions**: Field team apps for better customer service and data collection  
  • **Payment Integration**: Secure payment processing with multiple gateway support
  • **Performance Tracking**: Advanced analytics and KPI monitoring systems
  
  Given [Company Name]'s position in the UAE market, I believe a custom [web application/mobile app/business management system] could significantly enhance your competitive advantage.
  
  I have availability next week for a detailed discussion about your specific requirements and how we can build a solution that drives measurable results.
  
  Best regards,
  Muhammad Nouman
  Full-Stack MERN Developer
  Portfolio: noumanthedev.netlify.app`,

      friendly: `Subject: Quick follow-up on our development chat!
  
  Hi [Name],
  
  Thanks for taking the time to consider my proposal! I've been thinking more about [Company Name] and the potential tech solutions we discussed.
  
  I put together a few quick examples of similar projects I've delivered:
  - Real-time business dashboard for a trading company
  - MLM platform handling 10,000+ users with automated commissions
  - E-commerce system processing hundreds of orders daily
  - Mobile app for field service management
  
  The cool thing is, each project was tailored specifically to solve unique business challenges - just like what [Company Name] might be facing.
  
  What do you think about hopping on a call next week? I'd love to show you some demos and discuss your specific needs!
  
  Talk soon!
  Muhammad Nouman
  MERN Stack Developer | UAE Business Solutions`,
    },

    proposal: {
      professional: `Subject: Custom Development Proposal - [Project Name] for [Company Name]
  
  Dear [Name],
  
  Thank you for the opportunity to submit a proposal for [Company Name]'s custom development project. Based on our discussions about your requirements, I've prepared a comprehensive MERN stack solution.
  
  **Proposed Technical Solution:**
  • **Frontend**: React.js with Material-UI for responsive web interface
  • **Mobile App**: React Native for iOS/Android compatibility  
  • **Backend**: Node.js/Express.js API with MongoDB database
  • **Additional Features**: Real-time updates, payment integration, admin dashboard
  
  **Key Benefits for [Company Name]:**
  • Streamlined business operations with 40% efficiency improvement
  • Mobile-first approach for field teams and customers
  • Scalable architecture to support business growth
  • Secure payment processing and data management
  • 24/7 technical support and maintenance
  
  **Timeline**: 6-8 weeks for MVP, with iterative development approach
  **Investment**: Competitive rates with flexible payment terms
  
  The attached detailed proposal includes technical specifications, project phases, and cost breakdown. This solution will position [Company Name] as a technology leader in your sector.
  
  I'm available to present the proposal via video call and address any technical questions you might have.
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer
  Technical Portfolio: noumanthedev.netlify.app`,

      persuasive: `Subject: Transform [Company Name] with Custom Digital Solutions
  
  Dear [Name],
  
  Imagine if [Company Name] could automate 60% of your current manual processes, serve customers 24/7 through a mobile app, and have real-time insights into every aspect of your business operations.
  
  This isn't a dream - it's exactly what I've delivered for businesses across the UAE market.
  
  **Here's what's possible:**
  ✅ **Custom Business Management Platform**: Eliminate paperwork and automate workflows
  ✅ **Mobile App Development**: Reach customers where they are, when they want it
  ✅ **Real-time Analytics**: Make data-driven decisions with live dashboards
  ✅ **Payment Integration**: Process transactions seamlessly with multiple payment options
  ✅ **Scalable Architecture**: Grow without technology limitations
  
  I've built similar solutions for trading companies, financial services, and business management firms - delivering measurable ROI within 3-6 months.
  
  The UAE market is rapidly digitalizing. Companies that invest in custom technology solutions now will dominate their sectors tomorrow.
  
  Let's schedule a 20-minute call where I'll show you exactly how this could work for [Company Name], including live demos of similar projects.
  
  Ready to lead the digital transformation in your industry?
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer | Digital Transformation Specialist
  +92 3028954240`,
    },

    meeting: {
      professional: `Subject: Meeting Request - Custom Development Solutions Discussion
  
  Dear [Name],
  
  I would like to schedule a meeting to discuss custom MERN stack development opportunities for [Company Name].
  
  **Meeting Agenda:**
  • Current business challenges and digital requirements assessment
  • Technical solutions demonstration (live project examples)
  • Custom development roadmap and timeline discussion
  • Investment analysis and ROI projections
  • Q&A session about technical implementation
  
  **What I'll bring to the meeting:**
  - Portfolio of similar UAE business solutions
  - Technical architecture proposals
  - Cost-benefit analysis specific to your industry
  - Timeline and deliverables framework
  
  I estimate we'll need approximately 30-45 minutes for a comprehensive discussion. Would you be available for any of these time slots:
  
  • [Day/Date] at [Time]
  • [Day/Date] at [Time]  
  • [Day/Date] at [Time]
  
  I can meet at your office, via video conference, or at a convenient location in the UAE.
  
  Please let me know what works best for your schedule, and I'll send a calendar invitation with all the technical details.
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer
  noumanthedev.netlify.app`,

      casual: `Subject: Coffee chat about your tech needs?
  
  Hi [Name],
  
  Want to grab a coffee and talk about how some cool technology could boost [Company Name]'s operations?
  
  I'm thinking we could cover:
  - What's working (and what's not) in your current setup
  - Some awesome tech solutions I've built for similar businesses
  - Ideas for mobile apps, automation, or custom platforms
  - How other UAE companies are getting ahead with technology
  
  It's super informal - just a chance to share ideas and see if there's a good fit. I'll bring my laptop to show you some live demos of projects I've built.
  
  I'm flexible with timing - whatever works for you! Coffee's on me 😊
  
  Let me know what day works best!
  
  Cheers,
  Muhammad
  MERN Developer | Let's build something amazing together`,
    },

    thankyou: {
      professional: `Subject: Thank you for your time - Next steps for [Company Name]
  
  Dear [Name],
  
  Thank you for taking the time to meet with me yesterday to discuss custom development solutions for [Company Name]. I greatly enjoyed our conversation about your business goals and technical requirements.
  
  **Key points from our discussion:**
  • Your need for [specific requirement discussed]
  • The potential impact of [proposed solution]
  • Timeline expectations for project delivery
  • Budget considerations and ROI analysis
  
  **Next Steps:**
  1. I'll prepare a detailed technical proposal by [date]
  2. Cost breakdown and project timeline will be included
  3. Technical architecture documentation for your review
  
  I'm excited about the opportunity to help [Company Name] achieve its digital transformation goals. The solutions we discussed align perfectly with my expertise in building scalable MERN stack applications.
  
  I'll follow up early next week with the comprehensive proposal. Please don't hesitate to reach out if you have any additional questions in the meantime.
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer
  +92 3028954240`,

      friendly: `Subject: Thanks for the great meeting!
  
  Hi [Name],
  
  Thanks so much for yesterday's meeting! I really enjoyed learning more about [Company Name] and your vision for digital growth.
  
  I'm genuinely excited about the potential to work together on [specific project discussed]. The technical challenges you described are exactly the kind of problems I love solving with MERN stack solutions.
  
  I'm putting together everything we talked about:
  - The custom [web/mobile] solution we discussed
  - Timeline and milestones breakdown  
  - Some additional ideas that came to mind after our chat
  
  I'll have everything ready for you by [day]. In the meantime, feel free to ping me if any other questions come up!
  
  Looking forward to potentially building something awesome together 🚀
  
  Best,
  Muhammad Nouman
  Full-Stack Developer`,
    },

    reminder: {
      professional: `Subject: Gentle reminder - Custom development proposal for [Company Name]
  
  Dear [Name],
  
  I hope this email finds you well. I wanted to follow up on the custom development proposal I submitted for [Company Name] on [date].
  
  I understand that evaluating technical solutions requires careful consideration, especially when it comes to:
  • Technical architecture and scalability
  • Investment in digital transformation
  • Integration with existing systems
  • Timeline and resource allocation
  
  Given the competitive UAE market and the rapid pace of digital adoption, I believe the MERN stack solution we discussed could provide [Company Name] with a significant competitive advantage.
  
  **Quick Reminder of Key Benefits:**
  - 40-60% improvement in operational efficiency
  - Mobile-first customer engagement
  - Real-time business insights and analytics
  - Scalable platform for future growth
  
  Would you like to schedule a brief 15-minute call to address any questions or concerns about the proposal? I'm happy to clarify any technical aspects or adjust the solution to better fit your requirements.
  
  Looking forward to your response.
  
  Best regards,
  Muhammad Nouman
  MERN Stack Developer
  noumanthedev.netlify.app`,

      friendly: `Subject: Quick check-in on our development project discussion
  
  Hi [Name],
  
  Hope you're doing well! Just wanted to circle back on the custom development solutions we discussed for [Company Name].
  
  I know these decisions take time (and they should!), but I wanted to make sure you have everything you need from my end. 
  
  A few things I can help clarify if needed:
  - Technical questions about the MERN stack approach
  - Timeline adjustments to fit your schedule
  - Additional features or modifications to the proposal
  - References from other UAE businesses I've worked with
  
  No pressure at all - just want to make sure I'm available if you need anything!
  
  How's everything looking on your end?
  
  Best,
  Muhammad
  MERN Developer | Always here to help`,
    },
  };

  const generateTemplate = () => {
    if (selectedCategory === "custom" && !customPrompt.trim()) {
      message.warning("Please enter a custom prompt for template generation");
      return;
    }

    let template = "";

    if (selectedCategory === "custom") {
      // For custom prompts, create a basic structure
      template = `Subject: [Subject Line]

Dear [Name],

${customPrompt}

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`;
    } else {
      template =
        aiTemplates[selectedCategory]?.[selectedTone] ||
        aiTemplates[selectedCategory]?.professional ||
        "Template not available for this combination.";
    }

    setGeneratedTemplate(template);
    message.success("Email template generated successfully!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedTemplate);
    message.success("Template copied to clipboard!");
  };

  const saveTemplate = () => {
    if (!generatedTemplate.trim()) {
      message.warning("No template to save");
      return;
    }

    setEditingTemplate(null);
    form.setFieldsValue({
      name: `${categories.find((c) => c.value === selectedCategory)?.label} - ${
        tones.find((t) => t.value === selectedTone)?.label
      }`,
      category: selectedCategory,
      tone: selectedTone,
      content: generatedTemplate,
    });
    setIsModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields();

      if (editingTemplate) {
        await templateAPI.update(editingTemplate.id, values);
        message.success("Template updated successfully");
      } else {
        await templateAPI.create(values);
        message.success("Template saved successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      loadTemplates(); // Reload templates from API
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("Failed to save template");
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
      message.success("Template deleted successfully");
      loadTemplates(); // Reload templates from API
    } catch (error) {
      console.error("Error deleting template:", error);
      message.error("Failed to delete template");
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="AI Email Template Generator" extra={<RobotOutlined />}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text strong>Email Category:</Text>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder="Select email category"
                >
                  {categories.map((cat) => (
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
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder="Select tone"
                >
                  {tones.map((tone) => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {selectedCategory === "custom" && (
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
              style={{ fontFamily: "monospace" }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="Saved Templates" extra={<PlusOutlined />}>
        <Spin spinning={loading}>
          <List
            dataSource={savedTemplates}
            renderItem={(template) => (
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
                      message.success("Template loaded for editing");
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
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={template.name}
                  description={
                    <div>
                      <Tag color="blue">{template.category}</Tag>
                      <Tag color="green">{template.tone}</Tag>
                      <Text type="secondary">
                        Created:{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText:
                "No saved templates yet. Generate and save some templates!",
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingTemplate ? "Edit Template" : "Save Template"}
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
            rules={[
              { required: true, message: "Please enter a template name" },
            ]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select placeholder="Select category">
                  {categories.map((cat) => (
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
                rules={[{ required: true, message: "Please select a tone" }]}
              >
                <Select placeholder="Select tone">
                  {tones.map((tone) => (
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
            rules={[
              { required: true, message: "Please enter template content" },
            ]}
          >
            <TextArea rows={10} placeholder="Enter template content" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailTemplates;
