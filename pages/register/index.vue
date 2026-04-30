<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ t('register.title') }}</text>
      <view style="width:64rpx" />
    </view>
    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">

      <view class="form-card">
        <input class="form-input" type="text" v-model="username" :placeholder="t('register.username')" placeholder-class="ph" :adjust-position="false" />
        <view class="input-sep" />
        <input class="form-input" type="password" v-model="password" :placeholder="t('register.password')" placeholder-class="ph" :adjust-position="false" />
        <view class="input-sep" />
        <input class="form-input" type="password" v-model="confirmPassword" :placeholder="t('register.confirmPassword')" placeholder-class="ph" :adjust-position="false" />
        <view class="input-sep" />
        <input class="form-input" type="number" v-model="age" :placeholder="t('register.age')" placeholder-class="ph" :adjust-position="false" />
      </view>

      <view class="register-btn" :class="{ loading: isLoading }" @tap="handleRegister">
        <text class="register-btn-txt">{{ isLoading ? t('register.registering') : t('common.register') }}</text>
      </view>

      <view class="link-row">
        <text class="link-txt">{{ t('register.hasAccount') }}</text>
        <text class="link-action" @tap="uni.navigateBack()">{{ t('common.backToLogin') }}</text>
      </view>

    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n, t } from '../../utils/i18n.js';
import { userRegister } from '../../utils/api-service.js';
import { setUserId } from '../../utils/api.js';

useI18n();
const statusBarHeight = ref(44);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const age = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  // 表单验证
  if (!username.value.trim() || username.value.length < 3) { 
    uni.showToast({ title: t('register.usernameShort'), icon: 'none' }); 
    return; 
  }
  if (password.value.length < 6) { 
    uni.showToast({ title: t('register.passwordShort'), icon: 'none' }); 
    return; 
  }
  if (password.value !== confirmPassword.value) { 
    uni.showToast({ title: t('register.passwordMismatch'), icon: 'none' }); 
    return; 
  }
  
  isLoading.value = true;
  try {
    const response = await userRegister({
      username: username.value,
      password: password.value,
      name: username.value,
      actual_age: parseInt(age.value) || null,
      medical_history: ''
    });
    
    if (response && response.user_id) {
      // 保存用户ID
      setUserId(response.user_id);
      
      // 注册成功提示
      uni.showToast({ title: t('register.registerSuccess'), icon: 'success' });
      
      // 使用 navigateTo 替代 reLaunch，更稳定
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' });
      }, 1500);
    } else {
      throw new Error(response?.msg || '注册失败');
    }
  } catch (error) {
    console.error('Register error:', error);
    
    // 详细的调试输出
    console.log('%c【注册调试信息】', 'color: red; font-weight: bold;');
    console.log('错误码:', error.code);
    console.log('错误信息:', error.msg || error.message);
    console.log('完整错误对象:', error);
    
    let errMsg = '注册失败';
    
    if (error.code === 9999) {
      // 响应格式错误 - 后端返回格式不对
      errMsg = '❌ 后端响应异常: ' + (error.msg || '未知错误');
    } else if (error.code === 400) {
      errMsg = '用户名已存在或参数错误';
    } else if (error.code === 500) {
      errMsg = '服务器错误，请稍后重试';
    } else if (error.code === -1) {
      errMsg = '网络连接失败 - 请检查后端服务器是否启动（http://localhost:8000）';
    } else if (error.msg) {
      errMsg = error.msg;
    }
    
    uni.showToast({ title: errMsg, icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx;
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
    .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; }
  }
  .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; }
}
.scroll-body { flex: 1; padding: 24rpx; }
.form-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .input-sep { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
}
.form-input { width: 100%; box-sizing: border-box; height: 88rpx; padding: 0 24rpx; font-size: 28rpx; color: #1C1C1E; background: transparent; }
.ph { color: #C7C7CC; font-size: 28rpx; }
.register-btn { background: #007AFF; border-radius: 20rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,122,255,0.3);
  &.loading { opacity: 0.7; }
  .register-btn-txt { font-size: 30rpx; font-weight: 600; color: #fff; }
}
.link-row { display: flex; align-items: center; justify-content: center; gap: 4rpx;
  .link-txt { font-size: 26rpx; color: #8E8E93; }
  .link-action { font-size: 26rpx; color: #007AFF; font-weight: 500; }
}
</style>
