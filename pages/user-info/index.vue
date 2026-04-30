<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <text class="navbar-title">{{ text.title }}</text>
    </view>

    <scroll-view class="scroll-body" scroll-y enhanced :show-scrollbar="false">
      <view class="intro-card">
        <text class="intro-txt">{{ text.intro }}</text>
      </view>

      <view class="section-label">{{ text.basicInfo }}</view>
      <view class="form-card">
        <view class="form-row">
          <text class="fr-label">{{ text.name }}</text>
          <input class="fr-input" v-model="userInfo.name" :placeholder="text.input" placeholder-class="ph" />
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.age }}</text>
          <input class="fr-input" v-model="userInfo.chrono_age" :placeholder="text.agePlaceholder" placeholder-class="ph" type="number" />
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.gender }}</text>
          <view class="gender-group">
            <view class="gender-btn" :class="{ active: userInfo.gender===text.maleValue }" @tap="userInfo.gender=text.maleValue">
              <text class="gender-txt">{{ text.male }}</text>
            </view>
            <view class="gender-btn" :class="{ active: userInfo.gender===text.femaleValue }" @tap="userInfo.gender=text.femaleValue">
              <text class="gender-txt">{{ text.female }}</text>
            </view>
          </view>
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.height }}</text>
          <input class="fr-input" v-model="userInfo.height" placeholder="cm" placeholder-class="ph" type="number" />
        </view>
        <view class="row-sep" />
        <view class="form-row">
          <text class="fr-label">{{ text.weight }}</text>
          <input class="fr-input" v-model="userInfo.weight" placeholder="kg" placeholder-class="ph" type="number" />
        </view>
      </view>

      <view class="section-label">{{ text.medicalHistory }}</view>
      <view class="form-card">
        <textarea class="textarea-input" v-model="userInfo.medical_history" :placeholder="text.medicalHistoryPlaceholder" placeholder-class="ph" />
      </view>

      <view class="save-btn" :class="{ loading: isSaving }" @tap="handleSave">
        <text class="save-btn-txt">{{ isSaving ? text.saving : text.saveContinue }}</text>
      </view>

      <view style="height:80rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';

const { state, mutations } = useStore();
useI18n();
const statusBarHeight = ref(44);
const isSaving = ref(false);
const userInfo = reactive({
  name: state.user.name || '',
  chrono_age: state.user.chrono_age || '',
  gender: state.user.gender || '',
  height: state.user.height || '',
  weight: state.user.weight || '',
  medical_history: state.user.medical_history || ''
});

const text = computed(() => ({
  title: t('userInfo.title'),
  intro: t('userInfo.intro'),
  basicInfo: t('userInfo.basicInfo'),
  medicalHistory: t('userInfo.medicalHistory'),
  name: t('userInfo.name'),
  age: t('userInfo.age'),
  gender: t('userInfo.gender'),
  height: t('userInfo.height'),
  weight: t('userInfo.weight'),
  male: t('userInfo.male'),
  female: t('userInfo.female'),
  maleValue: t('userInfo.male'),
  femaleValue: t('userInfo.female'),
  input: t('userInfo.input'),
  agePlaceholder: t('common.ageSuffix').trim() || t('userInfo.age'),
  medicalHistoryPlaceholder: t('userInfo.medicalHistoryPlaceholder'),
  saving: t('userInfo.saving'),
  saveContinue: t('userInfo.saveContinue'),
  nameRequired: t('userInfo.nameRequired'),
  ageInvalid: t('userInfo.ageInvalid'),
  genderRequired: t('userInfo.genderRequired'),
  heightInvalid: t('userInfo.heightInvalid'),
  weightInvalid: t('userInfo.weightInvalid'),
  saveSuccess: t('userInfo.saveSuccess')
}));

const handleSave = () => {
  if (!userInfo.name.trim()) { uni.showToast({ title: text.value.nameRequired, icon: 'none' }); return; }
  if (!userInfo.chrono_age || userInfo.chrono_age < 18 || userInfo.chrono_age > 120) { uni.showToast({ title: text.value.ageInvalid, icon: 'none' }); return; }
  if (!userInfo.gender) { uni.showToast({ title: text.value.genderRequired, icon: 'none' }); return; }
  if (!userInfo.height || userInfo.height < 100 || userInfo.height > 250) { uni.showToast({ title: text.value.heightInvalid, icon: 'none' }); return; }
  if (!userInfo.weight || userInfo.weight < 30 || userInfo.weight > 300) { uni.showToast({ title: text.value.weightInvalid, icon: 'none' }); return; }
  isSaving.value = true;
  const dataToSave = {
    name: userInfo.name,
    chrono_age: parseInt(userInfo.chrono_age),
    gender: userInfo.gender,
    height: parseInt(userInfo.height),
    weight: parseInt(userInfo.weight),
    medical_history: userInfo.medical_history
  };
  try { uni.setStorageSync('user_info', dataToSave); } catch (e) {}
  mutations.setUser(dataToSave);
  uni.showToast({ title: text.value.saveSuccess, icon: 'success' });
  setTimeout(() => { uni.reLaunch({ url: '/pages/index/index' }); isSaving.value = false; }, 1200);
};

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  const savedInfo = uni.getStorageSync('user_info');
  if (savedInfo && savedInfo.name && savedInfo.chrono_age) {
    userInfo.name = savedInfo.name;
    userInfo.chrono_age = savedInfo.chrono_age;
    userInfo.gender = savedInfo.gender;
    userInfo.height = savedInfo.height;
    userInfo.weight = savedInfo.weight;
    userInfo.medical_history = savedInfo.medical_history;
  } else if (state.user.name) {
    userInfo.name = state.user.name;
  }
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.status-bar { background: #F2F2F7; }
.navbar { padding: 8rpx 32rpx 16rpx; background: #F2F2F7;
  .navbar-title { display: block; font-size: 56rpx; font-weight: 800; color: #1C1C1E; letter-spacing: -1rpx; }
}
.scroll-body { flex: 1; padding: 0 24rpx; }
.intro-card { background: #fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .intro-txt { font-size: 26rpx; color: #8E8E93; line-height: 1.6; }
}
.section-label { font-size: 22rpx; font-weight: 600; color: #8E8E93; text-transform: uppercase; letter-spacing: 1rpx; margin: 0 8rpx 10rpx; }
.form-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  .form-row { display: flex; align-items: center; padding: 0 24rpx; min-height: 88rpx;
    .fr-label { font-size: 28rpx; color: #1C1C1E; width: 160rpx; flex-shrink: 0; }
    .fr-input { flex: 1; height: 88rpx; font-size: 28rpx; color: #1C1C1E; text-align: right; }
  }
  .row-sep { height: 1rpx; background: #F2F2F7; margin-left: 24rpx; }
  .gender-group { flex: 1; display: flex; justify-content: flex-end; gap: 12rpx;
    .gender-btn { padding: 10rpx 28rpx; border-radius: 9999rpx; background: #F2F2F7;
      &.active { background: #007AFF; }
      .gender-txt { font-size: 26rpx; color: #8E8E93; font-weight: 500; }
      &.active .gender-txt { color: #fff; }
    }
  }
  .textarea-input { width: 100%; box-sizing: border-box; min-height: 160rpx; padding: 24rpx; font-size: 26rpx; color: #1C1C1E; line-height: 1.6; }
}
.ph { color: #C7C7CC; font-size: 28rpx; }
.save-btn { background: #007AFF; border-radius: 20rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,122,255,0.3);
  &.loading { opacity: 0.7; }
  .save-btn-txt { font-size: 30rpx; font-weight: 600; color: #fff; }
}
</style>
