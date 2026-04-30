<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ text.title }}</text>
      <view style="width:64rpx" />
    </view>
    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="ble-bar" :class="bleConnected ? 'connected' : 'disconnected'" @tap="!bleConnected && gotoBle()">
        <view class="ble-dot" />
        <text class="ble-txt">{{ bleConnected ? text.bleConnected : text.bleDisconnected }}</text>
        <text v-if="!bleConnected" class="ble-arrow">›</text>
      </view>
      <view class="section-label">{{ text.core }}</view>
      <view class="main-grid">
        <view class="main-item"><text class="mi-label">{{ text.hr }}</text><text class="mi-val" style="color:#FF2D55">{{ vitals.hr ?? '--' }}</text><text class="mi-unit">bpm</text></view>
        <view class="main-item"><text class="mi-label">{{ text.spo2 }}</text><text class="mi-val" style="color:#34C759">{{ vitals.spo2 ?? '--' }}</text><text class="mi-unit">%</text></view>
        <view class="main-item"><text class="mi-label">{{ text.sbp }}</text><text class="mi-val" style="color:#007AFF">{{ vitals.sbp ?? '--' }}</text><text class="mi-unit">mmHg</text></view>
        <view class="main-item"><text class="mi-label">{{ text.dbp }}</text><text class="mi-val" style="color:#007AFF">{{ vitals.dbp ?? '--' }}</text><text class="mi-unit">mmHg</text></view>
      </view>
      <view class="section-label">{{ text.detail }}</view>
      <view class="list-card">
        <view class="detail-row" v-for="(item,i) in detailItems" :key="item.key">
          <text class="dr-label">{{ item.label }}</text>
          <view class="dr-right"><text class="dr-val" :style="{ color: item.color }">{{ vitals[item.key] ?? '--' }}</text><text class="dr-unit">{{ item.unit }}</text></view>
          <view v-if="i < detailItems.length-1" class="row-sep" />
        </view>
      </view>
      <view class="section-label">{{ text.temperature }}</view>
      <view class="temp-card">
        <view class="temp-item"><text class="temp-label">{{ text.bodyTemp }}</text><view class="temp-val-wrap"><text class="temp-val">{{ vitals.bodyTemp ?? '--' }}</text><text class="temp-unit">°C</text></view></view>
        <view class="temp-divider" />
        <view class="temp-item"><text class="temp-label">{{ text.ambientTemp }}</text><view class="temp-val-wrap"><text class="temp-val">{{ vitals.predTemp ?? '--' }}</text><text class="temp-unit">°C</text></view></view>
      </view>
      <view v-if="!bleConnected || !hasData" class="empty-card">
        <text class="empty-icon">📡</text>
        <text class="empty-title">{{ !bleConnected ? text.noBle : text.waiting }}</text>
        <text class="empty-desc">{{ !bleConnected ? text.noBleDesc : text.waitingDesc }}</text>
        <view class="empty-btn" @tap="gotoBle"><text class="empty-btn-txt">{{ text.gotoBle }}</text></view>
      </view>
      <view style="height:120rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';
