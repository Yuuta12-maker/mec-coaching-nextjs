import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useRouter } from 'next/router';
import { 
  Button, 
  Card,
  Form, 
  Input, 
  DatePicker, 
  Select, 
  Spin, 
  message, 
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import { PrinterOutlined, MailOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const ReceiptGenerator = ({ clients = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const router = useRouter();

  // 自動採番
  useEffect(() => {
    form.setFieldsValue({
      receiptNumber: `MEC-${moment().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      issueDate: moment(),
      paymentMethod: 'bankTransfer',
      issuerName: '森山雄太',
      issuerTitle: 'マインドエンジニアリング・コーチング',
      issuerAddress: '〒790-0012 愛媛県松山市湊町2-5-2リコオビル401',
      taxRate: 10
    });
  }, [form]);

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

  // 領収書のプレビュー生成
  const generatePreview = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-preview', values);
      setPreview(response.data.previewUrl);
      message.success('プレビューを生成しました');
    } catch (error) {
      console.error('Error generating preview:', error);
      message.error('プレビュー生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // PDF生成と保存
  const generatePDF = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-pdf', values, {
        responseType: 'blob',
      });
      
      // PDFをStateに保存
      setPdfBlob(response.data);
      
      // 領収書レコードを保存
      await axios.post('/api/receipts/save-record', values);
      
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
    if (!pdfBlob) {
      message.error('まずPDFを生成してください');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // PDFをFormDataに追加
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `receipt_${values.receiptNumber}.pdf`);
      formData.append('data', JSON.stringify(values));
      
      await axios.post('/api/receipts/send-email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success('領収書をメールで送信しました');
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('メール送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receipt-generator">
      <Spin spinning={loading}>
        <Row gutter={24}>
          <Col span={16}>
            <Card 
              title="領収書情報入力" 
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  <Button 
                    icon={<EyeOutlined />} 
                    onClick={generatePreview}
                    disabled={loading}
                  >
                    プレビュー
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={generatePDF}
                    disabled={loading}
                  >
                    PDF生成
                  </Button>
                </Space>
              }
            >
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
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="アクション" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  block 
                  size="large"
                  onClick={generatePDF}
                  disabled={loading}
                >
                  領収書を生成
                </Button>
                
                <Button 
                  icon={<PrinterOutlined />} 
                  block 
                  size="large"
                  onClick={downloadPDF}
                  disabled={!pdfBlob || loading}
                >
                  PDFをダウンロード
                </Button>
                
                <Button 
                  icon={<MailOutlined />} 
                  block 
                  size="large"
                  onClick={sendByEmail}
                  disabled={!pdfBlob || loading}
                >
                  メールで送信
                </Button>
              </Space>
            </Card>
            
            {preview && (
              <Card title="プレビュー">
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
      </Spin>
    </div>
  );
};

export default ReceiptGenerator;