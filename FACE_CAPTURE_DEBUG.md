/**
 * Face Capture 数据流追踪文档
 * 用于排查 file=None 的问题
 */

// ======================== 完整数据流 ========================

// 【阶段 1】图片捕获 (renderScript)
// 位置: pages/face-capture/index.vue (RenderScript 模块)
// 流程:
//   1. 用户点击快门按钮 → takePhoto()
//   2. cameraCmd 更新 → 触发 renderScript.onCmdChange()
//   3. renderScript.capture() 执行
//   4. Canvas.toDataURL('image/jpeg', 0.9) 
//   5. Data URL 格式: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
//   6. 调用 this.$ownerInstance.callMethod('onCaptureResult', dataUrl)
// 输出: photoPath = "data:image/jpeg;base64,..."

console.log('【阶段 1】图片已捕获为 Data URL');
// 期望输出:
// photoPath = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

// ======================== 【阶段 2】参数准备 ========================
// 位置: pages/face-capture/index.vue → submitPhoto()
// 流程:
//   1. 获取 userId (from store)
//   2. 获取 actualAge (from state.user.actual_age)
//   3. 准备调用 analyzeFace(photoPath, userId, actualAge)

console.log('📸 ===== 开始上传面部图片流程 =====');
console.log('📸 [1] 用户信息:', {
  userId: 'U1001',
  actualAge: 28,
  user: { id, name, actual_age: 28, ... }
});
console.log('📸 [2] 图片数据:', {
  photoPathType: 'string',
  photoPathLength: 45320,
  photoPathStart: 'data:image/jpeg;base64,/9j/4AAQ...',
  isDataUrl: true
});

// ======================== 【阶段 3】Service 层处理 ========================
// 位置: utils/api-service.js → analyzeFace()
// 流程:
//   1. 构建 formData = { user_id: 'U1001', actual_age: 28 }
//   2. 调用 uploadFile('/face/analyze', photoPath, 'file', formData)

console.log('📸 [analyzeFace] 调用 uploadFile:', {
  endpoint: '/face/analyze',
  filePathType: 'string',
  filePathIsDataUrl: true,
  filePathLength: 45320,
  formData: { user_id: 'U1001', actual_age: 28 }
});

// ======================== 【阶段 4】API 层上传逻辑 ========================
// 位置: utils/api.js → uploadFile()

// 【判断 1】是否是 Data URL？
//   ✅ YES → photoPath.startsWith('data:')
//   
// 【判断 2】是否是 H5 环境？
//   const canUseFetch = isDataUrl && 
//                      typeof FormData !== 'undefined' && 
//                      typeof fetch !== 'undefined';
//
// 如果都是 YES:
//   → 使用 tryUploadWithFetch() (优先方案)
//   → Data URL → Blob → FormData → fetch POST
//   → ✅ 这种方式 file 字段应该能正确传
//
// 如果 isDataUrl=YES 但 canUseFetch=NO (小程序/App):
//   → 使用 saveDataUrlAsFile() 转换
//   → Data URL → 临时文件 → uni.uploadFile
//   → ✅ 这种方式也应该能传

console.log('📤 发起文件上传:', {
  url: 'http://121.40.235.7:8000/api/v1/face/analyze',
  fileType: 'DataURL',
  name: 'file',
  formDataKeys: ['user_id', 'actual_age']
});

// ======================== 【阶段 4a】H5 Fetch 方案 ========================
// 位置: utils/api.js → tryUploadWithFetch()

// 1. 转换 Data URL 为 Blob
const blob = dataUrlToBlob(dataUrl);  // 应该返回 Blob 对象

// 2. 创建 FormData
const form = new FormData();
form.append('file', blob, 'upload_1234567890.jpg');  // ✅ 这里添加文件
form.append('user_id', 'U1001');
form.append('actual_age', '28');

// 3. Fetch POST
fetch(url, { method: 'POST', body: form })
  .then(res => res.text())
  .then(data => {
    // 应该收到 { code: 200, msg: 'success', data: {...} }
  });

console.log('📋 Fetch FormData 内容:', {
  fields: ['file', 'user_id', 'actual_age'],
  values: ['Blob(size=45320)', 'U1001', '28']
});

// ======================== 【阶段 4b】小程序 uni.uploadFile 方案 ========================
// 位置: utils/api.js → saveDataUrlAsFile() → tryUploadWithUni()

