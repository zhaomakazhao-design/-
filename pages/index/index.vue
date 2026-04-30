<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="navbar">
      <text class="navbar-date">{{ todayStr }}</text>
      <text class="navbar-title">{{ text.healthTitle }}</text>
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="greeting-section">
        <text class="greeting-txt">{{ greetingText }}</text>
        <text class="greeting-sub">{{ text.todayOverview }}</text>
      </view>

      <view class="summary-card" @tap="goTo('/pages/health-report/index')">
        <view class="sc-left">
          <text class="sc-label">{{ text.score }}</text>
          <view class="sc-score-row">
            <text class="sc-score">{{ lastHealthScore || '--' }}</text>
            <text class="sc-unit">{{ text.points }}</text>
          </view>
          <text class="sc-hint">{{ lastHealthScore ? text.scoreHintReady : text.scoreHintEmpty }}</text>
        </view>
        <view class="sc-ring">
          <view class="ring-track" />
          <view class="ring-fill" :style="{ '--pct': (lastHealthScore || 0) / 100 }" />
          <text class="ring-num">{{ lastHealthScore || '--' }}</text>
        </view>
      </view>

      <view class="section-header">
        <text class="section-title">{{ text.modules }}</text>
      </view>

      <view class="modules-grid">
        <view class="module-cell" @tap="goTo('/pages/face-capture/index')">
          <view class="mc-icon-wrap" style="background:#EFF6FF">
            <text class="mc-icon">🦸</text>
          </view>
          <text class="mc-title">{{ text.face }}</text>
          <text class="mc-desc">{{ text.faceDesc }}</text>
          <text class="mc-status" :style="{ color: faceStatus.done ? '#34C759' : '#8E8E93' }">{{ faceStatus.label }}</text>
        </view>
        <view class="module-cell" @tap="goTo('/pages/bluetooth/index')">
          <view class="mc-icon-wrap" style="background:#FFF0F0">
            <text class="mc-icon">❤️</text>
          </view>
          <text class="mc-title">{{ text.hardware }}</text>
          <text class="mc-desc">{{ text.hardwareDesc }}</text>
          <text class="mc-status" :style="{ color: hwStatus.done ? '#34C759' : '#8E8E93' }">{{ hwStatus.label }}</text>
        </view>
        <view class="module-cell" @tap="goTo('/pages/report-upload/index')">
          <view class="mc-icon-wrap" style="background:#F0FFF4">
            <text class="mc-icon">🧸</text>
          </view>
          <text class="mc-title">{{ text.report }}</text>
          <text class="mc-desc">{{ text.reportDesc }}</text>
          <text class="mc-status" :style="{ color: reportStatus.done ? '#34C759' : '#8E8E93' }">{{ reportStatus.label }}</text>
        </view>
        <view class="module-cell" @tap="goTo('/pages/genomics/index')">
          <view class="mc-icon-wrap" style="background:#F5F0FF">
            <text class="mc-icon">🧬</text>
          </view>
          <text class="mc-title">{{ text.genomics }}</text>
          <text class="mc-desc">{{ text.genomicsDesc }}</text>
          <text class="mc-status" style="color:#8E8E93">{{ text.providedByHospital }}</text>
        </view>
      </view>

      <view v-if="recentVitals.length" class="section-header">
        <text class="section-title">{{ text.recentVitals }}</text>
        <text class="section-more" @tap="goTo('/pages/ppg-capture/index')">{{ text.viewAll }}</text>
      </view>
      <view v-if="recentVitals.length" class="vitals-grid">
        <view v-for="v in recentVitals" :key="v.key" class="vital-card">
          <text class="vc-name">{{ v.name }}</text>
          <view class="vc-val-row">
            <text class="vc-val" :style="{ color: v.color }">{{ v.val }}</text>
            <text class="vc-unit">{{ v.unit }}</text>
          </view>
        </view>
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
import { computed, ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useStore } from '../../utils/store.js';
import { useI18n, t } from '../../utils/i18n.js';

