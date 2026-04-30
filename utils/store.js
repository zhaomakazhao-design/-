/**
 * VitalAI - 前端全局状态管理 (AgentState)
 * 遵循 LangGraph 状态机设计原则
 * 数据流: 感知(Task1) -> 编码(Task2/4) -> 认知(Task5) -> 行动(展示报告)
 */

import { reactive } from 'vue';
import { formatTime } from './health.js';

// ============================================================
// 全局 AgentState
// ============================================================
const state = reactive({

  // 蓝牙实时数据
  ble: {
    connected: false,
    deviceName: ''
  },
  latestVitals: {},

  // 用户基础信息
  user: {
    id: '',
    name: '',
    chrono_age: null,
    actual_age: null,  // 实际年龄（用于face分析）
    gender: '',
    height: null,
    weight: null,
    medical_history: ''
  },

  // 认证信息
  auth: {
    token: '',
    isLoggedIn: false
  },

  // Task1 采集状态
  collection: {
    face: {
      status: 'idle',   // idle|collecting|done|uploaded|analyzing
      photos: { front: null, left: null, right: null, top: null },
      batch_id: null,
      uploaded_at: null
    },
    physiology: {
      status: 'idle',   // idle|connecting|connected|collecting|done|uploaded
      device_name: '',
      device_connected: false,
      raw: {
        hr: null, spo2: null, sbp: null, dbp: null,
        resp: null, hrv: null, rmssd: null, lf_hf: null,
        temp: null, room_temp: null
      },
      collected_at: null
    },
    report: {
      status: 'idle',   // idle|uploading|ocr_processing|done
      images: [],
      session_id: null,
      ocr_task_id: null,
      uploaded_at: null
    },
    genomics: {
      status: 'idle',   // idle|loading|ready|unavailable
      available: false
    }
  },

  // Task2 回传: 面部视觉分析结果
  task2: {
    status: 'idle',     // idle|pending|done|error
    CAD_Risk_Score: null,  // 冠心病高危概率 0-1
    FaceAge: null,         // 预测生物学年龄
    Aging_Index: null,     // 衰老超龄指数 = FaceAge - chrono_age
    confidence: null,
    analyzed_at: null
  },

  // Task4 回传: OCR结构化报告 + 基因组学特征
  task4: {
    status: 'idle',
    report_structured: {
      basic: {},
      lab: {
        blood_routine: null, urine_routine: null,
        liver_function: null, kidney_function: null,
        blood_glucose: null, blood_lipid: null
      },
      auxiliary: {
        ecg: null, ultrasound: null, chest_xray: null,
        ophthalmology: null, ent: null, physical_exam: null
      }
    },
    genomics_features: {
      PRS_CAD: null,         // 冠心病多基因风险评分
      PRS_aging: null,       // 衰老相关基因风险
      CDK6_status: null,     // 细胞周期基因CDK6
      pharmacogenomics: null,// 药物代谢特性
      confidence: null
    },
    analyzed_at: null
  },

  // Task5 回传: 多智能体综合报告
  task5: {
    status: 'idle',
    health_score: null,
    bio_age: null,
    report_text: '',
    intervention_plan: { exercise: '', diet: '', medication: '' },
    risk_summary: '',
    expert_drafts: {
      face_expert: '',
      physio_expert: '',
      clinical_expert: '',
      genomics_expert: ''
    },
    generated_at: null
  },

  // AI 问答
  chat: { messages: [], current_query: '' }
});

