<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="back-btn" @tap="uni.navigateBack()"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ text.title }}</text>
      <view style="width:64rpx" />
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="section-label">{{ text.basicInfo }}</view>
      <view class="form-card">
        <view class="form-row">
          <text class="fr-label">{{ text.age }}</text>
          <view class="fr-right"><input class="fr-input" type="number" v-model="form.age" :placeholder="text.agePlaceholder" placeholder-class="ph" /></view>
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.gender }}</text>
          <view class="gender-group">
            <view class="gender-btn" :class="{ active: form.gender==='male' }" @tap="form.gender='male'"><text class="gender-txt">{{ text.male }}</text></view>
            <view class="gender-btn" :class="{ active: form.gender==='female' }" @tap="form.gender='female'"><text class="gender-txt">{{ text.female }}</text></view>
          </view>
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.height }}</text>
          <view class="fr-right"><input class="fr-input" type="digit" v-model="form.height" :placeholder="text.heightPlaceholder" placeholder-class="ph" /></view>
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.weight }}</text>
          <view class="fr-right"><input class="fr-input" type="digit" v-model="form.weight" :placeholder="text.weightPlaceholder" placeholder-class="ph" /></view>
        </view>
        <view class="row-sep" />
        <view class="form-row col">
          <text class="fr-label">{{ text.history }}</text>
          <textarea class="fr-textarea" v-model="form.history" :placeholder="text.historyPlaceholder" placeholder-class="ph" />
        </view>
      </view>

      <view class="sec-header">
        <view class="section-label" style="margin:0">{{ text.images }}</view>
        <text class="sec-count">{{ images.length }}/20</text>
      </view>
      <text class="sec-hint">{{ text.imageHint }}</text>
      <view class="img-grid">
        <view v-for="(img,i) in images" :key="i" class="img-item" @tap="previewImg(i)">
          <image :src="img" class="img-thumb" mode="aspectFill" />
          <view class="img-del" @tap.stop="removeImg(i)"><text>×</text></view>
        </view>
        <view v-if="images.length < 20" class="img-add" @tap="chooseImages">
          <text class="add-plus">+</text>
          <text class="add-txt">{{ text.add }}</text>
        </view>
      </view>

      <view class="upload-actions">
        <view class="ua-btn" @tap="takePhoto"><text class="ua-txt">{{ text.takePhoto }}</text></view>
        <view class="ua-btn blue" @tap="chooseImages"><text class="ua-txt">{{ text.chooseAlbum }}</text></view>
      </view>

      <view style="height:180rpx" />
    </scroll-view>

    <view class="bottom-bar" :style="{ paddingBottom: safeBottom+'px' }">
      <view class="submit-btn" @tap="submitForm"><text class="submit-txt">{{ text.submit }}</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';
import { analyzeReportNew, debugReportFormat, testReportDataReceived } from '../../utils/api-service.js';
import { getUserId } from '../../utils/api.js';

const { mutations, state } = useStore();
useI18n();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const images = ref([]);
const form = reactive({ age: '', gender: 'male', height: '', weight: '', history: '' });

const text = computed(() => ({
  title: t('reportUpload.title'),
  basicInfo: t('reportUpload.basicInfo'),
  age: t('reportUpload.age'),
  gender: t('reportUpload.gender'),
  height: t('reportUpload.height'),
  weight: t('reportUpload.weight'),
  history: t('reportUpload.history'),
  male: t('reportUpload.male'),
  female: t('reportUpload.female'),
  agePlaceholder: t('reportUpload.agePlaceholder'),
  heightPlaceholder: t('reportUpload.heightPlaceholder'),
  weightPlaceholder: t('reportUpload.weightPlaceholder'),
  historyPlaceholder: t('reportUpload.historyPlaceholder'),
  images: t('reportUpload.images'),
  imageHint: t('reportUpload.imageHint'),
  add: t('reportUpload.add'),
  takePhoto: t('reportUpload.takePhoto'),
  chooseAlbum: t('reportUpload.chooseAlbum'),
  submit: t('reportUpload.submit'),
  ageRequired: t('reportUpload.ageRequired'),
  imageRequired: t('reportUpload.imageRequired'),
  uploading: t('reportUpload.uploading'),
  uploadSuccess: t('reportUpload.uploadSuccess'),
  savedOffline: t('reportUpload.savedOffline')
}));

const chooseImages = () => {
  uni.chooseImage({ count: 20 - images.value.length, sizeType: ['compressed'], sourceType: ['album'],
    success: res => { images.value.push.apply(images.value, res.tempFilePaths); res.tempFilePaths.forEach(p => mutations.addReportImage(p)); }
  });
};
const takePhoto = () => {
  uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['camera'],
    success: res => { images.value.push(res.tempFilePaths[0]); mutations.addReportImage(res.tempFilePaths[0]); }
  });
};
const removeImg = (i) => { images.value.splice(i, 1); mutations.removeReportImage(i); };
const previewImg = (i) => uni.previewImage({ urls: images.value, current: images.value[i] });

