<template>
  <view class="v-vital-ring" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <canvas
      type="2d"
      :id="canvasId"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
      class="ring-canvas"
    />
    <view class="ring-content">
      <text class="ring-value">{{ value }}</text>
      <text class="ring-unit">{{ unit }}</text>
      <text class="ring-label">{{ label }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  value:   { type: [Number, String], default: 0 },
  max:     { type: Number, default: 100 },
  unit:    { type: String, default: '' },
  label:   { type: String, default: '' },
  size:    { type: Number, default: 200 },
  color:   { type: String, default: '#00E5B4' },
  trackColor: { type: String, default: 'rgba(255,255,255,0.06)' },
  strokeWidth: { type: Number, default: 12 }
});

const canvasId = `vring-${Math.random().toString(36).slice(2, 8)}`;

const drawRing = () => {
  const query = uni.createSelectorQuery();
  query.select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res[0]?.node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = uni.getSystemInfoSync().pixelRatio || 2;
      const px = props.size * 2 * dpr / 2;
      canvas.width = px;
      canvas.height = px;
      ctx.scale(dpr, dpr);

      const cx = props.size;
      const cy = props.size;
      const r  = props.size - props.strokeWidth * 2;

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = props.trackColor;
      ctx.lineWidth = props.strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Progress
      const pct = Math.min(Number(props.value) / props.max, 1);
      const startAngle = -Math.PI / 2;
      const endAngle   = startAngle + pct * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = props.color;
      ctx.lineWidth = props.strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
};

onMounted(() => setTimeout(drawRing, 100));
watch(() => props.value, drawRing);
</script>

<style lang="scss" scoped>
.v-vital-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .ring-canvas { position: absolute; top: 0; left: 0; }

  .ring-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;

    .ring-value {
      font-size: 52rpx;
      font-weight: 800;
      color: #F0F4FF;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .ring-unit {
      font-size: 22rpx;
      color: #8A9BC0;
      margin-top: 2rpx;
    }
    .ring-label {
      font-size: 22rpx;
      color: #8A9BC0;
      margin-top: 4rpx;
    }
  }
}
</style>
