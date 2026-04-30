/**
 * 调试脚本：验证 actual_age 数据流
 * 在 browser console 中运行此代码来追踪年龄数据的流转
 */

// 1. 检查本地存储
console.log('=== 本地存储数据 ===');
try {
  const userInfo = uni.getStorageSync('user_info');
  console.log('user_info:', userInfo);
  console.log('chrono_age (从本地存储):', userInfo?.chrono_age);
} catch (e) {
  console.warn('读取本地存储失败:', e);
}

// 2. 检查 store
console.log('\n=== Store 状态 ===');
try {
  const store = window.__store__ || require('./utils/store.js');
  if (store && store.default) {
    console.log('Store state.user:', store.default.user);
    console.log('actual_age (从 store):', store.default.user?.actual_age);
    console.log('chrono_age (从 store):', store.default.user?.chrono_age);
  }
} catch (e) {
  console.warn('读取 store 失败:', e);
}

// 3. 模拟 analyzeFace 调用
console.log('\n=== 模拟上传参数 ===');
async function testUploadParams() {
  try {
    const userInfo = uni.getStorageSync('user_info');
    const userId = uni.getStorageSync('user_id') || 'U1001';
    const actualAge = userInfo?.chrono_age || null;
    
    console.log('将发送的参数:');
    console.log('  user_id:', userId);
    console.log('  actual_age:', actualAge);
    console.log('  formData:', { user_id: userId, actual_age: actualAge });
  } catch (e) {
    console.error('测试失败:', e);
  }
}

// 4. 监听存储变化
console.log('\n=== 监听器已安装 ===');
window.addEventListener('storage', (event) => {
  if (event.key === 'user_info' || event.key === 'STORAGE' || !event.key) {
    console.log('📢 存储已更新，新的 user_info:', uni.getStorageSync('user_info'));
  }
});

testUploadParams();
