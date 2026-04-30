<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="logo-section">
        <view class="logo-wrap">
          <text class="logo-txt">V</text>
        </view>
        <text class="app-name">VitalAI</text>
        <text class="app-desc">{{ t('login.subtitle') }}</text>
      </view>

      <view class="form-card">
        <view class="form-group">
          <input
            class="form-input"
            type="text"
            v-model="username"
            :placeholder="t('login.username')"
            placeholder-class="input-placeholder"
            :adjust-position="false"
          />
          <view class="input-divider" />
          <input
            class="form-input"
            type="password"
            v-model="password"
            :placeholder="t('login.password')"
            placeholder-class="input-placeholder"
            :adjust-position="false"
          />
        </view>
      </view>

      <view class="login-btn" :class="{ loading: isLoading }" @tap="handleLogin">
        <text class="login-btn-txt">{{ isLoading ? t('login.loggingIn') : t('common.login') }}</text>
      </view>

      <view class="link-row">
        <text class="link-txt" @tap="goRegister">{{ t('login.noAccount') }}</text>
        <text class="link-action" @tap="goRegister">{{ t('login.registerNow') }}</text>
      </view>

      <view class="demo-section">
        <text class="demo-label">{{ t('login.demoAccount') }}</text>
        <view class="demo-card">
          <view class="demo-row">
            <text class="demo-key">{{ t('common.account') }}</text>
            <text class="demo-val">demo</text>
          </view>
          <view class="demo-divider" />
          <view class="demo-row">
            <text class="demo-key">{{ t('common.passwordLabel') }}</text>
            <text class="demo-val">123456</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '../../utils/store.js';
import { useI18n, t } from '../../utils/i18n.js';
import { userLogin } from '../../utils/api-service.js';
import { setUserId } from '../../utils/api.js';

const { mutations } = useStore();
useI18n();
const statusBarHeight = ref(44);
const username = ref('');
const password = ref('');
const isLoading = ref(false);

// 登录信息存储 key
const LOGIN_STORAGE_KEY = 'vitalai_login_cache';

/**
 * 保存登录信息到本地存储
 * @param {string} user - 用户名
 * @param {string} pwd - 密码
 */
