<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="handleBack"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ detailHospital ? detailHospital.name : text.title }}</text>
      <view style="width:64rpx" />
    </view>
    <scroll-view class="scroll-body" :style="{ display: detailHospital ? 'none' : 'block' }" scroll-y enhanced :show-scrollbar="false">
      <view class="info-card"><view class="ic-icon-wrap"><text class="ic-icon">基</text></view><view class="ic-text"><text class="ic-title">{{ text.introTitle }}</text><text class="ic-desc">{{ text.introDesc }}</text></view></view>
      <view :style="{ display: hospitals.length ? 'block' : 'none' }">
        <view class="section-label">{{ hospitalsTitle }}</view>
        <view class="list-card">
          <view v-for="(h,i) in hospitals" :key="h.id" class="hospital-row" @tap="openDetail(h)">
            <view class="hr-avatar" :style="{ background: h.color+'18' }"><text class="hr-avatar-txt" :style="{ color: h.color }">{{ h.name.slice(0,2) }}</text></view>
            <view class="hr-info"><text class="hr-name">{{ h.name }}</text><text class="hr-meta">{{ h.uploadTime }} · {{ t('genomics.itemsCount', { count: h.items.length }) }}</text></view>
            <view class="hr-right"><text class="hr-badge" :style="{ color: h.status==='ready'?'#34C759':'#007AFF' }">{{ h.status==='ready'?text.ready:text.processing }}</text><text class="hr-chevron">›</text></view>
            <view class="row-sep" :style="{ display: i < hospitals.length-1 ? 'block' : 'none' }" />
          </view>
        </view>
      </view>
      <view class="empty-state" :style="{ display: hospitals.length ? 'none' : 'flex' }">
        <view class="empty-icon-wrap"><text class="empty-icon">基</text></view>
        <text class="empty-title">{{ text.emptyTitle }}</text>
        <text class="empty-desc">{{ text.emptyDesc }}</text>
        <view class="hint-card"><text class="hc-title">{{ text.dataTypes }}</text><text class="hc-item">· DNA测序 / 转录组学（RNA）</text><text class="hc-item">· 蛋白质组学 / 表观基因组</text><text class="hc-item">· 代谢组学 / SNPs位点特征</text><text class="hc-item">· 多基因风险评分（PRS）</text><text class="hc-item">· 药物基因组学特性</text></view>
      </view>
      <view style="height:80rpx" />
    </scroll-view>
    <scroll-view class="scroll-body" :style="{ display: detailHospital ? 'block' : 'none' }" scroll-y enhanced :show-scrollbar="false">
      <view class="detail-header"><view class="dh-avatar" :style="{ background: detailHospital ? detailHospital.color+'18' : '' }"><text class="dh-avatar-txt" :style="{ color: detailHospital ? detailHospital.color : '' }">{{ detailHospital ? detailHospital.name.slice(0,2) : '' }}</text></view><text class="dh-name">{{ detailHospital ? detailHospital.name : '' }}</text><text class="dh-meta">{{ uploadTimeText }}</text></view>
      <view class="section-label">{{ text.dataItems }}</view>
      <view class="list-card">
        <view v-for="(item,i) in (detailHospital ? detailHospital.items : [])" :key="item.key" class="gene-row">
          <view class="gi-icon-wrap" :style="{ background: item.color+'18' }"><text class="gi-icon" :style="{ color: item.color }">{{ item.icon }}</text></view>
          <view class="gi-info"><text class="gi-name">{{ item.name }}</text><text class="gi-desc">{{ item.desc }}</text></view>
          <text class="gi-status" :style="{ color: item.status==='ready'?'#34C759':item.status==='processing'?'#007AFF':'#8E8E93' }">{{ item.status==='ready'?text.ready:item.status==='processing'?text.processing:text.pendingUpload }}</text>
          <view class="row-sep" :style="{ display: i < (detailHospital ? detailHospital.items.length-1 : 0) ? 'block' : 'none' }" />
        </view>
      </view>
      <view :style="{ display: detailHospital && detailHospital.prs && detailHospital.prs.length ? 'block' : 'none' }"><view class="section-label">{{ text.prs }}</view><view class="prs-card"><view v-for="prs in (detailHospital ? detailHospital.prs : [])" :key="prs.key" class="prs-row"><text class="prs-name">{{ prs.name }}</text><view class="prs-bar-bg"><view class="prs-bar-fill" :style="{ width: prs.score+'%', background: prs.color }" /></view><text class="prs-val" :style="{ color: prs.color }">{{ prs.score }}%</text></view><text class="prs-hint">{{ text.prsHint }}</text></view></view>
      <view style="height:80rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { t, useI18n } from '../../utils/i18n.js';
