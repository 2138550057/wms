import * as fs from 'fs';
import * as path from 'path';
import prisma from '../src/utils/prisma';

async function importLocations() {
  try {
    // 读取文本文档
    const filePath = path.join(__dirname, '../../新建 文本文档.txt');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 解析所有库位编码
    const locationCodes: Set<string> = new Set();
    const lines = content.split('\n');

    for (const line of lines) {
      // 按制表符或多个空格分割
      const codes = line.split(/[\t\s]+/).filter(code => code.trim());
      codes.forEach(code => {
        if (code.trim()) {
          locationCodes.add(code.trim());
        }
      });
    }

    console.log(`共解析出 ${locationCodes.size} 个库位编码`);

    // 检查已存在的库位
    const existingLocations = await prisma.location.findMany({
      select: { code: true }
    });
    const existingCodes = new Set(existingLocations.map(loc => loc.code));

    console.log(`数据库中已存在 ${existingCodes.size} 个库位`);

    // 筛选出需要导入的库位
    const newCodes = Array.from(locationCodes).filter(code => !existingCodes.has(code));

    if (newCodes.length === 0) {
      console.log('没有需要导入的新库位');
      return;
    }

    console.log(`准备导入 ${newCodes.length} 个新库位...`);

    // 批量创建库位
    let successCount = 0;
    let failCount = 0;

    for (const code of newCodes) {
      try {
        await prisma.location.create({
          data: {
            code,
            name: code, // 使用编码作为名称
            status: 'active',
          }
        });
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`已导入 ${successCount}/${newCodes.length} 个库位...`);
        }
      } catch (error: any) {
        failCount++;
        console.error(`导入库位 ${code} 失败:`, error.message);
      }
    }

    console.log('\n导入完成！');
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);
    console.log(`跳过(已存在): ${existingCodes.size} 个`);

  } catch (error: any) {
    console.error('导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importLocations();
