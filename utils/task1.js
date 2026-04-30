/**
 * VitalAI - Task 1: 前端数据采集与边缘计算模块
 * 负责人: 赵胜彬（前端）、张恒瑞（后端/传感器）
 *
 * 数据流向:
 *   本模块 → Task2（面部图像 + 实际年龄）
 *   本模块 → Task4（报告单图片 + 基因组学信息）
 *   本模块 → Task5（生理信号 + 自然语言Query）
 *   Task2/4/5 → 本模块（服务器下发处理结果）
 */

import { uploadFile, request } from './api.js';

// ============================================================
// 1.1 面部图像采集与上传
// 输出给: Task 2 (Face-CV)
// ============================================================

/**
 * 上传面部图片到 OSS / 文件服务器，返回可访问 URL
 * 约定后端返回任一字段即可：image_url / file_url / url / image_path
 * @param {string} filePath 本地临时文件路径
 * @returns {Promise<string>} 网络图片 URL
 */
export async function uploadFaceImageAsset(filePath) {
  const res = await uploadFile('/task1/face/image-upload', filePath, 'image', {
    scene: 'facecv',
    format: 'jpg'
  });
  const imageUrl = res?.image_url || res?.file_url || res?.url || res?.image_path;
  if (!imageUrl) {
    throw new Error('上传成功但未返回图片 URL');
  }
  return imageUrl;
}

/**
 * 上传面部图像（FaceCV 接口规范）
 * 请求体示例:
 * {
 *   request_id,
 *   user_query,
 *   facecv_data: { Gender, RealAge },
 *   image_path
 * }
 * @param {string} imagePath OSS 返回的网络 URL 或 Base64
 * @param {{gender?: string, chronoAge?: number|string, userQuery?: string, requestId?: string}} options
 */
export async function uploadFaceImages(imagePath, options = {}) {
  const payload = {
    request_id: options.requestId || `face-${Date.now()}`,
    user_query: options.userQuery || '请结合 FaceCV 数据进行心血管风险筛查，并在有图片时补充皮肤和疲劳分析。',
    facecv_data: {
      Gender: options.gender || '',
      RealAge: options.chronoAge ?? ''
    },
    image_path: imagePath
  };
  return request('/task1/face/upload', 'POST', payload);
}

/**
 * 查询面部分析结果（Task2 处理完毕后回传）
 * 返回数据结构:
 *   CAD_Risk_Score: number (0-1)  冠心病高危概率
 *   FaceAge: number               预测生物学年龄
 *   Aging_Index: number           衰老超龄指数 = FaceAge - 实际年龄
 * @param {string} batchId
 */
export async function getFaceAnalysisResult(batchId) {
  return request(`/task2/face/result?batch_id=${batchId}`);
}

// ============================================================
// 1.2 生理信号数据上传（外部硬件采集）
// 输出给: Task 5 (MAS)
// ============================================================

/**
 * 构建生理信号数据包
 * 字段来自外部硬件设备，由张恒瑞负责蓝牙/串口协议对接
 * @param {object} raw 硬件采集的原始数值
 * @returns {PhysiologyPayload}
 */
export function buildPhysiologyPayload(raw) {
  return {
    timestamp: Date.now(),
    heart_rate: {
      value: raw.hr,              // 心率 (bpm)
      normal_range: [60, 100]
    },
    spo2: {
      value: raw.spo2,            // 血氧饱和度 (%)
      normal_range: [95, 100]
    },
    blood_pressure: {
      systolic: raw.sbp,          // 收缩压 (mmHg)
      diastolic: raw.dbp,         // 舒张压 (mmHg)
      normal_range_sys: [90, 140],
      normal_range_dia: [60, 90]
    },
    respiration_rate: {
      value: raw.resp,            // 呼吸率 (次/min)
      normal_range: [12, 20]
    },
    hrv: {
      value: raw.hrv,             // HRV 心率变异性 (ms)
      rmssd: raw.rmssd || null,   // 副交感指标
      lf_hf_ratio: raw.lf_hf || null, // 交感平衡 LF/HF
      normal_range: [20, 80]
    },
    body_temperature: {
      value: raw.temp,            // 体温 (°C)
      normal_range: [36.0, 37.3]
    },
    room_temperature: {
      value: raw.room_temp        // 室温 (°C)
    }
  };
}

/**
 * 上传生理信号数据到服务器
 * @param {object} raw 硬件原始数值
 * @param {string} query 用户自然语言描述（可选）
 * @returns {Promise}
 */
export async function uploadPhysiology(raw, query = '') {
  const payload = buildPhysiologyPayload(raw);
  return request('/task1/physiology/upload', 'POST', {
    physiology: payload,
    user_query: query,   // 自然语言 Query → Task 5
    collected_at: formatTime()
  });
}

