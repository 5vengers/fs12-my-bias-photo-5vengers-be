import { z } from 'zod';

export const openPointBoxSchema = z.object({
  boxNumber: z
    .number({ required_error: '상자 번호는 필수입니다.' })
    .int('상자 번호는 정수여야 합니다.')
    .min(1, '상자 번호는 1 이상이어야 합니다.')
    .max(3, '상자 번호는 3 이하여야 합니다.'),
});
