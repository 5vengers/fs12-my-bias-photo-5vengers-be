import { z } from 'zod';
import { Genre, CardGrade } from '@prisma/client';

// zod 로 type 값 validate 처리를 관리합니다.
// strict() 으로 알 수 없는 키 값은 반환 처리합니다.
// .coerce 로 number 값 타입 불일치가 안나도록 처리합니다. (js 로 사용시 num 값 제대로 처리 안될 가능성이 있음)
export const createCardSchema = z
  .object({
    name: z
      .string({
        error: (issue) => {
          if (issue.code === 'invalid_type') {
            return '포토카드 이름은 문자열이어야 합니다.';
          }

          return '포토카드 이름은 필수입니다.';
        },
      })
      .min(2, '포토카드 이름은 2자 이상이어야 합니다.')
      .max(20, '포토카드 이름은 20자 이하이어야 합니다.'),

    description: z.string({ required_error: '포토카드 설명은 필수입니다.' }),

    genre: z.enum(Genre, {
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return '유효하지 않은 포토카드 장르입니다.';
        }

        return '포토카드 장르는 필수입니다.';
      },
    }),

    grade: z.enum(CardGrade, {
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return '유효하지 않은 포토카드 등급입니다.';
        }

        return '포토카드 등급은 필수입니다.';
      },
    }),

    price: z.coerce
      .number({
        error: (issue) => {
          if (issue.code === 'invalid_type') {
            return '포토카드 가격은 숫자이어야 합니다.';
          }

          return '포토카드 가격은 필수입니다.';
        },
      })
      .min(1, '포토카드 판매 금액은 1 이상이어야 합니다.'),

    totalQuantity: z.coerce
      .number({
        error: (issue) => {
          if (issue.code === 'invalid_type') {
            return '포토카드 발행량은 숫자이어야 합니다.';
          }

          return '포토카드 발행량은 필수입니다.';
        },
      })
      .min(1, '포토카드 발행량은 1장 이상이어야 합니다.')
      .max(10, '총 발행량은 10장 이하입니다.'),
  })
  .strict();

export const getmyCardQuerySchema = z.object({
  keyword: z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return '키워드는 문자이어야 합니다.';
        }
      },
    })
    .optional(),
  genre: z
    .enum(Genre, {
      error: (issue) => {
        if (issue.code === 'invalid_value') {
          return '존재하지 않는 장르입니다.';
        }
      },
    })
    .optional(),
  grade: z
    .enum(CardGrade, {
      error: (issue) => {
        if (issue.code === 'invalid_value') {
          return '존재하지 않는 등급입니다.';
        }
      },
    })
    .optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).optional(),
});

export const myCardIdParamsSchema = z.strictObject({
  myCardId: z.coerce
    .number({ invalid_type_error: '유효하지 않은 카드 ID입니다.' })
    .int('카드 ID는 정수여야 합니다.')
    .positive('카드 ID는 양의 정수여야 합니다.'),
});
