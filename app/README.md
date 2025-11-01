# 智搭医美 APP

重庆联合丽格第五医疗美容医院的AI驱动个性化医美方案定制平台。

## 功能特性

### 核心功能

1. **智能照片分析**
   - 支持上传/拍摄1-3张照片（全面部、侧面、局部特写）
   - 自动验证照片质量和可用性
   - 智能引导用户拍摄更合适的照片

2. **个性化需求问卷**
   - 多维度问题分类（皮肤问题、医美需求、预算、恢复时间）
   - AI辅助确认和细化需求
   - 智能对话系统

3. **三种定制方案**
   - **标准程序**：价格和耗时折中，效果确切
   - **快捷省时**：快速初步解决，适合忙碌用户
   - **私人医生诊疗**：辩证施治，深度定制

4. **完整报告系统**
   - 支持PNG和PDF格式导出
   - 本地历史记录保存
   - 方案对比和修改

5. **AI对话助手**
   - 自动生成建议问题
   - 智能追问和解答
   - 支持文本选择AI解释功能

6. **丰富的个性化设置**
   - 4种优雅配色主题（优雅灰、温暖驼、清新绿、浪漫紫）
   - 3种字体大小（小、中、大）
   - AI输出风格控制（轻松幽默、标准日常、科学严谨）
   - AI输出长度控制（详细、标准、简约）

7. **社交分享功能**
   - 原生分享API支持
   - 微信/QQ等中国社交平台优化
   - 链接快速复制

## 技术架构

### 前端技术栈

- **HTML5**：语义化标签，响应式布局
- **CSS3**：
  - CSS变量系统实现主题切换
  - Flexbox和Grid布局
  - 流畅的动画和过渡效果
  - Mobile-first响应式设计
- **原生JavaScript (ES6+)**：
  - 模块化代码组织
  - 异步处理（async/await）
  - LocalStorage数据持久化
  - 标准Fetch API（iOS兼容）

### 设计系统

- **图标**：Material Symbols（Web Font）
- **字体**：Noto Sans SC（Google Fonts）
- **配色方案**：
  - 中性优雅色系
  - 柔和渐变效果
  - 高对比度文字
  - 女性化审美设计

### AI集成

- **模型**：Claude 3.5 Sonnet (Anthropic)
- **图像分析**：Nano Banana模型
- **iOS兼容性**：
  - 使用标准Fetch API
  - 避免第三方库依赖
  - 正确的Content-Type设置
  - CORS配置优化

## 目录结构

```
app/
├── index.html          # 主HTML文件
├── css/
│   └── styles.css      # 主样式文件
├── js/
│   └── app.js          # 主应用逻辑
├── images/
│   ├── logo.png        # Logo图片
│   ├── favicon.png     # 网站图标
│   ├── consultant-qr.png  # 咨询二维码
│   └── dr-kuai.png     # 医生照片
├── assets/             # 其他资源文件
└── README.md           # 本文件
```

## 部署指南

### 1. 环境要求

- 现代Web服务器（Nginx、Apache等）
- HTTPS支持（必需，用于摄像头访问）
- 支持HTML5的现代浏览器

### 2. 配置AI API

编辑 `js/app.js` 文件，配置您的AI API密钥：

```javascript
const AI_API_KEY = 'YOUR_API_KEY_HERE'; // 替换为实际的Anthropic API密钥
const AI_MODEL = 'claude-3-5-sonnet-20241022';
```

### 3. 本地开发

使用任何静态文件服务器即可：

```bash
# 使用Python
python3 -m http.server 8000

# 使用Node.js
npx serve

# 使用PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000/index.html`

### 4. 生产部署

#### Nginx配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    root /path/to/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用Gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;

    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. 数据服务集成

应用需要访问服务列表数据，确保 `../data/servicelist.json` 路径可访问。

可以通过以下方式：
- 使用相对路径（默认）
- 配置API端点
- 使用CDN托管

## 使用指南

### 用户流程