// 1. Data URL 转文件
const fs = uni.getFileSystemManager();
const parts = dataUrl.split(',');
const base64Data = parts[1];
const tempPath = `${uni.env.USER_DATA_PATH}/face_${Date.now()}.jpg`;
fs.writeFileSync(tempPath, base64Data, 'base64');
// 结果: tempPath = "/xxx/user_data_path/face_1234567890.jpg"

console.log('✅ 文件已保存为临时文件:', { 
  path: '/xxx/user_data_path/face_1234567890.jpg' 
});

// 2. 调用 uni.uploadFile
uni.uploadFile({
  url: 'http://121.40.235.7:8000/api/v1/face/analyze',
  filePath: '/xxx/user_data_path/face_1234567890.jpg',  // ✅ 本地文件路径
  name: 'file',
  formData: {
    user_id: 'U1001',
    actual_age: '28'
  },
  success: (res) => {
    // 应该收到响应
  }
});

console.log('📋 uni.uploadFile 参数（最终发送）:', {
  url: 'http://121.40.235.7:8000/api/v1/face/analyze',
  filePath: '/xxx/user_data_path/face_1234567890.jpg',
  name: 'file',
  formData: { user_id: 'U1001', actual_age: '28' }
});

// ======================== 【问题诊断】file=None 可能的原因 ========================

// ❌ 问题1: photoPath 不是 Data URL
// 检查: console.log('photoPath:', this.photoPath);
// 应该是: "data:image/jpeg;base64,..."
// 如果不是，说明渲染脚本没有正确捕获

// ❌ 问题2: 环境检测错误
// 在 H5 中，应该用 Fetch (有 FormData 和 fetch)
// 检查: console.log('typeof FormData:', typeof FormData, 'typeof fetch:', typeof fetch);
// 都应该是 'function'

// ❌ 问题3: Data URL 转 Blob 失败
// 检查: dataUrlToBlob() 是否正确
// 应该返回 Blob 对象，不是 null

// ❌ 问题4: Data URL 转文件失败
// 检查: saveDataUrlAsFile() 中的 fs.writeFileSync()
// 可能返回了原始 Data URL 而不是文件路径

// ❌ 问题5: uni.uploadFile 收到 Data URL 而不是文件路径
// 检查: tryUploadWithUni() 的参数验证
// 如果 filePath.startsWith('data:')，说明转换失败

// ======================== 【调试检查清单】========================

// 1. 开启浏览器/app 控制台
// 2. 进入 Face Capture 页面
// 3. 点击快门按钮拍照
// 4. 查看console输出：

// 应该看到的日志序列：
// [✓] 📸 ===== 开始上传面部图片流程 =====
// [✓] 📸 [1] 用户信息: { userId: ..., actualAge: ... }
// [✓] 📸 [2] 图片数据: { photoPathType: 'string', isDataUrl: true }
// [✓] 📸 [analyzeFace] 调用 uploadFile: { ... }
// [✓] 📤 发起文件上传: { fileType: 'DataURL', ... }
// [✓] 🔄 H5环境检测到Data URL，使用 Fetch + FormData
//     或
// [✓] 🔄 非H5环境检测到Data URL，先转换为文件
// [✓] 📋 Fetch FormData 内容
//     或
// [✓] ✅ Data URL已转换为文件路径
// [✓] 📋 uni.uploadFile 参数（最终发送）
// [✓] 📥 uni.uploadFile 响应 (或 Fetch 响应)

// 5. 打开网络请求面板 (Network tab)
// 6. 查看 POST /api/v1/face/analyze 的 Request
// 7. 查看 Form Data：
//    应该有:
//    - file: [File content]
//    - user_id: U1001
//    - actual_age: 28
//    
// 如果看到 file: (binary) 或 file: Blob，说明正确传输

// ======================== 【关键改进点】========================

// ✅ uploadFile() 函数现在有三个清晰的分支
// ✅ H5 优先用 Fetch + FormData（支持 Data URL）
// ✅ 小程序/App 会先转文件再用 uni.uploadFile
// ✅ tryUploadWithUni() 有 Data URL 检测和拒绝
// ✅ 每一步都有详细的日志输出

// 测试时请提供以上日志的完整输出，我们可以准确定位问题所在！
