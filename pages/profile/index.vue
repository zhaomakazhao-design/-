<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <text class="navbar-title">{{ text.title }}</text>
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="profile-card" @tap="goEditInfo">
        <view class="avatar">
          <text class="avatar-txt">{{ userInfo.name ? userInfo.name.slice(0,1) : fallbackAvatar }}</text>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ userInfo.name || text.tapToEdit }}</text>
          <text class="profile-sub">{{ profileSubText }}</text>
        </view>
        <text class="profile-chevron">›</text>
      </view>

      <view class="section-header"><text class="section-title">{{ text.basicInfo }}</text></view>
      <view class="list-card">
        <view v-for="(item, i) in infoItems" :key="item.key" class="list-row">
          <text class="lr-label">{{ item.label }}</text>
          <text class="lr-value">{{ item.value }}</text>
          <view v-if="i < infoItems.length - 1" class="lr-divider" />
        </view>
      </view>

      <view class="section-header"><text class="section-title">{{ text.collectionStatus }}</text></view>
      <view class="list-card">
        <view v-for="(s, i) in statusItems" :key="s.key" class="list-row">
          <view class="lr-left">
            <view class="lr-dot" :style="{ background: s.done ? '#34C759' : '#C7C7CC' }" />
            <text class="lr-label">{{ s.name }}</text>
          </view>
          <text class="lr-value" :style="{ color: s.done ? '#34C759' : '#8E8E93' }">{{ s.val }}</text>
          <view v-if="i < statusItems.length - 1" class="lr-divider" />
        </view>
      </view>

      <view class="section-header"><text class="section-title">{{ text.more }}</text></view>
      <view class="list-card">
        <view v-for="(m, i) in menuItems" :key="m.key" class="list-row tappable" @tap="m.action && m.action()">
          <view class="lr-left">
            <view class="lr-icon-wrap" :style="{ background: m.color + '18' }">
              <text class="lr-icon" :style="{ color: m.color }">{{ m.icon }}</text>
            </view>
            <text class="lr-label">{{ m.label }}</text>
          </view>
          <text class="lr-chevron">›</text>
          <view v-if="i < menuItems.length - 1" class="lr-divider" />
        </view>
      </view>

      <view class="logout-btn" @tap="handleLogout">
        <text class="logout-txt">{{ text.logout }}</text>
      </view>

      <view style="height:200rpx" />
    </scroll-view>

    <view class="tabbar" :style="{ paddingBottom: safeBottom + 'px' }">
      <view v-for="(tab,i) in tabList" :key="i" class="tab-item" @tap="onTab(i,tab)">
        <view class="tab-icon-wrap">
          <text class="tab-icon" :class="{ active: currentTab===i }">{{ tab.icon }}</text>
        </view>
        <text class="tab-lbl" :class="{ active: currentTab===i }">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useStore } from '../../utils/store.js';
import { useI18n, t } from '../../utils/i18n.js';

const { getters, state, mutations } = useStore();
const { locale } = useI18n();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const currentTab = ref(2);
const infoItems = ref([]);
const userInfo = ref({ name: '', age: 0, gender: '', height: 0, weight: 0, bmi: 0 });

const text = computed(() => ({
  title: t('profile.title'),
  tapToEdit: t('profile.tapToEdit'),
  basicInfo: t('profile.basicInfo'),
  collectionStatus: t('profile.collectionStatus'),
  more: t('profile.more'),
  detectionHistory: t('profile.detectionHistory'),
  bluetoothDevices: t('profile.bluetoothDevices'),
  settings: t('profile.settings'),
  logout: t('common.logout'),
  logoutTitle: t('profile.logoutTitle'),
  logoutConfirm: t('profile.logoutConfirm'),
  age: t('profile.age'),
  gender: t('profile.gender'),
  height: t('profile.height'),
  weight: t('profile.weight'),
  bmi: t('profile.bmi'),
  unset: t('profile.unset'),
  notCalculated: t('profile.notCalculated'),
  face: t('profile.face'),
  hardware: t('profile.hardware'),
  report: t('profile.report'),
  genomics: t('profile.genomics'),
  providedByHospital: t('home.providedByHospital'),
  tabHealth: t('common.health'),
  tabAiChat: t('common.aiChat'),
  tabProfile: t('common.profile'),
  ageSuffix: t('common.ageSuffix')
}));

const fallbackAvatar = computed(() => (text.value.tabProfile.startsWith('P') ? 'P' : 'U'));
const profileSubText = computed(() => t('profile.tapToEditId', { id: state.user.id || 'N/A' }));
const menuItems = computed(() => ([
  { key: 'history', label: text.value.detectionHistory, icon: '📊', color: '#007AFF', action: () => uni.navigateTo({ url: '/pages/health-report/index' }) },
  { key: 'ble', label: text.value.bluetoothDevices, icon: '⚡', color: '#AF52DE', action: () => uni.navigateTo({ url: '/pages/bluetooth/index' }) },
  { key: 'settings', label: text.value.settings, icon: '⚙️', color: '#34C759', action: () => uni.navigateTo({ url: '/pages/settings/index' }) },
]));
const tabList = computed(() => ([
  { text: text.value.tabHealth, icon:'♥', path:'/pages/index/index' },
  { text: text.value.tabAiChat, icon:'✦', path:'/pages/ai-chat/index' },
  { text: text.value.tabProfile, icon:'⊙', path:'/pages/profile/index' },
]));

