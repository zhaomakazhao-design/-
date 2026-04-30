<template>
  <view class="page">
    <view class="bg-orb orb-1" />
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner">
        <view class="brand">
          <view class="brand-dot" />
          <text class="brand-name">{{ t('aiChat.title') }}</text>
        </view>
        <view class="clear-btn" @tap="clearChat"><text class="clear-txt">{{ t('aiChat.clear') }}</text></view>
      </view>
    </view>
    <scroll-view class="quick-scroll" scroll-x enhanced :show-scrollbar="false">
      <view class="quick-list">
        <view v-for="q in quickQuestions" :key="q" class="quick-tag" @tap="sendQuick(q)">
          <text class="qt-txt">{{ q }}</text>
        </view>
      </view>
    </scroll-view>
    <scroll-view class="msg-list" scroll-y enhanced :show-scrollbar="false" :scroll-top="scrollTop">
      <view v-if="!messages.length" class="empty-chat">
        <view class="ec-icon-wrap"><text class="ec-icon">V</text></view>
        <text class="ec-title">{{ t('aiChat.emptyTitle') }}</text>
        <text class="ec-desc">{{ t('aiChat.emptyDesc') }}</text>
      </view>
      <view v-for="(msg,i) in messages" :key="i" class="msg-row" :class="msg.role">
        <view v-if="msg.role==='assistant'" class="msg-avatar ai"><text>V</text></view>
        <view class="msg-bubble" :class="msg.role">
          <text class="msg-text">{{ msg.content }}</text>
          <text class="msg-time">{{ msg.time }}</text>
        </view>
        <view v-if="msg.role==='user'" class="msg-avatar user"><text>赵</text></view>
      </view>
      <view v-if="isTyping" class="msg-row assistant">
        <view class="msg-avatar ai"><text>V</text></view>
        <view class="msg-bubble assistant typing">
          <view class="dot-anim"><view class="dot d1"/><view class="dot d2"/><view class="dot d3"/></view>
        </view>
      </view>
      <view style="height:20rpx" />
    </scroll-view>
    <view class="input-bar">
      <view class="input-wrap">
        <input class="chat-input" v-model="inputText" :placeholder="t('aiChat.placeholder')" :adjust-position="true" @confirm="sendMessage" />
        <view class="send-btn" :class="{ active: inputText.trim() }" @tap="sendMessage">
          <text class="send-icon">↑</text>
        </view>
      </view>
    </view>
    <view class="tabbar" :style="{ paddingBottom: safeBottom + 'px' }">
      <view v-for="(tab,i) in tabList" :key="i" class="tab-item" @tap="onTab(i,tab)">
        <view class="tab-icon-wrap" :class="{ active: currentTab===i }"><text class="tab-icon">{{ tab.icon }}</text></view>
        <text class="tab-lbl" :class="{ active: currentTab===i }">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { sendHealthQuery } from '../../utils/task1.js';
import { useStore } from '../../utils/store.js';
import { t } from '../../utils/i18n.js';
const { getters, mutations } = useStore();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const inputText = ref('');
const isTyping = ref(false);
const scrollTop = ref(0);
const messages = ref([]);
const currentTab = ref(1);
const quickQuestions = [t('aiChat.quick1'), t('aiChat.quick2'), t('aiChat.quick3'), t('aiChat.quick4'), t('aiChat.quick5')];
const getTime = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
const scrollToBottom = () => nextTick(() => { scrollTop.value = 99999; });
const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || isTyping.value) return;
  inputText.value = '';
  messages.value.push({ role: 'user', content: text, time: getTime() });
  scrollToBottom();
  isTyping.value = true;
  let replied = false;
  try {
    const ctx = getters.collectionContext();
    sendHealthQuery(text, { ...ctx, ...getters.healthContext() },
      (chunk) => {
        if (chunk.content) {
          const msgs = messages.value;
          if (msgs.length > 0 && msgs[msgs.length-1].role === 'assistant_streaming') {
            msgs[msgs.length-1].content += chunk.content;
          } else { msgs.push({ role: 'assistant_streaming', content: chunk.content, time: getTime() }); }
          scrollToBottom(); replied = true;
        }
      },
      () => {
        const msgs = messages.value;
        if (msgs.length > 0 && msgs[msgs.length-1].role === 'assistant_streaming') msgs[msgs.length-1].role = 'assistant';
        isTyping.value = false; scrollToBottom();
      }
    );
  } catch (e) {}
  setTimeout(() => {
    if (!replied && isTyping.value) {
      messages.value.push({ role: 'assistant', content: t('aiChat.fallbackReply'), time: getTime() });
      isTyping.value = false; scrollToBottom();
    }
  }, 3000);
};
const sendQuick = (q) => { inputText.value = q; sendMessage(); };
const clearChat = () => { uni.showModal({ title: t('aiChat.clearTitle'), content: t('aiChat.clearConfirm'), success: (res) => { if (res.confirm) messages.value = []; } }); };
const tabList = [{ text: t('tabbar.home'), icon:'首', path:'/pages/index/index' },{ text: t('tabbar.detection'), icon:'◎', path:'/pages/detection/index' },{ text: t('tabbar.report'), icon:'≡', path:'/pages/health-report/index' },{ text: t('tabbar.profile'), icon:'○', path:'/pages/profile/index' }];
const onTab = (i, tab) => { currentTab.value = i; if (tab.path !== '/pages/ai-chat/index') uni.redirectTo({ url: tab.path }); };
onMounted(() => { const info = uni.getSystemInfoSync(); statusBarHeight.value = info.statusBarHeight || 44; safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0; });
</script>