const { getters } = useStore();
const { locale } = useI18n();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const currentTab = ref(0);
const userName = ref('');
const recentVitals = ref([]);
const lastHealthScore = ref(null);
const todayStr = ref('');

const text = computed(() => ({
  healthTitle: t('common.health'),
  todayOverview: t('home.todayOverview'),
  score: t('home.score'),
  points: t('common.points'),
  scoreHintReady: t('home.scoreHintReady'),
  scoreHintEmpty: t('home.scoreHintEmpty'),
  modules: t('home.modules'),
  face: t('home.face'),
  faceDesc: t('home.faceDesc'),
  hardware: t('home.hardware'),
  hardwareDesc: t('home.hardwareDesc'),
  report: t('home.report'),
  reportDesc: t('home.reportDesc'),
  genomics: t('home.genomics'),
  genomicsDesc: t('home.genomicsDesc'),
  providedByHospital: t('home.providedByHospital'),
  recentVitals: t('home.recentVitals'),
  viewAll: t('home.viewAll'),
  userFallback: t('home.userFallback'),
  tabHealth: t('common.health'),
  tabAiChat: t('common.aiChat'),
  tabProfile: t('common.profile')
}));

const greetingText = computed(() => t('home.greeting', { name: userName.value }));
const tabList = computed(() => ([
  { text: text.value.tabHealth, icon:'♥', path:'/pages/index/index' },
  { text: text.value.tabAiChat, icon:'✦', path:'/pages/ai-chat/index' },
  { text: text.value.tabProfile, icon:'⊙', path:'/pages/profile/index' },
]));

const faceStatus = computed(() => {
  // 确保依赖文本的变化
  const _ = text.value;
  const status = getters.collectionStatus();
  const statusMap = {
    '未采集': t('common_ui.notCollected'),
    '已采集': t('common_ui.collected'),
    '未连接': t('common_ui.notConnected'),
    '已连接': t('common_ui.connected'),
    '未上传': t('common_ui.notUploaded'),
    '已上传': t('common_ui.uploaded')
  };
  return { label: statusMap[status.face] || status.face, done: status.face !== '未采集' };
});

const hwStatus = computed(() => {
  const _ = text.value;
  const status = getters.collectionStatus();
  const statusMap = {
    '未采集': t('common_ui.notCollected'),
    '已采集': t('common_ui.collected'),
    '未连接': t('common_ui.notConnected'),
    '已连接': t('common_ui.connected'),
    '未上传': t('common_ui.notUploaded'),
    '已上传': t('common_ui.uploaded')
  };
  return { label: statusMap[status.physio] || status.physio, done: status.physio !== '未连接' };
});

const reportStatus = computed(() => {
  const _ = text.value;
  const status = getters.collectionStatus();
  const statusMap = {
    '未采集': t('common_ui.notCollected'),
    '已采集': t('common_ui.collected'),
    '未连接': t('common_ui.notConnected'),
    '已连接': t('common_ui.connected'),
    '未上传': t('common_ui.notUploaded'),
    '已上传': t('common_ui.uploaded')
  };
  return { label: statusMap[status.report] || status.report, done: status.report !== '未上传' };
});

const goTo = (url) => uni.navigateTo({ url });
const onTab = (i, tab) => {
  currentTab.value = i;
  if (tab.path !== '/pages/index/index') uni.redirectTo({ url: tab.path });
};

const buildDateText = () => {
  const now = new Date();
  if (locale.locale === 'en') {
    todayStr.value = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    return;
  }
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  todayStr.value = `${now.getMonth()+1}月${now.getDate()}日 ${days[now.getDay()]}`;
};

