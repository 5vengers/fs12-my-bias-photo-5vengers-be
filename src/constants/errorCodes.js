// BE에서 사용하는 에러 코드 문자열을 한곳에 모아 관리
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 입력값 형식이나 필수값 검증 실패
  UNAUTHORIZED: 'UNAUTHORIZED', // 로그인 or 유효한 인증 토큰 필요
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 예상하지 못한 서버 내부 오류
  NOT_FOUND: 'NOT_FOUND', // 요청한 API 경로를 찾을 수 없음
};
