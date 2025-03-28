import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Card, 
  Breadcrumb, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  message 
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ReceiptGenerator from '../../../components/receipts/ReceiptGenerator';
import AdminGuard from '../../../components/AdminGuard';

const { Title } = Typography;

const CreateReceiptPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // クライアントデータの取得
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('クライアントデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClients();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="content-container">
          <Breadcrumb
            items={[
              { title: <Link href="/admin">管理画面</Link> },
              { title: <Link href="/admin/receipts">領収書管理</Link> },
              { title: '新規作成' },
            ]}
            style={{ marginBottom: 16 }}
          />
          
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>領収書作成</Title>
                <Space>
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => router.push('/admin/receipts')}
                  >
                    一覧に戻る
                  </Button>
                </Space>
              </div>
            }
          >
            <ReceiptGenerator clients={clients} />
          </Card>
        </div>
      </Layout>
    </AdminGuard>
  );
};

export default CreateReceiptPage;