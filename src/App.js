import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  MailOutlined, 
  FileTextOutlined, 
  DashboardOutlined,
  ContactsOutlined 
} from '@ant-design/icons';
import LeadManagement from './components/LeadManagement';
import EmailTemplates from './components/EmailTemplates';
import BulkEmail from './components/BulkEmail';
import Dashboard from './components/Dashboard';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [selectedKey, setSelectedKey] = useState('1');
  const [leads, setLeads] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // Load leads from localStorage on component mount
  useEffect(() => {
    const savedLeads = localStorage.getItem('leads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    }
  }, []);

  // Save leads to localStorage whenever leads change
  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '2',
      icon: <ContactsOutlined />,
      label: 'Lead Management',
    },
    {
      key: '3',
      icon: <FileTextOutlined />,
      label: 'Email Templates',
    },
    {
      key: '4',
      icon: <MailOutlined />,
      label: 'Bulk Email',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case '1':
        return <Dashboard leads={leads} />;
      case '2':
        return <LeadManagement leads={leads} setLeads={setLeads} />;
      case '3':
        return <EmailTemplates />;
      case '4':
        return <BulkEmail leads={leads} />;
      default:
        return <Dashboard leads={leads} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'LAT' : 'LeadForge'}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['1']}
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center',
            height: '100%'
          }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              LeadForge
            </Title>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
