import { z } from 'zod';
import { Genre, CardGrade } from '@prisma/client';

// zod 로 type 값 validate 처리를 관리합니다.
// strict() 으로 알 수 없는 키 값은 반환 처리합니다.
// .coerce 로 number 값 타입 불일치가 안나도록 처리합니다. (js 로 사용시 num 값 제대로 처리 안될 가능성이 있음)
export const createCardSchema = z
  .object({
    name: z
      .string({ required_error: '포토카드 이름은 필수입니다.' })
      .min(2, '포토카드 이름은 2자 이상이어야 합니다.')
      .max(20, '포토카드 이름은 20자 이하이어야 합니다.'),

    description: z.string({ required_error: '포토카드 설명은 필수입니다.' }),

    genre: z.enum(Object.values(Genre), {
      required_error: '포토카드 장르는 필수입니다.',
      invalid_type_error: '유효하지 않은 포토카드 장르입니다.',
    }),

    grade: z.enum(Object.values(CardGrade), {
      required_error: '포토카드 등급은 필수입니다.',
      invalid_type_error: '유효하지 않은 포토카드 등급입니다.',
    }),

    price: z.coerce
      .number({
        required_error: '포토카드 가격은 필수입니다.',
        invalid_type_error: '포토카드 가격은 숫자이어야 합니다.',
      })
      .gte(0, '포토카드 판매 금액은 0 이상이어야 합니다.'),

    total_quantity: z.coerce
      .number({
        required_error: '포토카드 발행량은 필수입니다.',
        invalid_type_error: '포토카드 발행량은 숫자이어야 합니다.',
      })
      .lte(10, '총 발행량은 10장 이하입니다.'),

    image_url: z.file({ required_error: '포토카드 이미지는 필수입니다.' }),
  })
  .strict();
