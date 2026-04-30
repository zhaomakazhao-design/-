<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="navbar">
      <view class="navbar-inner">
        <text class="navbar-title">{{ text.title }}</text>
        <view class="clear-btn" @tap="clearChat"><text class="clear-txt">{{ text.clear }}</text></view>
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
      <view class="empty-chat" :style="{ display: messages.length ? 'none' : 'flex' }">
        <view class="ec-avatar"><text class="ec-av-txt">V</text></view>
        <text class="ec-title">{{ text.emptyTitle }}</text>
        <text class="ec-desc">{{ text.emptyDesc }}</text>
      </view>
      <view v-for="(msg,i) in messages" :key="i" class="msg-row" :class="msg.role">
        <view class="msg-avatar ai" :style="{ display: (msg.role==='assistant' || msg.role==='assistant_streaming') ? 'flex' : 'none' }"><text>V</text></view>
        <view class="msg-bubble" :class="msg.role">
          <text class="msg-text">{{ msg.content }}</text>
          <text class="msg-time">{{ msg.time }}</text>
        </view>
        <view class="msg-avatar user" :style="{ display: msg.role==='user' ? 'flex' : 'none' }"><text>{{ userInitial }}</text></view>
      </view>
      <view class="msg-row assistant" :style="{ display: isTyping ? 'flex' : 'none' }">
        <view class="msg-avatar ai"><text>V</text></view>
        <view class="msg-bubble assistant typing">
          <view class="dot-anim"><view class="dot d1"/><view class="dot d2"/><view class="dot d3"/></view>
        </view>
      </view>
      <view style="height:20rpx" />
    </scroll-view>
    <view class="input-bar">
      <view class="input-wrap">
        <input class="chat-input" v-model="inputText" :placeholder="text.placeholder" placeholder-class="chat-ph" :adjust-position="true" @confirm="sendMessage" />
        <view class="send-btn" :class="{ active: inputText.trim() }" @tap="sendMessage">
          <text class="send-icon">↑</text>
        </view>
      </view>
    </view>
    <view class="tabbar" :style="{ paddingBottom: safeBottom + 'px' }">
      <view v-for="(tab,i) in tabList" :key="i" class="tab-item" @tap="onTab(i,tab)">
        <text class="tab-icon" :class="{ active: currentTab===i }">{{ tab.icon }}</text>
        <text class="tab-lbl" :class="{ active: currentTab===i }">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import { useStore } from '../../utils/store.js';
import { t, useI18n } from '../../utils/i18n.js';
import { chatWithAgent } from '../../utils/api-service.js';
import { getUserId } from '../../utils/api.js';

const { getters } = useStore();
useI18n();
const statusBarHeight = ref(44);
const safeBottom = ref(0);
const inputText = ref('');
const isTyping = ref(false);
const scrollTop = ref(0);
const messages = ref([]);
const currentTab = ref(1);
const userInitial = ref('我');

const text = computed(() => ({
  title: t('aiChat.title'),
  clear: t('aiChat.clear'),
  emptyTitle: t('aiChat.emptyTitle'),
  emptyDesc: t('aiChat.emptyDesc'),
  placeholder: t('aiChat.placeholder'),
  fallbackReply: t('aiChat.fallbackReply'),
  clearTitle: t('aiChat.clearTitle'),
  clearConfirm: t('aiChat.clearConfirm'),
  tabHealth: t('common.health'),
  tabAiChat: t('common.aiChat'),
  tabProfile: t('common.profile')
}));

const quickQuestions = computed(() => ([
  t('aiChat.quick1'),
  t('aiChat.quick2'),
  t('aiChat.quick3'),
  t('aiChat.quick4'),
  t('aiChat.quick5')
]));
const tabList = computed(() => ([
  { text:text.value.tabHealth, icon:'♥', path:'/pages/index/index' },
  { text:text.value.tabAiChat, icon:'✦', path:'/pages/ai-chat/index' },
  { text:text.value.tabProfile, icon:'⊙', path:'/pages/profile/index' },
]));

const getTime = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
const scrollToBottom = () => nextTick(() => { scrollTop.value = 99999; });

