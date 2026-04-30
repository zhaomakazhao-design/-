/**
 * VitalAI - 后端API服务层
 * 基于接口文档 v3.1，实现所有后端API调用
 * 模块化设计：用户管理、面部分析、生理信号、报告解析、智能体对话
 */

import { request, uploadFile, BASE_URL, API_VERSION, UPLOAD_TIMEOUT } from './api.js';

// ============================================================
// 【模块 1】用户管理服务
// ============================================================

/**
 * 用户注册
 * @param {Object} userData - { username, password, name, gender, actual_age, medical_history }
 * @returns {Promise} { user_id, created_at }
 */
export function userRegister(userData) {
  return request('/user/register', 'POST', {
    username: userData.username,
    password: userData.password,
    name: userData.name || '',
    gender: userData.gender || '',
    actual_age: userData.actual_age || null,
    medical_history: userData.medical_history || ''
  });
}

/**
 * 用户登录
 * @param {string} username - 手机号
 * @param {string} password - 密码
 * @returns {Promise} { user_id, username, name }
 */
export function userLogin(username, password) {
  return request('/user/login', 'POST', {
    username,
    password
  });
}

// ============================================================
// 【模块 2】面部视觉感知服务
// ============================================================

/**
 * 同步分析面部特征
 * @param {string} filePath - Data URL、Blob URL 或本地文件路径
 * @param {string} userId - 用户ID
 * @param {number} actualAge - 实际年龄（可选）
 * @returns {Promise} { code, msg, data: { record_id, age_estimation, skin_analysis, fatigue_analysis } }
 */
export async function analyzeFace(filePath, userId, actualAge = null) {
  // 构建 FormData 参数，忽略 null/undefined 值
  const formData = {
    user_id: userId
  };
  
  // 只在 actual_age 有值且是数字时才添加
  if (actualAge !== null && actualAge !== undefined && !isNaN(actualAge)) {
    formData.actual_age = Number(actualAge);
  }
  
  // 转换为 base64 格式
  let base64Image = filePath;
  
  if (filePath.startsWith('data:')) {
    // 已经是 Data URL，直接提取 base64
    base64Image = filePath.split(',')[1];
    console.log('📸 [analyzeFace] Data URL → base64');
  } else if (filePath.startsWith('blob:')) {
    // Blob URL 需要转换
    console.log('📸 [analyzeFace] 转换 Blob URL → base64...');
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      base64Image = await blobToBase64(blob);
      console.log('✓ Blob URL 已转换为 base64');
    } catch (e) {
      console.error('❌ Blob URL 转换失败:', e.message);
      throw new Error('Blob URL 转换失败: ' + e.message);
    }
  } else {
    // 本地文件路径，尝试读取为 base64
    console.log('📸 [analyzeFace] 读取本地文件...');
    try {
      if (typeof uni !== 'undefined' && uni.getFileSystemManager) {
        const fs = uni.getFileSystemManager();
        const fileContent = fs.readFileSync(filePath, 'binary');
        base64Image = btoa(fileContent);
        console.log('✓ 本地文件已转换为 base64');
      }
    } catch (e) {
      console.error('❌ 本地文件读取失败:', e.message);
      throw new Error('本地文件读取失败: ' + e.message);
    }
  }
  
  // 添加 base64 图片到 formData（后端需要 'file' 字段）
  formData.file = base64Image;
  
  console.log('📸 [analyzeFace] 调用上传:', {
    endpoint: '/face/analyze',
    base64Length: base64Image.length,
    userId,
    actualAge,
    formDataKeys: Object.keys(formData),
    fileField: 'file'  // 后端接收的字段名
  });
  
  return uploadFile('/face/analyze', formData);
}

/**
 * 调试函数：显示发送给后端的 JSON 格式
 * @param {string} filePath - 图片路径
 * @param {string} userId - 用户ID
 * @param {number} actualAge - 实际年龄
 * @returns {Object} 发送的 JSON 数据结构
 */
