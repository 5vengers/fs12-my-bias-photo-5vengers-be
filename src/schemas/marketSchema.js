import { z } from 'zod';

export const createMarketItemSchema = z.object({
  my_card_id: z.coerce.number({
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

//상세조회

//수정

//삭제
