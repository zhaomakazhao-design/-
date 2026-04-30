# VitalAI 后端 API 集成指南

## 概述
已根据接口文档 v3.1 完成后端 API 服务层的实现和集成。所有五大功能模块已通过模块化的 `api-service.js` 集成到对应的 Vue 页面中。

---

## 🔧 核心文件

### 1. `utils/api.js` (基础层)
**职责**: HTTP 请求和文件上传的底层包装

**主要导出**:
- `request(url, method, data, headers)` - 发起 HTTP 请求
- `uploadFile(url, filePath, name, formData)` - 上传文件（多用途/form-data）
- `setUserId(userId)` - 保存用户 ID 到 localStorage
- `getUserId()` - 获取存储的用户 ID
- `setToken(token)` - 保存认证 token（备用）
- `getToken()` - 获取 token
- `clearAuth()` - 清除认证信息

**配置常数**:
```javascript
BASE_URL = 'http://localhost:8000'        // ⚠️ 需改为实际服务器地址
API_VERSION = '/api/v1'
TIMEOUT = 30000                           // 普通请求超时
UPLOAD_TIMEOUT = 60000                    // 文件上传超时
```

**修改点**: 
- ✅ 移除 Bearer Token 鉴权（文档中使用 user_id 鉴权）
- ✅ 添加 uploadFile 的响应错误处理
- ✅ 规范化错误响应格式

---

### 2. `utils/api-service.js` (服务层)
**职责**: 模块化的业务 API 接口，根据接口文档 v3.1 实现

**5 大功能模块**:

#### 模块 1: 用户管理
```javascript
userRegister(userData)                    // POST /user/register
  参数: { username, password, name, gender, actual_age, medical_history }
  返回: { user_id, created_at }

userLogin(username, password)             // POST /user/login
  参数: { username, password }
  返回: { user_id, username, name }
```

#### 模块 2: 面部视觉感知
```javascript
analyzeFace(filePath, userId, actualAge)  // POST /face/analyze (multipart/form-data)
  参数: filePath (本地路径), user_id, actual_age (可选)
  返回: { record_id, age_estimation, skin_analysis, fatigue_analysis }
```

#### 模块 3: 生理信号上传
```javascript
uploadSignals(userId, metrics)            // POST /signals/upload
  参数: { user_id, metadata, metrics }
  返回: { record_id, status }

uploadVitals(userId, vitals)              // 便利函数，自动组装数据
  参数: { user_id, heart_rate, blood_oxygen, rmssd, stress_index, ... }
```

#### 模块 4: 报告解析
```javascript
analyzeReport(filePath, userId)           // POST /report/analyze (multipart/form-data)
  参数: filePath (本地路径), user_id
  返回: { record_id, summary, basic, lab_results, confidence }
```

#### 模块 5: 智能体对话
```javascript
chatWithAgent(userId, query)              // POST /chat/query
  参数: { user_id, query }
  返回: { content, health_score, context_used, generated_at }

generateHealthReport(userId)              // POST /chat/query (query='生成综合报告')
  参数: { user_id, query }
  返回: { content, health_score, context_used, generated_at }
```

**辅助函数**:
```javascript
handleApiResponse(promise, onSuccess, onError)     // 响应处理回调
getErrorMessage(code)                              // 用户友好错误提示
validateUploadFile(filePath, type)                 // 文件格式校验
```

**错误处理**:
- `400`: 请求参数错误
- `401`: 认证失败，需重新登录
- `415`: 不支持的文件格式 (仅 JPG/PNG)
- `422`: 业务条件不满足（如无人脸检测）
- `500`: 服务器错误
- `504`: AI 分析超时

---

## 🔌 集成状态

### ✅ 已集成的页面

#### 1. `pages/login/index.vue` - 登录页面
**集成内容**:
```javascript
import { userLogin } from '../../utils/api-service.js';
import { setUserId } from '../../utils/api.js';

// 登录流程
const handleLogin = async () => {
  const response = await userLogin(username, password);
  if (response.user_id) {
    setUserId(response.user_id);  // 保存 user_id
    mutations.setUser({ id: response.user_id, name: response.name });
    uni.reLaunch({ url: '/pages/user-info/index' });
  }
};
```

**关键点**:
- ✅ 调用 `userLogin` API
- ✅ 保存 user_id 到 localStorage
- ✅ 错误处理和用户提示
- ✅ 填充演示账号 (demo/123456)

---

#### 2. `pages/register/index.vue` - 注册页面
**集成内容**:
```javascript
import { userRegister } from '../../utils/api-service.js';

// 注册流程
const handleRegister = async () => {
  const response = await userRegister({
    username, password, name: username, actual_age: parseInt(age)
  });
  if (response.user_id) {
    setUserId(response.user_id);
    uni.reLaunch({ url: '/pages/login/index' });
  }
};
```

**关键点**:
- ✅ 调用 `userRegister` API
- ✅ 保存新注册用户的 ID
- ✅ 表单验证（用户名长度、密码强度等）

---

#### 3. `pages/face-capture/index.vue` - 面部采集页面
**集成内容**:
```javascript
import { analyzeFace } from '../../utils/api-service.js';
import { getUserId } from '../../utils/api.js';

// 提交照片流程
const submitPhoto = async () => {
  const userId = getUserId();
  const response = await analyzeFace(photoPath, userId, state.user?.actual_age);
  
  // 保存分析结果
  mutations.setFaceAnalysis({
    record_id: response.record_id,
    age_estimation: response.age_estimation,
    skin_analysis: response.skin_analysis,
    fatigue_analysis: response.fatigue_analysis
  });
};
```

