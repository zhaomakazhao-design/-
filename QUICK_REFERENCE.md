# VitalAI API 集成 - 快速参考卡

## 🔗 API 端点速查表

| 功能 | 方法 | 端点 | 参数 | 返回值 |
|------|------|------|------|--------|
| 用户注册 | POST | `/user/register` | {username, password, name, gender, actual_age, medical_history} | {user_id, created_at} |
| 用户登录 | POST | `/user/login` | {username, password} | {user_id, username, name} |
| 面部分析 | POST | `/face/analyze` | file + {user_id, actual_age} | {record_id, age_estimation, skin_analysis, fatigue_analysis} |
| 信号上传 | POST | `/signals/upload` | {user_id, metadata, metrics} | {record_id, status} |
| 报告解析 | POST | `/report/analyze` | file + {user_id} | {record_id, summary, basic, lab_results, confidence} |
| 聊天查询 | POST | `/chat/query` | {user_id, query} | {content, health_score, context_used, generated_at} |
| 生成报告 | POST | `/chat/query` | {user_id, query=生成报告文本} | {content, health_score, context_used, generated_at} |

---

## 📦 导入和使用

### 最小化示例

```javascript
// 1. 导入
import { userLogin, analyzeFace } from '../../utils/api-service.js';
import { getUserId, setUserId } from '../../utils/api.js';

// 2. 登录
const response = await userLogin('user', 'pass');
setUserId(response.user_id);

// 3. 调用其他 API
const result = await analyzeFace(imagePath, getUserId());
```

---

## ⚙️ 配置

### 服务器地址
编辑 `utils/api.js`:
```javascript
export const BASE_URL = 'http://localhost:8000';  // 改为实际地址
```

### 超时设置
```javascript
export const TIMEOUT = 30000;          // 普通请求 30 秒
export const UPLOAD_TIMEOUT = 60000;   // 文件上传 60 秒
```

---

## 🆔 用户 ID 管理

```javascript
// 登录时保存
setUserId(user_id);

// 后续获取
const userId = getUserId();

// 登出清除
clearAuth();
```

---

## ❌ 错误处理

### 常见错误代码

| 代码 | 含义 | 用户提示 |
|------|------|---------|
| 400 | 参数错误 | "请检查输入内容" |
| 401 | 认证失败 | "请重新登录" |
| 415 | 文件格式不支持 | "仅支持 JPG/PNG 格式" |
| 422 | 业务条件不满足 | 具体错误，如"未检测到人脸" |
| 500 | 服务器错误 | "服务器错误，请稍后重试" |
| 504 | 超时 | "AI 分析中，请稍候" |

### 标准错误处理

```javascript
try {
  const result = await apiFunction(...);
  // 处理成功
} catch (error) {
  uni.showToast({
    title: getErrorMessage(error.code),
    icon: 'none'
  });
}
```

---

## 📝 每个页面的核心改动

### login/index.vue
```javascript
✅ 导入 userLogin, setUserId
✅ 演示账号: demo/123456
✅ 保存 user_id 到 localStorage
```

### register/index.vue
```javascript
✅ 导入 userRegister
✅ 表单验证
✅ 保存新用户 ID
```

### face-capture/index.vue
```javascript
✅ 导入 analyzeFace, getUserId
✅ 获取 age_estimation, skin_analysis, fatigue_analysis
✅ 422 错误: "未检测到人脸"
```

### report-upload/index.vue
```javascript
✅ 导入 analyzeReport
✅ 解析 lab_results 数组
✅ 显示 confidence 置信度
✅ 422 错误: "无法识别报告"
```

### ai-chat/index.vue
```javascript
✅ 导入 chatWithAgent, generateHealthReport
✅ 显示 health_score 健康评分
✅ 显示 context_used 上下文引用
✅ 新增"一键生成报告"按钮
```

---

## 🌍 i18n 翻译模块 (18 个)

| 模块 | 中文 | 英文 |
|------|------|------|
| common | 通用 | Common |
| login | 登录 | Login |
| register | 注册 | Register |
| home | 首页 | Home |
| profile | 我的 | Profile |
| settings | 设置 | Settings |
| aiChat | AI问答 | AI Chat |
| userInfo | 个人信息 | User Info |
| reportUpload | 报告上传 | Report Upload |
| faceCapture | 面部识别 | Face Capture |
| healthReport | 健康报告 | Health Report |
| bluetooth | 蓝牙 | Bluetooth |
| detection | 检测 | Detection |
| genomics | 基因组学 | Genomics |
| ppg | 光电容积脉搏波 | PPG |
| hardwareCollect | 硬件采集 | Hardware Collect |
| weekdays | 星期 | Weekdays |
| tabbar | 标签栏 | Tabbar |

---

## 🧪 测试流程

```
1. npm run mock          (启动 mock 服务器)
2. HBuilder 预览         (H5 / 真机)
3. 输入演示账号          (demo/123456)
4. 测试各功能页面        (面部、报告、AI)
5. 切换语言             (设置页)
6. 验证错误处理          (网络中断等)
```

---

## 🚀 部署前检查

- [ ] BASE_URL 已更新
- [ ] 后端 7 个端点已部署
- [ ] 数据库已初始化
- [ ] SSL 证书已配置 (HTTPS)
- [ ] 测试登录 → 各功能流程
- [ ] 验证中英文切换
- [ ] 检查文件上传大小限制
- [ ] 网络错误处理已测试

---

## 💡 常见问题

**Q: 如何更改服务器地址？**
A: 编辑 `utils/api.js` 中的 `BASE_URL`

**Q: 如何测试上传功能？**
A: 在 face-capture/report-upload 页面选择或拍照，会调用对应的 API

**Q: 如何禁用某个 API？**
A: 注释掉 api-service.js 中的对应函数导出

**Q: 国际化如何新增翻译？**
A: 在 `utils/i18n.js` 的 messages.zh 和 messages.en 中添加新的键值对

**Q: 如何实现网络重试？**
A: 在 api.js 的 request/uploadFile 函数中添加重试逻辑

---

## 📞 快速支持

| 问题 | 解决方案 |
|------|---------|
| 登录失败 | 检查 BASE_URL，验证后端是否运行 |
| 文件上传失败 | 检查文件格式 (JPG/PNG)，验证 user_id |
| 语言切换无效 | 清除浏览器缓存，重新刷新 |
| AI 回复缓慢 | 正常，可能在深度分析，504 超时等待 |
| 数据不保存 | 检查 localStorage 是否禁用 |

---

**版本**: 1.0  
**最后更新**: 2024年  
**快速参考**: 3-5 分钟了解全部内容
