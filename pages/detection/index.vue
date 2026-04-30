<template>
  <view class="page">
    <view class="bg-orb orb-1" />
    <view class="bg-orb orb-2" />
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner">
        <text class="nav-title">{{ text.title }}</text>
        <view class="ble-status" @tap="goTo('/pages/bluetooth/index')">
          <view class="ble-dot" :class="bleConnected ? 'connected' : 'disconnected'" />
          <text class="ble-txt">{{ bleConnected ? text.bleConnected : text.bleDisconnected }}</text>
        </view>
      </view>
    </view>
    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="section">
        <text class="sec-title">{{ text.selectMode }}</text>
        <view class="mode-grid">
          <view v-for="mode in detectionModes" :key="mode.key" class="mode-card" :class="{ selected: selectedMode === mode.key }" @tap="selectMode(mode.key)">
            <view class="mode-icon-wrap" :style="{ background: mode.bg }"><text class="mode-icon">{{ mode.icon }}</text></view>
            <text class="mode-name">{{ mode.name }}</text>
            <text class="mode-desc">{{ mode.desc }}</text>
            <view class="mode-check" :style="{ opacity: selectedMode === mode.key ? 1 : 0 }">✓</view>
          </view>
        </view>
      </view>
      <view class="section">
        <text class="sec-title">{{ text.steps }}</text>
        <view class="steps-list">
          <view v-for="(step, i) in steps" :key="i" class="step-item">
            <view class="step-left">
              <view class="step-num" :class="step.status"><text class="step-num-txt">{{ step.status === 'done' ? '✓' : i + 1 }}</text></view>
              <view class="step-line" :class="{ done: step.status === 'done' }" :style="{ visibility: i < steps.length - 1 ? 'visible' : 'hidden' }" />
            </view>
            <view class="step-body">
              <view class="step-header"><text class="step-name">{{ step.name }}</text><view class="step-tag" :class="step.status"><text class="tag-txt">{{ stepStatusMap[step.status] }}</text></view></view>
              <text class="step-desc">{{ step.desc }}</text>
              <view class="step-action" :style="{ opacity: step.status === 'active' ? 1 : 0, pointerEvents: step.status === 'active' ? 'auto' : 'none' }"><view class="btn-go" @tap="goTo(step.route)"><text class="btn-go-txt">{{ text.startCollect }}</text></view></view>
            </view>
          </view>
        </view>
      </view>
      <view class="section">
        <view class="full-detect-card">
          <view class="fd-info"><text class="fd-title">{{ text.fullDetectTitle }}</text><text class="fd-desc">{{ text.fullDetectDesc }}</text></view>
          <view class="fd-btn" @tap="startFullDetect"><text class="fd-btn-txt">{{ text.start }}</text></view>
        </view>
      </view>
      <view style="height: 200rpx" />
    </scroll-view>
    <view class="tabbar" :style="{ paddingBottom: safeBottom + 'px' }">
      <view v-for="(tab, i) in tabList" :key="i" class="tab-item" @tap="onTab(i, tab)">
        <view class="tab-special" :class="{ 'sp-active': currentTab === i }" :style="{ display: tab.special ? 'flex' : 'none' }"><text class="tab-sp-icon">{{ tab.icon }}</text></view>
        <view class="tab-normal" :style="{ display: tab.special ? 'none' : 'flex' }"><text class="tab-icon" :class="{ 'ti-active': currentTab === i }">{{ tab.icon }}</text><view class="tab-dot" :style="{ opacity: currentTab === i ? 1 : 0 }" /></view>
        <text class="tab-lbl" :class="{ 'tl-active': currentTab === i }">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';
