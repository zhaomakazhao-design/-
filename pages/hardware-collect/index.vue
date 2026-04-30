<template>
  <view class="page">
    <view class="bg-orb orb-1" />
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner">
        <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">←</text></view>
        <text class="nav-title">{{ t('hardwareCollect.title') }}</text>
        <view style="width:64rpx" />
      </view>
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <!-- 设备连接状态 -->
      <view class="section">
        <view class="device-card" :class="deviceState">
          <view class="device-icon-wrap">
            <text class="device-icon">⚡</text>
            <view v-if="deviceState==='connected'" class="device-pulse" />
          </view>
          <view class="device-info">
            <text class="device-name">{{ deviceName }}</text>
            <text class="device-status-txt">{{ deviceStateLabel }}</text>
          </view>
          <view class="connect-btn" :class="deviceState" @tap="toggleConnect">
            <text class="cb-txt">{{ deviceState==='connected'?t('hardwareCollect.disconnect'):t('hardwareCollect.connectDevice') }}</text>
          </view>
        </view>
      </view>

      <!-- 采集按钮 -->
      <view class="section">
        <view class="collect-area">
          <view
            class="collect-btn"
            :class="{ collecting: isCollecting, disabled: deviceState!=='connected' }"
            @tap="toggleCollect"
          >
            <view class="cb-ring cb-ring-1" :style="{ display: isCollecting ? 'block' : 'none' }" />
            <view class="cb-ring cb-ring-2" :style="{ display: isCollecting ? 'block' : 'none' }" />
            <view class="cb-inner">
              <text class="cb-icon">{{ isCollecting ? '■' : '▶' }}</text>
              <text class="cb-label">{{ isCollecting ? t('hardwareCollect.stopCollect') : t('hardwareCollect.startCollect') }}</text>
            </view>
          </view>
          <text class="collect-hint" :style="{ color: isCollecting ? '#00E5B4' : '#8A9BC0', opacity: (deviceState!=='connected' || isCollecting) ? 1 : 0 }">{{ deviceState!=='connected' ? t('hardwareCollect.connectHint') : t('hardwareCollect.collectingHint') }}</text>
        </view>
      </view>

      <!-- 实时数据展示 -->
      <view class="section" v-if="deviceState==='connected'">
        <text class="sec-title">{{ t('hardwareCollect.realtime') }}</text>
        <view class="vitals-grid">
          <view v-for="v in vitals" :key="v.key" class="vital-card">
            <text class="vc-icon">{{ v.icon }}</text>
            <text class="vc-val" :style="{ color: v.color }">{{ isCollecting ? v.val : '--' }}</text>
            <text class="vc-unit">{{ v.unit }}</text>
            <text class="vc-name">{{ v.name }}</text>
            <view class="vc-range"><text class="vc-range-txt">{{ t('common.normal') }}: {{ v.normal }}</text></view>
          </view>
        </view>
      </view>

      <!-- 采集完成提示 -->
      <view class="section" v-if="collectDone">
        <view class="done-banner">
          <text class="done-icon">✓</text>
          <view class="done-info">
            <text class="done-title">{{ t('hardwareCollect.doneTitle') }}</text>
            <text class="done-desc">{{ t('hardwareCollect.doneDesc') }}</text>
          </view>
          <view class="done-btn" @tap="submitData"><text class="done-btn-txt">{{ t('hardwareCollect.submit') }}</text></view>
        </view>
      </view>

      <view style="height:120rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../../utils/store.js';
import { uploadPhysiology } from '../../utils/task1.js';
import { t } from '../../utils/i18n.js';

const { mutations } = useStore();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const deviceState = ref('idle');
const deviceName = ref('VitalSensor Pro');
const isCollecting = ref(false);
const collectDone = ref(false);
let mockTimer = null;

const deviceStateLabel = computed(() => ({
  idle: t('hardwareCollect.idleState'),
  connecting: t('hardwareCollect.connectingState'),
  connected: `${t('common.connected')} · ${deviceName.value}`
})[deviceState.value]);

