import { z } from 'zod';

export const createExchangeSchema = z.object({
  offeredCardId: z.coerce
    .number()
    .int('교환할 카드 ID는 정수여야 합니다.')
    .positive('올바른 교환 카드 ID를 입력해주세요.'),
});
