/**
 * VitalAI - API 网关配置 (简化版)
 * 专注于解决 Data URL 上传问题
 */

// ============ 基础配置 ============
export const BASE_URL = 'http://121.40.235.7:8000';
export const API_VERSION = '/api/v1';
export const TIMEOUT = 120000;  // 普通请求超时 120 秒
export const UPLOAD_TIMEOUT = 180000;  // 上传请求超时 180 秒

const DEBUG_MODE = true;

function debugLog(title, data) {
  if (DEBUG_MODE) {
    console.log(`[API] ${title}`, data);
  }
}

/**
 * 统一请求封装
 * @param {string} url - API 路径
 * @param {string} method - HTTP 方法
 * @param {object} data - 请求数据
 * @param {object} headers - 自定义 headers
 * @param {number} timeout - 超时时间（毫秒），默认 120000ms
 */
export function request(url, method = 'GET', data = {}, headers = {}, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${API_VERSION}${url}`;
    
    debugLog('📤 发起请求', { url: fullUrl, method, timeout });
    
    uni.request({
      url: fullUrl,
      method,
      data,
      timeout: timeout,
      header: {
        'Content-Type': 'application/json',
        ...headers
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          debugLog('✅ 请求成功', responseData);
          resolve(responseData);
        } else {
          const errorData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          debugLog('❌ 请求失败', errorData);
          reject({ code: res.statusCode, msg: errorData?.msg || '请求失败' });
        }
      },
      fail: (err) => {
        debugLog('❌ 网络错误', err);
        reject({ code: -1, msg: '网络连接失败' });
      }
    });
  });
}

/**
 * 文件上传 - 现已支持 base64 JSON 格式
 * 
 * 新方案：直接传递 base64 到后端
 * @param {string} url - 接口路径
 * @param {Object} formData - 包含 image_base64 字段的表单数据
 *        格式: { user_id, image_base64, actual_age }
 */
export function uploadFile(url, formData) {
  console.log('📤 uploadFile 开始上传 (base64 JSON 格式)', {
    url,
    formDataKeys: Object.keys(formData),
    imageSize: formData.file?.length || 0,  // 后端接收的字段名是 'file'
    hasFileField: !!formData.file,
    timeout: UPLOAD_TIMEOUT + 'ms'
  });
  
  // 直接使用 request 发送 JSON，使用更长的超时时间
  return request(url, 'POST', formData, {}, UPLOAD_TIMEOUT);
}



// ============================================================
// 【格式测试接口】
// ============================================================

/**
 * 测试上传格式 - 检查后端接收到的数据格式
 * @param {Object} testData - 测试数据
 * @returns {Promise} 后端返回的数据格式信息
 */
export function testUploadFormat(testData) {
  console.log('🧪 [测试] 发送格式测试数据:', testData);
  return request('/face/analyze', 'POST', testData);
}

// ============================================================
// 【本地存储管理】
// ============================================================

let _userId = '';

export function setUserId(userId) {
  _userId = userId;
  try {
    uni.setStorageSync('user_id', userId);
  } catch (e) {
    console.warn('设置 user_id 失败:', e);
  }
}

export function getUserId() {
  if (_userId) return _userId;
  try {
    _userId = uni.getStorageSync('user_id') || '';
    return _userId;
  } catch (e) {
    console.warn('读取 user_id 失败:', e);
    return '';
  }
}

export function clearUserId() {
  _userId = '';
  try {
    uni.removeStorageSync('user_id');
  } catch (e) {
    console.warn('清除 user_id 失败:', e);
  }
}

export default {
  BASE_URL,
  API_VERSION,
  request,
  uploadFile,
  setUserId,
  getUserId,
  clearUserId
};
