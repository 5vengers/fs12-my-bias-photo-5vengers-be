import { z } from 'zod';

export const createMarketItemSchema = z.object({
  myCardId: z.coerce.number({
    required_error: '등록할 카드 ID가 필요합니다.',
  }),
  quantity: z.coerce.number().positive('판매할 수량은 1장 이상이어야 합니다.'),
  price_per_card: z.coerce
    .number()
    .nonnegative('장당 금액은 0원 이상이어야 합니다.'),

  wanted_grade: z.string().nullable().optional(),
  wanted_genre: z.string().nullable().optional(),
  wanted_description: z.string().nullable().optional(),
});

export const itemIdParamsSchema = z.object({
  itemId: z.coerce
    .number({ invalid_type_error: '유효하지 않은 아이템 ID입니다.' })
    .int()
    .positive('아이템 ID는 양의 정수여야 합니다.'),
});

export const myCardIdParamsSchema = z.object({
  myCardId: z.coerce
    .number({ invalid_type_error: '유효하지 않은 카드 ID입니다.' })
    .int()
    .positive('카드 ID는 양의 정수여야 합니다.'),
});