const vitals = ref([
  { key: 'hr',    icon: '♥', name: t('hardwareCollect.hr'),    unit: 'bpm',  color: '#FF6B9D', val: '--', normal: '60-100' },
  { key: 'spo2',  icon: '◉', name: t('hardwareCollect.spo2'),  unit: '%',    color: '#00E5B4', val: '--', normal: '95-100' },
  { key: 'sbp',   icon: '⧖', name: t('hardwareCollect.sbp'),   unit: 'mmHg', color: '#3D8EFF', val: '--', normal: '90-140' },
  { key: 'dbp',   icon: '⧗', name: t('hardwareCollect.dbp'),   unit: 'mmHg', color: '#A78BFA', val: '--', normal: '60-90'  },
  { key: 'resp',  icon: '◌', name: t('hardwareCollect.resp'),  unit: '/min', color: '#FF9A3C', val: '--', normal: '12-20'  },
  { key: 'hrv',   icon: '~',  name: t('hardwareCollect.hrv'),   unit: 'ms',   color: '#00E5B4', val: '--', normal: '20-80'  },
  { key: 'temp',  icon: '◈', name: t('hardwareCollect.temp'),  unit: '°C',   color: '#FF6B9D', val: '--', normal: '36-37.3'},
  { key: 'rtemp', icon: '◇', name: t('hardwareCollect.roomTemp'), unit: '°C',   color: '#8A9BC0', val: '--', normal: '--'     },
]);

const mockBase = [72, 98, 118, 75, 16, 45, 36.6, 22];

const toggleConnect = () => {
  if (deviceState.value === 'connected') {
    deviceState.value = 'idle'; isCollecting.value = false; collectDone.value = false;
    vitals.value.forEach(v => v.val = '--'); clearInterval(mockTimer);
    mutations.setPhysiologyStatus('idle');
  } else {
    deviceState.value = 'connecting';
    mutations.setPhysiologyStatus('connecting');
    setTimeout(() => {
      deviceState.value = 'connected';
      mutations.setPhysiologyStatus('connected', deviceName.value);
      uni.showToast({ title: t('hardwareCollect.connectSuccess'), icon: 'success' });
    }, 1500);
  }
};

const toggleCollect = () => {
  if (deviceState.value !== 'connected') return;
  if (isCollecting.value) {
    isCollecting.value = false; collectDone.value = true; clearInterval(mockTimer);
    mutations.setPhysiologyStatus('done');
    uni.showToast({ title: t('hardwareCollect.collectSuccess'), icon: 'success' });
  } else {
    isCollecting.value = true; collectDone.value = false;
    mutations.setPhysiologyStatus('collecting');
    mockTimer = setInterval(() => {
      vitals.value.forEach((v, i) => {
        const b = mockBase[i];
        v.val = b > 10 ? String(Math.round(b + (Math.random()-0.5)*4)) : (b + (Math.random()-0.5)*0.2).toFixed(1);
      });
      // 实时同步到全局 store（供 AI 问答使用）
      mutations.setPhysiologyRaw({
        hr: Number(vitals.value[0].val),
        spo2: Number(vitals.value[1].val),
        sbp: Number(vitals.value[2].val),
        dbp: Number(vitals.value[3].val),
        resp: Number(vitals.value[4].val),
        hrv: Number(vitals.value[5].val),
        temp: Number(vitals.value[6].val),
        room_temp: Number(vitals.value[7].val)
      });
    }, 500);
  }
};

