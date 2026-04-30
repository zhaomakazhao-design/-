<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="navbar-inner">
        <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">‹</text></view>
        <text class="nav-title">{{ text.title }}</text>
        <view v-if="bleState === 'scanning'" class="refresh-btn" @tap="refreshScan"><text class="refresh-icon">↻</text></view>
        <view v-else style="width:64rpx" />
      </view>
    </view>
    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="section">
        <view class="status-card" :class="bleState">
          <view class="status-icon-wrap">
            <text class="status-icon">⚡</text>
            <view v-if="bleState === 'connected'" class="status-pulse" />
          </view>
          <view class="status-info">
            <text class="status-name">{{ bleState === 'connected' ? (connectedDevice?.name || connectedDevice?.localName || text.deviceName) : text.deviceName }}</text>
            <text class="status-txt">{{ stateLabel }}</text>
          </view>
          <view v-if="bleState === 'connecting'" class="sab connecting-indicator">
            <view class="conn-dots"><view class="cd1"/><view class="cd2"/><view class="cd3"/></view>
          </view>
          <view class="sab" :class="bleState" @tap="toggleScan" :style="{ display: bleState !== 'connected' && bleState !== 'connecting' ? 'flex' : 'none' }">
            <text class="sab-txt">{{ bleState === 'scanning' ? text.stop : text.scan }}</text>
          </view>
          <view class="sab disconnect" @tap="confirmDisconnect" :style="{ display: bleState === 'connected' ? 'flex' : 'none' }"><text class="sab-txt">{{ text.disconnect }}</text></view>
        </view>
      </view>
      <view class="section" v-if="bleState === 'connecting'">
        <view class="connecting-card">
          <view class="conn-ring"><view class="conn-ring-inner"><text class="conn-ring-icon">⚡</text></view></view>
          <text class="conn-title">{{ text.connectingDevice }}</text>
          <text class="conn-hint">{{ text.connectingHint }}</text>
        </view>
      </view>
      <view class="section" v-if="bleState === 'scanning'">
        <view class="sec-header">
          <text class="sec-title">{{ text.searchDevices }}</text>
          <view class="scanning-anim"><view class="scan-dot sd1"/><view class="scan-dot sd2"/><view class="scan-dot sd3"/></view>
        </view>
        <view class="device-list">
          <view v-for="dev in deviceList" :key="dev.deviceId" class="device-item" :class="{ connecting: connectingId === dev.deviceId }" @tap="connectDevice(dev)">
            <view class="dev-icon-wrap"><text class="dev-icon">⚡</text></view>
            <view class="dev-info"><text class="dev-name">{{ dev.name || dev.localName || text.deviceName }}</text></view>
            <view class="dev-signal"><view v-for="n in 4" :key="n" class="sig-bar" :class="{ active: n <= signalLevel(dev.RSSI) }" :style="{ height: (n*8+8)+'rpx' }" /></view>
          </view>
          <view class="empty-scan" :style="{ display: deviceList.length ? 'none' : 'flex' }">
            <text class="empty-txt">{{ text.searching }}</text>
            <text class="empty-hint">{{ text.searchingHint }}</text>
          </view>
        </view>
      </view>
      <view class="section" v-if="bleState === 'connected'">
        <view class="measure-card">
          <text class="measure-title">{{ text.measureControl }}</text>
          <view class="measure-btns">
            <view class="meas-btn start" @tap="startMeasure" :style="{ display: measuring ? 'none' : 'flex' }"><text class="meas-txt">{{ text.startMeasure }}</text></view>
            <view class="meas-btn stop" @tap="stopMeasure" :style="{ display: measuring ? 'flex' : 'none' }"><text class="meas-txt">{{ text.stopMeasure }}</text></view>
          </view>
          <text v-if="measuring" class="measure-hint">{{ text.receivingData }}</text>
        </view>
      </view>
      <view class="section" v-if="bleState === 'connected'">
        <text class="sec-title">{{ text.realtimeData }}</text>
        <view class="data-grid">
          <view class="data-item" v-for="item in vitalItems" :key="item.key">
            <text class="data-label">{{ item.label }}</text>
            <text class="data-val" :style="{ color: item.color }">{{ vitalData[item.key] ?? '--' }}</text>
            <text class="data-unit">{{ item.unit }}</text>
          </view>
        </view>
      </view>
      <view class="section" v-if="bleState === 'connected'">
        <view class="debug-header">
          <text class="sec-title">{{ text.rawLog }}</text>
          <view class="debug-clear" @tap="debugLogs = []"><text class="debug-clear-txt">{{ text.clear }}</text></view>
        </view>
        <view v-if="!debugLogs.length" class="debug-empty"><text class="debug-empty-txt">{{ text.waitingData }}</text></view>
        <view v-else class="debug-list">
          <view v-for="(log,i) in debugLogs" :key="i" class="debug-row">
            <view class="debug-row-top">
              <text class="debug-time">{{ log.time }}</text>
              <text class="debug-len">{{ log.len }}字节</text>
              <text class="debug-status" :style="{ color: log.ok ? '#34C759' : '#FF3B30' }">{{ log.ok ? '✓ 格式正确' : '✗ ' + log.err }}</text>
            </view>
            <text class="debug-hex">{{ log.hex }}</text>
          </view>
        </view>
      </view>
      <view class="section" v-if="errMsg"><view class="err-card"><text class="err-txt">{{ errMsg }}</text></view></view>
      <view style="height:120rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';
