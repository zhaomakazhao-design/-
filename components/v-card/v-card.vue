<template>
  <view class="v-card" :class="[variant, { glow: glow }]" :style="cardStyle">
    <slot />
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | glass | outline
  glow: { type: Boolean, default: false },
  glowColor: { type: String, default: 'green' }, // green | blue | pink
  padding: { type: String, default: '32rpx' }
});

const cardStyle = computed(() => ({
  padding: props.padding
}));
</script>

<style lang="scss" scoped>
.v-card {
  border-radius: 24rpx;
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &.default {
    background: #111827;
    border: 1rpx solid rgba(255,255,255,0.06);
  }

  &.glass {
    background: rgba(28, 36, 56, 0.75);
    border: 1rpx solid rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
  }

  &.outline {
    background: transparent;
    border: 1rpx solid rgba(0, 229, 180, 0.3);
  }

  &.glow {
    box-shadow: 0 0 24rpx rgba(0, 229, 180, 0.2), 0 4rpx 24rpx rgba(0,0,0,0.4);
  }
}
</style>