1. **首页欢迎** → 点击"开始分析"
2. **上传照片** → 1-3张照片（全面部/侧面/特写）
3. **问题分类** → 选择皮肤问题、需求、预算、恢复时间
4. **AI确认** → AI助手进一步确认需求
5. **查看方案** → 三种个性化方案供选择
6. **导出报告** → PNG或PDF格式

### 医生信息

蒯飞医生信息已内置：
- 医学博士
- 中国人民解放军第四军医大学
- 空军总医院骨干医生（近十年）
- 4篇国际重点期刊文章
- 1项个人发明专利
- 门诊时间：周一至周六（需预约）

### 设置选项

通过右上角设置按钮访问：
- **主题配色**：4种优雅主题
- **字体大小**：小/中/大
- **AI输出风格**：轻松/标准/严谨
- **AI输出长度**：详细/标准/简约

## 移动端优化

### iOS Safari兼容性

特别针对iOS Safari进行了优化：

1. **AI调用**：使用标准Fetch API，避免兼容性问题
2. **图片处理**：优化内存使用，防止崩溃
3. **触摸交互**：44px最小触摸目标
4. **视口设置**：正确的viewport meta标签
5. **避免滚动问题**：固定定位优化

### Android优化

- Material Design风格适配
- 原生分享菜单支持
- 响应式图片加载

## 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (iOS/macOS)
- ✅ Edge 90+
- ✅ 微信浏览器
- ✅ QQ浏览器

## 安全与隐私

### 数据保护

- 所有照片仅在本地处理
- 可选的云端AI分析（需用户同意）
- LocalStorage加密存储
- 支持一键清除历史

### 免责声明

应用内置完整的免责声明，包括：
- 医疗免责声明
- AI内容免责
- 个人信息保护
- 隐私保护声明
- 风险提示

## 性能优化

1. **图片优化**
   - 自动压缩上传图片
   - 渐进式加载
   - WebP格式支持

2. **代码优化**
   - 按需加载外部库（html2canvas、jsPDF）
   - 最小化重绘和回流
   - 事件委托

3. **缓存策略**
   - LocalStorage缓存设置和历史
   - Service Worker（可选）

## 故障排除

### AI调用失败

检查以下问题：
1. API密钥是否正确配置
2. 网络连接是否正常
3. CORS配置是否正确
4. API配额是否充足

### 照片上传失败

可能原因：
1. 照片尺寸过大（>10MB）
2. 照片格式不支持
3. 浏览器权限未授予

### iOS Safari问题

如果遇到问题：
1. 确保使用HTTPS
2. 检查Safari设置中的JavaScript
3. 清除网站数据后重试
4. 更新到最新版iOS

## 开发指南

### 添加新主题

在 `css/styles.css` 中添加：

```css
[data-theme="new-theme"] {
    --primary-color: #yourcolor;
    --primary-light: #yourcolor;
    /* ... 其他颜色变量 */
}
```

### 扩展AI功能

在 `js/app.js` 中修改 `Utils.callAI()` 函数：

```javascript
async callAI(prompt, systemPrompt = '') {
    // 添加自定义逻辑
}
```

### 自定义治疗方案

修改 `TreatmentPlans.selectStandardItems()` 等函数来定制方案内容。

## 联系信息

**重庆联合丽格第五医疗美容医院**

- 地址：重庆市渝中区临江支路28号
- 电话：023-68726872
- 邮箱：bccsw@cqlhlg.work
- 备案号：渝ICP备15004871号 | 渝公网安备50010302001456号

## 许可证

Copyright © 2025 重庆联合丽格第五医疗美容医院. All rights reserved.

## 更新日志

### v1.0.0 (2025-10-16)

- ✨ 首次发布
- 📸 照片上传和验证系统
- 🤖 AI问诊和方案生成
- 📊 三种定制方案推荐
- 📄 报告导出功能（PNG/PDF）
- 💾 历史记录管理
- 🎨 4种优雅主题
- 📱 完整移动端适配
- 🍎 iOS Safari兼容性优化

---

如有问题或建议，请联系技术支持团队。
