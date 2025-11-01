# CQBCC Service Data Files

## 数据文件说明

本目录包含CQBCC医美服务的结构化数据文件，以JSON格式存储，可直接用于移动应用开发。

## 文件列表

### 1. categories.json
**治疗分类数据**
- 主要分类：皮肤美容、问题肌肤治疗、抗衰年轻化、单独项目
- 包含子分类及适应症描述
- 中英文对照

### 2. devices.json
**设备信息数据**
- 光电设备：IPL/OPT、激光（皮秒、点阵、CO2）
- 射频设备：黄金微针、热芙美
- 超声设备：HIFU、超声炮、曲提超声刀
- 包含设备功能、模式、价格信息

### 3. injectables.json
**注射材料数据**
- 再生材料：童颜针(PLLA)、艾维岚、濡白天使等
- 胶原蛋白：双美、肤莱美、弗缦、爱莉丝等
- 玻尿酸：大分子（塑形用）、小分子（水光用）
- 特殊产品：嗨体、熊猫针等
- 包含规格、原价、活动价

### 4. packages.json
**套餐方案数据**
- 维养套餐：基础维养、轻奢维养、年度套餐
- 抗衰套餐：轻度、中度、高端定制
- 专项套餐：眼周、口周、敏感肌、祛斑、祛痘
- 包含项目内容、价格、适用人群

### 5. chemical_peels.json
**刷酸治疗数据**
- 水杨酸治疗（面部、身体各部位）
- 牛奶酸治疗（身体美白）
- 升级选项和价格

## 数据结构特点

1. **多语言支持**：包含中文和英文字段名
2. **价格体系**：原价和活动价分别标注
3. **详细描述**：包含适应症、功能、注意事项
4. **规格信息**：剂量、发数、面积等详细参数
5. **分类清晰**：按用途、部位、效果等多维度分类

## 使用建议

### 移动应用开发
```javascript
// 读取分类数据
import categories from './data/categories.json';

// 获取所有治疗分类
const allCategories = categories.categories;

// 筛选特定分类
const skinBeauty = allCategories.find(cat => cat.id === 'skin_beauty');
```

### 数据查询
```javascript
// 读取设备数据
import devices from './data/devices.json';

// 查找特定设备
const picosecond = devices.devices.find(d => d.id === 'picosecond');

// 获取设备价格
const price = picosecond.price_full_face;
```

### 价格计算
```javascript
// 读取注射材料数据
import injectables from './data/injectables.json';

// 获取活动价
const ha = injectables.injectables.hyaluronic_acid_large;
const discountPrice = ha[0].price_activity;
```

## 数据更新

- 价格以PDF文件中的202510版本为准
- 建议定期更新活动价格
- 新增项目需同步更新相关分类

## 注意事项

1. 所有价格单位为人民币（CNY）
2. 部分项目有使用限制（如"限新客户"）
3. 套餐内容可能包含赠品
4. 某些材料有特定用途（如"唇部、卧蚔专用"）
5. 设备治疗通常需要疗程，单次价格仅供参考

## API设计建议

建议的API端点：
- `GET /api/categories` - 获取所有分类
- `GET /api/devices` - 获取设备列表
- `GET /api/injectables` - 获取注射材料
- `GET /api/packages` - 获取套餐方案
- `GET /api/peels` - 获取刷酸项目
- `GET /api/treatments/:id` - 获取具体治疗详情
- `GET /api/search?q=keyword` - 搜索功能

## 版本信息

- 数据来源：cqbcc-pricelist-202510.pdf
- 创建日期：2025年
- 数据格式：JSON
- 编码：UTF-8
