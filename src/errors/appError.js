// 서비스에서 의도적으로 발생시키는 예측 가능한 에러를 표현하는 custom error 클래스
export class AppError extends Error {
  // message: 에러 메시지, statusCode: HTTP 상태 코드, code: ERROR_CODES에서 정의한 에러 코드 문자열
  constructor(message, statusCode, code) {
    // 기존 Error 클래스에 에러 메시지 전달
    super(message);

    // 에러 클래스의 이름 설정
    this.name = 'AppError';

    // HTTP 응답에 사용할 상태 코드
    this.statusCode = statusCode;

    // FE에서 에러를 식별할 코드
    this.code = code;

    // 개발자가 예상하고 의도적으로 발생시킨 운영상 에러임을 표시
    this.isOperational = true;

    // 스택 트레이스에서 AppError 생성자 호출 부분을 제외
    Error.captureStackTrace(this, this.constructor);
  }
}
