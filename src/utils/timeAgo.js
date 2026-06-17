const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * createdAt 기준 한국어 상대 시간 문자열을 반환합니다.
 *
 * 구간 기준
 * - 1시간 미만       → 방금 전
 * - 1 ~ 23시간       → N시간 전
 * - 1 ~ 6일          → N일 전
 * - 1 ~ 3주          → N주일 전
 * - 4주 ~ 11개월     → N개월 전
 * - 12개월 이상      → N년 전
 *
 * @param {Date | string} createdAt
 * @returns {string}
 */
export const formatTimeAgo = (createdAt) => {
  const diff = Date.now() - new Date(createdAt).getTime();

  if (diff < HOUR) return '방금 전';

  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(diff / DAY);
  if (days < 7) return `${days}일 전`;

  const weeks = Math.floor(diff / WEEK);
  if (weeks <= 3) return `${weeks}주일 전`;

  const months = Math.floor(diff / MONTH);
  if (months < 12) return `${months}개월 전`;

  const years = Math.floor(diff / YEAR);
  return `${years}년 전`;
};

/**
 * 단어 마지막 한글 음절의 받침 유무로 주격 조사를 반환합니다.
 * 예) '앞마당' -> '이' / '여행' -> '이' / '포토' -> '가'
 *
 * @param {string} word
 * @returns {'이' | '가'}
 */
export const getSubjectParticle = (word) => {
  const lastKorean = [...word].reverse().find((c) => /[가-힣]/.test(c));
  if (!lastKorean) return '이';
  return (lastKorean.charCodeAt(0) - 0xac00) % 28 !== 0 ? '이' : '가';
};

/**
 * 단어 마지막 한글 음절의 받침 유무로 목적격 조사를 반환합니다.
 * 예) '앞마당' -> '을' / '여행' -> '을' / '포토' -> '를'
 *
 * @param {string} word
 * @returns {'을' | '를'}
 */
export const getObjectParticle = (word) => {
  const lastKorean = [...word].reverse().find((c) => /[가-힣]/.test(c));
  if (!lastKorean) return '을';
  return (lastKorean.charCodeAt(0) - 0xac00) % 28 !== 0 ? '을' : '를';
};
