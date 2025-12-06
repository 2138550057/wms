import React, { useState, useEffect, useCallback } from 'react';
import { Select, Space, Tag, Spin } from 'antd';
import { locationAPI } from '../services/location.service';
import type { Location } from '../types';
import debounce from 'lodash/debounce';

const { Option } = Select;

interface LocationSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
}

// 分类映射
const categoryMap: Record<string, string> = {
  shelf: '货架',
  floor: '地面',
  large: '大件',
  small: '小件',
};

const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  onChange,
  placeholder = '选择或搜索库位',
  style,
  disabled = false,
  allowClear = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchValue, setSearchValue] = useState('');

  // 筛选条件
  const [bondedFilter, setBondedFilter] = useState<string | undefined>();
  const [zoneFilter, setZoneFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  // 加载库位数据
  const loadLocations = useCallback(async (keyword?: string) => {
    setLoading(true);
    try {
      const response: any = await locationAPI.getActive({
        bonded: bondedFilter,
        zone: zoneFilter,
        category: categoryFilter,
        keyword: keyword || searchValue,
      });
      if (response.success) {
        setLocations(response.data);
      }
    } catch (error) {
      console.error('加载库位失败:', error);
    } finally {
      setLoading(false);
    }
  }, [bondedFilter, zoneFilter, categoryFilter, searchValue]);

  // 初始加载和筛选条件变化时加载
  useEffect(() => {
    loadLocations();
  }, [bondedFilter, zoneFilter, categoryFilter]);

  // 搜索防抖
  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      loadLocations(keyword);
    }, 300),
    [loadLocations]
  );

  const handleSearch = (val: string) => {
    setSearchValue(val);
    debouncedSearch(val);
  };

  const handleChange = (val: string) => {
    onChange?.(val);
  };

  // 渲染库位选项
  const renderOption = (loc: Location) => {
    return (
      <Option key={loc.code} value={loc.code}>
        <Space>
          <span style={{ fontWeight: 'bold', color: loc.bonded ? '#f50' : '#108ee9' }}>
            {loc.code}
          </span>
          <Tag color={loc.bonded ? 'red' : 'blue'} style={{ marginRight: 0 }}>
            {loc.bonded ? '保税' : '非保税'}
          </Tag>
          <Tag color="default">{loc.zone}区</Tag>
          <Tag color="green">{categoryMap[loc.category] || loc.category}</Tag>
        </Space>
      </Option>
    );
  };

  return (
    <div style={style}>
      {/* 筛选器行 */}
      <Space style={{ marginBottom: 8 }} wrap>
        <Select
          placeholder="保税"
          value={bondedFilter}
          onChange={setBondedFilter}
          style={{ width: 90 }}
          allowClear
          size="small"
        >
          <Option value="true">保税</Option>
          <Option value="false">非保税</Option>
        </Select>
        <Select
          placeholder="地区"
          value={zoneFilter}
          onChange={setZoneFilter}
          style={{ width: 80 }}
          allowClear
          size="small"
        >
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(z => (
            <Option key={z} value={z}>{z}区</Option>
          ))}
        </Select>
        <Select
          placeholder="分类"
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ width: 80 }}
          allowClear
          size="small"
        >
          <Option value="shelf">货架</Option>
          <Option value="floor">地面</Option>
          <Option value="large">大件</Option>
          <Option value="small">小件</Option>
        </Select>
      </Space>

      {/* 库位选择器 */}
      <Select
        showSearch
        value={value}
        onChange={handleChange}
        onSearch={handleSearch}
        placeholder={placeholder}
        style={{ width: '100%' }}
        disabled={disabled}
        allowClear={allowClear}
        loading={loading}
        filterOption={false}
        notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
      >
        {locations.map(renderOption)}
      </Select>
    </div>
  );
};

export default LocationSelect;
