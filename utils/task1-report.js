/**
 * VitalAI - Task 1: 前端数据采集与边缘计算模块（续）
 * 获取服务器下发综合结果 + 本地状态管理
 */

import { request } from './api.js';

// ============================================================
// 1.6 获取服务器下发的综合健康报告
// 来源: Task2 + Task4 + Task5 → Task3 路由 → 前端
// ============================================================

/**
 * 获取综合健康分析结果（Task3 统一下发）
 * 返回数据结构:
 * {
 *   task2_result: {
 *     CAD_Risk_Score: number,   // 冠心病高危概率 0-1
 *     FaceAge: number,          // 预测生物学年龄
 *     Aging_Index: number,      // 衰老超龄指数
 *     confidence: number        // 置信度 0-1
 *   },
 *   task4_result: {
 *     basic: { height, weight, gender, age },
 *     lab: {
 *       blood_routine: {},      // 血常规
 *       urine_routine: {},      // 尿常规
 *       liver_function: {},     // 肝功能
 *       kidney_function: {},    // 肾功能
 *       blood_glucose: {},      // 血糖
 *       blood_lipid: {}         // 血脂
 *     },
 *     auxiliary: {
 *       ecg: {},                // 心电图
 *       ultrasound: {},         // 超声检查
 *       chest_xray: {},         // 胸部X线
 *       ophthalmology: {},      // 眼科检查
 *       ent: {},                // 耳鼻喉检查
 *       physical_exam: {}       // 体格检查
 *     },
 *     confidence: number
 *   },
 *   task5_result: {
 *     health_score: number,     // 综合健康评分 0-100
 *     report_text: string,      // 综合健康报告全文
 *     intervention_plan: {
 *       exercise: string,       // 运动建议
 *       diet: string,           // 饮食建议
 *       medication: string      // 用药提示（非处方）
 *     },
 *     risk_summary: string      // 风险摘要
 *   },
 *   generated_at: string
 * }
 */
export async function getHealthReport(userId) {
  return request(`/task3/report/latest?user_id=${userId}`);
}

/**
 * 获取历史生理信号趋势数据（Task3 下发）
 * @param {string} userId
 * @param {string} metric 指标名: 'hr'|'spo2'|'sbp'|'dbp'|'hrv'
 * @param {number} days   最近N天，默认7
 */
export async function getVitalTrend(userId, metric, days = 7) {
  return request(`/task3/vitals/trend?user_id=${userId}&metric=${metric}&days=${days}`);
}

/**
 * 轮询任务状态（面部分析/OCR等异步任务）
 * @param {Function} fetchFn  查询函数
 * @param {Function} isDone   判断是否完成
 * @param {number}   interval 轮询间隔(ms)
 * @param {number}   maxTry   最大重试次数
 */
export async function pollUntilDone(fetchFn, isDone, interval = 2000, maxTry = 30) {
  for (let i = 0; i < maxTry; i++) {
    const result = await fetchFn();
    if (isDone(result)) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('任务超时，请稍后重试');
}
