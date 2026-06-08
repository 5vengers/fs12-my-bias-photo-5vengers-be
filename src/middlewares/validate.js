import { ValidationError } from '../errors/appError.js';

/**
 * Zod 스키마로 요청 데이터를 검증하는 미들웨어 팩토리
 *
 * @param {ZodSchema} schema  - 검증에 사용할 Zod 스키마
 * @param {'body'|'query'} target - 검증할 요청 데이터 위치 (기본값: 'body')
 *
 * 기존 이메일 인증 라우트: validate(loginSchema)          → req.body 검증
 * Google OAuth 콜백 라우트: validate(googleCallbackSchema, 'query') → req.query 검증
 */
export const validate =
  (schema, target = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const message = result.error.issues[0].message;
      return next(new ValidationError(message));
    }

    // safeParse의 파싱 결과로 교체 (Zod의 타입 변환 / 기본값 적용 반영)
    req[target] = result.data;
    next();
  };