const { mutations } = useStore();
useI18n();
const TARGET_MAC = 'D2:38:39:35:67:6D';
const CMD_START  = new Uint8Array([0x24]);
const CMD_STOP   = new Uint8Array([0x2A]);
const statusBarHeight = ref(44);
const bleState        = ref('idle');
const connectedDevice = ref(null);
const connectingId    = ref('');
const deviceList      = ref([]);
const measuring       = ref(false);
const errMsg          = ref('');
const vitalData       = ref({});
const debugLogs       = ref([]);
let deviceId = '', serviceId = '', writeCharId = '', notifyCharId = '';
const text = computed(() => ({
  title: t('bluetooth.title'), deviceName: t('bluetooth.deviceName'), stop: t('bluetooth.stop'), scan: t('bluetooth.scan'), disconnect: t('bluetooth.disconnect'), connectingDevice: t('bluetooth.connectingDevice'), connectingHint: t('bluetooth.connectingHint'), searchDevices: t('bluetooth.searchDevices'), searching: t('bluetooth.searching'), searchingHint: t('bluetooth.searchingHint'), measureControl: t('bluetooth.measureControl'), startMeasure: t('bluetooth.startMeasure'), stopMeasure: t('bluetooth.stopMeasure'), receivingData: t('bluetooth.receivingData'), realtimeData: t('bluetooth.realtimeData'), rawLog: t('bluetooth.rawLog'), clear: t('bluetooth.clear'), waitingData: t('bluetooth.waitingData')
}));
const vitalItems = [
  { key: 'hr',         label: '心率',     unit: 'bpm',  color: '#FF2D55' },
  { key: 'spo2',       label: '血氧',     unit: '%',    color: '#34C759' },
  { key: 'micro',      label: '微循环',   unit: '',     color: '#AF52DE' },
  { key: 'sbp',        label: '收缩压',   unit: 'mmHg', color: '#007AFF' },
  { key: 'dbp',        label: '舒张压',   unit: 'mmHg', color: '#007AFF' },
  { key: 'rr',         label: '呼吸率',   unit: '/min', color: '#34C759' },
  { key: 'fatigue',    label: '疲劳指数', unit: '',     color: '#FF9500' },
  { key: 'rrInterval', label: 'RR间期',   unit: 'ms',   color: '#1C1C1E' },
  { key: 'sdnn',       label: 'SDNN',     unit: 'ms',   color: '#1C1C1E' },
  { key: 'rmssd',      label: 'RMSSD',    unit: 'ms',   color: '#1C1C1E' },
  { key: 'bodyTemp',   label: '体温',     unit: '°C',   color: '#FF9500' },
  { key: 'predTemp',   label: '环境温度', unit: '°C',   color: '#FF9500' },
];
const stateLabel = computed(() => ({
  idle:       '点击扫描以搜索设备',
  scanning:   '正在搜索...',
  connecting: '正在连接...',
  connected:  `已连接 · ${TARGET_MAC}`,
})[bleState.value]);
const signalLevel = (rssi) => rssi >= -60 ? 4 : rssi >= -70 ? 3 : rssi >= -80 ? 2 : 1;
const isTargetDevice = (dev) => (dev.deviceId || '').toUpperCase() === TARGET_MAC.toUpperCase();
const toggleScan = () => bleState.value === 'scanning' ? stopScan() : startScan();
const refreshScan = () => {
  if (bleState.value === 'connected') return;
  stopScan(); deviceList.value = []; errMsg.value = '';
  setTimeout(() => startScan(), 300);
};
const startScan = () => {
  errMsg.value = '';
  uni.openBluetoothAdapter({
    success: () => {
      bleState.value = 'scanning'; deviceList.value = [];
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          uni.onBluetoothDeviceFound((res) => {
            res.devices.forEach(dev => {
              if (!isTargetDevice(dev)) return;
              if (!deviceList.value.find(d => d.deviceId === dev.deviceId)) deviceList.value.push(dev);
            });
          });
        },
        fail: (e) => { errMsg.value = '扫描失败：' + e.errMsg; bleState.value = 'idle'; }
      });
    },
    fail: () => { errMsg.value = '蓝牙未开启，请检查权限。'; bleState.value = 'idle'; }
  });
};
const stopScan = () => {
  try { uni.stopBluetoothDevicesDiscovery({}); } catch(e) {}
  if (bleState.value === 'scanning') bleState.value = 'idle';
};
const connectDevice = (dev) => {
  if (bleState.value === 'connected' || bleState.value === 'connecting') return;
  bleState.value = 'connecting'; connectingId.value = dev.deviceId;
  stopScan();
  uni.createBLEConnection({
    deviceId: dev.deviceId,
    success: () => {
      deviceId = dev.deviceId; connectedDevice.value = dev;
      bleState.value = 'connected'; connectingId.value = '';
      mutations.setBleConnected(true, TARGET_MAC);
      uni.showToast({ title: '连接成功', icon: 'success' });
      setTimeout(() => getServices(), 500);
    },
    fail: (e) => { bleState.value = 'idle'; connectingId.value = ''; errMsg.value = '连接失败：' + e.errMsg; }
  });
  uni.onBLEConnectionStateChange((res) => {
    if (!res.connected && res.deviceId === deviceId) {
      bleState.value = 'idle'; connectedDevice.value = null;
      measuring.value = false; vitalData.value = {};
      mutations.setBleConnected(false); errMsg.value = '设备连接已断开';
    }
  });
};
const getServices = () => {
  uni.getBLEDeviceServices({ deviceId,
    success: (res) => {
      const svc = res.services.find(s => s.uuid.toUpperCase().includes('6E400001'));
      if (!svc) { errMsg.value = '未找到目标服务'; return; }
      serviceId = svc.uuid; getCharacteristics();
    },
    fail: (e) => { errMsg.value = '获取服务失败：' + e.errMsg; }
  });
};
const getCharacteristics = () => {
  uni.getBLEDeviceCharacteristics({ deviceId, serviceId,
    success: (res) => {
      res.characteristics.forEach(char => {
        const u = char.uuid.toUpperCase();
        if (u.includes('6E400003')) notifyCharId = char.uuid;
        if (u.includes('6E400002')) writeCharId  = char.uuid;
      });
      if (notifyCharId) enableNotify();
      else errMsg.value = '未找到通知特性';
    },
    fail: (e) => { errMsg.value = '获取特性失败：' + e.errMsg; }
  });
};
const enableNotify = () => {
  uni.notifyBLECharacteristicValueChange({
    deviceId, serviceId, characteristicId: notifyCharId, state: true,
    success: () => {
      uni.onBLECharacteristicValueChange((res) => {
        if (res.characteristicId.toUpperCase() === notifyCharId.toUpperCase()) parsePacket(res.value);
      });
    },
    fail: (e) => { errMsg.value = '启动通知失败：' + e.errMsg; }
  });
};
const parsePacket = (buffer) => {
  const arr = new Uint8Array(buffer);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
  const hex = Array.from(arr).map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  let ok = true, errTxt = '';
  if (arr.length < 16) { ok = false; errTxt = `包长不足(${arr.length}B)`; }
  else if (arr[0] !== 0xFF) { ok = false; errTxt = `包头错误(${arr[0].toString(16).toUpperCase()})`; }
  else if (arr[1] !== 0x01) { ok = false; errTxt = `包头2错误(${arr[1].toString(16).toUpperCase()})`; }
  debugLogs.value.unshift({ time: timeStr, len: arr.length, hex, ok, err: errTxt });
  if (debugLogs.value.length > 50) debugLogs.value.pop();
  if (!ok) return;
  const bodyTemp = (arr[12] || 0) + (arr[13] || 0) / 100;
  const predTemp = (arr[14] || 0) + (arr[15] || 0) / 100;
  const data = { hr: arr[2], spo2: arr[3], micro: arr[4], sbp: arr[5], dbp: arr[6], rr: arr[7],
    fatigue: arr[8], rrInterval: arr[9], sdnn: arr[10], rmssd: arr[11],
    bodyTemp: bodyTemp.toFixed(2), predTemp: predTemp.toFixed(2) };
  vitalData.value = data;
  mutations.setLatestVitals && mutations.setLatestVitals(data);
};
const writeBLE = (data) => {
  if (!deviceId || !serviceId || !writeCharId) { errMsg.value = '请先连接设备'; return; }
  uni.writeBLECharacteristicValue({ deviceId, serviceId, characteristicId: writeCharId, value: data.buffer,
    fail: (e) => { errMsg.value = '指令发送失败：' + e.errMsg; }
  });
};
const startMeasure = () => { vitalData.value = {}; measuring.value = true; writeBLE(CMD_START); uni.showToast({ title: '已发送开始测量指令', icon: 'none' }); };
const stopMeasure  = () => { measuring.value = false; writeBLE(CMD_STOP); uni.showToast({ title: '已发送结束测量指令', icon: 'none' }); };
const confirmDisconnect = () => {
  uni.showModal({ title: '断开设备', content: '确定要断开与设备的连接吗？', confirmText: '断开', cancelText: '取消',
    success: (res) => { if (res.confirm) disconnect(); }
  });
};
const disconnect = () => {
  if (measuring.value || writeCharId) {
    try {
      uni.writeBLECharacteristicValue({ deviceId, serviceId, characteristicId: writeCharId,
        value: new Uint8Array([0x2A]).buffer, complete: () => doDisconnect() });
    } catch(e) { doDisconnect(); }
  } else { doDisconnect(); }
};
const doDisconnect = () => {
  uni.closeBLEConnection({ deviceId, complete: () => {
    bleState.value = 'idle'; connectedDevice.value = null;
    vitalData.value = {}; measuring.value = false;
    mutations.setBleConnected(false);
    deviceId = ''; serviceId = ''; writeCharId = ''; notifyCharId = '';
    uni.showToast({ title: '设备已断开', icon: 'none' });
  }});
};
onMounted(() => { const info = uni.getSystemInfoSync(); statusBarHeight.value = info.statusBarHeight || 44; });
onUnmounted(() => { try { uni.stopBluetoothDevicesDiscovery({}); } catch(e) {} try { uni.closeBluetoothAdapter({}); } catch(e) {} });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { background: #F2F2F7;
  .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; }
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; } }
  .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; }
  .refresh-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; .refresh-icon { font-size: 40rpx; color: #007AFF; } }
}
.scroll-body { flex: 1; }
.section { padding: 8rpx 16rpx;
  .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
  .sec-title { display: block; font-size: 22rpx; font-weight: 600; color: #8E8E93; letter-spacing: 1rpx; margin-bottom: 12rpx; }
}
.status-card { background: #fff; border-radius: 20rpx; padding: 24rpx; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  &.connected  { border-left: 4rpx solid #34C759; }
  &.scanning   { border-left: 4rpx solid #007AFF; }
  &.connecting { border-left: 4rpx solid #FF9500; }
  &.idle       { border-left: 4rpx solid #C7C7CC; }
  .status-icon-wrap { position: relative; width: 72rpx; height: 72rpx; border-radius: 18rpx; background: #F2F2F7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    .status-icon { font-size: 32rpx; }
    .status-pulse { position: absolute; inset: -6rpx; border-radius: 50%; border: 2rpx solid #34C759; animation: pulse-ring 1.5s ease-out infinite; }
  }
  .status-info { flex: 1;
    .status-name { display: block; font-size: 28rpx; font-weight: 600; color: #1C1C1E; margin-bottom: 4rpx; }
    .status-txt  { display: block; font-size: 22rpx; color: #8E8E93; }
  }
  .sab { border-radius: 9999rpx; padding: 12rpx 24rpx; flex-shrink: 0;
    &.idle, &.scanning, &.connecting { background: #EFF6FF; .sab-txt { color: #007AFF; } }
    &.disconnect { background: rgba(255,59,48,0.1); .sab-txt { color: #FF3B30; } }
    .sab-txt { font-size: 26rpx; font-weight: 600; }
  }
}
.connecting-indicator { padding: 12rpx 16rpx; display: flex; align-items: center;
  .conn-dots { display: flex; gap: 6rpx; align-items: center;
    > view { width: 10rpx; height: 10rpx; border-radius: 50%; background: #FF9500;
      &.cd1 { animation: dot-fade 1s ease-in-out infinite 0s; }
      &.cd2 { animation: dot-fade 1s ease-in-out infinite 0.2s; }
      &.cd3 { animation: dot-fade 1s ease-in-out infinite 0.4s; }
    }
  }
}
.connecting-card { background: #fff; border-radius: 20rpx; padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .conn-ring { width: 120rpx; height: 120rpx; border-radius: 50%; border: 3rpx solid #FF9500; display: flex; align-items: center; justify-content: center; animation: conn-spin-ring 2s linear infinite;
    .conn-ring-inner { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(255,149,0,0.08); display: flex; align-items: center; justify-content: center; .conn-ring-icon { font-size: 40rpx; } }
  }
  .conn-title { font-size: 30rpx; font-weight: 700; color: #1C1C1E; }
  .conn-hint  { font-size: 22rpx; color: #8E8E93; text-align: center; }
}
.scanning-anim { display: flex; gap: 6rpx; align-items: flex-end;
  .scan-dot { width: 8rpx; border-radius: 9999rpx; background: #007AFF;
    &.sd1 { height: 16rpx; animation: scan-bounce 0.8s ease-in-out infinite 0s; }
    &.sd2 { height: 24rpx; animation: scan-bounce 0.8s ease-in-out infinite 0.15s; }
    &.sd3 { height: 16rpx; animation: scan-bounce 0.8s ease-in-out infinite 0.3s; }
  }
}
.device-list { display: flex; flex-direction: column; gap: 12rpx;
  .device-item { background: #fff; border-radius: 20rpx; padding: 20rpx 24rpx; display: flex; align-items: center; gap: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    &.connecting { border: 2rpx solid #FF9500; }
    .dev-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 16rpx; background: #F5F0FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .dev-icon { font-size: 28rpx; } }
    .dev-info { flex: 1; .dev-name { display: block; font-size: 28rpx; font-weight: 600; color: #1C1C1E; } }
    .dev-signal { display: flex; align-items: flex-end; gap: 4rpx; .sig-bar { width: 8rpx; border-radius: 3rpx; background: #E5E5EA; &.active { background: #34C759; } } }
  }
  .empty-scan { background: #fff; border-radius: 20rpx; padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; gap: 12rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    .empty-txt { font-size: 26rpx; color: #8E8E93; text-align: center; } .empty-hint { font-size: 22rpx; color: #C7C7CC; text-align: center; }
  }
}
.measure-card { background: #fff; border-radius: 20rpx; padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .measure-title { font-size: 28rpx; font-weight: 700; color: #1C1C1E; }
  .measure-btns { display: flex; gap: 16rpx;
    .meas-btn { flex: 1; border-radius: 16rpx; padding: 22rpx; display: flex; align-items: center; justify-content: center;
      &.start { background: #34C759; .meas-txt { color: #fff; } }
      &.stop  { background: rgba(255,59,48,0.1); .meas-txt { color: #FF3B30; } }
      .meas-txt { font-size: 28rpx; font-weight: 700; }
    }
  }
  .measure-hint { font-size: 22rpx; color: #8E8E93; text-align: center; }
}
.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx;
  .data-item { background: #fff; border-radius: 20rpx; padding: 24rpx 16rpx; display: flex; flex-direction: column; align-items: center; gap: 6rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    .data-label { font-size: 20rpx; color: #8E8E93; }
    .data-val   { font-size: 44rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
    .data-unit  { font-size: 18rpx; color: #C7C7CC; }
  }
}
.err-card { background: rgba(255,59,48,0.06); border: 1rpx solid rgba(255,59,48,0.15); border-radius: 16rpx; padding: 20rpx 24rpx;
  .err-txt { font-size: 24rpx; color: #FF3B30; line-height: 1.6; }
}
.debug-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx;
  .debug-clear { padding: 8rpx 20rpx; background: #F2F2F7; border-radius: 9999rpx; .debug-clear-txt { font-size: 22rpx; color: #8E8E93; } }
}
.debug-empty { padding: 32rpx; text-align: center; .debug-empty-txt { font-size: 24rpx; color: #C7C7CC; } }
.debug-list { display: flex; flex-direction: column; gap: 12rpx;
  .debug-row { background: #fff; border-radius: 16rpx; padding: 16rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
    .debug-row-top { display: flex; align-items: center; gap: 16rpx; margin-bottom: 10rpx; flex-wrap: wrap;
      .debug-time { font-size: 22rpx; color: #8E8E93; font-family: monospace; }
      .debug-len  { font-size: 20rpx; color: #C7C7CC; }
      .debug-status { font-size: 20rpx; font-weight: 600; }
    }
    .debug-hex { display: block; font-size: 20rpx; color: #1C1C1E; font-family: monospace; line-height: 1.8; word-break: break-all; }
  }
}
@keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
@keyframes scan-bounce { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.6); } }
@keyframes dot-fade { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes conn-spin-ring { 0% { border-color: #FF9500 transparent transparent transparent; } 50% { border-color: #FF9500 #FF9500 transparent transparent; } 100% { border-color: #FF9500 #FF9500 #FF9500 transparent; } }
</style>
