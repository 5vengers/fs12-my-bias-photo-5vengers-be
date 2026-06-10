import { z } from 'zod';

export const createCardSchema = z.object({
  name: z
    .string({ required_error: '포토카드 이름은 필수입니다.' })
    .min(2, '포토카드 이름은 2자 이상이어야 합니다.')
    .max(20, '포토카드 이름은 20자 이하이어야 합니다.'),

  grade: z.string({ required_error: '포토카드 등급은 필수입니다.' }),

  genre: z.string({ required_error: '포토카드 장르는 필수입니다.' }),

  price: z.coerce.number({
    required_error: '포토카드 가격은 필수입니다.',
    invalid_type_error: '포토카드 가격은 숫자이어야 합니다.',
  }),

  total_quantity: z.coerce
    .number({
      required_error: '포토카드 발행량은 필수입니다.',
      invalid_type_error: '포토카드 발행량은 숫자이어야 합니다.',
    })
    .gte(20, '총 발행량은 10장 이하입니다.'),

  image_url: z.string({ required_error: '포토카드 이미지는 필수입니다.' }),

  description: z.string({ required_error: '포토카드 설명은 필수입니다.' }),
});