const buildPageData = () => {
  buildDateText();
  const user = getters.userInfo();
  userName.value = user.name || text.value.userFallback;
  recentVitals.value = getters.recentVitals();
  const score = getters.healthScore();
  lastHealthScore.value = score ?? null;
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
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; overflow: hidden; }
.status-bar { background: #F2F2F7; }
.navbar { background: #F2F2F7; padding: 8rpx 32rpx 16rpx;
  .navbar-date { display: block; font-size: 24rpx; color: #8E8E93; font-weight: 400; }
  .navbar-title { display: block; font-size: 56rpx; font-weight: 800; color: #1C1C1E; letter-spacing: -1rpx; }
}
.scroll-body { flex: 1; }
.greeting-section { padding: 8rpx 32rpx 24rpx;
  .greeting-txt { display: block; font-size: 28rpx; font-weight: 600; color: #1C1C1E; margin-bottom: 4rpx; }
  .greeting-sub { display: block; font-size: 24rpx; color: #8E8E93; }
}
.summary-card { margin: 0 16rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx 28rpx; display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .sc-left { flex: 1;
    .sc-label { display: block; font-size: 22rpx; color: #8E8E93; margin-bottom: 8rpx; font-weight: 500; }
    .sc-score-row { display: flex; align-items: baseline; gap: 4rpx; margin-bottom: 8rpx;
      .sc-score { font-size: 72rpx; font-weight: 800; color: #1C1C1E; line-height: 1; letter-spacing: -2rpx; }
      .sc-unit  { font-size: 26rpx; color: #8E8E93; }
    }
    .sc-hint { font-size: 22rpx; color: #007AFF; font-weight: 500; }
  }
  .sc-ring { position: relative; width: 120rpx; height: 120rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    .ring-track { position: absolute; inset: 0; border-radius: 50%; border: 10rpx solid #F2F2F7; }
    .ring-fill  { position: absolute; inset: 0; border-radius: 50%; border: 10rpx solid transparent; border-top-color: #FF2D55; transform: rotate(calc(var(--pct) * 360deg - 90deg)); }
    .ring-num   { font-size: 28rpx; font-weight: 800; color: #1C1C1E; z-index: 1; }
  }
}
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 0 32rpx 12rpx;
  .section-title { font-size: 28rpx; font-weight: 700; color: #1C1C1E; }
  .section-more  { font-size: 24rpx; color: #007AFF; font-weight: 500; }
}
.modules-grid { margin: 0 16rpx 24rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx;
  .module-cell { background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; display: flex; flex-direction: column; gap: 10rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    .mc-icon-wrap { width: 88rpx; height: 88rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 4rpx;
      .mc-icon { font-size: 48rpx; line-height: 1; }
    }
    .mc-title  { font-size: 28rpx; font-weight: 700; color: #1C1C1E; }
    .mc-desc   { font-size: 20rpx; color: #8E8E93; line-height: 1.4; }
    .mc-status { font-size: 22rpx; font-weight: 600; margin-top: 4rpx; }
  }
}
.vitals-grid { margin: 0 16rpx 24rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx;
  .vital-card { background: #fff; border-radius: 20rpx; padding: 24rpx; display: flex; flex-direction: column; gap: 6rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    .vc-name { font-size: 22rpx; color: #8E8E93; font-weight: 500; }
    .vc-val-row { display: flex; align-items: baseline; gap: 6rpx;
      .vc-val  { font-size: 48rpx; font-weight: 800; letter-spacing: -1rpx; }
      .vc-unit { font-size: 20rpx; color: #8E8E93; }
    }
  }
}
.tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: rgba(249,249,249,0.92); backdrop-filter: blur(20px); border-top: 1rpx solid rgba(0,0,0,0.08); display: flex;
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0 8rpx; gap: 4rpx;
    .tab-icon { font-size: 36rpx; color: #8E8E93; &.active { color: #007AFF; } }
    .tab-lbl { font-size: 18rpx; color: #8E8E93; font-weight: 500; &.active { color: #007AFF; font-weight: 600; } }
  }
}
</style>
