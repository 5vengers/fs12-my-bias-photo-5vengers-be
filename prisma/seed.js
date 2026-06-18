import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  // ── 1. 테스트 유저 생성 ──
  const seedEmail = process.env.SEED_USER_EMAIL;
  const seedPassword = process.env.SEED_USER_PASSWORD;
  if (!seedEmail || !seedPassword) {
    throw new Error('SEED_USER_EMAIL/SEED_USER_PASSWORD must be set');
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      password: hashedPassword,
      nickname: '테스트유저',
      provider: 'LOCAL',
      userPoint: {
        create: { point: 1540 },
      },
    },
  });
  console.log('✅ User seeded');

  // ── 2. 포토카드 9종 생성 (이미지 3개 재사용) ──
  const photoCardData = [
    { name: '스페인 여행',       description: '스페인 여행 포토카드',       genre: 'CONCERT',         grade: 'RARE',       price: 150,  totalQuantity: 10, img: 1 },
    { name: "How Far I'll Go",  description: "How Far I'll Go 포토카드", genre: 'ALBUM',           grade: 'SUPER_RARE', price: 300,  totalQuantity: 5,  img: 2 },
    { name: '우리집 앞마당',     description: '우리집 앞마당 포토카드',     genre: 'FAN_MEETING',     grade: 'LEGENDARY',  price: 500,  totalQuantity: 3,  img: 3 },
    { name: '봄날의 콘서트',     description: '봄날 콘서트 포토카드',       genre: 'CONCERT',         grade: 'COMMON',     price: 80,   totalQuantity: 20, img: 1 },
    { name: '팬사인회 기념',     description: '팬사인회 기념 포토카드',     genre: 'FANSIGN',         grade: 'RARE',       price: 200,  totalQuantity: 8,  img: 2 },
    { name: '시즌 그리팅 2025', description: '2025 시즌그리팅 포토카드',  genre: 'SEASON_GREETING', grade: 'COMMON',     price: 100,  totalQuantity: 15, img: 3 },
    { name: '팬미팅 스페셜',     description: '팬미팅 스페셜 포토카드',    genre: 'FAN_MEETING',     grade: 'SUPER_RARE', price: 350,  totalQuantity: 6,  img: 1 },
    { name: '콜라보 에디션',     description: '콜라보 한정판 포토카드',    genre: 'COLLAB',          grade: 'LEGENDARY',  price: 600,  totalQuantity: 2,  img: 2 },
    { name: '앨범 미수록',       description: '앨범 미수록 포토카드',      genre: 'ALBUM',           grade: 'RARE',       price: 250,  totalQuantity: 7,  img: 3 },
  ];

  const photoCards = [];
  for (const { img, ...data } of photoCardData) {
    let card = await prisma.photoCard.findFirst({
      where: { name: data.name, creatorId: user.id },
    });
    if (!card) {
      card = await prisma.photoCard.create({
        data: {
          ...data,
          creatorId: user.id,
          imageUrl: `http://localhost:3000/images/img-image${img}.png`,
        },
      });
    }
    photoCards.push(card);
  }
  console.log('✅ PhotoCards:', photoCards.map((c) => c.name).join(', '));

  // ── 3. MyCard 9개 생성 ──
  const myCardQuantities = [5, 3, 2, 8, 4, 6, 2, 1, 3];

  const myCards = [];
  for (let i = 0; i < photoCards.length; i++) {
    let myCard = await prisma.myCard.findFirst({
      where: { photoCardId: photoCards[i].id, ownerId: user.id },
    });
    if (!myCard) {
      myCard = await prisma.myCard.create({
        data: {
          photoCardId: photoCards[i].id,
          quantity: myCardQuantities[i],
          ownerId: user.id,
        },
      });
    }
    myCards.push(myCard);
  }
  console.log('✅ MyCards:', myCards.length, '개');

  // ── 4. MarketItem 9개 생성 ──
  const marketItemDetails = [
    { grade: 'RARE',       genre: 'CONCERT',         quantity: 3, soldQuantity: 1, pricePerCard: 150, status: 'SELLING'  },
    { grade: 'SUPER_RARE', genre: 'ALBUM',           quantity: 2, soldQuantity: 0, pricePerCard: 300, status: 'SELLING'  },
    { grade: 'LEGENDARY',  genre: 'FAN_MEETING',     quantity: 1, soldQuantity: 1, pricePerCard: 500, status: 'SOLD_OUT' },
    { grade: 'COMMON',     genre: 'CONCERT',         quantity: 5, soldQuantity: 0, pricePerCard: 80,  status: 'SELLING'  },
    { grade: 'RARE',       genre: 'FANSIGN',         quantity: 3, soldQuantity: 1, pricePerCard: 200, status: 'SELLING'  },
    { grade: 'COMMON',     genre: 'SEASON_GREETING', quantity: 4, soldQuantity: 2, pricePerCard: 100, status: 'SELLING'  },
    { grade: 'SUPER_RARE', genre: 'FAN_MEETING',     quantity: 2, soldQuantity: 0, pricePerCard: 350, status: 'SELLING'  },
    { grade: 'LEGENDARY',  genre: 'COLLAB',          quantity: 1, soldQuantity: 0, pricePerCard: 600, status: 'SELLING'  },
    { grade: 'RARE',       genre: 'ALBUM',           quantity: 3, soldQuantity: 0, pricePerCard: 250, status: 'SELLING'  },
  ];

  const marketItems = [];
  for (let i = 0; i < myCards.length; i++) {
    let item = await prisma.marketItem.findFirst({
      where: {
        myCardId: myCards[i].id,
        sellerId: user.id,
        status: { not: 'DELETED' },
      },
    });
    if (!item) {
      item = await prisma.marketItem.create({
        data: {
          ...marketItemDetails[i],
          myCardId: myCards[i].id,
          sellerId: user.id,
        },
      });
    }
    marketItems.push(item);
  }
  console.log('✅ MarketItems:', marketItems.length, '개');

  console.log('🎉 Seed 완료!');
  console.log('📌 테스트 계정 시드 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
