/**
 * VitalAI - 健康数据工具函数
 */

/**
 * 健康评分分级
 * @param {number} score 0-100
 * @returns {{ label: string, color: string }}
 */
export function getScoreLevel(score) {
  if (score >= 85) return { label: '优秀', color: '#00E5B4' };
  if (score >= 70) return { label: '良好', color: '#3D8EFF' };
  if (score >= 55) return { label: '一般', color: '#FF9A3C' };
  return { label: '需关注', color: '#FF4D6D' };
}

/**
 * 心率评级
 * @param {number} bpm
 */
export function getHeartRateLevel(bpm) {
  if (bpm < 60) return { label: '偏低', color: '#3D8EFF' };
  if (bpm <= 100) return { label: '正常', color: '#00E5B4' };
  if (bpm <= 120) return { label: '偏高', color: '#FF9A3C' };
  return { label: '过高', color: '#FF4D6D' };
}

/**
 * 血氧评级
 * @param {number} spo2 百分比
 */
export function getSpO2Level(spo2) {
  if (spo2 >= 98) return { label: '优秀', color: '#00E5B4' };
  if (spo2 >= 95) return { label: '正常', color: '#3D8EFF' };
  if (spo2 >= 90) return { label: '偏低', color: '#FF9A3C' };
  return { label: '危险', color: '#FF4D6D' };
}

/**
 * 格式化时间戳
 */
export function formatTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 生物年龄评估
 * @param {number} chronoAge 实际年龄
 * @param {number} bioAge 生物年龄
 */
export function getBioAgeDiff(chronoAge, bioAge) {
  const diff = bioAge - chronoAge;
  if (diff <= -5) return { label: `年轻 ${Math.abs(diff)} 岁`, color: '#00E5B4', icon: '↓' };
  if (diff <= 0)  return { label: `年轻 ${Math.abs(diff)} 岁`, color: '#3D8EFF', icon: '↓' };
  if (diff <= 5)  return { label: `衰老 ${diff} 岁`, color: '#FF9A3C', icon: '↑' };
  return { label: `衰老 ${diff} 岁`, color: '#FF4D6D', icon: '↑' };
}