<style lang="scss" scoped>
.page { height: 100vh; background: #0A0F1E; display: flex; flex-direction: column; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.12; pointer-events: none;
  &.orb-1 { width: 500rpx; height: 500rpx; background: #3D8EFF; top: -100rpx; left: -100rpx; }
}
.navbar { flex-shrink: 0; z-index: 10;
  .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 28rpx; }
  .brand { display: flex; align-items: center; gap: 14rpx;
    .brand-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #00E5B4; }
    .brand-name { font-size: 32rpx; font-weight: 800; color: #F0F4FF; }
  }
  .clear-btn { padding: 10rpx 20rpx; border-radius: 9999rpx; background: rgba(255,255,255,0.05); }
  .clear-txt { font-size: 24rpx; color: #8A9BC0; }
}
.quick-scroll { flex-shrink: 0; padding: 12rpx 0;
  .quick-list { display: flex; gap: 12rpx; padding: 0 28rpx;
    .quick-tag { display: inline-flex; padding: 12rpx 24rpx; background: rgba(61,142,255,0.1); border: 1rpx solid rgba(61,142,255,0.25); border-radius: 9999rpx; flex-shrink: 0;
      .qt-txt { font-size: 24rpx; color: #3D8EFF; white-space: nowrap; }
    }
  }
}
.msg-list { flex: 1; padding: 16rpx 20rpx; overflow-y: auto;
  .empty-chat { display: flex; flex-direction: column; align-items: center; padding: 80rpx 40rpx; gap: 20rpx;
    .ec-icon-wrap { width: 120rpx; height: 120rpx; border-radius: 50%; background: linear-gradient(135deg,#00E5B4,#3D8EFF); display: flex; align-items: center; justify-content: center;
      .ec-icon { font-size: 56rpx; font-weight: 900; color: #0A0F1E; }
    }
    .ec-title { font-size: 32rpx; font-weight: 700; color: #F0F4FF; text-align: center; }
    .ec-desc  { font-size: 26rpx; color: #8A9BC0; text-align: center; line-height: 1.7; }
  }
  .msg-row { display: flex; align-items: flex-end; gap: 12rpx; margin-bottom: 24rpx;
    &.user { flex-direction: row-reverse; }
    .msg-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 700; flex-shrink: 0;
      &.ai   { background: linear-gradient(135deg,#00E5B4,#3D8EFF); color: #0A0F1E; }
      &.user { background: linear-gradient(135deg,#A78BFA,#3D8EFF); color: #fff; }
    }
    .msg-bubble { max-width: 68%; padding: 20rpx 24rpx; border-radius: 24rpx; display: flex; flex-direction: column; gap: 8rpx;
      &.assistant { background: #1C2438; border: 1rpx solid rgba(255,255,255,0.06); border-bottom-left-radius: 6rpx; }
      &.user { background: linear-gradient(135deg,#3D8EFF,#2563eb); border-bottom-right-radius: 6rpx; }
      &.assistant_streaming { background: #1C2438; border: 1rpx solid rgba(255,255,255,0.06); border-bottom-left-radius: 6rpx; }
      &.typing { padding: 20rpx 28rpx; }
      .msg-text { font-size: 28rpx; color: #F0F4FF; line-height: 1.7; }
      .msg-time { font-size: 20rpx; color: rgba(255,255,255,0.3); align-self: flex-end; }
    }
  }
  .dot-anim { display: flex; gap: 8rpx; align-items: center;
    .dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #8A9BC0;
      &.d1 { animation: dot-bounce 1s ease-in-out infinite 0s; }
      &.d2 { animation: dot-bounce 1s ease-in-out infinite 0.2s; }
      &.d3 { animation: dot-bounce 1s ease-in-out infinite 0.4s; }
    }
  }
}
.input-bar { flex-shrink: 0; background: rgba(17,24,39,0.98); border-top: 1rpx solid rgba(255,255,255,0.08); padding: 16rpx 24rpx;
  .input-wrap { display: flex; align-items: center; gap: 16rpx;
    .chat-input { flex: 1; background: rgba(255,255,255,0.08); border: 1rpx solid rgba(255,255,255,0.12); border-radius: 9999rpx; padding: 20rpx 28rpx; font-size: 28rpx; color: #F0F4FF; min-height: 80rpx; }
    .send-btn { width: 80rpx; height: 80rpx; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      &.active { background: linear-gradient(135deg,#00E5B4,#00BFA5); }
      .send-icon { font-size: 32rpx; color: #4A5568; font-weight: 700; }
      &.active .send-icon { color: #0A0F1E; }
    }
  }
}
.tabbar { flex-shrink: 0; background: rgba(17,24,39,0.96); border-top: 1rpx solid rgba(255,255,255,0.06); display: flex;
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0 12rpx; gap: 6rpx;
    .tab-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center;
      .tab-icon { font-size: 24rpx; font-weight: 700; color: #4A5568; }
      &.active { background: rgba(0,229,180,0.12); .tab-icon { color: #00E5B4; } }
    }
    .tab-lbl { font-size: 20rpx; color: #4A5568; &.active { color: #00E5B4; font-weight: 600; } }
  }
}
@keyframes dot-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8rpx); } }
</style>
