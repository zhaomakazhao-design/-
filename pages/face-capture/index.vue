<template>
  <view class="page">
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner">
        <view class="back-btn" @tap="goBack"><text class="back-icon">‹</text></view>
        <text class="nav-title">{{ text.title }}</text>
        <view style="width:64rpx" />
      </view>
    </view>

    <view class="camera-area" :prop="cameraCmd" :change:prop="renderScript.onCmdChange">
      <view class="face-overlay">
        <view class="guide-frame">
          <view class="face-ellipse" />
          <view class="scan-line" :style="{ opacity: scanning ? 1 : 0 }" />
        </view>
        <view class="light-bar ok">
          <view class="light-dot" />
          <text class="light-txt">{{ text.lightOk }}</text>
        </view>
        <view class="capture-hint">
          <text class="hint-label">{{ text.hint }}</text>
        </view>
      </view>
    </view>

    <view class="preview-fullscreen" :style="{ opacity: photoPath ? 1 : 0, pointerEvents: photoPath ? 'auto' : 'none' }">
      <image :src="photoPath || ''" class="preview-full-img" mode="aspectFill" />
      <view class="preview-actions">
        <view class="pa-btn retake" @tap="retakePhoto">
          <text class="pa-txt">{{ text.retake }}</text>
        </view>
        <view class="pa-btn confirm" @tap="submitPhoto">
          <text class="pa-txt">{{ uploading ? text.uploading : text.usePhoto }}</text>
        </view>
      </view>
      <view class="preview-tip">
        <text class="pt-txt">{{ text.previewTip }}</text>
      </view>
    </view>

    <view class="bottom-bar" :style="{ paddingBottom: safeBottom + 'px', opacity: photoPath ? 0 : 1, pointerEvents: photoPath ? 'none' : 'auto' }">
      <view class="tips-row">
        <text class="tip-item">{{ text.tip1 }}</text>
        <text class="tip-item">{{ text.tip2 }}</text>
        <text class="tip-item">{{ text.tip3 }}</text>
      </view>
      <view class="shutter-row">
        <view style="width:96rpx" />
        <view class="shutter-btn" :class="{ disabled: scanning }" @tap="takePhoto">
          <view class="shutter-inner" />
        </view>
        <view class="side-btn" :style="{ opacity: photoPath ? 1 : 0.25, pointerEvents: photoPath ? 'auto' : 'none' }" @tap="submitPhoto">
          <text class="side-txt">{{ text.submit }}</text>
        </view>
      </view>
      <text class="upload-note">{{ text.uploadNote }}</text>
    </view>
  </view>
</template>

<script>
import { useStore } from '../../utils/store.js';
import { t } from '../../utils/i18n.js';
import { analyzeFace } from '../../utils/api-service.js';
import { getUserId } from '../../utils/api.js';