export async function debugUploadFormat(filePath, userId, actualAge = null) {
  // 构建 FormData 参数，忽略 null/undefined 值
  const formData = {
    user_id: userId
  };
  
  // 只在 actual_age 有值且是数字时才添加
  if (actualAge !== null && actualAge !== undefined && !isNaN(actualAge)) {
    formData.actual_age = Number(actualAge);
  }
  
  // 转换为 base64 格式
  let base64Image = filePath;
  
  if (filePath.startsWith('data:')) {
    base64Image = filePath.split(',')[1];
  } else if (filePath.startsWith('blob:')) {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      base64Image = await blobToBase64(blob);
    } catch (e) {
      base64Image = '转换失败';
    }
  }
  
  // 添加 base64 图片到 formData（后端需要 'file' 字段）
  formData.file = base64Image;
  
  console.log('🔍 [调试] 发送给后端的 JSON 格式:');
  console.log(JSON.stringify(formData, null, 2));
  
  return formData;
}

// ============================================================
// 【模块 3】生理信号感知服务
// ============================================================

/**
 * 上传生理时序特征
 * @param {string} userId - 用户ID
 * @param {Object} metrics - 生理指标数据
 * @returns {Promise} { record_id, status }
 */
export function uploadSignals(userId, metrics) {
  return request('/signals/upload', 'POST', {
    user_id: userId,
    metadata: metrics.metadata || {},
    metrics: metrics.metrics || {}
  });
}

/**
 * 快速上传心率血氧数据（简化版）
 * @param {string} userId - 用户ID
 * @param {Object} vitals - { heart_rate, blood_oxygen, rmssd, ... }
 * @returns {Promise}
 */
export function uploadVitals(userId, vitals) {
  return uploadSignals(userId, {
    metadata: {
      trace_id: `trace_${Date.now()}`,
      device_info: { type: 'SMART_RING', wearing_state: 'normal' }
    },
    metrics: {
      vital_signs: {
        heart_rate: { value: vitals.heart_rate || 0, unit: 'bpm', conf: 0.95 },
        blood_oxygen: { value: vitals.blood_oxygen || 0, unit: '%', conf: 0.95 }
      },
      heart_rate_variability: {
        rmssd: { value: vitals.rmssd || 0, unit: 'ms' },
        stress_index: { value: vitals.stress_index || 0, level: 'normal' }
      },
      morphology_features: {
        systolic_peak_amp: vitals.systolic_peak_amp || 0.85,
        augmentation_index: { value: vitals.augmentation_index || 0.12 }
      }
    }
  });
}

// ============================================================
// 【模块 4】报告单结构化解析服务
// ============================================================

/**
 * 分析医疗报告 - 新版 base64 JSON 格式
 * @param {string} filePath - 报告图片路径 (Data URL、Blob URL 或本地文件)
 * @param {string} userId - 用户ID
 * @returns {Promise} { record_id, summary, basic, lab_results, confidence }
 */
export function analyzeReportNew(filePath, userId) {
  const fullUrl = `${BASE_URL}${API_VERSION}/report/analyze`;

  console.log('📋 [analyzeReportNew] multipart 上传:', { url: fullUrl, filePath, userId });

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: fullUrl,
      filePath: filePath,
      name: 'file',
      formData: { user_id: userId },
      timeout: UPLOAD_TIMEOUT,
      success: (res) => {
        let data;
        try {
          data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } catch (e) {
          console.error('📋 [analyzeReportNew] 响应解析失败:', res.data);
          reject({ code: res.statusCode, msg: '服务器响应格式异常' });
          return;
        }
        console.log('📋 [analyzeReportNew] 响应:', data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data.data || data);
        } else {
          reject({ code: res.statusCode, msg: data?.msg || '上传失败' });
        }
      },
      fail: (err) => {
        console.error('📋 [analyzeReportNew] 网络错误:', err);
        reject({ code: -1, msg: '网络连接失败' });
      }
    });
  });
}

// ============================================================
// 【模块 5】智能体中枢对话服务
// ============================================================

