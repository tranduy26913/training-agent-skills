# Kết nối Supabase

Backend kết nối Supabase PostgreSQL qua Prisma. Frontend chưa dùng Supabase Auth hoặc Storage nên không cần anon key hay service-role key.

## Cấu hình

Sao chép `server/.env.example` thành `server/.env`, sau đó điền:

```dotenv
DATABASE_URL=postgresql://postgres.<project-ref>:<encoded-password>@aws-<region>.pooler.supabase.com:5432/postgres
JWT_SECRET=<long-random-secret>
```

Dùng Session pooler cổng 5432 cho runtime và Prisma CLI. `DIRECT_URL` chỉ là tùy chọn cho công cụ quản trị khi máy có kết nối IPv6; source hiện không phụ thuộc biến này.

Nếu mật khẩu chứa ký tự đặc biệt, phải URL-encode phần mật khẩu trước khi đưa vào connection string. Không commit `server/.env` và không đưa database URL vào biến `VITE_*`.

## Migration và seed

```powershell
cd server
npx prisma validate
npx prisma generate
npm run migrate:deploy
npm run seed
```

Baseline PostgreSQL hiện tại nằm trong `server/prisma/migrations/20260722150000_supabase_postgres_baseline`.

## Integration test

Tạo một Supabase project hoặc database riêng và khai báo `DATABASE_URL_TEST`. Không dùng database development/production cho test vì test tạo và xóa dữ liệu.
