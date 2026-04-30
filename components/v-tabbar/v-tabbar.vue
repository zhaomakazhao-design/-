<template>
  <view class="v-tabbar" :style="{ paddingBottom: safeBottom + 'px' }">
    <view class="tabbar-inner">
      <view
        v-for="(item, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentIndex === index }"
        @tap="onTab(index, item)"
      >
        <view class="tab-special" :style="{ display: item.special ? 'flex' : 'none' }">
          <view class="special-ring" :class="{ 'ring-active': currentIndex === index }">
            <text class="special-icon-text">{{ item.icon }}</text>
          </view>
          <text class="tab-label" :class="{ 'label-active': currentIndex === index }">{{ item.text }}</text>
        </view>
        <view class="tab-normal" :style="{ display: item.special ? 'none' : 'flex' }">
          <view class="icon-wrap">
            <text class="tab-icon" :class="{ 'icon-active': currentIndex === index }">{{ item.icon }}</text>
            <view class="active-dot" :style="{ opacity: currentIndex === index ? 1 : 0 }" />
          </view>
          <text class="tab-label" :class="{ 'label-active': currentIndex === index }">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../utils/i18n.js';

const props = defineProps({
  current: { type: Number, default: 0 }
});

const emit = defineEmits(['change']);
const currentIndex = ref(props.current);
const safeBottom = ref(0);

const tabs = [
  { text: t('tabbar.home'),      icon: '⌂',  path: '/pages/index/index' },
  { text: t('tabbar.detection'),  icon: '◎',  path: '/pages/detection/index', special: true },
  { text: t('tabbar.report'),     icon: '≡',  path: '/pages/health-report/index' },
  { text: t('tabbar.profile'),    icon: '○',  path: '/pages/profile/index' }
];

onMounted(() => {
  const info = uni.getSystemInfoSync();
  safeBottom.value = info.safeAreaInsets?.bottom || 0;
});

const onTab = (index, item) => {
  if (currentIndex.value === index) return;
  currentIndex.value = index;
  emit('change', index);
  uni.switchTab({ url: item.path });
};
</script>

<style lang="scss" scoped>
.v-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);

  .tabbar-inner {
    display: flex;
    align-items: flex-end;
    height: 112rpx;
    padding: 0 8rpx;
  }

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 12rpx;
  }

  .tab-normal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding-top: 16rpx;

    .icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      .active-dot {
        position: absolute;
        bottom: -6rpx;
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        background: #00E5B4;
      }
    }

    .tab-icon {
      font-size: 44rpx;
      color: #4A5568;
      transition: color 0.2s ease;
      &.icon-active { color: #00E5B4; }
    }
  }

  .tab-special {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    margin-top: -24rpx;

    .special-ring {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #1C2438 0%, #243050 100%);
      border: 2rpx solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.4);

      &.ring-active {
        background: linear-gradient(135deg, #00E5B4 0%, #00BFA5 100%);
        border-color: #00E5B4;
        box-shadow: 0 -4rpx 24rpx rgba(0, 229, 180, 0.5);
      }

      .special-icon-text {
        font-size: 48rpx;
        color: #8A9BC0;
      }

      &.ring-active .special-icon-text { color: #0A0F1E; }
    }
  }

  .tab-label {
    font-size: 22rpx;
    color: #4A5568;
    transition: color 0.2s ease;
    &.label-active { color: #00E5B4; font-weight: 600; }
  }
}
</style>