useI18n();
const statusBarHeight = ref(44);
const detailHospital = ref(null);
const hospitals = ref([]);
const text = computed(() => ({ title: t('genomics.title'), introTitle: t('genomics.introTitle'), introDesc: t('genomics.introDesc'), ready: t('genomics.ready'), processing: t('genomics.processing'), pendingUpload: t('genomics.pendingUpload'), emptyTitle: t('genomics.emptyTitle'), emptyDesc: t('genomics.emptyDesc'), dataTypes: t('genomics.dataTypes'), dataItems: t('genomics.dataItems'), prs: t('genomics.prs'), prsHint: t('genomics.prsHint') }));
const hospitalsTitle = computed(() => t('genomics.connectedHospitals', { count: hospitals.value.length }));
const uploadTimeText = computed(() => t('genomics.uploadTime', { time: detailHospital.value ? detailHospital.value.uploadTime : '' }));
const openDetail = (h) => { detailHospital.value = h; };
const handleBack = () => { detailHospital.value ? detailHospital.value = null : uni.navigateBack(); };
onMounted(() => { const info = uni.getSystemInfoSync(); statusBarHeight.value = info.statusBarHeight || 44; });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; background: #F2F2F7; .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; } } .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; } }
.scroll-body { flex: 1; padding: 0 16rpx; }
.info-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 12rpx 0; display: flex; align-items: center; gap: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .ic-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 16rpx; background: #F5F0FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .ic-icon { font-size: 28rpx; font-weight: 800; color: #AF52DE; } } .ic-text { flex: 1; .ic-title { display: block; font-size: 26rpx; font-weight: 700; color: #AF52DE; margin-bottom: 6rpx; } .ic-desc { display: block; font-size: 22rpx; color: #8E8E93; line-height: 1.6; } } }
.section-label { font-size: 22rpx; font-weight: 600; color: #8E8E93; letter-spacing: 1rpx; margin: 20rpx 8rpx 10rpx; }
.list-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 12rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .hospital-row { position: relative; display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; .hr-avatar { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .hr-avatar-txt { font-size: 24rpx; font-weight: 800; } } .hr-info { flex: 1; .hr-name { display: block; font-size: 28rpx; font-weight: 600; color: #1C1C1E; } .hr-meta { display: block; font-size: 22rpx; color: #8E8E93; margin-top: 4rpx; } } .hr-right { display: flex; align-items: center; gap: 8rpx; .hr-badge { font-size: 22rpx; font-weight: 500; } .hr-chevron { font-size: 36rpx; color: #C7C7CC; } } .row-sep { position: absolute; bottom: 0; left: 24rpx; right: 0; height: 1rpx; background: #F2F2F7; } } .gene-row { position: relative; display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; .gi-icon-wrap { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .gi-icon { font-size: 24rpx; font-weight: 800; } } .gi-info { flex: 1; .gi-name { display: block; font-size: 26rpx; font-weight: 600; color: #1C1C1E; } .gi-desc { display: block; font-size: 20rpx; color: #8E8E93; margin-top: 4rpx; } } .gi-status { font-size: 22rpx; font-weight: 500; flex-shrink: 0; } .row-sep { position: absolute; bottom: 0; left: 24rpx; right: 0; height: 1rpx; background: #F2F2F7; } } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60rpx 0 40rpx; .empty-icon-wrap { width: 120rpx; height: 120rpx; border-radius: 32rpx; background: #F5F0FF; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; .empty-icon { font-size: 48rpx; font-weight: 900; color: #AF52DE; } } .empty-title { font-size: 30rpx; font-weight: 700; color: #1C1C1E; margin-bottom: 12rpx; } .empty-desc { font-size: 24rpx; color: #8E8E93; text-align: center; line-height: 1.7; margin-bottom: 32rpx; } .hint-card { width: 100%; background: #fff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .hc-title { display: block; font-size: 24rpx; font-weight: 700; color: #AF52DE; margin-bottom: 14rpx; } .hc-item { display: block; font-size: 22rpx; color: #8E8E93; line-height: 2; } } }
.detail-header { display: flex; flex-direction: column; align-items: center; padding: 28rpx 0 16rpx; .dh-avatar { width: 100rpx; height: 100rpx; border-radius: 26rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 16rpx; .dh-avatar-txt { font-size: 36rpx; font-weight: 900; } } .dh-name { font-size: 30rpx; font-weight: 700; color: #1C1C1E; margin-bottom: 6rpx; } .dh-meta { font-size: 22rpx; color: #8E8E93; } }
.prs-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); .prs-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; .prs-name { font-size: 22rpx; color: #8E8E93; width: 160rpx; flex-shrink: 0; } .prs-bar-bg { flex: 1; height: 10rpx; background: #F2F2F7; border-radius: 9999rpx; overflow: hidden; .prs-bar-fill { height: 100%; border-radius: 9999rpx; } } .prs-val { font-size: 24rpx; font-weight: 700; width: 60rpx; text-align: right; } } .prs-hint { display: block; font-size: 20rpx; color: #8E8E93; border-top: 1rpx solid #F2F2F7; padding-top: 14rpx; } }
</style>