const statusItems = computed(() => {
  // 监听 text 的变化（通过依赖 locale）确保语言改变时重新计算
  const _ = text.value;
  const status = getters.collectionStatus();
  const statusMap = {
    '未采集': t('common_ui.notCollected'),
    '已采集': t('common_ui.collected'),
    '未连接': t('common_ui.notConnected'),
    '已连接': t('common_ui.connected'),
    '未上传': t('common_ui.notUploaded'),
    '已上传': t('common_ui.uploaded'),
    '医院提供': text.value.providedByHospital,
    '待接入': text.value.providedByHospital
  };
  return [
    { key: 'face', name: text.value.face, val: statusMap[status.face] || status.face, done: status.face !== '未采集' },
    { key: 'hw', name: text.value.hardware, val: statusMap[status.physio] || status.physio, done: status.physio !== '未连接' },
    { key: 'report', name: text.value.report, val: statusMap[status.report] || status.report, done: status.report !== '未上传' },
    { key: 'genomics', name: text.value.genomics, val: status.genomics, done: false },
  ];
});

const onTab = (i, tab) => {
  currentTab.value = i;
  if (tab.path !== '/pages/profile/index') uni.redirectTo({ url: tab.path });
};
const goEditInfo = () => uni.navigateTo({ url: '/pages/user-info/index' });

const buildPageData = () => {
  const user = getters.userInfo();
  userInfo.value = user;
  infoItems.value = [
    { key: 'age', label: text.value.age, value: (user.chrono_age || user.age || '--') + text.value.ageSuffix },
    { key: 'gender', label: text.value.gender, value: user.gender || text.value.unset },
    { key: 'height', label: text.value.height, value: user.height ? user.height + ' cm' : text.value.unset },
    { key: 'weight', label: text.value.weight, value: user.weight ? user.weight + ' kg' : text.value.unset },
    { key: 'bmi', label: text.value.bmi, value: user.bmi || text.value.notCalculated },
  ];
};

const handleLogout = () => {
  uni.showModal({
    title: text.value.logoutTitle,
    content: text.value.logoutConfirm,
    success: (res) => {
      if (res.confirm) {
        mutations.setAuthToken('');
        uni.removeStorageSync('auth_token');
        uni.removeStorageSync('user_info');
        uni.reLaunch({ url: '/pages/login/index' });
      }
    }
  });
};

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0;
  buildPageData();
});

onShow(() => {
  buildPageData();
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { background: #F2F2F7; padding: 8rpx 32rpx 16rpx;
  .navbar-title { display: block; font-size: 56rpx; font-weight: 800; color: #1C1C1E; letter-spacing: -1rpx; }
}
.scroll-body { flex: 1; }
.profile-card { margin: 0 16rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 24rpx 28rpx; display: flex; align-items: center; gap: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .avatar { width: 100rpx; height: 100rpx; border-radius: 50%; background: linear-gradient(135deg,#007AFF,#34C759); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    .avatar-txt { font-size: 44rpx; font-weight: 800; color: #fff; }
  }
  .profile-info { flex: 1;
    .profile-name { display: block; font-size: 32rpx; font-weight: 700; color: #1C1C1E; margin-bottom: 6rpx; }
    .profile-sub  { display: block; font-size: 22rpx; color: #8E8E93; }
  }
  .profile-chevron { font-size: 40rpx; color: #C7C7CC; font-weight: 300; }
}
.section-header { padding: 0 32rpx 10rpx;
  .section-title { font-size: 24rpx; font-weight: 600; color: #8E8E93; text-transform: uppercase; letter-spacing: 1rpx; }
}
.list-card { margin: 0 16rpx 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .list-row { position: relative; padding: 22rpx 24rpx; display: flex; align-items: center; justify-content: space-between;
    &.tappable:active { background: #F2F2F7; }
    .lr-left { display: flex; align-items: center; gap: 16rpx;
      .lr-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; }
      .lr-icon-wrap { width: 52rpx; height: 52rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        .lr-icon { font-size: 26rpx; }
      }
    }
    .lr-label  { font-size: 28rpx; color: #1C1C1E; font-weight: 400; }
    .lr-value  { font-size: 26rpx; color: #8E8E93; font-weight: 500; }
    .lr-chevron { font-size: 36rpx; color: #C7C7CC; font-weight: 300; }
    .lr-divider { position: absolute; bottom: 0; left: 24rpx; right: 0; height: 1rpx; background: #F2F2F7; }
  }
}
.logout-btn { margin: 0 16rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .logout-txt { font-size: 28rpx; font-weight: 600; color: #FF3B30; }
}
.tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: rgba(249,249,249,0.92); backdrop-filter: blur(20px); border-top: 1rpx solid rgba(0,0,0,0.08); display: flex;
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0 8rpx; gap: 4rpx;
    .tab-icon { font-size: 36rpx; color: #8E8E93; &.active { color: #007AFF; } }
    .tab-lbl { font-size: 18rpx; color: #8E8E93; font-weight: 500; &.active { color: #007AFF; font-weight: 600; } }
  }
}
</style>
