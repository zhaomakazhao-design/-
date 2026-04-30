<script setup>
import { initAuth, useStore } from './utils/store.js';
import { initLocale } from './utils/i18n.js';

const { getters, mutations, state } = useStore();
initLocale();

// 初始化认证状态
initAuth();

// 根据登录状态跳转
setTimeout(() => {
  const isLoggedIn = getters.isLoggedIn();
  const userInfo = uni.getStorageSync('user_info');
  
  // 确保 actual_age 被正确加载
  if (userInfo && userInfo.chrono_age && !state.user.actual_age) {
    state.user.actual_age = userInfo.chrono_age;
  }
  
  if (isLoggedIn) {
    // 已登录
    if (userInfo && userInfo.name && userInfo.chrono_age) {
      // 有完整信息，进入首页
      uni.reLaunch({ url: '/pages/index/index' });
    } else {
      // 没有完整信息，进入编辑页
      uni.navigateTo({ url: '/pages/user-info/index' });
    }
  } else {
    // 未登录，进入登录页
    uni.reLaunch({ url: '/pages/login/index' });
  }
}, 100);
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
