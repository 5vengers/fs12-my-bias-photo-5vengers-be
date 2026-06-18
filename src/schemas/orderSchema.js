import { z } from 'zod';

export const purchaseSchema = z.object({
  quantity: z.coerce
    .number()
    .int('구매 수량은 정수여야 합니다.')
    .positive('구매 수량은 1장 이상이어야 합니다.'),
});
