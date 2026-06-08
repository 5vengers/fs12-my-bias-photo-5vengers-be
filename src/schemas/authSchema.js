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
    .min(2, '닉네임은 2자 이상이어야 합니다.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: '이메일은 필수입니다.' })
    .email('이메일 형식이 올바르지 않습니다.'),

  password: z.string({ required_error: '비밀번호는 필수입니다.' }),
});
