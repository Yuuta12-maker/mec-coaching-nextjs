import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Button, 
  Card, 
  Space, 
  Typography, 
  message, 
  Spin, 
  Breadcrumb 
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ReceiptList from '../../../components/receipts/ReceiptList';
import AdminGuard from '../../../components/AdminGuard';

const { Title } = Typography;

const ReceiptsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 領収書データの取得
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      message.error('領収書データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReceipts();
    }
  }, [status]);

  // 新規領収書作成ページへ移動
  const handleCreate = () => {
    router.push('/admin/receipts/create');
  };

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
              { title: '領収書管理' },
            ]}
            style={{ marginBottom: 16 }}
          />
          
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>領収書管理</Title>
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchReceipts}
                  >
                    更新
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreate}
                  >
                    新規作成
                  </Button>
                </Space>
              </div>
            }
          >
            <ReceiptList 
              receipts={receipts} 
              onRefresh={fetchReceipts} 
            />
          </Card>
        </div>
      </Layout>
    </AdminGuard>
  );
};

export default ReceiptsPage;