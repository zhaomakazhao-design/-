<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="goBack"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ t('settings.title') }}</text>
      <view style="width:64rpx" />
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="section-header"><text class="section-title">{{ t('settings.language') }}</text></view>
      <view class="list-card">
        <view class="list-row tappable" @tap="enableFollowSystem">
          <view class="lr-left">
            <view class="lr-icon-wrap soft-blue"><text class="lr-icon">🌐</text></view>
            <text class="lr-label">{{ t('settings.followSystem') }}</text>
          </view>
          <view class="row-right">
            <text class="lr-value">{{ locale.followSystem ? 'ON' : 'OFF' }}</text>
            <view class="switch-dot" :class="{ active: locale.followSystem }" />
          </view>
        </view>
        <view class="row-divider" />
        <view class="list-row tappable" @tap="switchLocale('zh')">
          <text class="lr-label">{{ t('settings.chinese') }}</text>
          <text class="checkmark">{{ !locale.followSystem && locale.locale === 'zh' ? '✓' : '' }}</text>
        </view>
        <view class="row-divider" />
        <view class="list-row tappable" @tap="switchLocale('en')">
          <text class="lr-label">{{ t('settings.english') }}</text>
          <text class="checkmark">{{ !locale.followSystem && locale.locale === 'en' ? '✓' : '' }}</text>
        </view>
      </view>

      <view class="section-header"><text class="section-title">{{ t('settings.currentLanguage') }}</text></view>
      <view class="info-card">
        <text class="info-value">{{ currentLanguageLabel }}</text>
      </view>

      <view class="section-header"><text class="section-title">{{ t('common.save') }}</text></view>
      <view class="list-card">
        <view class="list-row">
          <text class="lr-label">{{ t('settings.notifications') }}</text>
          <switch :checked="notificationsEnabled" color="#007AFF" @change="onNotificationsChange" />
        </view>
        <view class="row-divider" />
        <view class="list-row">
          <text class="lr-label">{{ t('settings.faceAutoUpload') }}</text>
          <switch :checked="faceAutoUpload" color="#34C759" @change="onFaceAutoUploadChange" />
        </view>
        <view class="row-divider" />
        <view class="list-row">
          <text class="lr-label">{{ t('settings.bluetoothAutoReconnect') }}</text>
          <switch :checked="bluetoothAutoReconnect" color="#AF52DE" @change="onBluetoothAutoReconnectChange" />
        </view>
      </view>

      <view class="section-header"><text class="section-title">{{ t('settings.about') }}</text></view>
      <view class="about-card">
        <text class="app-name">VitalAI</text>
        <text class="app-summary">{{ t('settings.summary') }}</text>
        <view class="about-meta">
          <text class="meta-key">{{ t('settings.version') }}</text>
          <text class="meta-value">1.0.0</text>
        </view>
      </view>

      <view class="section-header"><text class="section-title">{{ t('settings.dataPrivacy') }}</text></view>
      <view class="info-card">
        <text class="privacy-desc">{{ t('settings.privacyDesc') }}</text>
      </view>

      <view style="height:80rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n, t } from '../../utils/i18n.js';

const { locale, setLocale } = useI18n();
const statusBarHeight = ref(44);
const notificationsEnabled = ref(uni.getStorageSync('settings_notifications') !== false);
const faceAutoUpload = ref(uni.getStorageSync('settings_face_auto_upload') !== false);
const bluetoothAutoReconnect = ref(uni.getStorageSync('settings_ble_auto_reconnect') !== false);
const forceUpdateKey = ref(0);

const currentLanguageLabel = computed(() => {
  // 使用 forceUpdateKey 确保计算属性重新执行
  const _ = forceUpdateKey.value;
  if (locale.followSystem) return `${t('settings.followSystem')} · ${locale.locale === 'en' ? t('settings.english') : t('settings.chinese')}`;
  return locale.locale === 'en' ? t('settings.english') : t('settings.chinese');
});

const goBack = () => uni.navigateBack();
const enableFollowSystem = () => {
  const systemLocale = (uni.getSystemInfoSync?.().language || '').toLowerCase().startsWith('en') ? 'en' : 'zh';
  setLocale(systemLocale, { followSystem: true });
  forceUpdateKey.value += 1;
  uni.showToast({ title: t('common.save'), icon: 'success' });
};
const switchLocale = (value) => {
  setLocale(value, { followSystem: false });
  forceUpdateKey.value += 1;
  uni.showToast({ title: t('common.save'), icon: 'success' });
};
const onNotificationsChange = (e) => {
  notificationsEnabled.value = e.detail.value;
  uni.setStorageSync('settings_notifications', notificationsEnabled.value);
};
const onFaceAutoUploadChange = (e) => {
  faceAutoUpload.value = e.detail.value;
  uni.setStorageSync('settings_face_auto_upload', faceAutoUpload.value);
};
const onBluetoothAutoReconnectChange = (e) => {
  bluetoothAutoReconnect.value = e.detail.value;
  uni.setStorageSync('settings_ble_auto_reconnect', bluetoothAutoReconnect.value);
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
.scroll-body { flex: 1; }
.section-header { padding: 24rpx 32rpx 10rpx;
  .section-title { font-size: 24rpx; font-weight: 600; color: #8E8E93; text-transform: uppercase; letter-spacing: 1rpx; }
}
.list-card, .info-card, .about-card { margin: 0 16rpx 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.list-row { padding: 24rpx; display: flex; align-items: center; justify-content: space-between;
  &.tappable:active { background: #F7F7FA; }
  .lr-left { display: flex; align-items: center; gap: 16rpx; }
  .lr-icon-wrap { width: 52rpx; height: 52rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center;
    &.soft-blue { background: #EAF2FF; }
    .lr-icon { font-size: 28rpx; }
  }
  .lr-label { font-size: 28rpx; color: #1C1C1E; }
  .lr-value { font-size: 22rpx; color: #8E8E93; }
  .row-right { display: flex; align-items: center; gap: 12rpx; }
  .switch-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: #D1D1D6;
    &.active { background: #34C759; }
  }
  .checkmark { font-size: 30rpx; color: #007AFF; font-weight: 700; }
}
.row-divider { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
.info-card { padding: 24rpx;
  .info-value { font-size: 28rpx; color: #1C1C1E; font-weight: 600; }
  .privacy-desc { font-size: 24rpx; color: #636366; line-height: 1.6; }
}
.about-card { padding: 28rpx 24rpx; display: flex; flex-direction: column; gap: 12rpx;
  .app-name { font-size: 34rpx; font-weight: 800; color: #1C1C1E; }
  .app-summary { font-size: 24rpx; color: #636366; line-height: 1.6; }
  .about-meta { display: flex; align-items: center; justify-content: space-between; padding-top: 8rpx;
    .meta-key { font-size: 22rpx; color: #8E8E93; }
    .meta-value { font-size: 24rpx; color: #1C1C1E; font-weight: 600; }
  }
}
</style>
