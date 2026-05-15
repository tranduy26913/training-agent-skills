# Quality and Operations

## 1. Testing Strategy

### Backend Tests

- Unit: service layer rules cho validation, unique email, self-delete prevention, `changed_fields` diff.
- Integration: CRUD endpoints với database thật hoặc test DB.
- Authorization: verify toàn bộ endpoints chỉ admin truy cập được.

### Frontend Tests

- Component: `UserForm`, `UserTable`, `UserFilters`, `AuditLogViewer`.
- Integration: list page filter/sort/pagination, create/edit submit flows, audit sidebar refresh.
- E2E: full admin flow create -> edit -> delete user, và case email duplicate / self-delete guard.

### Test Data and Fixtures

- Seed ít nhất 1 admin user và nhiều user với role/status khác nhau.
- Seed audit logs cho edit page demo và tests.
- Mock response cho duplicate email check để kiểm thử debounce behavior ổn định.

---

## 2. Non-Functional Requirements

### Performance Considerations

- Pagination và sorting phải chạy server-side.
- Search ưu tiên dùng indexed columns trên `email`, `role`, `status`; full-text cho `name/email` là tối ưu sau.
- Duplicate email check dùng debounce 500ms để tránh spam request.
- Audit log chỉ load khi vào edit page và giới hạn mặc định 10 entries.

### Reliability Requirements

- Nếu duplicate email check thất bại ở client, submit vẫn phải được backend validate lại.
- Nếu delete thành công nhưng refresh list lỗi, UI cần giữ toast thành công và cho phép retry fetch.
- Audit log create/update/delete phải nằm cùng transaction hoặc có rollback strategy phù hợp để tránh mất trace.

### Security Considerations

- Authentication: tất cả CRUD endpoints yêu cầu JWT hợp lệ.
- Authorization: chỉ admin được truy cập.
- Input Validation: validate ở cả client và server, server là nguồn quyết định cuối.
- SQL Injection Prevention: dùng parameterized queries.
- Sensitive Data Protection: password chỉ được hash và không trả về trong response.
- Audit Trail: create, update, delete đều phải được log.

---

## 3. Observability and Audit

### Logging

- Ghi log structured cho request CRUD users với `actorId`, `targetUserId`, `action`, `statusCode`.
- Không log password hoặc dữ liệu nhạy cảm không cần thiết.
- Khi lỗi validation hoặc database, log phải đủ để trace request nhưng không làm lộ PII quá mức.

### Metrics

- Counter cho create, update, delete thành công và thất bại.
- Counter cho duplicate email conflicts.
- Latency metric cho list endpoint và duplicate email check nếu endpoint này được dùng nhiều.

### Audit Events

- `CREATE_USER`
- `UPDATE_USER`
- `DELETE_USER`
- Audit payload tối thiểu gồm `admin_id`, `target_user_id`, `action`, `changed_fields`, `timestamp`.

---

## 4. Rollout and Operations

### Release Plan

- Áp dụng migration schema trước khi bật UI dùng các field mới.
- Triển khai backend validation và endpoints trước, sau đó mới rollout frontend create/edit/list.
- Nếu endpoint duplicate email chưa chốt auth policy, cần quyết định trước khi public ra môi trường shared.

### Operational Runbook

- Nếu list page trả lỗi 5xx, kiểm tra logs của users module và DB connectivity.
- Nếu create/update liên tục trả 409, kiểm tra unique constraint và normalization email.
- Nếu audit sidebar rỗng bất thường, kiểm tra insert audit log ở create/update/delete paths.

---

## 5. Risks and Open Issues

### Risks

- Duplicate email check phía client có thể gây cảm giác sai lệch nếu state DB đổi giữa lúc check và submit.
- Nếu audit log không được ghi cùng transaction nghiệp vụ, có thể mất trace cho một số thao tác thất bại một phần.
- Hiển thị mật khẩu tạm thời sau khi create có thể gây rủi ro vận hành nếu bị chụp màn hình hoặc copy sai quy trình.

### Mitigations

- Luôn enforce unique email ở backend và DB, không dựa vào client check.
- Cân nhắc transactional boundary hoặc outbox pattern đơn giản cho audit.
- Giới hạn hoặc loại bỏ việc hiển thị mật khẩu tạm thời trong các phiên bản sau.

### Open Issues

- Chưa chốt auth policy cho endpoint `check-email`.
- Chưa chốt UX cuối cùng cho việc hiển thị hoặc bàn giao mật khẩu mặc định sau create.

---

## 6. Acceptance Criteria

- Admin có thể tìm kiếm, lọc, sort và phân trang danh sách user mà không reload toàn bộ ứng dụng.
- Admin có thể tạo user mới với validation đúng và audit log được ghi nhận.
- Admin có thể chỉnh sửa user hiện hữu, thấy audit log gần nhất trên edit page.
- Admin không thể xóa chính mình.
- Hệ thống trả lỗi rõ ràng khi email bị trùng và không tạo record duplicate.

---

## 7. Future Enhancements

- Bulk import/export users.
- Email invitation thay cho mật khẩu mặc định hiển thị trực tiếp.
- Password reset management.
- User groups/departments.
- Fine-grained permissions.
- Two-factor authentication support.