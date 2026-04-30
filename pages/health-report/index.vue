<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ text.title }}</text>
      <view style="width:64rpx" />
    </view>

    <scroll-view class="scroll-body" :style="{ display: hasData ? 'block' : 'none' }" scroll-y enhanced :show-scrollbar="false">
      <view class="score-card">
        <view class="sc-left">
          <text class="sc-label">{{ text.score }}</text>
          <view class="sc-score-row">
            <text class="sc-score">{{ healthScore }}</text>
            <text class="sc-unit">{{ pointsText }}</text>
          </view>
          <view class="level-badge" :style="{ color: scoreLevel.color, background: scoreLevel.color + '18' }">
            <text class="level-txt">{{ scoreLevel.label }}</text>
          </view>
          <text class="sc-date">{{ lastReportDate }}</text>
        </view>
        <view class="sc-ring"><text class="ring-num">{{ healthScore }}</text></view>
      </view>

      <view class="section-wrap" :style="{ display: metrics && metrics.length ? 'block' : 'none' }">
        <view class="section-label">{{ text.metrics }}</view>
        <view class="metrics-card">
          <view class="metric-row" v-for="(m, i) in metrics" :key="m.key">
            <view class="metric-left"><text class="metric-icon">{{ m.icon }}</text><text class="metric-name">{{ m.name }}</text></view>
            <view class="metric-right">
              <view class="metric-bar-bg"><view class="metric-bar-fill" :style="{ width: m.score + '%', background: m.color }" /></view>
              <text class="metric-score" :style="{ color: m.color }">{{ m.score }}</text>
            </view>
            <view class="row-sep" :style="{ display: i < metrics.length-1 ? 'block' : 'none' }" />
          </view>
        </view>
      </view>

      <view class="section-wrap" :style="{ display: bioAge && userAge ? 'block' : 'none' }">
        <view class="section-label">{{ text.bioAge }}</view>
        <view class="bio-card">
          <view class="bio-row">
            <view class="bio-col">
              <text class="bc-lbl">{{ text.chronologicalAge }}</text>
              <view class="bc-val-wrap"><text class="bc-val">{{ userAge }}</text><text class="bc-u">{{ ageSuffix }}</text></view>
            </view>
            <text class="bio-arr">→</text>
            <view class="bio-col">
              <text class="bc-lbl">{{ text.biologicalAge }}</text>
              <view class="bc-val-wrap"><text class="bc-val green">{{ bioAge }}</text><text class="bc-u">{{ ageSuffix }}</text></view>
            </view>
          </view>
          <text class="bio-tip" :style="{ display: userAge > bioAge ? 'block' : 'none' }">{{ youngerText }}</text>
          <text class="bio-tip warn" :style="{ display: userAge <= bioAge ? 'block' : 'none' }">{{ olderText }}</text>
        </view>
      </view>

      <view class="section-label">{{ text.history }}</view>
      <view class="list-card" :style="{ display: historyRecords.length ? 'block' : 'none' }">
        <view v-for="(rec,i) in historyRecords" :key="rec.id" class="history-row">
          <view class="hr-icon-wrap" :style="{ background: rec.color+'18' }"><text class="hr-icon">{{ rec.icon }}</text></view>
          <view class="hr-info"><text class="hr-name">{{ rec.name }}</text><text class="hr-date">{{ rec.date }}</text></view>
          <text class="hr-score" :style="{ color: rec.color }">{{ rec.score }}{{ pointsText }}</text>
          <view class="row-sep" :style="{ display: i < historyRecords.length-1 ? 'block' : 'none' }" />
        </view>
      </view>
      <view class="empty-card" :style="{ display: historyRecords.length ? 'none' : 'flex' }"><text class="empty-txt">{{ text.noHistory }}</text></view>

      <view style="height:80rpx" />
    </scroll-view>

    <view class="generate-btn" @tap="handleGenerateReport">
      <text v-if="!generating" class="gen-btn-txt">生成报告</text>
      <text v-else class="gen-btn-txt">生成中...</text>
    </view>

    <view class="empty-page" :style="{ display: hasData ? 'none' : 'flex' }">
      <view class="ep-icon-wrap"><text class="ep-icon">📊</text></view>
      <text class="ep-title">{{ text.noReport }}</text>
      <text class="ep-desc">{{ text.noReportDesc }}</text>
      <view class="ep-btn" @tap="uni.navigateBack()"><text class="ep-btn-txt">{{ text.backHome }}</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../utils/store.js';