export default {
  data() {
    return {
      statusBarHeight: 44,
      safeBottom: 0,
      scanning: false,
      uploading: false,
      photoPath: '',
      cameraCmd: 'init',
    };
  },
  computed: {
    text() {
      return {
        title: t('faceCapture.title'),
        lightOk: t('faceCapture.lightOk'),
        hint: t('faceCapture.hint'),
        retake: t('faceCapture.retake'),
        uploading: t('faceCapture.uploading'),
        usePhoto: t('faceCapture.usePhoto'),
        previewTip: t('faceCapture.previewTip'),
        tip1: t('faceCapture.tip1'),
        tip2: t('faceCapture.tip2'),
        tip3: t('faceCapture.tip3'),
        submit: t('faceCapture.submit'),
        uploadNote: t('faceCapture.uploadNote'),
        captureFailed: t('faceCapture.captureFailed'),
        captureSuccess: t('faceCapture.captureSuccess'),
        uploadSuccess: t('faceCapture.uploadSuccess'),
        uploadFailed: t('faceCapture.uploadFailed')
      };
    }
  },
  onMounted() {
    const info = uni.getSystemInfoSync();
    this.statusBarHeight = info.statusBarHeight || 44;
    this.safeBottom = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0;
  },
  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
        return;
      }
      uni.reLaunch({ url: '/pages/index/index' });
    },
    retakePhoto() {
      this.photoPath = '';
      this.scanning = false;
    },
    takePhoto() {
      if (this.scanning || this.uploading) return;
      this.scanning = true;
      this.cameraCmd = 'capture_' + Date.now();
    },
    async onCaptureResult(dataUrl) {
      if (!dataUrl) {
        this.scanning = false;
        uni.showToast({ title: this.text.captureFailed, icon: 'none' });
        return;
      }
      
      try {
        // 尝试将 Data URL 保存为本地文件或 Blob URL
        let filePath = dataUrl;  // 默认使用原始 Data URL
        
        try {
          filePath = await this.savePhotoToLocal(dataUrl);
          console.log('✅ 照片已保存为:', { type: filePath.startsWith('blob:') ? 'Blob URL' : filePath.startsWith('data:') ? 'Data URL' : '本地文件', filePath });
        } catch (saveError) {
          console.warn('⚠️ 保存照片失败，使用原始 Data URL:', saveError.message);
          // 即使保存失败也继续使用 Data URL
          filePath = dataUrl;
        }
        
        this.photoPath = filePath;
        
        const { mutations } = useStore();
        mutations.setFacePhoto && mutations.setFacePhoto('front', filePath);
        this.scanning = false;
        uni.showToast({ title: this.text.captureSuccess, icon: 'success' });
      } catch (e) {
        console.error('保存照片流程出错:', e);
        this.scanning = false;
        uni.showToast({ title: '拍摄处理失败，请重新拍摄', icon: 'none' });
      }
    },
    async savePhotoToLocal(dataUrl) {
      return new Promise((resolve, reject) => {
        try {
          console.log('💾 开始保存照片...');
          
          // ===== 前置检查：验证 Data URL 格式 =====
          if (!dataUrl || typeof dataUrl !== 'string') {
            throw new Error('Data URL 无效');
          }
          
          if (!dataUrl.startsWith('data:')) {
            throw new Error('不是有效的 Data URL');
          }
          
          // ===== 方案1：使用 Blob URL（H5 最优方案） =====
          try {
            console.log('🌐 [方案1] 尝试使用 Blob URL');
            
            // 确保 URL API 可用
            if (typeof window !== 'undefined' && typeof window.URL !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
              const parts = dataUrl.split(',');
              if (parts.length < 2) throw new Error('Data URL 格式不完整');
              
              const base64Data = parts[1];
              
              // 校验 base64
              if (!base64Data || base64Data.length === 0) {
                throw new Error('base64 数据为空');
              }
              
              // 转换 base64 为 Blob
              const bstr = atob(base64Data);
              const n = bstr.length;
              const u8arr = new Uint8Array(n);
              for (let i = 0; i < n; i++) {
                u8arr[i] = bstr.charCodeAt(i);
              }
              
              const blob = new Blob([u8arr], { type: 'image/jpeg' });
              const fileUrl = window.URL.createObjectURL(blob);
              
              console.log('✅ [方案1] Blob URL 创建成功', { fileUrl, blobSize: blob.size });
              resolve(fileUrl);
              return;
            } else {
              console.log('⚠️ [方案1] URL.createObjectURL 不可用');
            }
          } catch (e) {
            console.log('⚠️ [方案1] Blob URL 方案失败:', e.message);
          }
          
          // ===== 方案2：使用 uni.getFileSystemManager（小程序/App） =====
          try {
            console.log('📱 [方案2] 尝试使用 uni.getFileSystemManager');
            
            if (typeof uni !== 'undefined' && typeof uni.getFileSystemManager === 'function') {
              const parts = dataUrl.split(',');
              if (parts.length < 2) throw new Error('Data URL 格式不完整');
              
              const base64Data = parts[1];
              const fileName = `face_${Date.now()}.jpg`;
              
              const fs = uni.getFileSystemManager();
              
              // 使用临时目录
              const filePath = `${uni.env.USER_DATA_PATH || './'}${fileName}`;
              
              console.log('  写入文件:', filePath);
              fs.writeFileSync(filePath, base64Data, 'base64');
              
              console.log('✅ [方案2] 照片已保存到本地文件', { filePath });
              resolve(filePath);
              return;
            } else {
              console.log('⚠️ [方案2] uni.getFileSystemManager 不可用');
            }
          } catch (e) {
            console.log('⚠️ [方案2] getFileSystemManager 方案失败:', e.message);
          }
          
          // ===== 方案3：fallback - 直接返回 Data URL =====
          try {
            console.log('⚡ [方案3] 使用 Data URL 作为 fallback');
            console.log('⚠️ 警告：直接使用 Data URL，后端上传可能不支持');
            resolve(dataUrl);
            return;
          } catch (e) {
            console.log('⚠️ [方案3] Data URL fallback 失败:', e.message);
          }
          
          // 所有方案都失败了
          throw new Error('无法处理照片：所有保存方案都不可用');
        } catch (e) {
          console.error('❌ 保存照片失败:', e.message);
          console.error('   完整错误:', e);
          reject(e);
        }
      });
    },
    async submitPhoto() {
      if (!this.photoPath || this.uploading) return;
      this.uploading = true;
      const { state, mutations } = useStore();
      mutations.setFaceStatus && mutations.setFaceStatus('uploading');
      
      try {
        const userId = getUserId();
        if (!userId) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          this.uploading = false;
          mutations.setFaceStatus && mutations.setFaceStatus('done');
          return;
        }
        
        // 调用后端API分析面部
        const actualAge = state.user?.actual_age || null;
        
        console.log('📸 ===== 开始上传面部图片 =====');
        console.log('📸 [1] 用户信息:', { userId, actualAge });
        console.log('📸 [2] 本地文件路径:', this.photoPath);
        
        // 调试：显示发送的 JSON 格式
        const { debugUploadFormat } = await import('../../utils/api-service.js');
        const debugData = await debugUploadFormat(this.photoPath, userId, actualAge);
        console.log('📸 [3] 发送给后端的 JSON 结构:', debugData);
        
        const response = await analyzeFace(this.photoPath, userId, actualAge);
        
        // 响应格式: { code, msg, data: { record_id, age_estimation, skin_analysis, fatigue_analysis } }
        const responseData = response?.data || response;
        
        if (responseData?.record_id) {
          // 保存分析结果到 store
          mutations.setFaceAnalysis && mutations.setFaceAnalysis({
            record_id: responseData.record_id,
            age_estimation: responseData.age_estimation,
            skin_analysis: responseData.skin_analysis,
            fatigue_analysis: responseData.fatigue_analysis
          });
          
          mutations.setFaceStatus && mutations.setFaceStatus('uploaded', responseData.record_id);
          uni.showToast({ title: this.text.uploadSuccess, icon: 'success' });
          
          setTimeout(() => uni.navigateBack(), 1500);
        } else {
          uni.showToast({ title: response?.msg || this.text.uploadFailed, icon: 'none' });
          mutations.setFaceStatus && mutations.setFaceStatus('done');
        }
      } catch (error) {
        console.error('Face analysis error:', error);
        let errMsg = this.text.uploadFailed;
        
        if (error.code === 422) {
          errMsg = '未检测到人脸，请重新拍照';
        } else if (error.code === 415) {
          errMsg = '不支持的图片格式';
        } else if (error.code === 500) {
          errMsg = '服务器错误，请稍后重试';
        }
        
        uni.showToast({ title: errMsg, icon: 'none' });
        mutations.setFaceStatus && mutations.setFaceStatus('done');
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>

<script module="renderScript" lang="renderjs">
export default {
  data() {
    return {
      videoEl: null,
      canvasEl: null,
      stream: null,
    };
  },
  mounted() {
    this.$nextTick(() => this.initCamera());
  },
  methods: {
    initCamera() {
      const area = document.querySelector('.camera-area');
      if (!area) return;
      const video = document.createElement('video');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transform:scaleX(-1);background:#000;';
      area.insertBefore(video, area.firstChild);
      this.videoEl = video;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 853;
      this.canvasEl = canvas;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 853 } },
          audio: false
        }).then(stream => {
          this.stream = stream;
          video.srcObject = stream;
        }).catch(err => {
          console.error('摄像头启动失败:', err);
        });
      }
    },
    onCmdChange(newVal) {
      if (!newVal || newVal === 'init') return;
      if (newVal.startsWith('capture_')) this.capture();
    },
    capture() {
      if (!this.videoEl || !this.canvasEl) {
        this.$ownerInstance.callMethod('onCaptureResult', null);
        return;
      }
      const ctx = this.canvasEl.getContext('2d');
      ctx.save();
      ctx.translate(this.canvasEl.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);
      ctx.restore();
      const dataUrl = this.canvasEl.toDataURL('image/jpeg', 0.9);
      this.$ownerInstance.callMethod('onCaptureResult', dataUrl);
    }
  }
};
</script>