const { state } = useStore();
useI18n();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const currentTab = ref(1);
const selectedMode = ref('full');
const bleConnected = computed(() => state.ble && state.ble.connected || false);
const text = computed(() => ({
  title: t('detection.title'), bleConnected: t('detection.bleConnected'), bleDisconnected: t('detection.bleDisconnected'),
  selectMode: t('detection.selectMode'), steps: t('detection.steps'), done: t('detection.done'), active: t('detection.active'), pending: t('detection.pending'),
  startCollect: t('detection.startCollect'), fullDetectTitle: t('detection.fullDetectTitle'), fullDetectDesc: t('detection.fullDetectDesc'), start: t('detection.start'),
  tabHome: t('detection.tabHome'), tabDetection: t('detection.tabDetection'), tabReport: t('detection.tabReport'), tabProfile: t('detection.tabProfile')
}));
const detectionModes = computed(() => ([
  { key: 'full', icon: '◎', name: t('detection.full'), desc: t('detection.fullDesc'), bg: 'rgba(0,229,180,0.15)' },
  { key: 'face', icon: '◑', name: t('detection.face'), desc: t('detection.faceDesc'), bg: 'rgba(61,142,255,0.15)' },
  { key: 'ppg', icon: '♥', name: t('detection.ppg'), desc: t('detection.ppgDesc'), bg: 'rgba(255,107,157,0.15)' },
  { key: 'report', icon: '≡', name: t('detection.report'), desc: t('detection.reportDesc'), bg: 'rgba(167,139,250,0.15)' },
]));
const steps = computed(() => ([
  { name: t('detection.step1'), desc: t('detection.step1Desc'), status: 'done', route: '/pages/face-capture/index' },
  { name: t('detection.step2'), desc: t('detection.step2Desc'), status: 'active', route: '/pages/ppg-capture/index' },
  { name: t('detection.step3'), desc: t('detection.step3Desc'), status: 'pending', route: '/pages/report-upload/index' },
  { name: t('detection.step4'), desc: t('detection.step4Desc'), status: 'pending', route: '/pages/health-report/index' },
]));
const stepStatusMap = computed(() => ({ done: text.value.done, active: text.value.active, pending: text.value.pending }));
const tabList = computed(() => ([
  { text: text.value.tabHome, icon: '⌂', path: '/pages/index/index' },
  { text: text.value.tabDetection, icon: '◎', path: '/pages/detection/index', special: true },
  { text: text.value.tabReport, icon: '≡', path: '/pages/health-report/index' },
  { text: text.value.tabProfile, icon: '○', path: '/pages/profile/index' },
]));
onMounted(() => { const info = uni.getSystemInfoSync(); statusBarHeight.value = info.statusBarHeight || 44; safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0; });
const selectMode = (key) => { selectedMode.value = key; };
const goTo = (url) => uni.navigateTo({ url });
const startFullDetect = () => goTo('/pages/face-capture/index');
const onTab = (i, tab) => { currentTab.value = i; if (tab.path !== '/pages/detection/index') uni.switchTab({ url: tab.path }); };
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0F1E; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.12; pointer-events: none; z-index: 0; &.orb-1 { width: 500rpx; height: 500rpx; background: #3D8EFF; top: -100rpx; left: -100rpx; } &.orb-2 { width: 400rpx; height: 400rpx; background: #00E5B4; bottom: 200rpx; right: -80rpx; } }
.navbar { position: relative; z-index: 10; .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 32rpx; } .nav-title { font-size: 36rpx; font-weight: 800; color: #F0F4FF; } .ble-status { display: flex; align-items: center; gap: 10rpx; background: rgba(255,255,255,0.05); border-radius: 9999rpx; padding: 12rpx 20rpx; border: 1rpx solid rgba(255,255,255,0.08); .ble-dot { width: 14rpx; height: 14rpx; border-radius: 50%; &.connected { background: #00E5B4; box-shadow: 0 0 8rpx rgba(0,229,180,0.8); } &.disconnected { background: #4A5568; } } .ble-txt { font-size: 24rpx; color: #8A9BC0; } } }
.scroll-body { position: relative; z-index: 1; height: calc(100vh - var(--status-bar-height) - 132rpx - 112rpx); }
.section { padding: 24rpx 28rpx; }
.sec-title { display: block; font-size: 30rpx; font-weight: 700; color: #F0F4FF; margin-bottom: 20rpx; }
.mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; .mode-card { background: #111827; border: 1rpx solid rgba(255,255,255,0.06); border-radius: 24rpx; padding: 24rpx; position: relative; transition: all 0.2s ease; &.selected { border-color: rgba(0,229,180,0.5); background: rgba(0,229,180,0.05); } .mode-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; } .mode-icon { font-size: 36rpx; } .mode-name { display: block; font-size: 28rpx; font-weight: 700; color: #F0F4FF; margin-bottom: 6rpx; } .mode-desc { display: block; font-size: 22rpx; color: #8A9BC0; } .mode-check { position: absolute; top: 16rpx; right: 16rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: #00E5B4; display: flex; align-items: center; justify-content: center; font-size: 20rpx; color: #0A0F1E; font-weight: 700; } } }
.steps-list { .step-item { display: flex; gap: 20rpx; margin-bottom: 8rpx; } .step-left { display: flex; flex-direction: column; align-items: center; } .step-num { width: 56rpx; height: 56rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; &.done { background: #00E5B4; } &.active { background: linear-gradient(135deg, #3D8EFF, #00E5B4); box-shadow: 0 0 16rpx rgba(0,229,180,0.4); } &.pending { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); } .step-num-txt { font-size: 24rpx; font-weight: 700; color: #0A0F1E; } &.pending .step-num-txt { color: #4A5568; } } .step-line { width: 2rpx; flex: 1; min-height: 40rpx; background: rgba(255,255,255,0.06); margin: 6rpx 0; &.done { background: #00E5B4; } } .step-body { flex: 1; padding-bottom: 32rpx; } .step-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; } .step-name { font-size: 28rpx; font-weight: 600; color: #F0F4FF; } .step-tag { border-radius: 9999rpx; padding: 6rpx 16rpx; &.done { background: rgba(0,229,180,0.15); .tag-txt { color: #00E5B4; } } &.active { background: rgba(61,142,255,0.15); .tag-txt { color: #3D8EFF; } } &.pending { background: rgba(255,255,255,0.05); .tag-txt { color: #4A5568; } } .tag-txt { font-size: 22rpx; font-weight: 600; } } .step-desc { font-size: 24rpx; color: #8A9BC0; margin-bottom: 16rpx; } .step-action .btn-go { display: inline-flex; background: linear-gradient(135deg, #00E5B4, #00BFA5); border-radius: 9999rpx; padding: 14rpx 32rpx; .btn-go-txt { font-size: 26rpx; font-weight: 700; color: #0A0F1E; } } }
.full-detect-card { background: linear-gradient(135deg, #1C2438, #243050); border: 1rpx solid rgba(0,229,180,0.2); border-radius: 28rpx; padding: 32rpx; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 0 24rpx rgba(0,229,180,0.1); .fd-title { display: block; font-size: 30rpx; font-weight: 700; color: #F0F4FF; margin-bottom: 8rpx; } .fd-desc { display: block; font-size: 24rpx; color: #8A9BC0; } .fd-btn { width: 100rpx; height: 100rpx; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #00E5B4, #00BFA5); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24rpx rgba(0,229,180,0.4); .fd-btn-txt { font-size: 26rpx; font-weight: 700; color: #0A0F1E; } } }
.tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: rgba(17,24,39,0.96); backdrop-filter: blur(20px); border-top: 1rpx solid rgba(255,255,255,0.06); display: flex; align-items: flex-end; .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12rpx 0 16rpx; } .tab-normal { display: flex; flex-direction: column; align-items: center; position: relative; gap: 4rpx; .tab-dot { position: absolute; bottom: -8rpx; width: 8rpx; height: 8rpx; border-radius: 50%; background: #00E5B4; } } .tab-icon { font-size: 44rpx; color: #4A5568; &.ti-active { color: #00E5B4; } } .tab-special { width: 100rpx; height: 100rpx; border-radius: 50%; margin-top: -24rpx; background: #1C2438; border: 2rpx solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.4); &.sp-active { background: linear-gradient(135deg, #00E5B4, #00BFA5); border-color: #00E5B4; box-shadow: 0 -4rpx 24rpx rgba(0,229,180,0.5); } .tab-sp-icon { font-size: 48rpx; color: #8A9BC0; } &.sp-active .tab-sp-icon { color: #0A0F1E; } } .tab-lbl { font-size: 22rpx; color: #4A5568; margin-top: 4rpx; &.tl-active { color: #00E5B4; font-weight: 600; } } }
</style>
