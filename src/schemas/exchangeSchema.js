import { z } from 'zod';

export const createExchangeSchema = z.object({
  offeredCardId: z.coerce
    .number()
    .int('교환할 카드 ID는 정수여야 합니다.')
    .positive('올바른 교환 카드 ID를 입력해주세요.'),
});

export const marketItemIdParamSchema = z.object({
  itemId: z.coerce
    .number()
    .int('판매글 ID는 정수여야 합니다.')
    .positive('올바른 판매글 ID를 입력해주세요.'),
});

export const exchangeIdParamSchema = z.object({
  exchangeId: z.coerce
    .number()
    .int('교환 신청 ID는 정수여야 합니다.')
    .positive('올바른 교환 신청 ID를 입력해주세요.'),
});
