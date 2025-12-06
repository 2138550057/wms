import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Excel列映射（范本表头 -> 数据库字段）
const EXCEL_COLUMN_MAP: Record<string, string> = {
  '行号': 'rowNumber',
  '提单号': 'billOfLadingNo',
  '内部货号': 'internalCode',
  '产销国': 'countryCode',
  '币种': 'currencyCode',
  '申报数量': 'declaredQuantity',
  '征免方式': 'dutyFreeType',
  '报关单号': 'customsDeclarationNo',
  'CMD料号': 'cmdPartNo',
  '工程编号': 'projectNo',
  '装箱单号': 'packingListNo',
  'CMD统一编号': 'cmdUnifiedNo',
  '报关名称': 'customsName',
  '进出口标记': 'importExportFlag',
  '用途': 'purpose',
  '申报总价': 'declaredValue',
  '法定数量': 'legalQuantity',
  '第二数量': 'secondQuantity',
  'BOM开始有效期': 'bomStartDate',
  '核销次数': 'writeOffCount',
  '导出标志': 'exportFlag',
  '单位工程': 'unitProject',
};

// 数据库字段 -> Excel列标题
const DB_TO_EXCEL_MAP: Record<string, string> = {
  'rowNumber': '行号',
  'billOfLadingNo': '提单号',
  'internalCode': '内部货号',
  'countryCode': '产销国',
  'currencyCode': '币种',
  'declaredQuantity': '申报数量',
  'dutyFreeType': '征免方式',
  'customsDeclarationNo': '报关单号',
  'cmdPartNo': 'CMD料号',
  'projectNo': '工程编号',
  'packingListNo': '装箱单号',
  'cmdUnifiedNo': 'CMD统一编号',
  'customsName': '报关名称',
  'importExportFlag': '进出口标记',
  'purpose': '用途',
  'declaredValue': '申报总价',
  'legalQuantity': '法定数量',
  'secondQuantity': '第二数量',
  'bomStartDate': 'BOM开始有效期',
  'writeOffCount': '核销次数',
  'exportFlag': '导出标志',
  'unitProject': '单位工程',
};

// 获取二级库存列表
export const list = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      size = 20,
      cmdUnifiedNo,
      billOfLadingNo,
      internalCode,
      customsDeclarationNo,
      packingListNo,
      customsName,
    } = req.query;

    const where: any = {};

    if (cmdUnifiedNo) {
      where.cmdUnifiedNo = { contains: cmdUnifiedNo as string };
    }
    if (billOfLadingNo) {
      where.billOfLadingNo = { contains: billOfLadingNo as string };
    }
    if (internalCode) {
      where.internalCode = { contains: internalCode as string };
    }
    if (customsDeclarationNo) {
      where.customsDeclarationNo = { contains: customsDeclarationNo as string };
    }
    if (packingListNo) {
      where.packingListNo = { contains: packingListNo as string };
    }
    if (customsName) {
      where.customsName = { contains: customsName as string };
    }

    const [data, total] = await Promise.all([
      prisma.secondaryInventory.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: [{ cmdUnifiedNo: 'asc' }, { rowNumber: 'asc' }],
      }),
      prisma.secondaryInventory.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 根据CMD统一编号获取二级库存