// ============================================================
// Mutations
// ============================================================
export const mutations = {
  setUser(info) { Object.assign(state.user, info); },

  setAuthToken(token) { 
    state.auth.token = token;
    state.auth.isLoggedIn = !!token;
    if (token) uni.setStorageSync('auth_token', token);
  },

  logout() {
    state.auth.token = '';
    state.auth.isLoggedIn = false;
    state.user = { id: '', name: '', chrono_age: null, gender: '', height: null, weight: null, medical_history: '' };
    state.collection = { face: { status: 'idle', photos: { front: null, left: null, right: null, top: null }, batch_id: null, uploaded_at: null }, physiology: { status: 'idle', device_name: '', device_connected: false, raw: { hr: null, spo2: null, sbp: null, dbp: null, resp: null, hrv: null, rmssd: null, lf_hf: null, temp: null, room_temp: null }, collected_at: null }, report: { status: 'idle', images: [], session_id: null, ocr_task_id: null, uploaded_at: null }, genomics: { status: 'idle', available: false } };
    state.task2 = { status: 'idle', CAD_Risk_Score: null, FaceAge: null, Aging_Index: null, confidence: null, analyzed_at: null };
    state.task4 = { status: 'idle', report_structured: { basic: {}, lab: { blood_routine: null, urine_routine: null, liver_function: null, kidney_function: null, blood_glucose: null, blood_lipid: null }, auxiliary: { ecg: null, ultrasound: null, chest_xray: null, ophthalmology: null, ent: null, physical_exam: null } }, genomics_features: { PRS_CAD: null, PRS_aging: null, CDK6_status: null, pharmacogenomics: null, confidence: null }, analyzed_at: null };
    state.task5 = { status: 'idle', health_score: null, bio_age: null, report_text: '', intervention_plan: { exercise: '', diet: '', medication: '' }, risk_summary: '', expert_drafts: { face_expert: '', physio_expert: '', clinical_expert: '', genomics_expert: '' }, generated_at: null };
    state.chat = { messages: [], current_query: '' };
    uni.removeStorageSync('auth_token');
  },

  // 蓝牙实时数据
  setLatestVitals(vitals) {
    state.latestVitals = { ...vitals };
    // 同步到 physiology.raw
    state.collection.physiology.raw.hr       = vitals.hr;
    state.collection.physiology.raw.spo2     = vitals.spo2;
    state.collection.physiology.raw.sbp      = vitals.sbp;
    state.collection.physiology.raw.dbp      = vitals.dbp;
    state.collection.physiology.raw.resp     = vitals.rr;
    state.collection.physiology.raw.hrv      = vitals.sdnn;
    state.collection.physiology.raw.rmssd    = vitals.rmssd;
    state.collection.physiology.raw.temp     = vitals.bodyTemp;
    state.collection.physiology.raw.room_temp = vitals.predTemp;
  },

  setBleConnected(connected, deviceName = '') {
    state.ble.connected = connected;
    state.ble.deviceName = deviceName;
    if (connected) {
      state.collection.physiology.status = 'connected';
      state.collection.physiology.device_name = deviceName;
      state.collection.physiology.device_connected = true;
    } else {
      state.collection.physiology.device_connected = false;
      if (state.collection.physiology.status === 'connected') {
        state.collection.physiology.status = 'idle';
      }
    }
  },

  setFacePhoto(angle, filePath) {
    state.collection.face.photos[angle] = { filePath, timestamp: Date.now() };
    const allDone = Object.values(state.collection.face.photos).every(p => p !== null);
    state.collection.face.status = allDone ? 'done' : 'collecting';
  },

  setFaceStatus(status, batchId = null) {
    state.collection.face.status = status;
    if (batchId) state.collection.face.batch_id = batchId;
    if (status === 'uploaded') state.collection.face.uploaded_at = formatTime();
  },

  setPhysiologyRaw(raw) { Object.assign(state.collection.physiology.raw, raw); },

  setPhysiologyStatus(status, deviceName = '') {
    state.collection.physiology.status = status;
    if (deviceName) state.collection.physiology.device_name = deviceName;
    state.collection.physiology.device_connected = status === 'connected' || status === 'collecting' || status === 'done';
    if (status === 'done') state.collection.physiology.collected_at = formatTime();
  },

  addReportImage(filePath) { state.collection.report.images.push(filePath); },
  removeReportImage(i) { state.collection.report.images.splice(i, 1); },

  setReportStatus(status, ids = {}) {
    state.collection.report.status = status;
    if (ids.session_id) state.collection.report.session_id = ids.session_id;
    if (ids.ocr_task_id) state.collection.report.ocr_task_id = ids.ocr_task_id;
    if (status === 'done') state.collection.report.uploaded_at = formatTime();
  },

  setTask2Result(r) {
    Object.assign(state.task2, {
      status: 'done',
      CAD_Risk_Score: r.CAD_Risk_Score,
      FaceAge: r.FaceAge,
      Aging_Index: r.Aging_Index,
      confidence: r.confidence ?? 1,
      analyzed_at: formatTime()
    });
  },

  setTask4Result(r) {
    state.task4.status = 'done';
    if (r.report_structured) Object.assign(state.task4.report_structured, r.report_structured);
    if (r.genomics_features) Object.assign(state.task4.genomics_features, r.genomics_features);
    state.task4.analyzed_at = formatTime();
  },

  setTask5Result(r) {
    Object.assign(state.task5, {
      status: 'done',
      health_score: r.health_score,
      bio_age: r.bio_age,
      report_text: r.report_text,
      intervention_plan: r.intervention_plan || {},
      risk_summary: r.risk_summary,
      expert_drafts: r.expert_drafts || {},
      generated_at: formatTime()
    });
  },

  addChatMessage(role, content) {
    state.chat.messages.push({ role, content, time: formatTime() });
  },

  appendChatChunk(chunk) {
    const msgs = state.chat.messages;
    if (msgs.length > 0 && msgs[msgs.length-1].role === 'assistant_streaming') {
      msgs[msgs.length-1].content += chunk;
    } else {
      msgs.push({ role: 'assistant_streaming', content: chunk, time: formatTime() });
    }
  },

  finalizeChatStream() {
    const msgs = state.chat.messages;
    if (msgs.length > 0 && msgs[msgs.length-1].role === 'assistant_streaming') {
      msgs[msgs.length-1].role = 'assistant';
    }
  },

  clearChat() { state.chat.messages = []; }
};

