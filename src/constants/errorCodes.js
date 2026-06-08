// BE에서 사용하는 에러 코드 문자열을 한곳에 모아 관리
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 입력값 형식이나 필수값 검증 실패
  UNAUTHORIZED: 'UNAUTHORIZED', // 로그인 or 유효한 인증 토큰 필요
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 예상하지 못한 서버 내부 오류
  NOT_FOUND: 'NOT_FOUND', // 요청한 API 경로를 찾을 수 없음

  MARKET_LISTING_NOT_FOUND: 'MARKET_LISTING_NOT_FOUND', // 카드를 찾을 수 없을 때 (404)
  PHOTO_CARD_ALREADY_LISTED: 'PHOTO_CARD_ALREADY_LISTED', // 이미 등록된 카드일 때 (409)
  CANNOT_BUY_OWN_PHOTO_CARD: 'CANNOT_BUY_OWN_PHOTO_CARD', // 본인 카드 구매 시도 시 (409)
};
