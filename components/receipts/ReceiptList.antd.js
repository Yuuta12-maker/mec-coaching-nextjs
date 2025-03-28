import React, { useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Input, DatePicker } from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  MailOutlined,
  SearchOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useRouter } from 'next/router';
import axios from 'axios';

const { RangePicker } = DatePicker;

const ReceiptList = ({ receipts = [], onRefresh }) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [loading, setLoading] = useState(false);

  // 検索フィルタリング
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = searchText ? 
      (receipt.recipientName?.toLowerCase().includes(searchText.toLowerCase()) ||
       receipt.receiptNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
       receipt.description?.toLowerCase().includes(searchText.toLowerCase())) : true;
    
    const matchesDateRange = dateRange[0] && dateRange[1] ? 
      (moment(receipt.issueDate).isSameOrAfter(dateRange[0], 'day') && 
       moment(receipt.issueDate).isSameOrBefore(dateRange[1], 'day')) : true;
    
    return matchesSearch && matchesDateRange;
  });

  // 領収書の再発行・編集
  const handleEdit = (record) => {
    router.push(`/admin/receipts/edit/${record.id}`);
  };

  // 領収書の削除
  const handleDelete = async (record) => {
    try {
      setLoading(true);
      await axios.delete(`/api/receipts/${record.id}`);
      message.success('領収書を削除しました');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      message.error('領収書の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 領収書をダウンロード
  const handleDownload = async (record) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/receipts/download/${record.id}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `領収書_${record.receiptNumber}_${record.recipientName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('領収書をダウンロードしました');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      message.error('領収書のダウンロードに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 領収書をメール送信
  const handleSendEmail = async (record) => {
    try {
      setLoading(true);
      await axios.post(`/api/receipts/send-email/${record.id}`);
      message.success('領収書をメールで送信しました');
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('メール送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // テーブル列の定義
  const columns = [
    {
      title: '領収書番号',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      sorter: (a, b) => a.receiptNumber.localeCompare(b.receiptNumber),
    },
    {
      title: '発行日',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (text) => moment(text).format('YYYY/MM/DD'),
      sorter: (a, b) => moment(a.issueDate).diff(moment(b.issueDate)),
    },
    {
      title: '宛名',
      dataIndex: 'recipientName',
      key: 'recipientName',
      sorter: (a, b) => a.recipientName.localeCompare(b.recipientName),
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => `${text.toLocaleString()}円`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '内容',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '支払方法',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text) => {
        const paymentMethods = {
          bankTransfer: '銀行振込',
          cash: '現金',
          creditCard: 'クレジットカード',
          other: 'その他'
        };
        
        const colorMap = {
          bankTransfer: 'blue',
          cash: 'green',
          creditCard: 'purple',
          other: 'default'
        };
        
        return <Tag color={colorMap[text]}>{paymentMethods[text] || text}</Tag>;
      },
      filters: [
        { text: '銀行振込', value: 'bankTransfer' },
        { text: '現金', value: 'cash' },
        { text: 'クレジットカード', value: 'creditCard' },
        { text: 'その他', value: 'other' },
      ],
      onFilter: (value, record) => record.paymentMethod === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<DownloadOutlined />} 
            size="small" 
            onClick={() => handleDownload(record)}
            title="ダウンロード"
          />
          <Button 
            icon={<MailOutlined />} 
            size="small" 
            onClick={() => handleSendEmail(record)}
            title="メール送信"
            disabled={!record.email}
          />
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
            title="編集"
          />
          <Popconfirm
            title="本当に削除しますか？"
            onConfirm={() => handleDelete(record)}
            okText="はい"
            cancelText="いいえ"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              title="削除"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="receipt-list">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="領収書番号・宛名・内容を検索"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <RangePicker
            placeholder={['開始日', '終了日']}
            onChange={setDateRange}
            format="YYYY/MM/DD"
          />
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredReceipts}
        rowKey="id"
        loading={loading}
        pagination={{ 
          showSizeChanger: true,
          showTotal: (total) => `合計 ${total} 件`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 10
        }}
      />
    </div>
  );
};

export default ReceiptList;