const submitForm = async () => {
  if (!form.age) { uni.showToast({ title: text.value.ageRequired, icon: 'none' }); return; }
  if (!images.value.length) { uni.showToast({ title: text.value.imageRequired, icon: 'none' }); return; }
  
  mutations.setUser({ chrono_age: Number(form.age), gender: form.gender, height: Number(form.height), weight: Number(form.weight), medical_history: form.history });
  mutations.setReportStatus('uploading');
  uni.showLoading({ title: text.value.uploading });
  
  try {
    const userId = getUserId();
    if (!userId) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      mutations.setReportStatus('done');
      uni.hideLoading();
      return;
    }
    
    // 分析第一张图片（根据文档，通常上传第一张代表性的报告图）
    const reportImagePath = images.value[0];
    
    // 调试：显示发送的 JSON 格式
    const debugData = await debugReportFormat(reportImagePath, userId);
    console.log('📋 [3] 发送给后端的 Report JSON 结构:', debugData);
    
    const response = await analyzeReportNew(reportImagePath, userId);
    
    if (response.record_id) {
      // 保存分析结果
      mutations.setReportStatus('ocr_processing', { 
        record_id: response.record_id,
        summary: response.summary,
        basic: response.basic,
        lab_results: response.lab_results,
        confidence: response.confidence
      });
      
      uni.hideLoading();
      uni.showToast({ title: text.value.uploadSuccess, icon: 'success' });
      
      setTimeout(() => { 
        mutations.setReportStatus('done'); 
        uni.navigateBack(); 
      }, 1500);
    } else {
      mutations.setReportStatus('done');
      uni.hideLoading();
      uni.showToast({ title: response.msg || text.value.savedOffline, icon: 'none' });
    }
  } catch (error) {
    console.error('Report upload error:', error);
    mutations.setReportStatus('done');
    uni.hideLoading();
    
    let errMsg = text.value.savedOffline;
    if (error.code === 422) {
      errMsg = '无法识别报告内容，请检查图片清晰度';
    } else if (error.code === 415) {
      errMsg = '不支持的图片格式';
    } else if (error.code === 500) {
      errMsg = '服务器错误，请稍后重试';
    }
    
    uni.showToast({ title: errMsg, icon: 'none' });
    setTimeout(() => uni.navigateBack(), 1500);
  }
};

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0;
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; background: #F2F2F7;
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; .back-icon { font-size: 48rpx; color: #007AFF; font-weight: 300; } }
  .nav-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; }
}
.scroll-body { flex: 1; padding: 0 16rpx; }
.section-label { font-size: 22rpx; font-weight: 600; color: #8E8E93; letter-spacing: 1rpx; margin: 20rpx 8rpx 10rpx; }
.sec-header { display: flex; align-items: center; justify-content: space-between; margin: 20rpx 8rpx 4rpx;
  .sec-count { font-size: 22rpx; color: #8E8E93; }
}
.sec-hint { display: block; font-size: 22rpx; color: #8E8E93; margin: 0 8rpx 12rpx; }
.form-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .form-row { display: flex; align-items: center; justify-content: space-between; padding: 0 24rpx; min-height: 88rpx;
    &.col { flex-direction: column; align-items: flex-start; padding: 20rpx 24rpx; gap: 12rpx; }
    .fr-label { font-size: 28rpx; color: #1C1C1E; flex-shrink: 0; }
    .fr-right { flex: 1; display: flex; justify-content: flex-end; }
    .fr-input { text-align: right; font-size: 28rpx; color: #1C1C1E; height: 88rpx; min-width: 120rpx; }
    .fr-textarea { width: 100%; min-height: 120rpx; font-size: 26rpx; color: #1C1C1E; line-height: 1.6; }
    .gender-group { display: flex; gap: 12rpx;
      .gender-btn { padding: 10rpx 28rpx; border-radius: 9999rpx; background: #F2F2F7;
        &.active { background: #007AFF; .gender-txt { color: #fff; } }
        .gender-txt { font-size: 26rpx; color: #8E8E93; font-weight: 500; }
      }
    }
  }
  .row-sep { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
}
.ph { color: #C7C7CC; font-size: 28rpx; }
.img-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12rpx; margin-bottom: 16rpx;
  .img-item { position: relative; aspect-ratio: 1;
    .img-thumb { width: 100%; height: 100%; border-radius: 12rpx; }
    .img-del { position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: #FF3B30; display: flex; align-items: center; justify-content: center; font-size: 22rpx; color: #fff; font-weight: 700; }
  }
  .img-add { aspect-ratio: 1; background: #fff; border: 2rpx dashed #C7C7CC; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx;
    .add-plus { font-size: 48rpx; color: #C7C7CC; line-height: 1; }
    .add-txt  { font-size: 20rpx; color: #8E8E93; }
  }
}
.upload-actions { display: flex; gap: 16rpx; margin-bottom: 12rpx;
  .ua-btn { flex: 1; height: 80rpx; border-radius: 16rpx; background: #fff; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    &.blue { background: #007AFF; .ua-txt { color: #fff; } }
    .ua-txt { font-size: 28rpx; font-weight: 600; color: #007AFF; }
  }
}
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(242,242,247,0.95); backdrop-filter: blur(20px); padding: 16rpx 24rpx; border-top: 1rpx solid rgba(0,0,0,0.08);
  .submit-btn { background: #007AFF; border-radius: 20rpx; height: 88rpx; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4rpx 16rpx rgba(0,122,255,0.3);
    .submit-txt { font-size: 30rpx; font-weight: 600; color: #fff; }
  }
}
</style>
