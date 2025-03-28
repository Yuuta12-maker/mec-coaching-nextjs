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
  message,
  Form,
  Input,
  DatePicker,
  Select,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PrinterOutlined, 
  MailOutlined,
  EyeOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';
import Layout from '../../../../components/Layout';
import AdminGuard from '../../../../components/AdminGuard';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditReceiptPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [form] = Form.useForm();
  
  const [receipt, setReceipt] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);

  // 領収書データの取得
  const fetchReceipt = async (receiptId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/receipts/${receiptId}`);
      setReceipt(response.data);
      
      // フォームに初期値を設定
      const data = response.data;
      form.setFieldsValue({
        receiptNumber: data.receiptNumber,
        issueDate: moment(data.issueDate),
        clientId: data.clientId || null,
        recipientName: data.recipientName,
        recipientAddress: data.recipientAddress || '',
        email: data.email || '',
        sessionType: getSessionTypeFromDescription(data.description) || 'other',
        description: data.description,
        amount: data.amount,
        taxRate: data.taxRate,
        paymentMethod: data.paymentMethod,
        issuerName: data.issuerName,
        issuerTitle: data.issuerTitle,
        issuerAddress: data.issuerAddress,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      message.error('領収書データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // クライアントデータの取得
  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('クライアントデータの取得に失敗しました');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && id) {
      Promise.all([
        fetchReceipt(id),
        fetchClients()
      ]);
    }
  }, [status, id]);

  // 説明文からセッションタイプを推測
  const getSessionTypeFromDescription = (description) => {
    if (!description) return null;
    
    if (description.includes('トライアル')) {
      return 'trial';
    } else if (description.includes('継続')) {
      return 'continuation';
    } else if (description.includes('全6回') || description.includes('フルプログラム')) {
      return 'full';
    }
    
    return 'other';
  };

  // セッションタイプが変更されたときに金額と説明を自動設定
  const handleSessionTypeChange = (value) => {
    if (value === 'trial') {
      form.setFieldsValue({ 
        amount: 6000,
        description: 'マインドエンジニアリング・コーチング トライアルセッション'
      });
    } else if (value === 'continuation') {
      form.setFieldsValue({ 
        amount: 214000,
        description: 'マインドエンジニアリング・コーチング 継続セッション（2回目〜6回目）'
      });
    } else if (value === 'full') {
      form.setFieldsValue({ 
        amount: 220000,
        description: 'マインドエンジニアリング・コーチング フルプログラム（全6回）'
      });
    }
  };

  // クライアントが選択されたときに情報を自動入力
  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      form.setFieldsValue({
        recipientName: selectedClient.name,
        recipientAddress: selectedClient.address || '',
        email: selectedClient.email || '',
      });
    }
  };

  // 領収書の更新
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // 日付を適切なフォーマットに変換
      const formattedValues = {
        ...values,
        issueDate: moment(values.issueDate).format('YYYY-MM-DD'),
      };
      
      await axios.put(`/api/receipts/${id}`, formattedValues);
      message.success('領収書を更新しました');
      router.push('/admin/receipts');
    } catch (error) {
      console.error('Error updating receipt:', error);
      message.error('領収書の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 領収書のプレビュー生成
  const generatePreview = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-preview', {
        ...values,
        issueDate: moment(values.issueDate).format('YYYY-MM-DD'),
      });
      setPreview(response.data.previewUrl);
      message.success('プレビューを生成しました');
    } catch (error) {
      console.error('Error generating preview:', error);
      message.error('プレビュー生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // PDF生成
  const generatePDF = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-pdf', {
        ...values,
        issueDate: moment(values.issueDate).format('YYYY-MM-DD'),
      }, {
        responseType: 'blob',
      });
      
      // PDFをStateに保存
      setPdfBlob(response.data);
      message.success('領収書PDFを生成しました');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('PDF生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // PDFダウンロード
  const downloadPDF = () => {
    if (!pdfBlob) {
      message.error('まずPDFを生成してください');
      return;
    }

    const receiptNumber = form.getFieldValue('receiptNumber');
    const recipientName = form.getFieldValue('recipientName');
    
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `領収書_${receiptNumber}_${recipientName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // メール送信
  const sendByEmail = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/receipts/send-email/${id}`);
      message.success('領収書をメールで送信しました');
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('メール送信に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading && !receipt) {
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
              { title: '編集' },
            ]}
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={24}>
            <Col span={16}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>領収書編集</Title>
                    <Space>
                      <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/admin/receipts')}
                      >
                        一覧に戻る
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />} 
                        onClick={handleUpdate}
                        loading={saving}
                      >
                        保存
                      </Button>
                    </Space>
                  </div>
                }
              >
                <Spin spinning={loading || saving}>
                  <Form
                    form={form}
                    layout="vertical"
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="領収書番号"
                          name="receiptNumber"
                          rules={[{ required: true, message: '領収書番号を入力してください' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      
                      <Col span={12}>
                        <Form.Item
                          label="発行日"
                          name="issueDate"
                          rules={[{ required: true, message: '発行日を選択してください' }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="YYYY年MM月DD日" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Divider orientation="left">クライアント情報</Divider>
                    
                    <Form.Item
                      label="クライアント選択"
                      name="clientId"
                    >
                      <Select 
                        placeholder="クライアントを選択"
                        onChange={handleClientChange}
                        allowClear
                      >
                        {clients.map(client => (
                          <Option key={client.id} value={client.id}>{client.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="宛名（受領者）"
                      name="recipientName"
                      rules={[{ required: true, message: '宛名を入力してください' }]}
                    >
                      <Input />
                    </Form.Item>
                    
                    <Form.Item
                      label="住所"
                      name="recipientAddress"
                    >
                      <Input />
                    </Form.Item>
                    
                    <Form.Item
                      label="メールアドレス"
                      name="email"
                      rules={[
                        { type: 'email', message: '有効なメールアドレスを入力してください' }
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    
                    <Divider orientation="left">支払い情報</Divider>
                    
                    <Form.Item
                      label="セッション種別"
                      name="sessionType"
                      rules={[{ required: true, message: 'セッション種別を選択してください' }]}
                    >
                      <Select 
                        placeholder="セッション種別を選択"
                        onChange={handleSessionTypeChange}
                      >
                        <Option value="trial">トライアルセッション</Option>
                        <Option value="continuation">継続セッション（2〜6回目）</Option>
                        <Option value="full">フルプログラム（全6回）</Option>
                        <Option value="other">その他</Option>
                      </Select>
                    </Form.Item>
                    
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item
                          label="品目・説明"
                          name="description"
                          rules={[{ required: true, message: '品目・説明を入力してください' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      
                      <Col span={8}>
                        <Form.Item
                          label="金額（税込）"
                          name="amount"
                          rules={[{ required: true, message: '金額を入力してください' }]}
                        >
                          <Input type="number" addonAfter="円" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item
                      label="消費税率"
                      name="taxRate"
                      rules={[{ required: true, message: '消費税率を入力してください' }]}
                    >
                      <Input type="number" addonAfter="%" style={{ width: '150px' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="支払方法"
                      name="paymentMethod"
                      rules={[{ required: true, message: '支払方法を選択してください' }]}
                    >
                      <Select placeholder="支払方法を選択">
                        <Option value="bankTransfer">銀行振込</Option>
                        <Option value="cash">現金</Option>
                        <Option value="creditCard">クレジットカード</Option>
                        <Option value="other">その他</Option>
                      </Select>
                    </Form.Item>
                    
                    <Divider orientation="left">発行者情報</Divider>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="発行者名"
                          name="issuerName"
                          rules={[{ required: true, message: '発行者名を入力してください' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      
                      <Col span={12}>
                        <Form.Item
                          label="事業名・組織名"
                          name="issuerTitle"
                          rules={[{ required: true, message: '事業名を入力してください' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item
                      label="発行者住所"
                      name="issuerAddress"
                      rules={[{ required: true, message: '発行者住所を入力してください' }]}
                    >
                      <Input />
                    </Form.Item>
                    
                    <Form.Item
                      label="備考"
                      name="notes"
                    >
                      <TextArea rows={3} />
                    </Form.Item>
                  </Form>
                </Spin>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title="アクション">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    icon={<EyeOutlined />} 
                    block 
                    size="large"
                    onClick={generatePreview}
                    disabled={loading || saving}
                  >
                    プレビュー
                  </Button>
                  
                  <Button 
                    icon={<SaveOutlined />} 
                    type="primary" 
                    block 
                    size="large"
                    onClick={generatePDF}
                    disabled={loading || saving}
                  >
                    PDF生成
                  </Button>
                  
                  <Button 
                    icon={<PrinterOutlined />} 
                    block 
                    size="large"
                    onClick={downloadPDF}
                    disabled={!pdfBlob || loading || saving}
                  >
                    PDFをダウンロード
                  </Button>
                  
                  <Button 
                    icon={<MailOutlined />} 
                    block 
                    size="large"
                    onClick={sendByEmail}
                    disabled={loading || saving}
                  >
                    メールで送信
                  </Button>
                </Space>
              </Card>
              
              {preview && (
                <Card title="プレビュー" style={{ marginTop: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={preview} 
                      alt="領収書プレビュー" 
                      style={{ maxWidth: '100%', border: '1px solid #eee' }} 
                    />
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        </div>
      </Layout>
    </AdminGuard>
  );
};

export default EditReceiptPage;