<style lang="scss" scoped>
.page { height: 100vh; background: #000; display: flex; flex-direction: column; overflow: hidden; }
.navbar { flex-shrink: 0; z-index: 10; background: rgba(0,0,0,0.7);
  .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 16rpx; }
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
    .back-icon { font-size: 48rpx; color: #fff; font-weight: 300; }
  }
  .nav-title { font-size: 30rpx; font-weight: 600; color: #fff; }
}
.camera-area { flex: 1; position: relative; overflow: hidden; }
.face-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 2;
  .guide-frame { position: relative; width: 520rpx; height: 660rpx;
    .face-ellipse { position: absolute; inset: 0; border-radius: 50%; border: 3rpx dashed rgba(255,255,255,0.5); }
    .scan-line { position: absolute; left: 0; right: 0; height: 3rpx; top: 50%; background: linear-gradient(90deg,transparent,#34C759,transparent); animation: scan-anim 1.5s linear infinite; transition: opacity 0.2s; }
  }
  .light-bar { position: absolute; top: 24rpx; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10rpx; border-radius: 9999rpx; padding: 10rpx 24rpx; white-space: nowrap;
    &.ok { background: rgba(52,199,89,0.2); border: 1rpx solid rgba(52,199,89,0.5); .light-dot { background: #34C759; } .light-txt { color: #34C759; font-size: 22rpx; } }
    .light-dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
  }
  .capture-hint { position: absolute; bottom: 40rpx;
    .hint-label { font-size: 26rpx; color: rgba(255,255,255,0.8); text-shadow: 0 1px 8px rgba(0,0,0,0.8); }
  }
}
.bottom-bar { background: rgba(0,0,0,0.9); flex-shrink: 0; padding-top: 16rpx; z-index: 10;
  .tips-row { display: flex; justify-content: space-around; padding: 0 20rpx 16rpx;
    .tip-item { font-size: 20rpx; color: rgba(255,255,255,0.5); }
  }
  .shutter-row { display: flex; align-items: center; justify-content: space-between; padding: 0 40rpx 16rpx;
    .side-btn { width: 96rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; transition: opacity 0.3s;
      .side-txt { font-size: 28rpx; color: #34C759; font-weight: 700; }
    }
    .shutter-btn { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid #fff; display: flex; align-items: center; justify-content: center;
      .shutter-inner { width: 96rpx; height: 96rpx; border-radius: 50%; background: #fff; }
      &.disabled { border-color: rgba(255,255,255,0.3); .shutter-inner { background: rgba(255,255,255,0.3); } }
    }
  }
  .upload-note { display: block; text-align: center; font-size: 20rpx; color: rgba(255,255,255,0.3); padding-bottom: 20rpx; }
}
@keyframes scan-anim { 0% { top: 10%; } 100% { top: 90%; } }
.preview-fullscreen {
  position: fixed; inset: 0; z-index: 100;
  background: #000;
  display: flex; flex-direction: column;
  transition: opacity 0.3s;
  .preview-full-img { width: 100%; flex: 1; display: block; }
  .preview-tip { padding: 16rpx 32rpx;
    .pt-txt { font-size: 24rpx; color: rgba(255,255,255,0.5); text-align: center; display: block; }
  }
  .preview-actions {
    display: flex; gap: 20rpx; padding: 20rpx 32rpx;
    .pa-btn { flex: 1; height: 88rpx; border-radius: 44rpx; display: flex; align-items: center; justify-content: center;
      &.retake { background: rgba(255,255,255,0.12); border: 1rpx solid rgba(255,255,255,0.2);
        .pa-txt { color: #fff; font-size: 28rpx; font-weight: 500; }
      }
      &.confirm { background: #34C759;
        .pa-txt { color: #fff; font-size: 28rpx; font-weight: 700; }
      }
    }
  }
}
</style>
