import { z } from 'zod';

export const openPointBoxRequestSchema = z.object({
  boxId: z.string({ required_error: '박스 ID는 필수입니다.' }),
});