// ============================================================
// 1.3 体检报告图片上传
// 输出给: Task 4 (NLP/OCR)
// ============================================================

/**
 * 上传体检报告图片（支持多张）
 * @param {string[]} filePaths 本地图片路径数组
 * @param {object} basicInfo 基础信息表单
 *   basicInfo.age    实际年龄（以此为准，不用报告单年龄）
 *   basicInfo.gender 性别
 *   basicInfo.height 身高(cm)
 *   basicInfo.weight 体重(kg)
 *   basicInfo.history 既往病史
 * @returns {Promise<{ocr_task_id: string}>}
 */
export async function uploadMedicalReports(filePaths, basicInfo) {
  // 先上传基础信息
  const session = await request('/task1/report/session', 'POST', {
    chrono_age: basicInfo.age,      // 实际年龄 → Task2 & Task4
    gender: basicInfo.gender,
    height: basicInfo.height,
    weight: basicInfo.weight,
    medical_history: basicInfo.history,
    report_count: filePaths.length
  });

  // 逐张上传报告图片
  const sessionId = session.session_id;
  const uploads = [];
  for (let i = 0; i < filePaths.length; i++) {
    const res = await uploadFile(
      '/task4/report/upload',
      filePaths[i],
      'report_image',
      {
        session_id: sessionId,
        page_index: i,             // 页码索引
        total_pages: filePaths.length
      }
    );
    uploads.push(res);
  }
  return { session_id: sessionId, uploads, ocr_task_id: session.ocr_task_id };
}

/**
 * 查询 OCR 识别结果（Task4 处理完后回传）
 * OCR 识别字段包括:
 *   基础体征: 身高、体重
 *   检验指标: 血常规、尿常规、肝功能、肾功能、血糖、血脂
 *   辅助检查: 心电图、超声、胸部X线、眼科、耳鼻喉、体格检查
 * @param {string} ocrTaskId
 */
export async function getOCRResult(ocrTaskId) {
  return request(`/task4/report/result?task_id=${ocrTaskId}`);
}

// ============================================================
// 1.4 基因组学信息查询
// 数据来源: 医院上传至服务器，由 Task4 管理
// ============================================================

/**
 * 获取基因组学数据状态与展示数据
 * 数据字段包括:
 *   DNA测序序列、转录组学(RNA)
 *   蛋白质组学、表观基因组(甲基化)
 *   代谢组学、SNPs位点
 *   PRS多基因风险评分
 *   药物基因组学特性
 * @param {string} userId
 */
export async function getGenomicsData(userId) {
  return request(`/task4/genomics/data?user_id=${userId}`);
}

// ============================================================
// 1.5 自然语言 Query 发送
// 输出给: Task 5 (MAS 多智能体中枢)
// ============================================================

/**
 * 发送自然语言健康问询（SSE 流式响应）
 * @param {string} query 用户自然语言问题
 * @param {object} context 当前已采集的上下文数据
 *   context.has_face    是否已上传面部图像
 *   context.has_physio  是否已采集生理信号
 *   context.has_report  是否已上传体检报告
 *   context.has_genomics 是否有基因组数据
 * @param {Function} onChunk SSE 流式回调，每次收到片段调用
 * @param {Function} onDone  完成回调
 */
export function sendHealthQuery(query, context, onChunk, onDone) {
  // uni-app 中通过 EventSource 或 uni.request 轮询实现 SSE
  // 实际 SSE 对接由张恒瑞完成后端接口
  const requestTask = uni.request({
    url: `${BASE_URL}/api/v1/task5/query`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${uni.getStorageSync('vitalai_token') || ''}`
    },
    data: {
      query,
      context,
      stream: true,
      timestamp: Date.now()
    },
    enableChunked: true, // uni-app 分块接收
    success: (res) => onDone && onDone(res.data),
    fail: (err) => console.error('[Task5 Query Error]', err)
  });

  // 分块数据处理
  requestTask.onChunkReceived && requestTask.onChunkReceived((chunk) => {
    try {
      const text = new TextDecoder().decode(chunk.data);
      const lines = text.split('\n').filter(l => l.startsWith('data:'));
      lines.forEach(line => {
        const json = JSON.parse(line.replace('data:', '').trim());
        onChunk && onChunk(json);
      });
    } catch (e) {
      // 非 JSON 行跳过
    }
  });

  return requestTask;
}

// ============================================================
// 1.6 获取服务器下发的综合健康报告
// 来源: Task5 生成 → Task3 路由下发 → 前端展示
// ============================================================
// 详见 utils/task1-report.js