/**
 * 发起综合研判与对话
 * @param {string} userId - 用户ID
 * @param {string} query - 用户查询文本（可选，不填时为一键生成报告）
 * @returns {Promise} { content, health_score, context_used, generated_at }
 */
export function chatWithAgent(userId, query = '') {
  return request('/chat/query', 'POST', {
    user_id: userId,
    query: query || '请根据我最近的所有数据生成一份综合健康报告'
  });
}

/**
 * 一键生成综合报告（通过发送空query调用 /chat/query）
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function generateHealthReport(userId) {
  return request('/chat/query', 'POST', {
    user_id: userId,
    query: '请根据我最近的所有数据生成一份综合健康报告'
  });
}

// ============================================================
// 【辅助函数】错误处理与响应解析
// ============================================================

/**
 * 统一的响应处理器
 * @param {Promise} apiPromise - API 调用 Promise
 * @param {Function} onSuccess - 成功回调
 * @param {Function} onError - 失败回调
 */
export function handleApiResponse(apiPromise, onSuccess, onError) {
  apiPromise
    .then(res => {
      if (res.code === 200) {
        onSuccess && onSuccess(res.data);
      } else {
        onError && onError({ code: res.code, msg: res.msg });
      }
    })
    .catch(err => {
      console.error('API Error:', err);
      onError && onError(err);
    });
}

/**
 * 根据错误状态码给出用户友好的提示
 * @param {number} code - 状态码
 * @returns {string} 用户提示文案
 */
export function getErrorMessage(code) {
  const messages = {
    200: '成功',
    400: '请求参数错误，请检查输入',
    401: '认证失败，请重新登录',
    415: '不支持的文件格式，请使用JPG或PNG',
    422: '业务条件不满足，请检查数据',
    500: '服务器错误，请稍后重试',
    504: 'AI 医生正在深度分析中，请稍候'
  };
  return messages[code] || `操作失败（${code}）`;
}

/**
 * 处理文件上传的进度与错误
 * @param {string} filePath - 文件路径
 * @param {string} type - 文件类型：'face' | 'report'
 * @returns {Object} { isValid, error }
 */
export function validateUploadFile(filePath, type) {
  const validTypes = ['jpg', 'jpeg', 'png'];
  const ext = filePath.split('.').pop().toLowerCase();
  
  if (!validTypes.includes(ext)) {
    return {
      isValid: false,
      error: `${type}图片仅支持 JPG 或 PNG 格式`
    };
  }
  
  return { isValid: true };
}

// ============================================================
// 【Report 调试和测试函数】
// ============================================================

/**
 * 【调试】显示发送给后端的 Report JSON 格式
 */
export async function debugReportFormat(filePath, userId) {
  let base64Image = filePath;
  
  if (filePath.startsWith('data:')) {
    base64Image = filePath.split(',')[1];
  } else if (filePath.startsWith('blob:')) {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      base64Image = await blobToBase64(blob);
    } catch (e) {
      base64Image = '转换失败';
    }
  }
  
  const formData = {
    user_id: userId,
    file: base64Image
  };
  
  console.log('🔍 [调试] Report 发送给后端的 JSON 格式:');
  console.log(JSON.stringify(formData, null, 2));
  console.log('\n📋 关键字段验证:');
  console.log('- user_id 字段:', !!formData.user_id ? '✓' : '✗', '值:', formData.user_id);
  console.log('- file 字段:', !!formData.file ? '✓' : '✗', '长度:', formData.file?.length || 0);
  
  return formData;
}

/**
 * 【测试】验证是否真的收到了所有数据
 */
export function testReportDataReceived(userId, base64Data) {
  const testData = {
    user_id: userId,
    file: base64Data,
    _test_timestamp: Date.now(),
    _test_marker: 'TEST_REPORT_DATA_VERIFICATION'
  };
  
  console.log('🧪 [测试] 发送数据验证请求:', {
    userId: testData.user_id,
    base64Length: testData.file.length,
    testMarker: testData._test_marker
  });
  
  // 发送测试请求
  return request('/report/analyze', 'POST', testData, {}, 180000);
}