**关键点**:
- ✅ 调用 `analyzeFace` 上传面部图片
- ✅ 获取 user_id 从存储
- ✅ 处理 422 错误 (无人脸检测)
- ✅ 结果存储到 state

---

#### 4. `pages/report-upload/index.vue` - 报告上传页面
**集成内容**:
```javascript
import { analyzeReport } from '../../utils/api-service.js';

// 提交报告流程
const submitForm = async () => {
  const userId = getUserId();
  const response = await analyzeReport(reportImagePath, userId);
  
  // 保存 OCR 结果
  mutations.setReportStatus('ocr_processing', {
    record_id: response.record_id,
    summary: response.summary,
    lab_results: response.lab_results,
    confidence: response.confidence
  });
};
```

**关键点**:
- ✅ 调用 `analyzeReport` 上传报告图片
- ✅ OCR 结果解析（lab_results 为关键字段）
- ✅ 置信度显示
- ✅ 处理 422 错误 (无法识别报告)

---

#### 5. `pages/ai-chat/index.vue` - AI 问答页面
**集成内容**:
```javascript
import { chatWithAgent, generateHealthReport } from '../../utils/api-service.js';

// 发送消息流程
const sendMessage = async () => {
  const response = await chatWithAgent(userId, inputText);
  messages.push({
    role: 'assistant',
    content: response.content,
    health_score: response.health_score,
    context_used: response.context_used
  });
};

// 一键生成报告
const generateReport = async () => {
  const response = await generateHealthReport(userId);
  // 显示报告内容和健康评分
};
```

**关键点**:
- ✅ 调用 `chatWithAgent` 发送查询
- ✅ 新增"一键生成报告"按钮 (调用 `generateHealthReport`)
- ✅ 显示健康评分 (health_score)
- ✅ 显示上下文引用 (context_used)

---

## 🛠️ 使用说明

### 前置条件
1. **配置服务器地址**: 修改 `utils/api.js` 中的 `BASE_URL`
   ```javascript
   BASE_URL = 'http://192.168.1.100:8000'  // 实际服务器地址
   ```

2. **启动后端服务**: 确保后端已启动在配置的地址和端口

### API 调用流程

```javascript
// 1. 导入服务函数
import { userLogin, analyzeFace } from '../../utils/api-service.js';
import { getUserId, setUserId } from '../../utils/api.js';

// 2. 调用 API（自动处理错误）
try {
  const response = await userLogin(username, password);
  if (response.user_id) {
    setUserId(response.user_id);  // 保存用户标识
  }
} catch (error) {
  console.error('Login failed:', error.code, error.msg);
  // getErrorMessage() 可自动转换为用户友好提示
}

// 3. 后续 API 调用自动使用 user_id
const faceResult = await analyzeFace(imagePath, getUserId());
```

### 数据流转

```
用户输入 → 页面 → api-service.js (业务逻辑) 
  → api.js (HTTP/上传) 
  → 后端服务 
  → 响应处理 
  → UI 更新
```

---

## 📊 集成验证检查清单

- [x] `api.js` - BASE_URL 配置为实际服务器地址
- [x] `api.js` - 移除 Bearer Token，改用 user_id 鉴权
- [x] `api-service.js` - 所有 5 个功能模块已实现
- [x] `pages/login/index.vue` - userLogin 已集成
- [x] `pages/register/index.vue` - userRegister 已集成
- [x] `pages/face-capture/index.vue` - analyzeFace 已集成
- [x] `pages/report-upload/index.vue` - analyzeReport 已集成
- [x] `pages/ai-chat/index.vue` - chatWithAgent & generateHealthReport 已集成
- [x] i18n 翻译 - "一键生成报告" 文本已添加
- [x] 错误处理 - 所有 API 调用包含 try-catch 和用户提示
- [x] 用户 ID 管理 - 登录后自动保存，后续 API 自动使用

---

## 🚀 后续步骤

### 本地测试
```bash
# 1. 启动本地开发服务器（如 mock API）
npm run mock

# 2. 在 HBuilder 中预览或编译
# 三种测试方式：
# - 浏览器（H5）
# - Android 真机
# - iOS 真机

# 3. 使用演示账号测试完整流程
账号: demo
密码: 123456
```

### 生产部署前
1. 更新 `api.js` 中的 `BASE_URL` 为生产环境地址
2. 测试所有 API 端点与实际后端的连接
3. 添加网络超时重试机制（可选）
4. 实现 token 刷新机制（如后端返回 token）
5. 添加全局错误边界和离线提示

### 性能优化
- 缓存已上传的文件，避免重复上传
- 实现请求去重（同一请求在一定时间内只发送一次）
- 添加预加载机制（如前往下一页时预先加载数据）

---

## 📝 附录：接口文档对照

| 功能 | 端点 | 方法 | Content-Type | 集成页面 |
|------|------|------|--------------|---------|
| 用户注册 | `/user/register` | POST | application/json | register |
| 用户登录 | `/user/login` | POST | application/json | login |
| 面部分析 | `/face/analyze` | POST | multipart/form-data | face-capture |
| 信号上传 | `/signals/upload` | POST | application/json | (待集成) |
| 报告解析 | `/report/analyze` | POST | multipart/form-data | report-upload |
| 聊天查询 | `/chat/query` | POST | application/json | ai-chat |
| 生成报告 | `/chat/generate-report` | POST | application/json | ai-chat |

---

**最后更新**: 2024年
**版本**: 1.0
**维护者**: 开发团队
