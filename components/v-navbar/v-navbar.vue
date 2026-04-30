<template>
  <view class="v-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="navbar-inner">
      <!-- 左侧返回/自定义 -->
      <view class="navbar-left" @tap="onLeft">
        <slot name="left">
          <view v-if="showBack" class="back-btn">
            <text class="back-icon">&#8592;</text>
          </view>
        </slot>
      </view>

      <!-- 标题 -->
      <view class="navbar-title">
        <slot name="title">
          <text class="title-text">{{ title }}</text>
        </slot>
      </view>

      <!-- 右侧 -->
      <view class="navbar-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  transparent: { type: Boolean, default: false }
});

const emit = defineEmits(['back']);
const statusBarHeight = ref(0);

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
});

const onLeft = () => {
  if (props.showBack) {
    emit('back');
    uni.navigateBack();
  }
};
</script>

<style lang="scss" scoped>
.v-navbar {
  position: relative;
  z-index: 999;
  background: transparent;
  width: 100%;

  .navbar-inner {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 24rpx;
  }

  .navbar-left {
    width: 80rpx;
    display: flex;
    align-items: center;

    .back-btn {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .back-icon {
      font-size: 36rpx;
      color: #F0F4FF;
    }
  }

  .navbar-title {
    flex: 1;
    text-align: center;

    .title-text {
      font-size: 34rpx;
      font-weight: 700;
      color: #F0F4FF;
      letter-spacing: 2rpx;
    }
  }

  .navbar-right {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
