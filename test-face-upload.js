/**
 * 调试脚本：直接测试面部上传API
 * 用于诊断后端响应问题
 */

const BASE_URL = 'http://121.40.235.7:8000';
const API_VERSION = '/api/v1';

/**
 * Base64 Data URL 转换为 Blob
 */
function dataUrlToBlob(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null;
  
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    
    const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    
    return new Blob([u8arr], { type: mimeType });
  } catch (e) {
    console.error('⚠️ Base64转Blob失败', e);
    return null;
  }
}

/**
 * 测试上传（使用 Fetch）
 */
async function testUploadWithFetch(dataUrl, userId) {
  console.log('=== 测试 Fetch 方式上传 ===');
  
  try {
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) {
      console.error('❌ 图片转换失败');
      return;
    }
    
    const form = new FormData();
    form.append('file', blob, 'test_face.jpg');
    form.append('user_id', userId);
    // 不添加 actual_age 来简化测试
    
    console.log('📤 发送请求...');
    console.log('URL:', `${BASE_URL}${API_VERSION}/face/analyze`);
    console.log('Method: POST');
    console.log('Content-Type: multipart/form-data (自动)');
    console.log('FormData 字段: file, user_id');
    
    const response = await fetch(`${BASE_URL}${API_VERSION}/face/analyze`, {
      method: 'POST',
      body: form
    });
    
    console.log('📥 收到响应:');
    console.log('Status:', response.status);
    console.log('Headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });
    
    const text = await response.text();
    console.log('原始响应文本长度:', text.length);
    console.log('原始响应前100字符:', text.substring(0, 100));
    
    try {
      const json = JSON.parse(text);
      console.log('✅ JSON 解析成功:', json);
    } catch (e) {
      console.log('❌ JSON 解析失败:', e.message);
      console.log('完整响应:', text);
    }
  } catch (err) {
    console.error('❌ 请求失败:', err.message);
  }
}

/**
 * 生成测试用的 Base64 图片（1x1 透明PNG）
 */
function getTestBase64Image() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// 导出函数供浏览器控制台调用
window.testFaceUpload = {
  testWithFetch: () => testUploadWithFetch(getTestBase64Image(), 'U1001'),
  testWithCustomImage: (dataUrl) => testUploadWithFetch(dataUrl, 'U1001')
};

console.log('✅ 测试脚本已加载');
console.log('调用方式:');
console.log('  testFaceUpload.testWithFetch()  - 使用测试图片上传');
console.log('  testFaceUpload.testWithCustomImage(dataUrl)  - 使用自定义图片上传');