const { state } = useStore();
useI18n();
const statusBarHeight = ref(44);
const vitals = computed(() => state.latestVitals || {});
const bleConnected = computed(() => state.ble && state.ble.connected || false);
const hasData = computed(() => Object.keys(vitals.value).length > 0 && vitals.value.hr !== undefined);
const text = computed(() => ({ title: t('ppg.title'), bleConnected: t('ppg.bleConnected'), bleDisconnected: t('ppg.bleDisconnected'), core: t('ppg.core'), detail: t('ppg.detail'), temperature: t('ppg.temperature'), bodyTemp: t('ppg.bodyTemp'), ambientTemp: t('ppg.ambientTemp'), noBle: t('ppg.noBle'), waiting: t('ppg.waiting'), noBleDesc: t('ppg.noBleDesc'), waitingDesc: t('ppg.waitingDesc'), gotoBle: t('ppg.gotoBle'), hr: t('ppg.hr'), spo2: t('ppg.spo2'), sbp: t('ppg.sbp'), dbp: t('ppg.dbp') }));
const detailItems = computed(() => ([
  { key: 'micro', label: t('ppg.micro'), unit: '', color: '#AF52DE' },
  { key: 'rr', label: t('ppg.rr'), unit: '/min', color: '#34C759' },
  { key: 'fatigue', label: t('ppg.fatigue'), unit: '', color: '#FF9500' },
  { key: 'rrInterval', label: t('ppg.rrInterval'), unit: 'ms', color: '#1C1C1E' },
  { key: 'sdnn', label: 'SDNN', unit: 'ms', color: '#1C1C1E' },
  { key: 'rmssd', label: 'RMSSD', unit: 'ms', color: '#1C1C1E' },
]));
const gotoBle = () => uni.navigateTo({ url: '/pages/bluetooth/index' });
onMounted(() => { const info = uni.getSystemInfoSync(); statusBarHeight.value = info.statusBarHeight || 44; });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; background: #F2F2F7; .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; } } .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; } }
.scroll-body { flex: 1; padding: 0 16rpx; }
.ble-bar { display: flex; align-items: center; gap: 12rpx; border-radius: 16rpx; padding: 16rpx 20rpx; margin: 12rpx 0; &.connected { background: rgba(52,199,89,0.1); .ble-dot { background: #34C759; } .ble-txt { color: #34C759; } } &.disconnected { background: rgba(255,59,48,0.08); .ble-dot { background: #FF3B30; } .ble-txt { color: #FF3B30; } } .ble-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; } .ble-txt { flex: 1; font-size: 24rpx; font-weight: 500; } .ble-arrow { font-size: 36rpx; color: #C7C7CC; } }
.section-label { font-size: 22rpx; font-weight: 600; color: #8E8E93; letter-spacing: 1rpx; margin: 20rpx 8rpx 10rpx; }
.main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; margin-bottom: 4rpx; .main-item { background: #fff; border-radius: 20rpx; padding: 28rpx; display: flex; flex-direction: column; align-items: center; gap: 8rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .mi-label { font-size: 22rpx; color: #8E8E93; } .mi-val { font-size: 56rpx; font-weight: 800; line-height: 1.1; } .mi-unit { font-size: 20rpx; color: #8E8E93; } } }
.list-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 4rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .detail-row { position: relative; display: flex; align-items: center; justify-content: space-between; padding: 22rpx 24rpx; .dr-label { font-size: 28rpx; color: #1C1C1E; } .dr-right { display: flex; align-items: baseline; gap: 4rpx; .dr-val { font-size: 36rpx; font-weight: 700; } .dr-unit { font-size: 20rpx; color: #8E8E93; } } .row-sep { position: absolute; bottom: 0; left: 24rpx; right: 0; height: 1rpx; background: #F2F2F7; } } }
.temp-card { background: #fff; border-radius: 20rpx; display: flex; overflow: hidden; margin-bottom: 4rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .temp-item { flex: 1; padding: 28rpx; display: flex; flex-direction: column; align-items: center; gap: 8rpx; .temp-label { font-size: 22rpx; color: #8E8E93; } .temp-val-wrap { display: flex; align-items: baseline; gap: 4rpx; .temp-val { font-size: 44rpx; font-weight: 800; color: #FF9500; } .temp-unit { font-size: 22rpx; color: #FF9500; } } } .temp-divider { width: 1rpx; background: #F2F2F7; margin: 20rpx 0; } }
.empty-card { background: #fff; border-radius: 20rpx; padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; margin-top: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .empty-icon { font-size: 64rpx; } .empty-title { font-size: 30rpx; font-weight: 700; color: #1C1C1E; } .empty-desc { font-size: 24rpx; color: #8E8E93; text-align: center; line-height: 1.6; } .empty-btn { margin-top: 8rpx; background: #007AFF; border-radius: 9999rpx; padding: 16rpx 40rpx; .empty-btn-txt { font-size: 26rpx; font-weight: 600; color: #fff; } } }
</style>