const sendMessage = async () => {
  const textValue = inputText.value.trim();
  if (!textValue || isTyping.value) return;
  
  const userId = getUserId();
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  inputText.value = '';
  messages.value.push({ role: 'user', content: textValue, time: getTime() });
  scrollToBottom();
  isTyping.value = true;
  
  try {
    // 调用 Agent 对话接口
    const response = await chatWithAgent(userId, textValue);
    
    if (response.content) {
      messages.value.push({ 
        role: 'assistant', 
        content: response.content, 
        time: getTime(),
        health_score: response.health_score,
        context_used: response.context_used
      });
    } else {
      messages.value.push({ 
        role: 'assistant', 
        content: text.value.fallbackReply, 
        time: getTime() 
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    messages.value.push({ 
      role: 'assistant', 
      content: text.value.fallbackReply, 
      time: getTime() 
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const sendQuick = (q) => { inputText.value = q; sendMessage(); };
const clearChat = () => { uni.showModal({ title: text.value.clearTitle, content: text.value.clearConfirm, success: (res) => { if (res.confirm) messages.value = []; } }); };
const onTab = (i, tab) => { currentTab.value = i; if (tab.path !== '/pages/ai-chat/index') uni.redirectTo({ url: tab.path }); };

onMounted(() => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 44;
  safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom || 0 : 0;
  const user = getters.userInfo();
  userInitial.value = user.name ? user.name.slice(0,1) : '我';
});
</script>

<style lang="scss" scoped>
.page { height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; overflow: hidden; }
.status-bar { background: #fff; flex-shrink: 0; }
.navbar { flex-shrink: 0; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.08);
  .navbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 28rpx; }
  .navbar-title { font-size: 30rpx; font-weight: 700; color: #1C1C1E; }
  .clear-btn { padding: 10rpx 20rpx; border-radius: 9999rpx; background: #F2F2F7; }
  .clear-txt { font-size: 24rpx; color: #8E8E93; }
}
.quick-scroll { flex-shrink: 0; background: #fff; padding: 16rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.06);
  .quick-list { display: flex; gap: 12rpx; padding: 0 20rpx;
    .quick-tag { display: inline-flex; padding: 12rpx 24rpx; background: #EFF6FF; border-radius: 9999rpx; flex-shrink: 0;
      .qt-txt { font-size: 24rpx; color: #007AFF; white-space: nowrap; }
    }
  }
}
.msg-list { flex: 1; padding: 24rpx 20rpx;
  .empty-chat { display: flex; flex-direction: column; align-items: center; padding: 80rpx 40rpx; gap: 20rpx;
    .ec-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: linear-gradient(135deg,#007AFF,#34C759); display: flex; align-items: center; justify-content: center;
      .ec-av-txt { font-size: 56rpx; font-weight: 900; color: #fff; }
    }
    .ec-title { font-size: 32rpx; font-weight: 700; color: #1C1C1E; text-align: center; }
    .ec-desc  { font-size: 26rpx; color: #8E8E93; text-align: center; line-height: 1.7; }
  }
  .msg-row { display: flex; align-items: flex-end; gap: 12rpx; margin-bottom: 24rpx;
    &.user { flex-direction: row-reverse; }
    .msg-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 700; flex-shrink: 0;
      &.ai   { background: linear-gradient(135deg,#007AFF,#34C759); color: #fff; }
      &.user { background: #007AFF; color: #fff; }
    }
    .msg-bubble { max-width: 68%; padding: 20rpx 24rpx; border-radius: 24rpx; display: flex; flex-direction: column; gap: 8rpx;
      &.assistant, &.assistant_streaming { background: #fff; border-bottom-left-radius: 6rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
        .msg-text { color: #1C1C1E; } .msg-time { color: #8E8E93; }
      }
      &.user { background: #007AFF; border-bottom-right-radius: 6rpx;
        .msg-text { color: #fff; } .msg-time { color: rgba(255,255,255,0.6); }
      }
      &.typing { padding: 20rpx 28rpx; }
      .msg-text { font-size: 28rpx; line-height: 1.7; }
      .msg-time { font-size: 20rpx; align-self: flex-end; }
    }
  }
  .dot-anim { display: flex; gap: 8rpx; align-items: center;
    .dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #C7C7CC;
      &.d1 { animation: dot-bounce 1s ease-in-out infinite 0s; }
      &.d2 { animation: dot-bounce 1s ease-in-out infinite 0.2s; }
      &.d3 { animation: dot-bounce 1s ease-in-out infinite 0.4s; }
    }
  }
}
.input-bar { flex-shrink: 0; background: #fff; border-top: 1rpx solid rgba(0,0,0,0.08); padding: 16rpx 20rpx;
  .input-wrap { display: flex; align-items: center; gap: 16rpx;
    .chat-input { flex: 1; background: #F2F2F7; border-radius: 9999rpx; padding: 20rpx 28rpx; font-size: 28rpx; color: #1C1C1E; min-height: 80rpx; }
    .chat-ph { color: #C7C7CC; }
    .send-btn { width: 80rpx; height: 80rpx; border-radius: 50%; background: #F2F2F7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      &.active { background: #007AFF; }
      .send-icon { font-size: 32rpx; color: #8E8E93; font-weight: 700; }
      &.active .send-icon { color: #fff; }
    }
  }
}
.tabbar { flex-shrink: 0; background: rgba(249,249,249,0.92); backdrop-filter: blur(20px); border-top: 1rpx solid rgba(0,0,0,0.08); display: flex;
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0 8rpx; gap: 4rpx;
    .tab-icon { font-size: 36rpx; color: #8E8E93; &.active { color: #007AFF; } }
    .tab-lbl { font-size: 18rpx; color: #8E8E93; font-weight: 500; &.active { color: #007AFF; font-weight: 600; } }
  }
}
@keyframes dot-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8rpx); } }
</style>
