import type { JungTypeId } from "@/lib/jungType";

export type TypeBaseline = {
  id: string;
  labelZh: string;
  sampleSize: number;
  year: number;
  sourceLabel: string;
  sourceUrl: string;
  noteZh: string;
  shares: Record<JungTypeId, number>; // 0..1
};

export type TypeBaselineRow = {
  type: JungTypeId;
  share: number;
  rank: number;
};

// Source:
// The Myers-Briggs Company, MBTI Manual Global Supplement Series
// "China (Simplified Chinese) Supplement to the MBTI Manual for the Global Step I and Step II Assessments" (2018), Table 3.
// https://www.themyersbriggs.com/-/media/Myers-Briggs/Files/Manual-Supplements/MBTIGlobalManualSuppCNS.pdf
export const BASELINE_CN_SIMPLIFIED_2018: TypeBaseline = {
  id: "cn_simplified_2018",
  labelZh: "全国基线（中国简体样本）",
  sampleSize: 521,
  year: 2018,
  sourceLabel: "Myers-Briggs Global Manual Supplement (China Simplified Chinese)",
  sourceUrl:
    "https://www.themyersbriggs.com/-/media/Myers-Briggs/Files/Manual-Supplements/MBTIGlobalManualSuppCNS.pdf",
  noteZh: "该基线为工作年龄样本的类型分布，不等同于人口普查；用于对比参考。",
  shares: {
    ISTJ: 0.184,
    ISFJ: 0.04,
    INFJ: 0.018,
    INTJ: 0.044,
    ISTP: 0.079,
    ISFP: 0.058,
    INFP: 0.033,
    INTP: 0.048,
    ESTP: 0.086,
    ESFP: 0.029,
    ENFP: 0.033,
    ENTP: 0.04,
    ESTJ: 0.18,
    ESFJ: 0.044,
    ENFJ: 0.042,
    ENTJ: 0.044,
  },
};

export const DEFAULT_TYPE_BASELINE = BASELINE_CN_SIMPLIFIED_2018;

export function getBaselineRows(baseline: TypeBaseline): TypeBaselineRow[] {
  return (Object.keys(baseline.shares) as JungTypeId[])
    .map((type) => ({ type, share: baseline.shares[type] }))
    .sort((a, b) => b.share - a.share || a.type.localeCompare(b.type))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

