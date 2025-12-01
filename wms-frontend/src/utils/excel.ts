import * as XLSX from 'xlsx';

/**
 * 导出数据到Excel
 * @param data 数据数组
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

/**
 * 将数据导出为Excel（带自定义列头）
 * @param data 数据数组
 * @param headers 列头映射 { key: 'displayName' }
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export const exportToExcelWithHeaders = (
  data: any[],
  headers: Record<string, string>,
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  // 转换数据，使用自定义列头
  const transformedData = data.map(row => {
    const newRow: any = {};
    Object.keys(headers).forEach(key => {
      newRow[headers[key]] = row[key];
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};