// ============================================================
// Getters
// ============================================================
export const getters = {
  isLoggedIn: () => state.auth.isLoggedIn,
  
  collectionContext: () => ({
    has_face:     ['done','uploaded','analyzing'].includes(state.collection.face.status),
    has_physio:   ['done','uploaded'].includes(state.collection.physiology.status),
    has_report:   state.collection.report.status === 'done',
    has_genomics: state.collection.genomics.available,
    detections: state.task5.status === 'done' ? [{ type: 'full', date: state.task5.generated_at, score: state.task5.health_score }] : []
  }),

  healthContext: () => ({
    chrono_age:     state.user.chrono_age,
    CAD_Risk_Score: state.task2.CAD_Risk_Score,
    FaceAge:        state.task2.FaceAge,
    Aging_Index:    state.task2.Aging_Index,
    physiology:     state.collection.physiology.raw,
    report_lab:     state.task4.report_structured.lab,
    PRS_CAD:        state.task4.genomics_features.PRS_CAD
  }),

  // 页面展示用的计算数据
  userInfo: () => ({
    name: state.user.name || '赵胜彬',
    age: state.user.chrono_age || 28,
    gender: state.user.gender || '男',
    height: state.user.height || 175,
    weight: state.user.weight || 68,
    bmi: state.user.height && state.user.weight ? (state.user.weight / ((state.user.height/100)**2)).toFixed(1) : 22.2
  }),

  collectionStatus: () => ({
    face: state.collection.face.status === 'done' || state.collection.face.status === 'uploaded' ? '已采集' : '未采集',
    physio: state.collection.physiology.status === 'done' || state.collection.physiology.status === 'uploaded' ? '已连接' : '未连接',
    report: state.collection.report.status === 'done' ? '已上传' : '未上传',
    genomics: state.collection.genomics.available ? '医院提供' : '待接入'
  }),

  healthMetrics: () => {
    const raw = state.collection.physiology.raw;
    return [
      { key: 'cv',     icon: '♥', name: '心血管',   score: state.task2.CAD_Risk_Score ? Math.round((1 - state.task2.CAD_Risk_Score) * 100) : 85, color: '#FF6B9D' },
      { key: 'resp',   icon: '◉', name: '血氧代谢', score: raw.spo2 ? Math.round(raw.spo2) : 92, color: '#00E5B4' },
      { key: 'stress', icon: '⧖', name: '压力指数', score: raw.hrv ? Math.round(raw.hrv / 10) : 68, color: '#FF9A3C' },
      { key: 'age',    icon: '⬡', name: '抗衰指数', score: state.task2.FaceAge ? Math.round((1 - (state.task2.FaceAge - state.user.chrono_age) / 10) * 100) : 88, color: '#A78BFA' },
      { key: 'sleep',  icon: '◌', name: '睡眠质量', score: 75, color: '#3D8EFF' },
      { key: 'immune', icon: '✦', name: '免疫功能', score: 80, color: '#00E5B4' },
    ];
  },

  healthScore: () => state.task5.status === 'done' ? state.task5.health_score : null,

  bioAge: () => state.task2.status === 'done' ? state.task2.FaceAge : null,

  recentVitals: () => {
    const raw = state.collection.physiology.raw;
    const items = [
      { key:'hr',   name:'心率',  val: raw.hr   ? String(raw.hr)                : null, unit:'bpm',  color:'#FF6B9D' },
      { key:'spo2', name:'血氧',  val: raw.spo2 ? String(raw.spo2)              : null, unit:'%',    color:'#00E5B4' },
      { key:'sbp',  name:'血压',  val: raw.sbp  ? String(raw.sbp)               : null, unit:'mmHg', color:'#3D8EFF' },
      { key:'hrv',  name:'HRV',  val: raw.hrv  ? String(Math.round(raw.hrv))   : null, unit:'ms',   color:'#A78BFA' },
    ];
    return items.filter(v => v.val !== null);
  }
};

export const useStore = () => ({ state, mutations, getters });

// 初始化：检查本地存储的登录状态
export const initAuth = () => {
  const token = uni.getStorageSync('auth_token');
  const userInfo = uni.getStorageSync('user_info');
  if (token) {
    state.auth.token = token;
    state.auth.isLoggedIn = true;
  }
  if (userInfo && userInfo.name) {
    // 将本地用户信息加载到 state，并将 chrono_age 映射到 actual_age
    Object.assign(state.user, userInfo);
    // 确保 actual_age 有值（从 chrono_age 映射）
    if (userInfo.chrono_age && !state.user.actual_age) {
      state.user.actual_age = userInfo.chrono_age;
    }
    console.log('🔐 已加载本地用户信息:', {
      name: state.user.name,
      actual_age: state.user.actual_age,
      chrono_age: state.user.chrono_age
    });
  }
};

export default state;
