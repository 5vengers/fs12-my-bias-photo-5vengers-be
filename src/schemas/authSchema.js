import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: '이메일은 필수입니다.' })
    .email('이메일 형식이 올바르지 않습니다.'),

  password: z
    .string({ required_error: '비밀번호는 필수입니다.' })
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(20, '비밀번호는 20자 이하이어야 합니다.'),

  nickname: z
    .string({ required_error: '닉네임은 필수입니다.' })
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하이어야 합니다.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: '이메일은 필수입니다.' })
    .email('이메일 형식이 올바르지 않습니다.'),

  password: z.string({ required_error: '비밀번호는 필수입니다.' }),
});

/**
 * Google OAuth 콜백 쿼리 파라미터 검증 스키마
 *
 * Google이 콜백으로 전달하는 파라미터 두 가지 케이스:
 *  - 성공: ?code=xxx&state=yyy   → code로 access_token 교환
 *  - 실패: ?error=access_denied  → 사용자 취소 또는 Google 측 에러
 *
 * code와 error는 동시에 올 수 없고, 둘 중 하나는 반드시 존재해야 유효한 콜백.
 * refine XOR 조건으로 강제: code만 있거나 error만 있어야 통과.
 */
export const googleCallbackSchema = z
  .object({
    code: z.string().optional(),
    error: z.string().optional(), // 사용자 취소 시: 'access_denied'
    state: z.string().optional(), // CSRF 방지용 (Passport가 자동 검증)
  })
  .refine((data) => Boolean(data.code) !== Boolean(data.error), {
    message: '잘못된 OAuth 콜백 요청입니다.',
  });