import { getScoreLevel } from '../../utils/health.js';
import { t, useI18n } from '../../utils/i18n.js';
import { generateHealthReport } from '../../utils/api-service.js';
import { getUserId } from '../../utils/api.js';

const { getters, state, mutations } = useStore();
const { locale } = useI18n();
const statusBarHeight = ref(44);
const hasData = ref(false);
const lastReportDate = ref('');
const historyRecords = ref([]);
const generating = ref(false);
const userAge = ref(0);
const healthScore = computed(() => getters.healthScore());
const scoreLevel = computed(() => getScoreLevel(healthScore.value));
const metrics = computed(() => getters.healthMetrics());
const bioAge = computed(() => getters.bioAge());
const pointsText = computed(() => t('common.points'));
const ageSuffix = computed(() => t('common.ageSuffix').trim() || '');
const text = computed(() => ({
  title: t('healthReport.title'),
  score: t('healthReport.score'),
  metrics: t('healthReport.metrics'),
  bioAge: t('healthReport.bioAge'),
  chronologicalAge: t('healthReport.chronologicalAge'),
  biologicalAge: t('healthReport.biologicalAge'),
  history: t('healthReport.history'),
  noHistory: t('healthReport.noHistory'),
  noReport: t('healthReport.noReport'),
  noReportDesc: t('healthReport.noReportDesc'),
  backHome: t('healthReport.backHome'),
  fullDetect: t('healthReport.fullDetect'),
  ppg: t('healthReport.ppg'),
  hardware: t('healthReport.hardware')
}));
const youngerText = computed(() => t('healthReport.younger', { years: userAge.value - bioAge.value }));
const olderText = computed(() => t('healthReport.older', { years: bioAge.value - userAge.value }));

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  const score = getters.healthScore();
  if (score !== null && score !== undefined) {
    hasData.value = true;
    const now = new Date();
    if (locale.locale === 'en') {
      lastReportDate.value = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    } else {
      lastReportDate.value = `${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }
    const ctx = getters.collectionContext();
    if (ctx && ctx.detections && ctx.detections.length > 0) {
      historyRecords.value = ctx.detections.map((d, i) => ({
        id: i,
        icon: d.type === 'full' ? '◎' : d.type === 'ppg' ? '♥' : '◉',
        name: d.type === 'full' ? text.value.fullDetect : d.type === 'ppg' ? text.value.ppg : text.value.hardware,
        date: d.date || '',
        score: d.score || 0,
        color: ['#34C759', '#007AFF', '#FF2D55'][i % 3],
      }));
    }
    const user = getters.userInfo();
    userAge.value = user.chrono_age || user.age || 0;
  }
});

const handleGenerateReport = async () => {
  if (generating.value) return;
  
  generating.value = true;
  const userId = getUserId();
  
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    generating.value = false;
    return;
  }
  
  try {
    const response = await generateHealthReport(userId);
    
    if (response && response.report_id) {
      // 保存报告到 store
      mutations.setHealthReport && mutations.setHealthReport(response);
      
      uni.showToast({ title: '生成成功', icon: 'success' });
      
      // 如果有报告下载链接，可以打开
      if (response.download_url) {
        setTimeout(() => {
          uni.downloadFile({
            url: response.download_url,
            success: () => {
              uni.showToast({ title: '报告已保存', icon: 'success' });
            }
          });
        }, 500);
      }
    } else {
      throw new Error('报告生成失败：后端无返回');
    }
  } catch (error) {
    console.error('Report generation error:', error);
    
    let errorMsg = '生成报告失败';
    if (error.code === 400) {
      errorMsg = '缺少必要数据，请先完成数据采集';
    } else if (error.code === 422) {
      errorMsg = '数据不完整，无法生成报告';
    } else if (error.code === 500) {
      errorMsg = '服务器错误，请稍后重试';
    }
    
    uni.showModal({
      title: '生成报告失败',
      content: errorMsg,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          handleGenerateReport(); // 重试
        }
      }
    });
  } finally {
    generating.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; background: #F2F2F7;
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
    .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; }
  }
  .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; }
}

.generate-btn {
  position: fixed;
  bottom: 120rpx;
  left: 20rpx;
  right: 20rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #34C759 0%, #00C9A7 100%);
  border-radius: 16rpx;
  display: flex !important;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(52, 199, 89, 0.3);
  z-index: 10;
}

.gen-btn-txt {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}
.scroll-body { flex: 1; padding: 0 16rpx; }
.score-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 12rpx; display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .sc-left { flex: 1;
    .sc-label { display: block; font-size: 22rpx; color: #8E8E93; margin-bottom: 8rpx; }
    .sc-score-row { display: flex; align-items: baseline; gap: 4rpx; margin-bottom: 12rpx;
      .sc-score { font-size: 72rpx; font-weight: 800; color: #1C1C1E; line-height: 1; letter-spacing: -2rpx; }
      .sc-unit { font-size: 26rpx; color: #8E8E93; }
    }
    .level-badge { display: inline-flex; border-radius: 9999rpx; padding: 6rpx 18rpx; margin-bottom: 10rpx;
      .level-txt { font-size: 24rpx; font-weight: 600; }
    }
    .sc-date { display: block; font-size: 20rpx; color: #8E8E93; }
  }
  .sc-ring { width: 110rpx; height: 110rpx; border-radius: 50%; border: 10rpx solid #F2F2F7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    .ring-num { font-size: 30rpx; font-weight: 800; color: #1C1C1E; }
  }
}
.section-label { font-size: 22rpx; font-weight: 600; color: #8E8E93; letter-spacing: 1rpx; margin: 20rpx 8rpx 10rpx; }
.metrics-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .metric-row { position: relative; padding: 20rpx 24rpx;
    .metric-left { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx;
      .metric-icon { font-size: 28rpx; } .metric-name { font-size: 26rpx; color: #1C1C1E; font-weight: 500; }
    }
    .metric-right { display: flex; align-items: center; gap: 16rpx;
      .metric-bar-bg { flex: 1; height: 8rpx; background: #F2F2F7; border-radius: 9999rpx; overflow: hidden;
        .metric-bar-fill { height: 100%; border-radius: 9999rpx; }
      }
      .metric-score { font-size: 28rpx; font-weight: 700; width: 60rpx; text-align: right; }
    }
  }
}
.bio-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .bio-row { display: flex; align-items: center; justify-content: space-around; margin-bottom: 20rpx;
    .bio-col { display: flex; flex-direction: column; align-items: center; gap: 8rpx;
      .bc-lbl { font-size: 22rpx; color: #8E8E93; }
      .bc-val-wrap { display: flex; align-items: baseline; gap: 4rpx;
        .bc-val { font-size: 52rpx; font-weight: 800; color: #1C1C1E; &.green { color: #34C759; } }
        .bc-u { font-size: 22rpx; color: #8E8E93; }
      }
    }
    .bio-arr { font-size: 36rpx; color: #C7C7CC; }
  }
  .bio-tip { display: block; font-size: 24rpx; color: #34C759; background: rgba(52,199,89,0.08); border-radius: 12rpx; padding: 16rpx 20rpx;
    &.warn { color: #FF9500; background: rgba(255,149,0,0.08); }
  }
}
.list-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .history-row { position: relative; display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx;
    .hr-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .hr-icon { font-size: 28rpx; } }
    .hr-info { flex: 1; .hr-name { display: block; font-size: 28rpx; font-weight: 600; color: #1C1C1E; } .hr-date { display: block; font-size: 22rpx; color: #8E8E93; margin-top: 4rpx; } }
    .hr-score { font-size: 28rpx; font-weight: 700; }
  }
}
.row-sep { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
.empty-card { background: #fff; border-radius: 20rpx; padding: 48rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .empty-txt { font-size: 26rpx; color: #8E8E93; }
}
.empty-page { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80rpx 48rpx;
  .ep-icon-wrap { width: 120rpx; height: 120rpx; border-radius: 32rpx; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 28rpx; .ep-icon { font-size: 56rpx; } }
  .ep-title { font-size: 32rpx; font-weight: 700; color: #1C1C1E; margin-bottom: 16rpx; }
  .ep-desc { font-size: 26rpx; color: #8E8E93; text-align: center; line-height: 1.7; margin-bottom: 32rpx; }
  .ep-btn { background: #007AFF; border-radius: 9999rpx; padding: 18rpx 48rpx; .ep-btn-txt { font-size: 28rpx; font-weight: 600; color: #fff; } }
}
</style>