export const getByUnifiedNo = async (req: Request, res: Response) => {
  try {
    const { cmdUnifiedNo } = req.params;

    const data = await prisma.secondaryInventory.findMany({
      where: { cmdUnifiedNo },
      orderBy: { rowNumber: 'asc' },
    });

    // 获取关联的一级库存信息
    const primaryInventory = await prisma.inventory.findFirst({
      where: { warehouseEntryNo: cmdUnifiedNo },
    });

    res.json({
      success: true,
      data,
      primaryInventory,
      total: data.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取单条记录
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await prisma.secondaryInventory.findUnique({
      where: { id: Number(id) },
    });

    if (!data) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建单条记录
export const create = async (req: Request, res: Response) => {
  try {
    const data = await prisma.secondaryInventory.create({
      data: req.body,
    });

    res.json({ success: true, data, message: '创建成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新单条记录
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await prisma.secondaryInventory.update({
      where: { id: Number(id) },
      data: req.body,
    });

    res.json({ success: true, data, message: '更新成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 删除单条记录
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.secondaryInventory.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量删除
export const batchRemove = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的记录' });
    }

    const result = await prisma.secondaryInventory.deleteMany({
      where: { id: { in: ids.map(Number) } },
    });

    res.json({ success: true, message: `成功删除 ${result.count} 条记录` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 按CMD统一编号删除所有相关记录
export const removeByUnifiedNo = async (req: Request, res: Response) => {
  try {
    const { cmdUnifiedNo } = req.params;

    const result = await prisma.secondaryInventory.deleteMany({
      where: { cmdUnifiedNo },
    });

    res.json({ success: true, message: `成功删除 ${result.count} 条记录` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 解析Excel文件的公共函数
const parseExcelFile = (filePath: string) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  if (rawData.length < 2) {
    throw new Error('文件为空或格式不正确');
  }

  // 获取表头（第一行）
  const headers = rawData[0] as string[];

  // 构建列索引映射
  const columnIndexMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    const cleanHeader = String(header).trim();
    if (EXCEL_COLUMN_MAP[cleanHeader]) {
      columnIndexMap[EXCEL_COLUMN_MAP[cleanHeader]] = index;
    }
  });

  // 检查必需字段
  if (columnIndexMap['cmdUnifiedNo'] === undefined) {
    throw new Error('缺少必需列：CMD统一编号');
  }

  // 解析数据行
  const records: any[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    // 跳过没有CMD统一编号的行
    const cmdUnifiedNo = row[columnIndexMap['cmdUnifiedNo']];
    if (!cmdUnifiedNo) {
      errors.push({ row: i + 1, message: '缺少CMD统一编号' });
      continue;
    }

    const record: any = {
      _rowIndex: i + 1, // 用于前端显示行号
      cmdUnifiedNo: String(cmdUnifiedNo).trim(),
    };

    // 映射其他字段
    for (const [dbField, colIndex] of Object.entries(columnIndexMap)) {
      if (dbField === 'cmdUnifiedNo') continue;

      const value = row[colIndex];
      if (value === undefined || value === null || value === '') continue;

      // 数值类型转换
      if (['rowNumber', 'writeOffCount'].includes(dbField)) {
        record[dbField] = parseInt(String(value), 10) || null;
      } else if (['declaredQuantity', 'declaredValue', 'legalQuantity', 'secondQuantity'].includes(dbField)) {
        record[dbField] = parseFloat(String(value)) || null;
      } else {
        record[dbField] = String(value).trim();
      }
    }

    records.push(record);
  }

  return { records, errors };
};

// 预览导入（只解析不写入）
export const previewImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    try {
      const { records, errors } = parseExcelFile(filePath);

      // 统计每个CMD统一编号的记录数
      const cmdNoStats: Record<string, number> = {};
      records.forEach((r) => {
        cmdNoStats[r.cmdUnifiedNo] = (cmdNoStats[r.cmdUnifiedNo] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          records: records.slice(0, 100), // 预览最多显示100条
          totalCount: records.length,
          cmdNoCount: Object.keys(cmdNoStats).length,
          errors,
          hasMore: records.length > 100,
        },
        message: `解析成功，共 ${records.length} 条记录`,
      });
    } finally {
      // 清理临时文件
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 确认导入（实际写入数据库）
export const confirmImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    try {
      const { records } = parseExcelFile(filePath);

      if (records.length === 0) {
        return res.status(400).json({ success: false, message: '没有有效数据' });
      }

      // 移除 _rowIndex 字段后插入
      const cleanRecords = records.map(({ _rowIndex, ...rest }) => rest);

      // 批量插入
      const result = await prisma.secondaryInventory.createMany({
        data: cleanRecords,
        skipDuplicates: false,
      });

      res.json({
        success: true,
        message: `成功导入 ${result.count} 条记录`,
        count: result.count,
      });
    } finally {
      // 清理临时文件
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 导入Excel（兼容旧接口，直接导入）
export const importExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    try {
      const { records } = parseExcelFile(filePath);

      if (records.length === 0) {
        return res.status(400).json({ success: false, message: '没有有效数据' });
      }

      // 移除 _rowIndex 字段后插入
      const cleanRecords = records.map(({ _rowIndex, ...rest }) => rest);

      // 批量插入
      const result = await prisma.secondaryInventory.createMany({
        data: cleanRecords,
        skipDuplicates: false,
      });

      res.json({
        success: true,
        message: `成功导入 ${result.count} 条记录`,
        count: result.count,
      });
    } finally {
      // 清理临时文件
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 导出Excel
export const exportExcel = async (req: Request, res: Response) => {
  try {
    const { cmdUnifiedNo, billOfLadingNo, internalCode, customsDeclarationNo, packingListNo } = req.query;

    const where: any = {};
    if (cmdUnifiedNo) where.cmdUnifiedNo = { contains: cmdUnifiedNo as string };
    if (billOfLadingNo) where.billOfLadingNo = { contains: billOfLadingNo as string };
    if (internalCode) where.internalCode = { contains: internalCode as string };
    if (customsDeclarationNo) where.customsDeclarationNo = { contains: customsDeclarationNo as string };
    if (packingListNo) where.packingListNo = { contains: packingListNo as string };

    const data = await prisma.secondaryInventory.findMany({
      where,
      orderBy: [{ cmdUnifiedNo: 'asc' }, { rowNumber: 'asc' }],
    });

    // 转换为Excel格式
    const excelData = data.map((item) => {
      const row: any = {};
      for (const [dbField, excelHeader] of Object.entries(DB_TO_EXCEL_MAP)) {
        row[excelHeader] = (item as any)[dbField] ?? '';
      }
      return row;
    });

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 设置列宽
    const colWidths = [
      { wch: 8 },   // 行号
      { wch: 18 },  // 提单号
      { wch: 15 },  // 内部货号
      { wch: 8 },   // 产销国
      { wch: 8 },   // 币种
      { wch: 12 },  // 申报数量
      { wch: 10 },  // 征免方式
      { wch: 25 },  // 报关单号
      { wch: 20 },  // CMD料号
      { wch: 18 },  // 工程编号
      { wch: 25 },  // 装箱单号
      { wch: 18 },  // CMD统一编号
      { wch: 30 },  // 报关名称
      { wch: 10 },  // 进出口标记
      { wch: 8 },   // 用途
      { wch: 15 },  // 申报总价
      { wch: 12 },  // 法定数量
      { wch: 12 },  // 第二数量
      { wch: 15 },  // BOM开始有效期
      { wch: 10 },  // 核销次数
      { wch: 10 },  // 导出标志
      { wch: 18 },  // 单位工程
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '二级库存');

    // 生成buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    const filename = encodeURIComponent(`二级库存_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 下载导入模板
export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    // 创建模板表头
    const headers = Object.values(DB_TO_EXCEL_MAP);
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // 添加示例数据
    const exampleRow = [
      1,                              // 行号
      'IBOE2508009',                  // 提单号
      '5A-49251',                     // 内部货号
      '133',                          // 产销国
      '502',                          // 币种
      1,                              // 申报数量
      '3',                            // 征免方式
      '221020251000216686',           // 报关单号
      '5A-49251\\0021-5033',          // CMD料号
      'AB000057AEA11',                // 工程编号
      '24KR31CSTCI-JM52YX107',        // 装箱单号
      'CMD25080143',                  // CMD统一编号
      '船舶柴油发动机用燃气分配管',    // 报关名称
      'I',                            // 进出口标记
      '05',                           // 用途
      267400,                         // 申报总价
      1,                              // 法定数量
      0,                              // 第二数量
      '0',                            // BOM开始有效期
      0,                              // 核销次数
      '1',                            // 导出标志
      'AB000057AEA11',                // 单位工程
    ];
    XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: 'A2' });

    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '二级库存模板');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = encodeURIComponent('二级库存导入模板.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取统计信息
export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalRecords, uniqueCmdNos] = await Promise.all([
      prisma.secondaryInventory.count(),
      prisma.secondaryInventory.groupBy({
        by: ['cmdUnifiedNo'],
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        uniqueCmdNos: uniqueCmdNos.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