const submitData = () => {
  uni.showLoading({ title: t('hardwareCollect.submitting') });
  // 调用 Task1 上传接口（由张恒瑞对接后端）
  uploadPhysiology({
    hr: Number(vitals.value[0].val) || 0,
    spo2: Number(vitals.value[1].val) || 0,
    sbp: Number(vitals.value[2].val) || 0,
    dbp: Number(vitals.value[3].val) || 0,
    resp: Number(vitals.value[4].val) || 0,
    hrv: Number(vitals.value[5].val) || 0,
    temp: Number(vitals.value[6].val) || 0,
    room_temp: Number(vitals.value[7].val) || 0
  }).catch(() => {}).finally(() => {
    uni.hideLoading();
    mutations.setPhysiologyStatus('uploaded');
    uni.showToast({ title: t('hardwareCollect.submitSuccess'), icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  });
};

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  safeBottom.value = info.safeAreaInsets?.bottom || 0;
});
onUnmounted(() => clearInterval(mockTimer));
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0F1E; display: flex; flex-direction: column; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.12; pointer-events: none;
  &.orb-1 { width: 500rpx; height: 500rpx; background: #FF6B9D; top: -100rpx; right: -100rpx; }
}
.navbar { z-index: 10;
  .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 24rpx; }
  .back-btn { width: 64rpx; height: 64rpx; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; }
  .back-icon { font-size: 32rpx; color: #F0F4FF; } .nav-title { font-size: 32rpx; font-weight: 700; color: #F0F4FF; }
}
.scroll-body { flex: 1; }
.section { padding: 16rpx 28rpx; }
.sec-title { display: block; font-size: 28rpx; font-weight: 700; color: #F0F4FF; margin-bottom: 16rpx; }
.device-card { background: #111827; border: 1rpx solid rgba(255,255,255,0.06); border-radius: 24rpx; padding: 28rpx; display: flex; align-items: center; gap: 20rpx; transition: all 0.3s;
  &.connected { border-color: rgba(0,229,180,0.3); background: rgba(0,229,180,0.04); }
  &.connecting { border-color: rgba(61,142,255,0.3); }
  .device-icon-wrap { position: relative; width: 80rpx; height: 80rpx; border-radius: 50%; background: rgba(255,107,157,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    .device-icon { font-size: 36rpx; }
    .device-pulse { position: absolute; inset: -8rpx; border-radius: 50%; border: 2rpx solid #00E5B4; animation: pulse-ring 1.5s ease-out infinite; }
  }
  .device-info { flex: 1;
    .device-name { display: block; font-size: 28rpx; font-weight: 700; color: #F0F4FF; }
    .device-status-txt { display: block; font-size: 22rpx; color: #8A9BC0; margin-top: 4rpx; }
  }
  .connect-btn { border-radius: 9999rpx; padding: 14rpx 24rpx;
    &.idle, &.connecting { background: rgba(0,229,180,0.15); border: 1rpx solid rgba(0,229,180,0.3); .cb-txt { color: #00E5B4; } }
    &.connected { background: rgba(255,77,109,0.15); border: 1rpx solid rgba(255,77,109,0.3); .cb-txt { color: #FF4D6D; } }
    .cb-txt { font-size: 26rpx; font-weight: 600; }
  }
}
.collect-area { display: flex; flex-direction: column; align-items: center; padding: 24rpx 0; gap: 20rpx;
  .collect-btn { position: relative; width: 240rpx; height: 240rpx; border-radius: 50%; background: linear-gradient(135deg,#1C2438,#243050); border: 2rpx solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; transition: all 0.3s;
    &.collecting { border-color: rgba(255,107,157,0.5); box-shadow: 0 0 32rpx rgba(255,107,157,0.3); }
    &.disabled { opacity: 0.4; }
    .cb-ring { position: absolute; inset: -16rpx; border-radius: 50%; border: 2rpx solid rgba(255,107,157,0.4); animation: pulse-ring 2s ease-out infinite; }
    .cb-ring-2 { animation-delay: 0.6s; }
    .cb-inner { display: flex; flex-direction: column; align-items: center; gap: 8rpx; z-index: 1;
      .cb-icon { font-size: 64rpx; color: #F0F4FF; } .cb-label { font-size: 26rpx; color: #F0F4FF; font-weight: 600; }
    }
  }
  .collect-hint { font-size: 24rpx; color: #8A9BC0; &.green { color: #00E5B4; } }
}
.vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx;
  .vital-card { background: #111827; border: 1rpx solid rgba(255,255,255,0.06); border-radius: 20rpx; padding: 20rpx; display: flex; flex-direction: column; gap: 6rpx;
    .vc-icon { font-size: 28rpx; } .vc-val { font-size: 40rpx; font-weight: 900; font-variant-numeric: tabular-nums; }
    .vc-unit { font-size: 20rpx; color: #8A9BC0; } .vc-name { font-size: 22rpx; color: #8A9BC0; }
    .vc-range { margin-top: 4rpx; .vc-range-txt { font-size: 18rpx; color: #4A5568; } }
  }
}
.done-banner { background: rgba(0,229,180,0.08); border: 1rpx solid rgba(0,229,180,0.25); border-radius: 24rpx; padding: 28rpx; display: flex; align-items: center; gap: 20rpx;
  .done-icon { font-size: 48rpx; color: #00E5B4; flex-shrink: 0; }
  .done-info { flex: 1; .done-title { display: block; font-size: 28rpx; font-weight: 700; color: #00E5B4; } .done-desc { display: block; font-size: 22rpx; color: #8A9BC0; margin-top: 6rpx; } }
  .done-btn { background: linear-gradient(135deg,#00E5B4,#00BFA5); border-radius: 9999rpx; padding: 14rpx 28rpx; .done-btn-txt { font-size: 26rpx; font-weight: 700; color: #0A0F1E; } }
}
@keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
</style>
