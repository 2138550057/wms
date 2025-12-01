import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Spin, Empty, Select, Input, Row, Col, Image, Checkbox, Dropdown, Tooltip } from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseOutlined,
  SettingOutlined,
  FolderOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Attachment } from '@/types';
import { attachmentAPI } from '@/services/attachment.service';
import AttachmentUploader from './AttachmentUploader';
import AttachmentCategoryManager from './AttachmentCategoryManager';
import './AttachmentViewer.css';

interface AttachmentViewerProps {
  visible: boolean;
  onCancel: () => void;
  entityType: string;
  entityId: number;
  title?: string;
  orderNo?: string;
  warehouseEntryNo?: string;
  actualQuantity?: number;
  vehicleNumber?: string;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  visible,
  onCancel,
  entityType,
  entityId,
  title = '查看附件',
  orderNo,
  warehouseEntryNo,
  actualQuantity,
  vehicleNumber,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<number[]>([]);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);

  // 附件分类选项 - 从 localStorage 读取
  useEffect(() => {
    loadCategories();
  }, [categoryManagerVisible]); // 当分类管理器关闭时重新加载

  const loadCategories = () => {
    const savedCategories = localStorage.getItem('attachment_categories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategories([{ value: 'all', label: '全部' }, ...parsed]);
      } catch (error) {
        console.error('Failed to parse categories:', error);
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const DEFAULT_CATEGORIES = [
    { value: 'all', label: '全部' },
    { value: 'default', label: '默认' },
    { value: 'image', label: '图片' },
    { value: 'document', label: '文档' },
    { value: 'contract', label: '合同' },
    { value: 'other', label: '其他' },
  ];

  // 加载附件列表
  const loadAttachments = async () => {
    if (!entityId || !visible) return;

    try {
      setLoading(true);
      const response = await attachmentAPI.getByEntity(entityType, entityId);
      if (response.success) {
        setAttachments(response.data || []);
        filterAttachments(response.data || [], selectedCategory);
      }
    } catch (error: any) {
      message.error(error.message || '加载附件失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [entityType, entityId, visible]);

  useEffect(() => {
    // Reset selections when attachments change
    setSelectedAttachments([]);
  }, [filteredAttachments]);

  // 筛选附件
  const filterAttachments = (list: Attachment[], category: string) => {
    if (category === 'all') {
      setFilteredAttachments(list);
    } else {
      setFilteredAttachments(list.filter((item) => item.category === category));
    }
  };

  // 分类变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    filterAttachments(attachments, value);
  };

  // 预览图片
  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  // 选择/取消选择附件
  const handleSelectAttachment = (id: number) => {
    setSelectedAttachments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedAttachments.length === filteredAttachments.length) {
      setSelectedAttachments([]);
    } else {
      setSelectedAttachments(filteredAttachments.map((item) => item.id));
    }
  };

  // 查看单个附件
  const handleView = (attachment: Attachment) => {
    if (attachment.mimeType.startsWith('image/') && attachment.storageUrl) {
      handlePreview(attachment.storageUrl);
    } else if (attachment.storageUrl) {
      window.open(attachment.storageUrl, '_blank');
    } else {
      message.warning('附件地址不可用');
    }
  };

  // 下载单个附件
  const handleDownloadSingle = async (attachment: Attachment) => {
    try {
      await attachmentAPI.download([attachment.id]);
      message.success('下载成功');
    } catch (error: any) {
      message.error(error.message || '下载失败');
    }
  };

  // 分享单个附件
  const handleShareSingle = async (attachment: Attachment) => {
    try {
      const response = await attachmentAPI.generateShareLink(attachment.id, 7);
      if (response.success && response.data) {
        await navigator.clipboard.writeText(response.data.shareUrl);
        message.success('分享链接已复制到剪贴板');
        loadAttachments();
      }
    } catch (error: any) {
      message.error(error.message || '分享失败');
    }
  };

  // 删除单个附件
  const handleDeleteSingle = async (attachment: Attachment) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除附件"${attachment.fileName}"吗？`,
      onOk: async () => {
        try {
          const response = await attachmentAPI.delete(attachment.id);
          if (response.success) {
            message.success('删除成功');
            loadAttachments();
          }
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  // 全部下载
  const handleDownloadAll = async () => {
    const targetAttachments = selectedAttachments.length > 0
      ? selectedAttachments
      : filteredAttachments.map((item) => item.id);

    if (targetAttachments.length === 0) {
      message.warning('没有可下载的附件');
      return;
    }

    try {
      await attachmentAPI.download(targetAttachments);
      message.success('下载成功');
    } catch (error: any) {
      message.error(error.message || '下载失败');
    }
  };

  // 全部共享
  const handleShareAll = async () => {
    const targetAttachments = selectedAttachments.length > 0
      ? attachments.filter((item) => selectedAttachments.includes(item.id))
      : filteredAttachments;

    if (targetAttachments.length === 0) {
      message.warning('没有可共享的附件');
      return;
    }

    try {
      let successCount = 0;
      for (const attachment of targetAttachments) {
        if (!attachment.isShared) {
          const response = await attachmentAPI.generateShareLink(attachment.id, 7);
          if (response.success) {
            successCount++;
          }
        }
      }
      message.success(`成功共享 ${successCount} 个附件`);
      loadAttachments();
    } catch (error: any) {
      message.error(error.message || '共享失败');
    }
  };

  // 取消全部共享
  const handleUnshareAll = () => {
    message.info('取消共享功能待实现');
  };

  // 删除选中的附件
  const handleDeleteSelected = async () => {
    if (selectedAttachments.length === 0) {
      message.warning('请先选择要删除的附件');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedAttachments.length} 个附件吗？`,
      onOk: async () => {
        try {
          let successCount = 0;
          for (const id of selectedAttachments) {
            const response = await attachmentAPI.delete(id);
            if (response.success) {
              successCount++;
            }
          }
          message.success(`成功删除 ${successCount} 个附件`);
          loadAttachments();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  return (
    <>
      <Modal
        title={title}
        open={visible}
        onCancel={onCancel}
        width={1400}
        style={{ top: 20 }}
        footer={null}
        className="attachment-viewer-modal"
      >
        <div className="attachment-viewer-container">
          {/* 左侧筛选面板 */}
          <div className="attachment-viewer-sidebar">
            <div className="filter-item">
              <label>附件类型:</label>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ width: '100%' }}
              >
                {categories.map((cat) => (
                  <Select.Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="filter-item">
              <label>作业编号:</label>
              <Input value={orderNo} disabled />
            </div>

            <div className="filter-item">
              <label>进仓编号:</label>
              <Input value={warehouseEntryNo} disabled />
            </div>

            <div className="filter-item">
              <label>实收件数:</label>
              <Input value={actualQuantity} disabled />
            </div>

            <div className="filter-item">
              <label>车牌号:</label>
              <Input value={vehicleNumber} disabled />
            </div>
          </div>

          {/* 右侧附件展示区域 */}
          <div className="attachment-viewer-content">
            <Spin spinning={loading}>
              {filteredAttachments.length === 0 ? (
                <Empty description="暂无附件" style={{ marginTop: 100 }} />
              ) : (
                <>
                  {/* 全选控制 */}
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Checkbox
                      checked={selectedAttachments.length === filteredAttachments.length && filteredAttachments.length > 0}
                      indeterminate={selectedAttachments.length > 0 && selectedAttachments.length < filteredAttachments.length}
                      onChange={handleSelectAll}
                    >
                      全选 ({selectedAttachments.length}/{filteredAttachments.length})
                    </Checkbox>
                    {selectedAttachments.length > 0 && (
                      <Space>
                        <Button
                          size="small"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleDeleteSelected}
                        >
                          删除选中
                        </Button>
                      </Space>
                    )}
                  </div>

                  <div className="attachment-grid">
                    {filteredAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={`attachment-item ${selectedAttachments.includes(attachment.id) ? 'attachment-item-selected' : ''}`}
                      >
                        {/* 选择框 */}
                        <div className="attachment-checkbox">
                          <Checkbox
                            checked={selectedAttachments.includes(attachment.id)}
                            onChange={() => handleSelectAttachment(attachment.id)}
                          />
                        </div>

                        {/* 缩略图/图标 */}
                        {attachment.mimeType.startsWith('image/') && attachment.storageUrl ? (
                          <div
                            className="attachment-thumbnail"
                            onClick={() => handleView(attachment)}
                          >
                            <img src={attachment.storageUrl} alt={attachment.fileName} />
                          </div>
                        ) : (
                          <div className="attachment-file-icon" onClick={() => handleView(attachment)}>
                            📄
                          </div>
                        )}

                        {/* 文件信息 */}
                        <div className="attachment-info">
                          <div className="attachment-name" title={attachment.fileName}>
                            {attachment.fileName}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="attachment-actions">
                          <Space size="small">
                            <Tooltip title="查看">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleView(attachment)}
                              />
                            </Tooltip>
                            <Tooltip title="下载">
                              <Button
                                type="text"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownloadSingle(attachment)}
                              />
                            </Tooltip>
                            <Tooltip title="分享">
                              <Button
                                type="text"
                                size="small"
                                icon={<ShareAltOutlined />}
                                onClick={() => handleShareSingle(attachment)}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteSingle(attachment)}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Spin>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="attachment-viewer-footer">
          <Space>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setCategoryManagerVisible(true)}
            >
              附件类型设置
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              上传附件
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadAll}
              disabled={filteredAttachments.length === 0}
            >
              {selectedAttachments.length > 0 ? `下载选中(${selectedAttachments.length})` : '全部下载'}
            </Button>
            <Button
              icon={<FolderOutlined />}
              onClick={handleDownloadAll}
              disabled={filteredAttachments.length === 0}
            >
              {selectedAttachments.length > 0 ? `下载选中(文件夹)` : '全部下载(文件夹)'}
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShareAll}
              disabled={filteredAttachments.length === 0}
            >
              {selectedAttachments.length > 0 ? `共享选中(${selectedAttachments.length})` : '全部共享'}
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleUnshareAll}
              disabled={filteredAttachments.length === 0}
            >
              全部不共享
            </Button>
            <Button icon={<CloseOutlined />} onClick={onCancel}>
              关闭
            </Button>
          </Space>
        </div>
      </Modal>

      {/* 上传附件弹窗 */}
      <AttachmentUploader
        visible={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        onSuccess={() => {
          setUploadVisible(false);
          loadAttachments();
        }}
        entityType={entityType}
        entityId={entityId}
        category={selectedCategory === 'all' ? 'default' : selectedCategory}
      />

      {/* 图片预览 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />

      {/* 附件类型管理 */}
      <AttachmentCategoryManager
        visible={categoryManagerVisible}
        onCancel={() => setCategoryManagerVisible(false)}
      />
    </>
  );
};

export default AttachmentViewer;
