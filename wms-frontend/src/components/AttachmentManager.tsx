import React, { useState, useEffect } from 'react';
import {
  Upload,
  Button,
  List,
  Modal,
  Image,
  message,
  Popconfirm,
  Space,
  Tag,
  Select,
  Checkbox,
  Card,
  Tooltip,
  Row,
  Col,
  Input,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  InboxOutlined,
  FolderOutlined,
  LinkOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { Attachment } from '@/types';
import { attachmentAPI } from '@/services/attachment.service';
import AttachmentUploader from './AttachmentUploader';
import dayjs from 'dayjs';

const { Dragger } = Upload;

// 附件分类选项
const CATEGORIES = [
  { value: 'default', label: '默认', color: 'default' },
  { value: 'image', label: '图片', color: 'blue' },
  { value: 'document', label: '文档', color: 'green' },
  { value: 'contract', label: '合同', color: 'orange' },
  { value: 'other', label: '其他', color: 'purple' },
];

interface AttachmentManagerProps {
  entityType: string;
  entityId: number;
  maxCount?: number;
  maxSize?: number; // 单个文件最大大小（MB）
  accept?: string;
  disabled?: boolean;
  storageType?: string;
  useProgressUploader?: boolean; // 是否使用带进度条的上传器
  // 允许外部传入上传按钮的渲染函数
  renderUploadButton?: (props: { onClick: () => void; loading: boolean }) => React.ReactNode;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  entityType,
  entityId,
  maxCount = 10,
  maxSize = 100,
  accept,
  disabled = false,
  storageType,
  useProgressUploader = true, // 默认使用进度条上传器
  renderUploadButton,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<number[]>([]);

  // 上传预览相关状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('default');

  // 文件查看器状态
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerContent, setViewerContent] = useState<{ type: 'image' | 'pdf' | 'other'; url: string; title: string } | null>(null);

  // 分享链接状态
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [sharingAttachmentId, setSharingAttachmentId] = useState<number | null>(null);

  // 加载附件列表
  const loadAttachments = async () => {
    if (!entityId) return;

    try {
      setLoading(true);
      const response = await attachmentAPI.getByEntity(entityType, entityId);
      if (response.success) {
        setAttachments(response.data || []);
      }
    } catch (error: any) {
      message.error(error.message || '加载附件失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [entityType, entityId]);

  // 打开上传预览对话框
  const openUploadModal = () => {
    if (disabled || !entityId) {
      message.warning('请先保存主记录再上传附件');
      return;
    }
    setUploadModalVisible(true);
  };

  // 处理文件选择（拖拽或点击）
  const handleFilesChange: UploadProps['onChange'] = (info) => {
    setFilesToUpload(info.fileList);
  };

  // 确认上传
  const handleConfirmUpload = async () => {
    if (filesToUpload.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    try {
      setUploading(true);

      const files = filesToUpload.map((file) => file.originFileObj).filter(Boolean) as File[];

      if (files.length === 1) {
        const response = await attachmentAPI.uploadSingle(
          files[0],
          entityType,
          entityId,
          storageType,
          selectedCategory
        );
        if (response.success) {
          message.success('上传成功');
        }
      } else {
        const response = await attachmentAPI.uploadMultiple(
          files,
          entityType,
          entityId,
          storageType,
          selectedCategory
        );
        if (response.success) {
          message.success(`成功上传 ${response.data.length} 个文件`);
        }
      }

      // 关闭对话框并重置状态
      setUploadModalVisible(false);
      setFilesToUpload([]);
      setSelectedCategory('default');
      loadAttachments();
    } catch (error: any) {
      message.error(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 取消上传
  const handleCancelUpload = () => {
    setUploadModalVisible(false);
    setFilesToUpload([]);
    setSelectedCategory('default');
  };

  // 删除单个附件
  const handleDelete = async (id: number) => {
    try {
      const response = await attachmentAPI.delete(id);
      if (response.success) {
        message.success('删除成功');
        loadAttachments();
        setSelectedAttachments(selectedAttachments.filter(sid => sid !== id));
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedAttachments.length === 0) {
      message.warning('请选择要删除的附件');
      return;
    }

    try {
      const response = await attachmentAPI.deleteBatch(selectedAttachments);
      if (response.success) {
        message.success(`成功删除 ${selectedAttachments.length} 个附件`);
        setSelectedAttachments([]);
        loadAttachments();
      }
    } catch (error: any) {
      message.error(error.message || '批量删除失败');
    }
  };

  // 批量下载
  const handleBatchDownload = async () => {
    if (selectedAttachments.length === 0) {
      message.warning('请选择要下载的附件');
      return;
    }

    try {
      await attachmentAPI.download(selectedAttachments);
      message.success('下载成功');
    } catch (error: any) {
      message.error(error.message || '下载失败');
    }
  };

  // 查看附件
  const handleView = async (attachment: Attachment) => {
    if (!attachment.storageUrl) {
      message.error('无法查看此附件');
      return;
    }

    if (attachment.mimeType.startsWith('image/')) {
      setViewerContent({
        type: 'image',
        url: attachment.storageUrl,
        title: attachment.fileName,
      });
      setViewerVisible(true);
    } else if (attachment.mimeType === 'application/pdf') {
      setViewerContent({
        type: 'pdf',
        url: attachment.storageUrl,
        title: attachment.fileName,
      });
      setViewerVisible(true);
    } else {
      // 其他文件类型，在新窗口打开
      window.open(attachment.storageUrl, '_blank');
    }
  };

  // 下载单个附件
  const handleDownload = (attachment: Attachment) => {
    if (attachment.storageUrl) {
      const link = document.createElement('a');
      link.href = attachment.storageUrl;
      link.download = attachment.fileName;
      link.click();
    }
  };

  // 生成分享链接
  const handleGenerateShareLink = async (id: number) => {
    try {
      const response = await attachmentAPI.generateShareLink(id, 7);
      if (response.success) {
        setShareLink(response.data.shareUrl);
        setSharingAttachmentId(id);
        setShareModalVisible(true);
        message.success('分享链接已生成');
      }
    } catch (error: any) {
      message.error(error.message || '生成分享链接失败');
    }
  };

  // 更新附件分类
  const handleUpdateCategory = async (id: number, category: string) => {
    try {
      const response = await attachmentAPI.updateCategory(id, category);
      if (response.success) {
        message.success('分类更新成功');
        loadAttachments();
      }
    } catch (error: any) {
      message.error(error.message || '更新分类失败');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedAttachments.length === attachments.length) {
      setSelectedAttachments([]);
    } else {
      setSelectedAttachments(attachments.map(att => att.id));
    }
  };

  // 切换单个选择
  const toggleSelect = (id: number) => {
    if (selectedAttachments.includes(id)) {
      setSelectedAttachments(selectedAttachments.filter(sid => sid !== id));
    } else {
      setSelectedAttachments([...selectedAttachments, id]);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed'))
      return '📦';
    return '📎';
  };

  // 获取分类标签
  const getCategoryTag = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
    return <Tag color={cat.color}>{cat.label}</Tag>;
  };

  // 上传配置（用于拖拽上传）
  const uploadProps: UploadProps = {
    accept,
    maxCount,
    multiple: true,
    beforeUpload: () => false, // 阻止自动上传
    onChange: handleFilesChange,
    fileList: filesToUpload,
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 外置上传按钮（可自定义） */}
        {renderUploadButton ? (
          renderUploadButton({ onClick: openUploadModal, loading: uploading })
        ) : (
          <Button icon={<UploadOutlined />} onClick={openUploadModal} disabled={disabled || !entityId}>
            上传附件
          </Button>
        )}

        {/* 批量操作工具栏 */}
        {attachments.length > 0 && (
          <Card size="small">
            <Space>
              <Checkbox
                checked={selectedAttachments.length === attachments.length && attachments.length > 0}
                indeterminate={selectedAttachments.length > 0 && selectedAttachments.length < attachments.length}
                onChange={handleSelectAll}
              >
                全选
              </Checkbox>
              <span style={{ color: '#999' }}>
                已选 {selectedAttachments.length} / {attachments.length} 项
              </span>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={selectedAttachments.length === 0}
                onClick={handleBatchDownload}
              >
                批量下载
              </Button>
              <Popconfirm
                title={`确定删除选中的 ${selectedAttachments.length} 个附件？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
                disabled={selectedAttachments.length === 0}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedAttachments.length === 0}
                >
                  批量删除
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        )}

        {/* 附件列表 */}
        <List
          loading={loading}
          dataSource={attachments}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Checkbox
                  checked={selectedAttachments.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />,
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(item)}
                >
                  查看
                </Button>,
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(item)}
                >
                  下载
                </Button>,
                <Button
                  type="link"
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={() => handleGenerateShareLink(item.id)}
                >
                  分享
                </Button>,
                <Popconfirm
                  title="确定删除此附件？"
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 24 }}>{getFileIcon(item.mimeType)}</span>}
                title={
                  <Space>
                    {item.fileName}
                    <Select
                      size="small"
                      value={item.category}
                      style={{ width: 100 }}
                      onChange={(value) => handleUpdateCategory(item.id, value)}
                    >
                      {CATEGORIES.map(cat => (
                        <Select.Option key={cat.value} value={cat.value}>
                          {cat.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Space>
                }
                description={
                  <Space size="large">
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span>上传于：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    {item.uploadedByName && <span>上传人：{item.uploadedByName}</span>}
                    {item.isShared && (
                      <Tooltip title="此文件已分享">
                        <Tag icon={<ShareAltOutlined />} color="success">已分享</Tag>
                      </Tooltip>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        {/* 上传预览与确认对话框 */}
        {useProgressUploader ? (
          <AttachmentUploader
            visible={uploadModalVisible}
            onCancel={() => {
              setUploadModalVisible(false);
              setSelectedCategory('default');
            }}
            onSuccess={() => {
              setUploadModalVisible(false);
              setSelectedCategory('default');
              loadAttachments();
            }}
            entityType={entityType}
            entityId={entityId}
            category={selectedCategory}
            maxCount={maxCount}
            maxSize={maxSize}
            accept={accept}
            storageType={storageType}
          />
        ) : (
          <Modal
            title="上传附件"
            open={uploadModalVisible}
            onOk={handleConfirmUpload}
            onCancel={handleCancelUpload}
            confirmLoading={uploading}
            width={700}
            okText="确认上传"
            cancelText="取消"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 分类选择 */}
              <div>
                <label style={{ marginRight: 8 }}>附件分类：</label>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: 200 }}
                >
                  {CATEGORIES.map(cat => (
                    <Select.Option key={cat.value} value={cat.value}>
                      <Tag color={cat.color}>{cat.label}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* 拖拽上传区域 */}
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个或批量上传，最多 {maxCount} 个文件
                </p>
              </Dragger>

              {/* 文件预览列表 */}
              {filesToUpload.length > 0 && (
                <Card title="待上传文件" size="small">
                  <List
                    dataSource={filesToUpload}
                    renderItem={(file) => (
                      <List.Item>
                        <Space>
                          <span>{getFileIcon(file.type || '')}</span>
                          <span>{file.name}</span>
                          <span style={{ color: '#999' }}>
                            {formatFileSize(file.size || 0)}
                          </span>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Space>
          </Modal>
        )}

        {/* 文件查看器 */}
        <Modal
          title={viewerContent?.title}
          open={viewerVisible}
          footer={null}
          onCancel={() => setViewerVisible(false)}
          width={viewerContent?.type === 'pdf' ? 1000 : 800}
          style={{ top: 20 }}
        >
          {viewerContent?.type === 'image' && (
            <Image
              alt={viewerContent.title}
              style={{ width: '100%' }}
              src={viewerContent.url}
              preview={false}
            />
          )}
          {viewerContent?.type === 'pdf' && (
            <iframe
              src={viewerContent.url}
              style={{ width: '100%', height: '80vh', border: 'none' }}
              title={viewerContent.title}
            />
          )}
        </Modal>

        {/* 分享链接对话框 */}
        <Modal
          title="分享链接"
          open={shareModalVisible}
          onCancel={() => setShareModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setShareModalVisible(false)}>
              关闭
            </Button>,
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>分享链接已生成，有效期7天：</div>
            <Input.TextArea
              value={shareLink}
              readOnly
              rows={3}
              style={{ fontFamily: 'monospace' }}
            />
            <Button
              icon={<LinkOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                message.success('链接已复制到剪贴板');
              }}
            >
              复制链接
            </Button>
          </Space>
        </Modal>
      </Space>
    </div>
  );
};

export default AttachmentManager;
