// Seeds roles and the default admin user idempotently (upsert by unique key).
// Run with `npm run seed`.
import { prisma } from "./prisma";
import { hashPassword } from "@utils/hash.util";
import { logger } from "@utils/logger.util";

// Default admin credentials. The password is hashed at seed time.
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Administrator";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const LEARNER_NAME = process.env.SEED_LEARNER_NAME;
const LEARNER_EMAIL = process.env.SEED_LEARNER_EMAIL;
const LEARNER_PASSWORD = process.env.SEED_LEARNER_PASSWORD;
const SHOULD_SEED_N4_VOCABULARY = process.env.SEED_N4_VOCABULARY === "true";
const N4_MINNA_LESSON_NUMBERS = Array.from(
  { length: 25 },
  (_, index) => index + 26,
);

const N4_VOCABULARY = [
  {
    slug: "n4-keiken",
    kanji: "経験",
    hiragana: "けいけん",
    romaji: "keiken",
    meaningVi: "kinh nghiệm",
  },
  {
    slug: "n4-junbi",
    kanji: "準備",
    hiragana: "じゅんび",
    romaji: "junbi",
    meaningVi: "chuẩn bị",
  },
  {
    slug: "n4-hitsuyo",
    kanji: "必要",
    hiragana: "ひつよう",
    romaji: "hitsuyou",
    meaningVi: "cần thiết",
  },
  {
    slug: "n4-renraku",
    kanji: "連絡",
    hiragana: "れんらく",
    romaji: "renraku",
    meaningVi: "liên lạc",
  },
  {
    slug: "n4-yoyaku",
    kanji: "予約",
    hiragana: "よやく",
    romaji: "yoyaku",
    meaningVi: "đặt trước",
  },
  {
    slug: "n4-sanka",
    kanji: "参加",
    hiragana: "さんか",
    romaji: "sanka",
    meaningVi: "tham gia",
  },
  {
    slug: "n4-seikatsu",
    kanji: "生活",
    hiragana: "せいかつ",
    romaji: "seikatsu",
    meaningVi: "cuộc sống, sinh hoạt",
  },
  {
    slug: "n4-shukan",
    kanji: "習慣",
    hiragana: "しゅうかん",
    romaji: "shuukan",
    meaningVi: "thói quen",
  },
  {
    slug: "n4-saikin",
    kanji: "最近",
    hiragana: "さいきん",
    romaji: "saikin",
    meaningVi: "gần đây",
  },
  {
    slug: "n4-shorai",
    kanji: "将来",
    hiragana: "しょうらい",
    romaji: "shourai",
    meaningVi: "tương lai",
  },
  {
    slug: "n4-erabu",
    kanji: "選ぶ",
    hiragana: "えらぶ",
    romaji: "erabu",
    meaningVi: "lựa chọn",
  },
  {
    slug: "n4-shiraberu",
    kanji: "調べる",
    hiragana: "しらべる",
    romaji: "shiraberu",
    meaningVi: "tra cứu, điều tra",
  },
  {
    slug: "n4-tsuzukeru",
    kanji: "続ける",
    hiragana: "つづける",
    romaji: "tsuzukeru",
    meaningVi: "tiếp tục",
  },
  {
    slug: "n4-kimeru",
    kanji: "決める",
    hiragana: "きめる",
    romaji: "kimeru",
    meaningVi: "quyết định",
  },
  {
    slug: "n4-maniau",
    kanji: "間に合う",
    hiragana: "まにあう",
    romaji: "maniau",
    meaningVi: "kịp giờ",
  },
  {
    slug: "n4-katazukeru",
    kanji: "片付ける",
    hiragana: "かたづける",
    romaji: "katazukeru",
    meaningVi: "dọn dẹp",
  },
  {
    slug: "n4-kuraberu",
    kanji: "比べる",
    hiragana: "くらべる",
    romaji: "kuraberu",
    meaningVi: "so sánh",
  },
  {
    slug: "n4-fueru",
    kanji: "増える",
    hiragana: "ふえる",
    romaji: "fueru",
    meaningVi: "tăng lên",
  },
  {
    slug: "n4-heru",
    kanji: "減る",
    hiragana: "へる",
    romaji: "heru",
    meaningVi: "giảm xuống",
  },
  {
    slug: "n4-naosu",
    kanji: "直す",
    hiragana: "なおす",
    romaji: "naosu",
    meaningVi: "sửa chữa",
  },
] as const;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to run the seed.",
  );
}