function saveLoginCache(user, pwd) {
  try {
    uni.setStorageSync(LOGIN_STORAGE_KEY, {
      username: user,
      password: pwd,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('保存登录信息失败:', e);
  }
}

/**
 * 读取本地存储的登录信息
 * @returns {Object} { username, password }
 */
function getLoginCache() {
  try {
    const cached = uni.getStorageSync(LOGIN_STORAGE_KEY);
    if (cached && cached.username && cached.password) {
      return {
        username: cached.username,
        password: cached.password
      };
    }
  } catch (e) {
    console.warn('读取登录信息失败:', e);
  }
  return { username: '', password: '' };
}

/**
 * 清除本地存储的登录信息
 */
function clearLoginCache() {
  try {
    uni.removeStorageSync(LOGIN_STORAGE_KEY);
  } catch (e) {
    console.warn('清除登录信息失败:', e);
  }
}

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    uni.showToast({ title: t('login.inputRequired'), icon: 'none' });
    return;
  }
  
  isLoading.value = true;
  try {
    // ✨ 演示账号本地验证（不发送请求）
    if (username.value === 'demo' && password.value === '123456') {
      console.log('🎬 [演示账号] 本地验证通过，直接进入系统');
      
      // 构造演示用户数据
      const demoUser = {
        user_id: 'DEMO_USER_001',
        username: 'demo',
        name: 'Demo User',
        actual_age: 28,
        gender: 'M',
        height: 175,
        weight: 70,
        phone: '13800000000'
      };
      
      // 保存登录信息到本地
      saveLoginCache(username.value, password.value);
      
      // 保存演示用户信息
      try {
        uni.setStorageSync('user_info', {
          user_id: demoUser.user_id,
          username: demoUser.username,
          name: demoUser.name,
          chrono_age: demoUser.actual_age,
          gender: demoUser.gender,
          height: demoUser.height,
          weight: demoUser.weight,
          phone: demoUser.phone
        });
      } catch (e) {
        console.warn('保存演示用户信息失败:', e);
      }
      
      // 设置用户状态
      setUserId(demoUser.user_id);
      mutations.setUser({ 
        id: demoUser.user_id,
        name: demoUser.name,
        actual_age: demoUser.actual_age,
        chrono_age: demoUser.actual_age,
        gender: demoUser.gender,
        height: demoUser.height,
        weight: demoUser.weight,
        phone: demoUser.phone
      });
      
      console.log('✅ 演示账号已登录', demoUser);
      
      // 成功提示
      uni.showToast({ title: '演示账号登录成功', icon: 'success' });
      
      // 延迟导航
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/index/index' });
      }, 1000);
      return;
    }
    
    // 正常账号向后端验证
    console.log('🔐 [正常账号] 向后端发送验证请求');
    const response = await userLogin(username.value, password.value);
    const loginData = response?.data || response;
    
    if (loginData && loginData.user_id) {
      // 保存登录信息到本地
      saveLoginCache(username.value, password.value);
      
      // 从本地存储读取用户详细信息（包括年龄）
      let userDetailInfo = {};
      try {
        userDetailInfo = uni.getStorageSync('user_info') || {};
      } catch (e) {
        console.warn('读取本地用户信息失败:', e);
      }
      
      // 保存用户信息，包括 actual_age（从本地 chrono_age 映射）
      const userId = loginData.user_id;
      setUserId(userId);
      mutations.setUser({ 
        id: userId, 
        name: loginData.name || loginData.username || t('login.demoAccount'),
        actual_age: userDetailInfo.chrono_age || loginData.actual_age || null,  // 优先取本地年龄
        chrono_age: userDetailInfo.chrono_age || loginData.actual_age || null,
        gender: userDetailInfo.gender || loginData.gender || null,
        height: userDetailInfo.height || null,
        weight: userDetailInfo.weight || null,
        medical_history: userDetailInfo.medical_history || loginData.medical_history || null
      });
      
      console.log('✅ 用户登录成功并加载详细信息', {
        userId,
        actualAge: userDetailInfo.chrono_age || loginData.actual_age || null,
        userDetailInfo
      });
      
      // 成功提示
      uni.showToast({ title: t('login.loginSuccess'), icon: 'success' });
      
      // 延迟导航，确保状态已更新，使用 redirectTo 更稳定
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/index/index' });
      }, 1500);
    } else {
      throw new Error(response?.msg || loginData?.msg || t('login.loginFailed'));
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // 详细的调试输出
    console.log('%c【登录调试信息】', 'color: red; font-weight: bold;');
    console.log('错误码:', error.code);
    console.log('错误信息:', error.msg || error.message);
    console.log('完整错误对象:', error);
    
    let errMsg = t('login.networkError');
    
    // 根据错误代码给出特定提示
    if (error.code === 401) {
      errMsg = t('login.invalidCreds') || '账号或密码错误';
    } else if (error.code === 400) {
      errMsg = '请检查输入内容';
    } else if (error.code === 500) {
      errMsg = '服务器错误，请稍后重试';
    } else if (error.code === -1) {
      errMsg = '网络连接失败 - 请检查后端服务器是否启动（http://localhost:8000）';
    } else if (error.message) {
      errMsg = error.message;
    }
    
    uni.showToast({ title: errMsg, icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

const goRegister = () => uni.redirectTo({ url: '/pages/register/index' });

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  
  // 读取上次登录的信息
  const cached = getLoginCache();
  if (cached.username && cached.password) {
    username.value = cached.username;
    password.value = cached.password;
  }
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.scroll-body { flex: 1; padding: 0 24rpx; }
.logo-section { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0 60rpx;
  .logo-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; background: linear-gradient(135deg,#007AFF,#34C759); display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(0,122,255,0.3);
    .logo-txt { font-size: 56rpx; font-weight: 900; color: #fff; }
  }
  .app-name { font-size: 40rpx; font-weight: 800; color: #1C1C1E; margin-bottom: 8rpx; letter-spacing: -1rpx; }
  .app-desc { font-size: 24rpx; color: #8E8E93; }
}
.form-card { background: #fff; border-radius: 20rpx; margin-bottom: 20rpx; overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .form-group {
    .input-divider { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
  }
}
.form-input { width: 100%; box-sizing: border-box; height: 88rpx; padding: 0 24rpx; font-size: 28rpx; color: #1C1C1E; background: transparent; }
.input-placeholder { color: #C7C7CC; font-size: 28rpx; }
.login-btn { background: #007AFF; border-radius: 20rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,122,255,0.3);
  &.loading { opacity: 0.7; }
  .login-btn-txt { font-size: 30rpx; font-weight: 600; color: #fff; }
}
.link-row { display: flex; align-items: center; justify-content: center; gap: 4rpx; margin-bottom: 48rpx;
  .link-txt { font-size: 26rpx; color: #8E8E93; }
  .link-action { font-size: 26rpx; color: #007AFF; font-weight: 500; }
}
.demo-section { margin-bottom: 40rpx;
  .demo-label { display: block; font-size: 22rpx; font-weight: 600; color: #8E8E93; text-transform: uppercase; letter-spacing: 1rpx; margin: 0 8rpx 10rpx; }
  .demo-card { background: #fff; border-radius: 20rpx; overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    .demo-row { display: flex; align-items: center; justify-content: space-between; padding: 22rpx 24rpx;
      .demo-key { font-size: 26rpx; color: #1C1C1E; }
      .demo-val { font-size: 26rpx; color: #8E8E93; font-weight: 500; }
    }
    .demo-divider { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
  }
}
</style>
