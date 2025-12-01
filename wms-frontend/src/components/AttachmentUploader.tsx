import React, { useState, useEffect } from 'react';
import { Upload, Progress, message, Modal, Card, Space, Button, Select, Tag } from 'antd';
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload';
import { attachmentAPI } from '@/services/attachment.service';

const { Dragger } = Upload;

// 默认附件分类选项
const DEFAULT_CATEGORIES = [
  { value: 'default', label: '默认', color: 'default' },
  { value: 'image', label: '图片', color: 'blue' },
  { value: 'document', label: '文档', color: 'green' },
  { value: 'contract', label: '合同', color: 'orange' },
  { value: 'other', label: '其他', color: 'purple' },
];

// 从 localStorage 读取分类
const getCategories = () => {
  const savedCategories = localStorage.getItem('attachment_categories');
  if (savedCategories) {
    try {
      return JSON.parse(savedCategories);
    } catch (error) {
      console.error('Failed to parse categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }
  return DEFAULT_CATEGORIES;
};

interface UploadProgressFile extends UploadFile {
  progress?: number;
  uploadedSize?: number;
  totalSize?: number;
}

interface AttachmentUploaderProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  entityType: string;
  entityId: number;
  category?: string;
  maxCount?: number;
  maxSize?: number; // MB
  accept?: string;
  storageType?: string;
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  visible,
  onCancel,
  onSuccess,
  entityType,
  entityId,
  category = 'default',
  maxCount = 10,
  maxSize = 100, // 默认100MB
  accept,
  storageType,
}) => {
  const [fileList, setFileList] = useState<UploadProgressFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [categories, setCategories] = useState(getCategories());

  // 当 modal 打开或 category prop 变化时，重置 category 状态
  useEffect(() => {
    if (visible) {
      setSelectedCategory(category);
      setCategories(getCategories()); // 重新加载分类
    }
  }, [visible, category]);

  // 处理文件选择
  const handleBeforeUpload = (file: RcFile, list: RcFile[]) => {
    // 检查文件大小
    const isLt = file.size / 1024 / 1024 < maxSize;
    if (!isLt) {
      message.error(`文件 ${file.name} 大小超过 ${maxSize}MB!`);
      return Upload.LIST_IGNORE;
    }

    // 添加到文件列表
    const newFile: UploadProgressFile = {
      uid: file.uid,
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: file,
      status: 'ready',
      progress: 0,
      uploadedSize: 0,
      totalSize: file.size,
    };

    setFileList(prev => {
      if (prev.length + list.length > maxCount) {
        message.warning(`最多只能上传 ${maxCount} 个文件`);
        return prev;
      }
      return [...prev, newFile];
    });

    return false; // 阻止自动上传
  };

  // 移除文件
  const handleRemove = (file: UploadFile) => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
  };

  // 上传文件（带进度）
  const uploadFileWithProgress = async (file: UploadProgressFile): Promise<boolean> => {
    return new Promise((resolve) => {
      const originFile = file.originFileObj as File;
      const formData = new FormData();
      formData.append('file', originFile);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId.toString());
      if (storageType) {
        formData.append('storageType', storageType);
      }
      if (selectedCategory) {
        formData.append('category', selectedCategory);
      }

      // 使用 XMLHttpRequest 来跟踪上传进度
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);

          setFileList(prev =>
            prev.map(item =>
              item.uid === file.uid
                ? {
                    ...item,
                    progress: percent,
                    uploadedSize: e.loaded,
                    totalSize: e.total,
                    status: 'uploading' as const,
                  }
                : item
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setFileList(prev =>
                prev.map(item =>
                  item.uid === file.uid
                    ? { ...item, status: 'done' as const, progress: 100 }
                    : item
                )
              );
              resolve(true);
            } else {
              throw new Error(response.message || '上传失败');
            }
          } catch (error) {
            setFileList(prev =>
              prev.map(item =>
                item.uid === file.uid
                  ? { ...item, status: 'error' as const }
                  : item
              )
            );
            message.error(`${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
            resolve(false);
          }
        } else {
          setFileList(prev =>
            prev.map(item =>
              item.uid === file.uid
                ? { ...item, status: 'error' as const }
                : item
            )
          );
          message.error(`${file.name} 上传失败: HTTP ${xhr.status}`);
          resolve(false);
        }
      });

      xhr.addEventListener('error', () => {
        setFileList(prev =>
          prev.map(item =>
            item.uid === file.uid
              ? { ...item, status: 'error' as const }
              : item
          )
        );
        message.error(`${file.name} 上传失败: 网络错误`);
        resolve(false);
      });

      xhr.addEventListener('abort', () => {
        setFileList(prev =>
          prev.map(item =>
            item.uid === file.uid
              ? { ...item, status: 'error' as const }
              : item
          )
        );
        message.warning(`${file.name} 上传已取消`);
        resolve(false);
      });

      // 获取token并发送请求
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      xhr.open('POST', `${apiBaseUrl}/attachments/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  };

  // 开始上传所有文件
  const handleUploadAll = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    setUploading(true);

    try {
      // 并发上传所有文件
      const results = await Promise.all(
        fileList.map(file => uploadFileWithProgress(file))
      );

      const successCount = results.filter(Boolean).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        message.success(`成功上传 ${successCount} 个文件`);
        // 调用成功回调，让父组件刷新附件列表和关闭弹窗
        onSuccess();
        // 清空文件列表
        setFileList([]);
        setSelectedCategory('default');
      } else if (successCount > 0) {
        message.warning(`成功上传 ${successCount} 个文件，${failCount} 个文件上传失败`);
        // 部分成功也需要刷新
        onSuccess();
        // 清空已成功的文件，保留失败的
        const failedFiles = fileList.filter((_, index) => !results[index]);
        setFileList(failedFiles);
      } else {
        message.error('所有文件上传失败');
      }
    } catch (error: any) {
      message.error(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 取消上传
  const handleCancel = () => {
    setFileList([]);
    setSelectedCategory('default');
    onCancel();
  };

  // 格式化文件大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title="上传附件"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={uploading}>
          取消
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUploadAll}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          {uploading ? '上传中...' : `上传 ${fileList.length} 个文件`}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 分类选择 */}
        <div>
          <label style={{ marginRight: 8 }}>附件分类：</label>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 200 }}
            disabled={uploading}
          >
            {categories.map(cat => (
              <Select.Option key={cat.value} value={cat.value}>
                <Tag color={cat.color}>{cat.label}</Tag>
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 拖拽上传区域 */}
        <Dragger
          multiple
          beforeUpload={handleBeforeUpload}
          onRemove={handleRemove}
          showUploadList={false}
          accept={accept}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持批量上传，最多 {maxCount} 个文件，单个文件不超过 {maxSize}MB
          </p>
        </Dragger>

        {/* 文件列表和进度 */}
        {fileList.length > 0 && (
          <Card title={`待上传文件 (${fileList.length}/${maxCount})`} size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {fileList.map(file => (
                <Card key={file.uid} size="small" type="inner">
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        {file.status === 'done' && (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        )}
                        {file.status === 'error' && (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                        )}
                        <span style={{ fontWeight: 500 }}>{file.name}</span>
                      </Space>
                      <Space>
                        <span style={{ color: '#999' }}>
                          {file.uploadedSize && file.totalSize
                            ? `${formatBytes(file.uploadedSize)} / ${formatBytes(file.totalSize)}`
                            : formatBytes(file.size || 0)}
                        </span>
                        {!uploading && file.status !== 'done' && (
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => handleRemove(file)}
                          >
                            移除
                          </Button>
                        )}
                      </Space>
                    </Space>

                    {/* 进度条 */}
                    {(file.status === 'uploading' || file.status === 'done') && (
                      <Progress
                        percent={file.progress || 0}
                        size="small"
                        status={
                          file.status === 'done'
                            ? 'success'
                            : file.status === 'error'
                            ? 'exception'
                            : 'active'
                        }
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    )}

                    {file.status === 'error' && (
                      <div style={{ color: '#ff4d4f', fontSize: 12 }}>上传失败</div>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};

export default AttachmentUploader;