// Role definitions seeded into the roles table.
const ROLES = [
  { name: "admin", description: "Full access to all features" },
  { name: "user", description: "Standard user access" },
  { name: "moderator", description: "Can moderate content and users" },
];

// Seed all reference roles via upsert on the unique name column.
async function seedRoles(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  logger.info(`Seeded ${ROLES.length} roles`);
}

// Seed the default admin user via upsert on the unique email column.
async function seedAdminUser(): Promise<void> {
  const hashedPassword = await hashPassword(ADMIN_PASSWORD!);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL! },
    update: {
      name: ADMIN_NAME,
      password: hashedPassword,
      role: "admin",
      status: "active",
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL!,
      password: hashedPassword,
      role: "admin",
      status: "active",
    },
  });
  logger.info(`Seeded admin user: ${ADMIN_EMAIL}`);
}

async function seedLearnerUser(): Promise<void> {
  if (!LEARNER_NAME || !LEARNER_EMAIL || !LEARNER_PASSWORD) return;
  const password = await hashPassword(LEARNER_PASSWORD);
  await prisma.user.upsert({
    where: { email: LEARNER_EMAIL },
    update: { name: LEARNER_NAME, password, role: "user", status: "active" },
    create: {
      name: LEARNER_NAME,
      email: LEARNER_EMAIL,
      password,
      role: "user",
      status: "active",
    },
  });
  logger.info(`Seeded learner user: ${LEARNER_EMAIL}`);
}

async function seedN4Vocabulary(): Promise<void> {
  if (!SHOULD_SEED_N4_VOCABULARY) return;

  const admin = await prisma.user.findFirst({
    where: { role: "admin", status: "active" },
    select: { id: true },
  });
  if (!admin)
    throw new Error("Create an active admin user before seeding vocabulary.");

  const legacyLesson = await prisma.vocabularyLesson.findUnique({
    where: { level_position: { level: "N4", position: 1 } },
  });
  const lesson26 = await prisma.vocabularyLesson.findUnique({
    where: { level_position: { level: "N4", position: 26 } },
  });

  if (legacyLesson && !lesson26) {
    await prisma.vocabularyLesson.update({
      where: { id: legacyLesson.id },
      data: { position: 26 },
    });
  }

  for (const lessonNumber of N4_MINNA_LESSON_NUMBERS) {
    await prisma.vocabularyLesson.upsert({
      where: { level_position: { level: "N4", position: lessonNumber } },
      update: {
        title: `Minna no Nihongo · Bài ${lessonNumber}`,
        description: `Từ vựng Minna no Nihongo, bài ${lessonNumber}.`,
        status: "published",
      },
      create: {
        level: "N4",
        position: lessonNumber,
        title: `Minna no Nihongo · Bài ${lessonNumber}`,
        description: `Từ vựng Minna no Nihongo, bài ${lessonNumber}.`,
        status: "published",
      },
    });
  }

  const lesson = await prisma.vocabularyLesson.findUniqueOrThrow({
    where: { level_position: { level: "N4", position: 26 } },
  });

  for (const [position, word] of N4_VOCABULARY.entries()) {
    const vocabulary = await prisma.vocabulary.upsert({
      where: { slug: word.slug },
      update: {
        kanji: word.kanji,
        hiragana: word.hiragana,
        romaji: word.romaji,
        meaningVi: word.meaningVi,
        level: "N4",
        status: "published",
        isDeleted: false,
        updatedById: admin.id,
      },
      create: {
        ...word,
        level: "N4",
        tags: ["jlpt-n4"],
        status: "published",
        createdById: admin.id,
        updatedById: admin.id,
      },
      select: { id: true },
    });
    await prisma.lessonVocabulary.upsert({
      where: {
        lessonId_vocabularyId: {
          lessonId: lesson.id,
          vocabularyId: vocabulary.id,
        },
      },
      update: { position, isIntroduced: true },
      create: {
        lessonId: lesson.id,
        vocabularyId: vocabulary.id,
        position,
        isIntroduced: true,
      },
    });
  }
  logger.info(
    `Seeded ${N4_MINNA_LESSON_NUMBERS.length} Minna no Nihongo N4 lessons and ${N4_VOCABULARY.length} vocabulary items`,
  );
}

// Entry point. Connects, runs seeds, then disconnects.
async function runSeeds(): Promise<void> {
  await prisma.$connect();
  await seedRoles();
  await seedAdminUser();
  await seedLearnerUser();
  await seedN4Vocabulary();
  await prisma.$disconnect();
  logger.info("All seeds completed.");
}

runSeeds().catch((err) => {
  logger.error("Seed failed:", err);
  process.exit(1);
});
