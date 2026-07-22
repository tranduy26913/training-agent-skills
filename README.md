# Japanese Learning Platform

Nền tảng học tiếng Nhật sử dụng Vue 3 ở frontend, Express ở backend và Supabase PostgreSQL thông qua Prisma.

## Tech stack

- Frontend: Vue 3, Vite, TypeScript, Pinia, PrimeVue, Tailwind CSS.
- Backend: Express, TypeScript, Zod, Prisma.
- Database: Supabase PostgreSQL.
- Authentication: JWT do Express quản lý.

## Cấu trúc

```text
client/   Vue application
server/   Express API, Prisma schema và migrations
docs/     Roadmap và hướng dẫn vận hành
```

Các module Python, COBOL, Project, Script và AI provider cũ đã được loại bỏ.

## Chạy local

Yêu cầu Node.js 20+ và một Supabase project.

1. Tạo file môi trường:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

2. Điền connection string và secret trong `server/.env`.

3. Cài dependency:

```powershell
cd server
npm install

cd ../client
npm install
```

4. Chuẩn bị database và chạy ứng dụng:

```powershell
cd ../server
npm run migrate:deploy
npm run seed
npm run dev
```

Mở terminal khác:

```powershell
cd client
npm run dev
```

Frontend chạy tại `http://localhost:5173`, API mặc định tại `http://localhost:3000/api/v1`.

## Kiểm tra

```powershell
cd server
npm run build
npm test

cd ../client
npm run build
npm run test:unit
```

Integration test backend bắt buộc có `DATABASE_URL_TEST` trỏ tới database riêng. Test sẽ dừng nếu biến này thiếu hoặc trùng `DATABASE_URL`.

Xem thêm [hướng dẫn Supabase](docs/supabase-setup.md) và [roadmap triển khai](docs/japanese-learning-platform-roadmap.md).
