# Agent Skills Workflow Report

## 1. Executive Summary

Báo cáo này mô tả workflow agent skills theo chuỗi:

1. Brainstorming
2. Plan
3. Execute
4. Test
5. Review

Mục tiêu của workflow là giảm rủi ro hiểu sai yêu cầu, tăng tốc triển khai bằng phân pha rõ ràng, và đảm bảo chất lượng đầu ra bằng các cổng kiểm soát (gates) bắt buộc.

## 2. Mục tiêu của Workflow

### 2.1. Mục tiêu chính

1. **Đúng yêu cầu ngay từ đầu (spec-first):** Mọi quyết định kỹ thuật đều phải bắt đầu từ tài liệu spec đã được duyệt. Không viết code khi yêu cầu còn mơ hồ hoặc chưa có thiết kế được thống nhất. Điều này ngăn chặn nguyên nhân phổ biến nhất của rework — hiểu sai yêu cầu ban đầu dẫn đến sửa toàn bộ sau khi đã code.
2. **Triển khai có thể kiểm chứng (evidence-driven):** Mỗi thay đổi hành vi phải có test tương ứng. Không chấp nhận trạng thái "đã xong" nếu chưa có output test thực tế. Mọi claim về quality phải đi kèm bằng chứng cụ thể từ lệnh chạy, không phụ thuộc vào suy đoán hay cảm giác chủ quan của người thực thi.
3. **Kiểm soát chất lượng trước khi merge (review-gated):** Trước khi tích hợp vào nhánh chính, toàn bộ thay đổi phải qua hai lớp kiểm soát: technical review theo rule catalog và spec compliance review đối chiếu với tài liệu thiết kế đã duyệt. Verdict merge phải rõ ràng, có cơ sở, và ai đọc cũng hiểu được.

### 2.2. Giá trị đạt được

1. **Giảm rework do mơ hồ yêu cầu:** Nhờ Design Gate bắt buộc chốt spec trước khi code, tỷ lệ phát sinh thay đổi lớn giữa chừng giảm đáng kể. Chi phí sửa lỗi hiểu sai ở giai đoạn spec rẻ hơn nhiều so với sửa ở giai đoạn test hoặc production.
2. **Tăng năng suất nhờ tổ chức task có dependency rõ:** Phân pha và khai báo dependency tường minh cho phép thực thi song song các task độc lập, giảm thời gian tổng thể mà không làm tăng nguy cơ xung đột file hay race condition trong khi tích hợp.
3. **Tăng độ tin cậy phát hành qua test và review có bằng chứng:** Bộ test tự động kết hợp với review report có cấu trúc tạo ra lớp bảo vệ kép. Mỗi feature khi merge đều đi kèm bằng chứng test pass và không có findings nghiêm trọng còn tồn đọng chưa xử lý.

## 3. Tổng quan luồng End-to-End

### 3.1. Input

1. Feature request hoặc Change Request (CR).
2. Bối cảnh codebase hiện tại.
3. Tài liệu spec liên quan (nếu có).

### 3.2. Output

1. Spec package hoàn chỉnh.
2. Implementation plan theo phase.
3. Code thay đổi + bộ test tương ứng.
4. Review report + quyết định sẵn sàng merge.

### 3.3. Luồng chuẩn

1. Brainstorming: Làm rõ yêu cầu và chốt thiết kế.
2. Plan: Chuyển thiết kế thành kế hoạch thực thi.
3. Execute: Triển khai theo task có kiểm soát.
4. Test: Xác minh bằng test output thực tế.
5. Review: Rà soát kỹ thuật + đối chiếu spec.

## 4. Chi tiết theo từng giai đoạn

## 4.1. Brainstorming (Design Gate)

### Mục tiêu

1. **Làm rõ problem statement thực sự:** Không dừng lại ở yêu cầu bề mặt. Phải hiểu được mục tiêu kinh doanh đằng sau, ai bị ảnh hưởng trực tiếp, và kết quả nào đo được để chứng minh tính năng thành công. Đây là bước ngăn chặn sớm nhất nguy cơ xây đúng sản phẩm nhưng sai vấn đề.
2. **Chốt phạm vi và tiêu chí thành công đo được:** Xác định rõ ràng những gì in-scope và out-of-scope trong vòng triển khai hiện tại. Tiêu chí "xong" phải quan sát và kiểm chứng được, tránh dùng ngôn ngữ chủ quan như "trải nghiệm tốt hơn" hay "hiệu suất cao hơn" mà không có ngưỡng cụ thể.
3. **Tránh code khi chưa thống nhất thiết kế (hard gate):** Không có hành động triển khai nào được khởi động khi spec chưa được duyệt, bất kể feature trông có vẻ đơn giản. Chi phí sửa thiết kế sai ở giai đoạn này chỉ bằng một phần nhỏ so với sửa sau khi đã code, test, và deploy.

### Hoạt động chính

1. **Khảo sát context dự án trước khi đặt câu hỏi:** Đọc các file spec hiện có, xem migration đã có, kiểm tra cấu trúc code liên quan, đọc commit gần nhất. Mục tiêu là hiểu thực trạng hệ thống trước khi đề xuất bất kỳ hướng giải quyết nào, tránh thiết kế xung đột với những gì đang tồn tại.
2. **Đặt câu hỏi làm rõ theo 4 nhóm trong một lượt:** Nhóm mục tiêu/phạm vi (ai dùng, giá trị là gì, out-of-scope là gì), nhóm luồng nghiệp vụ (happy path, alternative flow, error flow, rollback), nhóm dữ liệu/quy tắc (validation, role-based rule, data consistency), và nhóm chất lượng/vận hành (tiêu chí done, performance threshold, security requirements). Ghi lại đầy đủ câu trả lời vào phần Assumptions của spec.
3. **Đề xuất 2-3 phương án kèm trade-off có căn cứ:** Mỗi phương án cần mô tả rõ cơ chế hoạt động, lý do phù hợp với bối cảnh dự án, điểm mạnh, điểm yếu, và điều kiện tốt nhất để dùng. Không đề xuất phương án chỉ để đủ số lượng. Dẫn đầu bằng phương án khuyến nghị và giải thích tại sao nó phù hợp nhất ở thời điểm này.
4. **Chốt phương án và trình bày design theo phần:** Sau khi người dùng chọn phương án, trình bày thiết kế theo từng phần (architecture, data model, API contract, UI flow), lấy phê duyệt từng phần thay vì trình bày toàn bộ rồi mới hỏi. Nếu người dùng chọn phương án khác với khuyến nghị, ghi lại quyết định và lý do vào Changelog.
5. **Viết spec package 5 file theo chuẩn bắt buộc:** Ghi đầy đủ nội dung cho 5 file (00-index, 01-backend, 02-frontend, 03-behavior, 04-quality). Không bỏ trống phần nào. Nếu một mục không áp dụng thì ghi rõ "Not applicable" cùng lý do ngắn gọn. Structural compliance là bắt buộc, không được đổi tên hay gộp section.
6. **Self-review spec trước khi trình người dùng duyệt:** Rà soát tìm placeholder TBD/TODO còn sót, phát hiện mâu thuẫn nội bộ giữa các file spec, kiểm tra scope có đủ hẹp để triển khai trong một vòng plan-execute, và xác minh không có requirement nào bị bỏ sót. Sửa ngay các vấn đề tìm được, không để sang bước sau.

### Artifact bắt buộc

Bộ spec package gồm:

1. 00-index.md
2. 01-backend.md
3. 02-frontend.md
4. 03-behavior.md
5. 04-quality.md

### Exit Criteria

1. Không còn placeholder kiểu TBD/TODO mơ hồ.
2. Các file spec nhất quán với nhau.
3. User đã duyệt spec trước khi sang phase Plan.

## 4.2. Plan (Planning Gate)

### Mục tiêu

1. **Chuyển spec thành task thực thi được ngay, không cần đoán:** Mỗi task phải đủ cụ thể để một engineer mới vào dự án bắt đầu ngay mà không phải hỏi thêm. Tiêu chuẩn này đòi hỏi file path chính xác, command verify rõ, và expected output mô tả được. Bất kỳ task nào còn dùng ngôn ngữ mơ hồ như "xử lý phù hợp" hay "cập nhật logic" đều chưa đạt tiêu chuẩn.
2. **Tổ chức phase để chạy song song an toàn, tối đa hóa throughput:** Phân tích dependency thật sự giữa các task để nhóm vào phase. Các task trong cùng phase phải độc lập đủ để dispatch song song mà không gây xung đột file hay race condition. Nguyên tắc cốt lõi: chỉ serialize khi có dependency bắt buộc về mặt kỹ thuật, không serialize vì thói quen tuần tự.
3. **Gắn traceability từ task về đúng section trong spec:** Mỗi task phải có trường Spec Reference chỉ đến đúng file và section. Một executor không quen feature phải có thể mở spec reference và biết ngay cần build gì, validation rule nào áp dụng, UI state nào cần xử lý — không cần đoán hay hỏi thêm.

### Hoạt động chính

1. **Đọc spec package toàn bộ trước khi chia task:** Không chia task từ trí nhớ hay giả định. Phải đọc đủ 01-backend, 02-frontend, 03-behavior, 04-quality để nắm hết yêu cầu. Ghi chú những yêu cầu có dependency với nhau trước khi vẽ phase. Mỗi yêu cầu trong spec phải được map vào ít nhất một task trong plan.
2. **Liệt kê chính xác file tạo mới, chỉnh sửa, test:** Cho mỗi file ghi rõ vai trò của nó trong feature. Quyết định decomposition ở bước này: file nào làm gì, boundary ở đâu. Tránh để một file đảm nhận nhiều trách nhiệm không liên quan — đây là nơi thiết kế modularity được thực thi, không phải ở giai đoạn execute.
3. **Chia phase và khai báo dependency tường minh:** Vẽ đồ thị dependency thật sự, gom task không phụ thuộc nhau vào cùng phase. Với mỗi task có dependency, ghi rõ "Depends on: Task N" thay vì để executor tự suy diễn. Phase 1 là foundation (schema, types), Phase 2 là core backend+frontend song song, Phase 3 là UI components song song, Phase 4 là quality.
4. **Thiết kế mỗi task theo cấu trúc TDD bắt buộc:** Bước đầu tiên của mỗi task là viết failing test (RED), không phải viết code triển khai. Tiếp theo implement tối thiểu để test pass (GREEN). Cuối cùng refactor nếu cần mà không làm test fail (REFACTOR). Mỗi task kết thúc bằng một commit rõ ràng.
5. **Self-review plan theo 6 điểm trước khi trình người dùng:** Kiểm tra từng task có spec reference chưa, có file path cụ thể chưa, có command verify chưa, có expected output chưa, có placeholder còn sót không, và có hidden dependency nào chưa khai báo không. Sửa ngay các vấn đề tìm được. Một plan tốt là plan mà executor đọc xong có thể bắt tay làm ngay mà không cần hỏi thêm.

### Đặc tính của task tốt

1. Có Spec Reference rõ ràng.
2. Có đường dẫn file cụ thể.
3. Có lệnh verify và expected result.
4. Không dùng mô tả chung chung, khó kiểm chứng.

### Exit Criteria

1. Executor có thể bắt đầu ngay, không cần đoán.
2. Các task độc lập có thể dispatch song song.
3. Không có xung đột file nặng trong cùng phase.

## 4.3. Execute (Implementation Gate)

### Mục tiêu

1. **Triển khai bám chặt plan và spec, không drift:** Executor không được tự ý thêm logic, thay đổi API contract, hay mở rộng scope ngoài những gì spec đã định nghĩa. Nếu phát hiện yêu cầu mới trong lúc code, phải dừng, ghi nhận, và đưa vào CR riêng thay vì nhét vào feature hiện tại để tránh scope creep không kiểm soát.
2. **Tối ưu tốc độ bằng thực thi song song hợp lý:** Tận dụng cấu trúc phase trong plan để dispatch task độc lập song song. Parent agent giữ vai trò điều phối, theo dõi trạng thái toàn bộ, và đảm bảo tích hợp sạch giữa các lane trước khi chuyển phase. Không để song song hóa tạo ra bug tích hợp khó debug vì thiếu điểm đồng bộ.
3. **Duy trì kỷ luật kỹ thuật xuyên suốt quá trình coding:** Áp dụng coding guidelines nhất quán: YAGNI (không build thứ chưa cần), SRP (mỗi function/file một trách nhiệm), surgical changes (chỉ chạm vào những gì cần thiết cho task hiện tại). Không cải thiện code lân cận trừ khi thay đổi đó trực tiếp phục vụ task được assign.

### Hoạt động chính

1. **Đọc và phản biện plan trước khi bắt đầu bất kỳ task nào:** Tìm những chỗ kế hoạch không rõ ràng, xung đột với codebase hiện tại, hoặc thiếu thông tin để thực thi. Raise concern với người phụ trách ngay, không tiếp tục và đoán. Một plan tốt được thực thi đúng sẽ cho kết quả tốt hơn nhiều so với một plan tốt được thực thi với nhiều giả định không được xác nhận.
2. **Quản lý trạng thái task minh bạch và theo thời gian thực:** Chỉ được đánh dấu completed sau khi verification step của task đó đã chạy và pass. Không batch-complete nhiều task cùng lúc chỉ để tiết kiệm thời gian cập nhật. Trạng thái phải phản ánh thực tế, không phải ý định hay dự đoán.
3. **Thực thi theo vòng RED -> GREEN -> REFACTOR nghiêm ngặt:** Viết test thất bại trước, chạy để xác nhận nó fail vì đúng lý do (implementation chưa tồn tại, không phải lỗi import hay setup). Viết code tối thiểu để pass — không thêm logic phòng ngừa chưa có test cover. Chỉ refactor khi test đã xanh. Không kết hợp viết test + implement trong cùng một bước.
4. **Tích hợp kết quả sau mỗi phase trước khi chạy phase tiếp theo:** Sau khi một phase hoàn tất, parent agent kiểm tra tích hợp giữa các lane (API contract khớp store, UI component nhận đúng props từ service). Phát hiện xung đột ở ranh giới phase sớm dễ debug hơn nhiều so với phát hiện khi đã hoàn tất toàn bộ feature.
5. **Dừng và báo cáo ngay khi gặp blocker, tuyệt đối không đoán:** Nếu một bước không thể thực hiện vì lý do kỹ thuật, thiếu thông tin, hoặc plan mâu thuẫn với thực tế, dừng ngay và mô tả blocker cụ thể. Không tự suy diễn giải pháp thay thế mà không được xác nhận. Guessing khi không chắc là nguyên nhân chính của các bug khó tìm nhất trong giai đoạn test.

### Nguyên tắc vận hành

1. Chỉ serialize khi có dependency bắt buộc.
2. Parent agent chịu trách nhiệm điều phối và tích hợp.
3. Không tự ý mở rộng scope ngoài spec.

### Exit Criteria

1. Toàn bộ task trong plan hoàn tất.
2. Verification tại mức task đều đã chạy.

## 4.4. Test (Evidence Gate)

### Mục tiêu

1. **Chứng minh hành vi bằng test chạy thực tế, không bằng lời nói:** Test là tài liệu sống duy nhất đáng tin cậy về hành vi hệ thống. Mỗi behavior mới hay thay đổi phải có ít nhất một test case kiểm chứng đầu ra theo cấu trúc Arrange-Act-Assert. Test pass không phải là kết quả cuối cùng mà là bằng chứng tối thiểu cần thiết trước khi chuyển giai đoạn.
2. **Ngăn tuyên bố hoàn tất khi thiếu bằng chứng chạy lệnh:** Không được phép nói "đã xong", "có vẻ ổn", hay "nên pass" nếu chưa có output lệnh test mới nhất từ lần chạy trong phiên làm việc hiện tại. Bất kỳ tuyên bố nào về trạng thái pass/fail mà không đi kèm bằng chứng chạy lệnh là thông tin không đáng tin cậy và không được chấp nhận.
3. **Bảo vệ chống regression một cách có hệ thống:** Mỗi bug fix phải đi kèm test tái hiện lỗi đó trước khi fix (RED), sau đó fix và xác nhận test pass (GREEN). Test regression này được giữ lại vĩnh viễn trong suite để ngăn lỗi quay lại. Không được xóa hoặc skip test chỉ vì nó bất tiện hay mất thời gian sửa.

### Hoạt động chính

1. **Viết test trước khi triển khai logic mới, theo đúng spec quality:** Đọc 04-quality.md để nắm test case yêu cầu cho phần đang implement. Viết test theo đúng Arrange/Act/Assert đã định nghĩa trong spec. Chạy ngay để xác nhận fail vì đúng lý do — implementation chưa tồn tại, không phải lỗi import, setup, hay mock. Bước này là RED trong vòng TDD và không được bỏ qua.
2. **Đảm bảo coverage đủ bốn nhóm tiêu chí chất lượng:** Happy path (luồng thành công chuẩn với dữ liệu hợp lệ), edge case (null, empty string, boundary value, giá trị biên), error/failure path (validation fail, unauthorized, network error, DB constraint violation), và auth/permission guard (kiểm tra với role không đủ quyền). Thiếu bất kỳ nhóm nào là coverage không đầy đủ theo tiêu chuẩn quality spec.
3. **Chạy full test suite và ghi lại output đầy đủ trước mỗi claim done:** Không chỉ chạy test file của task vừa hoàn thành. Phải chạy toàn bộ suite với lệnh `npx vitest run` hoặc tương đương để phát hiện regression do thay đổi gây ra ở nơi khác. Ghi lại số liệu: tổng test, pass, fail, skip như bằng chứng xác nhận trạng thái.
4. **Đọc output và exit code thực tế, không bỏ qua chi tiết:** Exit code 0 chưa đủ nếu có test bị skip vô lý. Đọc từng dòng output để xác nhận số test pass khớp với số test case đã viết. Nếu có bất đồng giữa số test expected và actual, điều tra nguyên nhân trước khi tiếp tục sang giai đoạn Review.

### Nguyên tắc quan trọng

1. Không dùng "should pass" thay cho bằng chứng.
2. Không bỏ qua test fail nếu chưa phân tích nguyên nhân.
3. Không tắt test chỉ để làm xanh CI cục bộ.

### Exit Criteria

1. Test command pass với output xác nhận rõ ràng.
2. Bao phủ testcase khớp với 04-quality.md.
3. Không còn failure chưa được xử lý.

## 4.5. Review (Release Gate)

### Mục tiêu

1. **Đánh giá chất lượng kỹ thuật một cách có hệ thống, không theo cảm tính:** Mỗi finding phải gắn với rule ID cụ thể từ rule catalog. Không review theo phong cách cá nhân hay kinh nghiệm riêng. Rule catalog bao phủ: code quality, architecture, TypeScript safety, Vue 3 patterns, security (OWASP Top 10), performance, PrimeVue, Pinia store, MySQL schema, và i18n compliance.
2. **Đảm bảo implementation khớp 100% với spec đã duyệt:** Đây là lớp review thứ hai, tập trung vào compliance thay vì style. Kiểm tra endpoint có đúng method/path/request body/response shape, screen item có đủ theo 02-frontend, event handler và UI state có đủ theo 03-behavior. Bất kỳ deviation nào so với spec đều là finding, bất kể có vẻ cải tiến hay không.
3. **Ra quyết định merge rõ ràng và ai đọc cũng hiểu ngay:** Verdict phải là một trong ba trạng thái: Ready (merge được ngay), Not Ready (có blocking issue chưa xử lý), hoặc With Fixes (merge được sau khi thực hiện danh sách cụ thể). Verdict mơ hồ hoặc điều kiện không rõ là không chấp nhận được.

### Hai lớp review

**Lớp 1 — Technical Review:**

Rà soát toàn bộ diff thay đổi so với base commit. Áp dụng rule catalog theo loại file:
- Tất cả file: Code quality (độ phức tạp cyclomatic, naming, dead code, side effect ẩn).
- Backend/Express: Architecture layers, security (input validation, auth guard, SQL injection prevention, rate limiting), performance (query N+1, index usage).
- Vue component: Vue 3 Composition API patterns, PrimeVue usage, i18n compliance (không dùng raw string trong template).
- TypeScript: Type safety, no implicit any, proper generics, exhaustive type narrowing.
- Pinia store: Action/getter boundary, no direct state mutation ngoài store, reactive state management.
- Database/SQL: Migration reversibility, index strategy, foreign key constraint, data type appropriateness.

Mỗi finding ghi rõ: Rule ID, vị trí file:line, severity (Critical/Important/Minor), mô tả vấn đề và tác hại, hướng fix cụ thể.

**Lớp 2 — Spec Compliance Review:**

Đối chiếu implementation với từng file spec:
- 01-backend.md: Endpoint tồn tại đúng HTTP method/path, request body DTO khớp, response shape khớp, tất cả validation rule được áp dụng đúng, error code trả về đúng spec.
- 02-frontend.md: Tất cả screen item có mặt, props/emits interface khớp, i18n key được dùng thay vì hardcoded string, cấu trúc component boundary đúng phân chia trong spec.
- 03-behavior.md: Tất cả event handler được implement, tất cả UI state được xử lý đầy đủ (loading, empty, error, success), navigation flow và confirm dialog có mặt đúng nơi.

### Output review

1. **Findings table** với 5 cột đầy đủ: Rule ID (hoặc "spec"), File:Line, Severity, Mô tả vấn đề và tác hại, Fix action cụ thể.
2. **Summary table** theo nhóm: Critical/Important/Minor riêng cho Technical Review và Spec Compliance Review.
3. **Verdict rõ ràng:** Ready / Not Ready / With Fixes kèm danh sách required actions phải hoàn thành trước merge.
4. **Strengths section:** Ghi nhận những điểm được thực hiện tốt để củng cố pattern tốt và chia sẻ học hỏi trong team.

### Exit Criteria

1. Critical findings đã được xử lý.
2. Important findings đã được xử lý trước merge.
3. Minor findings có kế hoạch xử lý rõ ràng.

## 5. Mapping Skills theo Workflow

1. Brainstorming:
- Dẫn dắt discovery và hoàn thiện spec package.

2. Writing-plans:
- Chuyển spec thành execution plan theo phase, có dependency và khả năng song song.

3. Executing-plans:
- Điều phối triển khai theo task lane, tích hợp và xác minh tiến độ.

4. Test-driven-development:
- Bảo đảm RED -> GREEN -> REFACTOR cho thay đổi hành vi.

5. Verification-before-completion:
- Bắt buộc có bằng chứng chạy lệnh trước mọi claim hoàn tất.

6. UT-review:
- So khớp coverage UT với quality spec và bổ sung thiếu hụt.

7. Code-review:
- Review 2 lớp (technical + spec compliance) trước merge.

8. Coding-guidelines:
- Giữ code đơn giản, đúng trọng tâm, tránh over-engineering.

## 6. Governance và Quality Gates

### Gate 1: Design Gate
- Điều kiện qua gate: Spec được duyệt.
- Nếu fail: Quay lại Brainstorming.

### Gate 2: Planning Gate
- Điều kiện qua gate: Plan có task rõ, verify rõ.
- Nếu fail: Quay lại Plan.

### Gate 3: Evidence Gate
- Điều kiện qua gate: Có output test/build mới nhất.
- Nếu fail: Quay lại Execute/Test.

### Gate 4: Review Gate
- Điều kiện qua gate: Critical/Important findings đã xử lý.
- Nếu fail: Quay lại Execute để fix.

## 7. KPI đề xuất theo dõi hiệu quả

1. Lead time từ approved spec đến ready-to-merge.
2. Tỷ lệ rework do thiếu rõ ràng trong spec.
3. Tỷ lệ defect phát sinh sau merge.
4. Tỷ lệ pass full test suite ở lần chạy đầu tiên.
5. Số lượng Critical/Important findings mỗi feature.
6. Tỷ lệ task chạy song song thành công không conflict.

## 8. Rủi ro thường gặp và biện pháp

1. Rủi ro: Brainstorming chưa đủ sâu.
- Hậu quả: Kế hoạch sai hướng.
- Biện pháp: Bổ sung câu hỏi làm rõ trước khi chốt design.

2. Rủi ro: Plan quá chung chung.
- Hậu quả: Executor phải đoán, tăng lỗi.
- Biện pháp: Bắt buộc file path + command + expected output.

3. Rủi ro: Claim done khi chưa verify.
- Hậu quả: Sai lệch chất lượng thực tế.
- Biện pháp: Áp gate verification-before-completion.

4. Rủi ro: Review chỉ nhìn style, bỏ sót logic.
- Hậu quả: Bug lọt vào production.
- Biện pháp: Review hai lớp, ưu tiên behavior/spec compliance.

## 9. Kết luận

Workflow Brainstorming -> Plan -> Execute -> Test -> Review tạo ra chuỗi kiểm soát chất lượng khép kín, có khả năng mở rộng theo team hoặc multi-agent. Điểm mạnh cốt lõi là:

1. Làm đúng trước khi làm nhanh.
2. Dùng bằng chứng thay cho giả định.
3. Ra quyết định merge dựa trên finding có cấu trúc.

Với mô hình này, tổ chức có thể tăng tốc delivery mà vẫn giữ được độ tin cậy kỹ thuật ở mức cao.

## 10. Deep Dive: Brainstorming

Phần này làm rõ cách vận hành Brainstorming theo hướng thực thi được ngay, tránh tình trạng "thảo luận nhiều nhưng không chốt được thiết kế".

### 10.1. Mục tiêu chi tiết của Brainstorming

1. Xác nhận đúng business goal thay vì chỉ bám yêu cầu bề mặt.
2. Chuyển yêu cầu mơ hồ thành acceptance criteria rõ ràng.
3. Chốt design baseline đủ chắc để chuyển sang Planning.

### 10.2. Bộ câu hỏi chuẩn (question bank)

#### Nhóm A: Mục tiêu và phạm vi

1. Mục tiêu kinh doanh quan trọng nhất của tính năng là gì?
2. Người dùng mục tiêu là ai, vai trò nào chịu tác động trực tiếp?
3. Điều gì nằm ngoài phạm vi ở phiên bản hiện tại?
4. Nếu phải cắt 50% scope, phần nào bắt buộc phải giữ?

#### Nhóm B: Luồng nghiệp vụ

1. Luồng chuẩn (happy path) của người dùng diễn ra thế nào?
2. Các nhánh thay thế (alternative flow) nào thường gặp?
3. Trường hợp lỗi nghiêm trọng nhất là gì và hệ thống phản hồi thế nào?
4. Có yêu cầu rollback hoặc bù trừ dữ liệu khi thất bại không?

#### Nhóm C: Dữ liệu và quy tắc

1. Trường dữ liệu bắt buộc là gì? Có giới hạn định dạng/độ dài không?
2. Có quy tắc validation liên quan vai trò (role-based) không?
3. Có ràng buộc tính nhất quán với dữ liệu cũ không?
4. Có yêu cầu audit trail/log để truy vết không?

#### Nhóm D: Chất lượng và vận hành

1. Tiêu chí "xong" được đo bằng những chỉ số nào?
2. Ngưỡng hiệu năng chấp nhận được là bao nhiêu?
3. Yêu cầu bảo mật bắt buộc là gì (authz, masking, rate limit)?
4. Mức ưu tiên: tốc độ delivery hay độ đầy đủ chức năng?

### 10.3. Mẫu cấu trúc phiên Brainstorming (45-60 phút)

1. 0-10 phút: Khung bài toán và mục tiêu thành công.
2. 10-25 phút: Làm rõ phạm vi, dependency, rủi ro.
3. 25-40 phút: Trình bày 2-3 phương án và trade-off.
4. 40-50 phút: Chọn phương án khuyến nghị.
5. 50-60 phút: Chốt yêu cầu đầu ra của spec package.

### 10.4. Mẫu đánh giá 2-3 phương án

Mỗi phương án nên được chấm theo thang điểm 1-5 trên cùng bộ tiêu chí:

1. Phù hợp mục tiêu business.
2. Độ phức tạp triển khai.
3. Khả năng mở rộng về sau.
4. Rủi ro vận hành và bảo trì.
5. Tốc độ ra phiên bản đầu tiên.

Khuyến nghị chọn phương án có tổng điểm tốt nhất nhưng phải thỏa các điều kiện cứng:

1. Không vi phạm yêu cầu bảo mật/bền vững dữ liệu.
2. Có thể kiểm chứng qua test trong giai đoạn hiện tại.
3. Không vượt quá phạm vi của một vòng plan -> execute.

### 10.5. Tiêu chuẩn Definition of Ready cho giai đoạn Plan

Chỉ chuyển sang Plan khi tất cả điều kiện dưới đây đều đúng:

1. Bài toán có statement rõ: input, output, actor, ràng buộc.
2. Phạm vi có danh sách in-scope và out-of-scope.
3. Quy tắc nghiệp vụ chính đã được mô tả không mơ hồ.
4. Các API/UI state chính đã có mô tả hành vi.
5. Bộ test case khung trong 04-quality.md đã có cấu trúc sơ bộ.

### 10.6. Anti-pattern thường gặp trong Brainstorming

1. Vào thẳng giải pháp trước khi chốt vấn đề.
2. Đặt quá ít câu hỏi về ngoại lệ và lỗi.
3. Chốt phạm vi bằng ngôn ngữ chung chung, không đo được.
4. Bỏ qua ràng buộc vận hành (monitoring, logging, rollback).
5. Không ghi rõ giả định, dẫn đến tranh cãi ở giai đoạn execute.

### 10.7. Cơ chế giảm rủi ro cho Brainstorming

1. Ghi rõ Assumptions + Open Questions trong 00-index.md.
2. Mọi quyết định quan trọng phải có rationale ngắn gọn.
3. Mỗi yêu cầu phải truy vết được về source (user statement hoặc CR).
4. Không chuyển pha nếu còn mâu thuẫn giữa backend/frontend/behavior.

### 10.8. Deliverable checklist cuối phiên Brainstorming

1. Có 2-3 approaches kèm trade-off.
2. Có phương án khuyến nghị và lý do chọn.
3. Có scope boundary rõ ràng.
4. Có quality baseline để chuẩn bị viết test.
5. Có spec package skeleton đầy đủ để chuyển sang phase Plan.

## 11. Deep Dive: Plan

Phần này chuẩn hóa cách viết implementation plan để executor có thể bắt đầu ngay mà không cần hỏi lại nhiều lần.

### 11.1. Mục tiêu của phase Plan

1. Biến spec thành task thực thi có thứ tự rõ ràng.
2. Tối đa hóa khả năng chạy song song an toàn.
3. Bảo đảm mỗi task đều có tiêu chí verify cụ thể.

### 11.2. Cấu trúc tài liệu plan khuyến nghị

1. Goal: Một câu mô tả giá trị sẽ được tạo ra.
2. Architecture: 2-3 câu mô tả hướng kỹ thuật.
3. Tech stack: Liệt kê công nghệ dùng cho feature.
4. Execution phases: Chia theo dependency, không chia hình thức.
5. Task detail: Mỗi task có phase, depends on, files, steps, verify.

### 11.3. Mẫu phase chuẩn

#### Phase 1: Foundation

1. Migration/schema.
2. Shared types/interfaces.
3. Seed/config nền tảng.

Đặc điểm: Các phase sau phụ thuộc vào phase này.

#### Phase 2: Core Implementation (parallel)

1. Backend API/service.
2. Frontend store/composable.

Đặc điểm: Có thể tách lane nếu giảm xung đột file trung tâm.

#### Phase 3: UI Layer (parallel)

1. Danh sách (List).
2. Tạo mới (Create).
3. Cập nhật (Edit/Detail).

Đặc điểm: Chỉ chạy sau khi contract dữ liệu ở Phase 2 ổn định.

#### Phase 4: Quality

1. Unit tests.
2. Integration tests.
3. (Tùy phạm vi) E2E critical flows.

Đặc điểm: Chốt bằng evidence chạy test thật.

### 11.4. Template task tiêu chuẩn (thực thi được ngay)

Mỗi task nên chứa đủ các trường sau:

1. Task name.
2. Phase.
3. Depends on.
4. Spec reference (file + section).
5. Files create/modify/test.
6. Step 1: Write failing test (RED).
7. Step 2: Implement minimal change (GREEN).
8. Step 3: Refactor + re-run tests (REFACTOR).
9. Verify command + expected output.
10. Effort estimate.

### 11.5. Quy tắc quality cho task mô tả

1. Không dùng từ mơ hồ: "xử lý phù hợp", "nâng cấp logic", "cập nhật cần thiết".
2. File path phải cụ thể.
3. Mỗi task chỉ có một mục tiêu chức năng chính.
4. Mỗi task có định nghĩa "done" quan sát được.

### 11.6. Quy tắc dependency và song song

1. Chỉ khai báo depends-on khi thật sự có ràng buộc kỹ thuật.
2. Hai task cùng sửa nặng một file thì không nên ở hai lane song song.
3. Ưu tiên tách theo vertical slice hơn là tách theo tầng kỹ thuật thuần túy.
4. Luôn tự kiểm tra: "Nếu dispatch song song ngay bây giờ có đụng nhau không?"

### 11.7. Checklist self-review cho plan

1. Có task nào thiếu spec reference không?
2. Có task nào thiếu command verify không?
3. Có command nào thiếu expected output không?
4. Có bước nào chứa placeholder/TBD không?
5. Có hidden dependency nào chưa ghi rõ không?
6. Có yêu cầu trong spec chưa được map vào task nào không?

### 11.8. Definition of Ready để chuyển sang Execute

1. Tất cả task đều có step RED/GREEN/REFACTOR.
2. Phase và dependency rõ, không mâu thuẫn.
3. Có thể giao cho executor mới mà không cần giải thích thêm.
4. Verification plan đủ để chứng minh trạng thái done.

### 11.9. Anti-pattern thường gặp ở phase Plan

1. Chia phase theo module tổ chức thay vì dependency thật.
2. Task quá lớn, kéo dài nhiều ngày, khó rollback.
3. Gộp nhiều mục tiêu trong một task.
4. Thiếu bước verify trung gian, chỉ verify ở cuối.
5. Không cập nhật plan khi phạm vi thay đổi có kiểm soát.

### 11.10. Mẫu mini-plan tham khảo

1. Phase 1: Tạo migration + cập nhật shared type.
2. Phase 2A (parallel): Implement API endpoint theo spec backend.
3. Phase 2B (parallel): Implement store action theo spec frontend.
4. Phase 3A (parallel): List page + loading/empty/error states.
5. Phase 3B (parallel): Create form + validation states.
6. Phase 4: Viết UT theo 04-quality.md và chạy full suite.

Mẫu này nên được điều chỉnh theo quy mô feature, nhưng luôn giữ nguyên nguyên tắc: rõ task, rõ verify, rõ dependency.

## 12. So sánh: Agent Skills vs Raw Prompting vs Copilot Instructions

### 12.1. Tổng quan ba mô hình

Ba mô hình dưới đây đều dùng AI assistant nhưng khác nhau về cách kiểm soát hành vi, tính nhất quán, và khả năng duy trì chất lượng qua nhiều phiên làm việc.

| Tiêu chí | Raw Prompting | Copilot Instructions | Agent Skills |
|---|---|---|---|
| Định nghĩa | Nhập lệnh trực tiếp mỗi lần, không có cấu trúc lặp lại | File cấu hình hành vi global cho toàn workspace | Module kỹ năng chuyên biệt, kích hoạt theo ngữ cảnh |
| Phạm vi áp dụng | Mỗi câu trả lời độc lập | Toàn bộ workspace | Từng domain/task cụ thể |
| Tính nhất quán | Thấp — phụ thuộc chất lượng prompt từng lần | Trung bình — áp dụng rule chung nhưng không có workflow | Cao — workflow được định nghĩa trước và bắt buộc |
| Khả năng tái sử dụng | Không — cần viết lại prompt mỗi lần | Một phần — rule được tái dụng nhưng context không | Cao — skill được gọi bất cứ lúc nào cần |
| Kiểm soát quy trình | Không có | Có một phần (naming convention, comment style) | Đầy đủ (hard gate, checklist, exit criteria) |
| Chi phí khởi tạo | Thấp nhất | Thấp — vài file config | Cao hơn — cần thiết kế và viết skill |
| Chi phí vận hành lâu dài | Cao — lặp lại nhiều, kết quả không đồng đều | Trung bình | Thấp — consistent output với ít effort |

---

### 12.2. Raw Prompting

#### Mô tả

Raw prompting là cách dùng AI phổ biến nhất. Người dùng gõ câu hỏi hoặc yêu cầu tự do, không có cấu trúc bổ sung nào. Mỗi phiên bắt đầu từ đầu.

#### Ưu điểm

1. Không cần chuẩn bị gì trước, bắt đầu ngay.
2. Linh hoạt hoàn toàn với mọi loại yêu cầu.
3. Phù hợp với câu hỏi một lần, không lặp lại.

#### Nhược điểm

1. **Không nhất quán:** Cùng một yêu cầu nhưng prompt khác nhau dẫn đến kết quả khác nhau. Không có cơ chế đảm bảo chất lượng giữa các phiên.
2. **Không có workflow kiểm soát:** Không có gate, không có checklist, không có exit criteria. AI có thể bỏ qua bước quan trọng nếu prompt không đề cập rõ.
3. **Phụ thuộc kỹ năng viết prompt:** Kết quả tốt hay xấu phụ thuộc vào người dùng có biết cách prompt tốt không. Không thể scale trong team.
4. **Không có traceability:** Không có lịch sử quyết định, không biết tại sao AI làm theo hướng đó.
5. **Drift theo thời gian:** Cùng một task sau vài tuần có thể cho kết quả hoàn toàn khác vì không có anchor cố định.

#### Phù hợp với

1. Khám phá ý tưởng nhanh, không cần bảo đảm chất lượng.
2. Câu hỏi tra cứu, giải thích khái niệm.
3. Task một lần, không lặp lại.

---

### 12.3. Copilot Instructions

#### Mô tả

Copilot Instructions là file cấu hình (`.github/copilot-instructions.md`) định nghĩa hành vi mặc định cho AI trong toàn workspace. Nó hoạt động như "standing orders" — quy tắc luôn được áp dụng không cần nhắc lại mỗi lần.

#### Ưu điểm

1. **Áp dụng toàn workspace tự động:** Không cần nhắc lại naming convention, comment style, hay tech stack preference mỗi lần.
2. **Phù hợp cho rule ổn định:** Convention không thay đổi thường xuyên rất hợp để đưa vào Instructions.
3. **Khai báo skill reference:** Có thể dùng Instructions để chỉ định khi nào load skill nào, tạo cầu nối giữa Instructions và Agent Skills.
4. **Chi phí thấp để thiết lập:** Chỉ cần một file Markdown, không cần cấu hình phức tạp.

#### Nhược điểm

1. **Không có workflow:** Instructions định nghĩa "làm thế nào" nhưng không định nghĩa "theo thứ tự nào" hay "khi nào được phép tiếp tục". Không thể tạo hard gate bằng Instructions thuần.
2. **Không có domain-specific depth:** Một file Instructions phải phục vụ mọi loại task. Nếu viết quá chi tiết cho một domain thì gây nhiễu cho các domain khác.
3. **Không thể bắt buộc checklist:** Instructions gợi ý nhưng không enforced. Nếu AI quên một bước, không có cơ chế tự phát hiện và nhắc lại.
4. **Khó version control theo feature:** Instructions là global, không thể bật/tắt theo feature hay context.

#### Phù hợp với

1. Quy ước chung cho toàn team (naming, comment language, import style).
2. Khai báo tech stack và thư viện ưu tiên.
3. Điều phối việc load skill phù hợp theo trigger.

---

### 12.4. Agent Skills

#### Mô tả

Agent Skills là module kỹ năng chuyên biệt, được định nghĩa trong file SKILL.md riêng biệt. Mỗi skill bao gồm workflow bắt buộc, checklist, exit criteria, và hard gate. Skills được kích hoạt khi ngữ cảnh phù hợp (trigger) hoặc khi được gọi tường minh.

#### Ưu điểm

1. **Workflow có cấu trúc và bắt buộc:** Mỗi skill định nghĩa thứ tự bước, điều kiện chuyển bước, và exit criteria. AI không thể bỏ qua bước quan trọng vì skill đặt hard gate.\
2. **Chuyên sâu theo domain:** Skill Brainstorming chỉ biết về brainstorming. Skill TDD chỉ biết về TDD. Mỗi skill được thiết kế để làm một việc thật tốt thay vì làm nhiều việc ở mức trung bình.
3. **Tái sử dụng có kiểm soát:** Cùng một quy trình review được áp dụng nhất quán cho mọi feature. Không phụ thuộc vào chất lượng prompt từng lần.
4. **Composable — kết hợp được:** Skills có thể gọi lẫn nhau theo thứ tự định nghĩa trước (Brainstorming → Writing-plans → Executing-plans → UT-review → Code-review). Đây là điều mà raw prompting hay Instructions không thể làm được một cách có cấu trúc.
5. **Traceability rõ ràng:** Mỗi output của skill có nguồn gốc rõ (skill nào, bước nào, dựa trên artifact nào). Dễ audit và debug khi có sự cố.
6. **Scale được trong team:** Khi thêm member mới, họ học workflow qua skill thay vì học cách viết prompt. Kiến thức được encode vào skill, không nằm trong đầu người.

#### Nhược điểm

1. **Chi phí thiết kế ban đầu cao:** Mỗi skill cần được thiết kế cẩn thận, viết workflow rõ ràng, định nghĩa trigger và exit criteria. Không thể làm qua loa.
2. **Cần maintenance:** Khi quy trình thay đổi, skill phải được cập nhật. Skill lỗi thời còn nguy hiểm hơn không có skill.
3. **Over-engineering cho task đơn giản:** Không phải mọi task đều cần skill. Tra cứu nhanh, giải thích khái niệm, task chỉ làm một lần — raw prompting vẫn tốt hơn.

#### Phù hợp với

1. Workflow lặp lại nhiều lần trong team (feature development, code review, test coverage).
2. Quy trình có nhiều bước phụ thuộc nhau cần kiểm soát chặt.
3. Domain phức tạp cần checklist và exit criteria rõ ràng để tránh lỗi.

---

### 12.5. Khi nào dùng cái gì

| Tình huống | Lựa chọn phù hợp |
|---|---|
| Hỏi nhanh, tra cứu, giải thích | Raw Prompting |
| Quy ước code chung cả team | Copilot Instructions |
| Bắt đầu tính năng mới cần thiết kế | Agent Skill: Brainstorming |
| Viết kế hoạch triển khai từ spec | Agent Skill: Writing-plans |
| Triển khai feature phức tạp, nhiều task | Agent Skill: Executing-plans |
| Kiểm tra coverage UT | Agent Skill: UT-review |
| Review code trước merge | Agent Skill: Code-review |
| Sửa bug không rõ nguyên nhân | Agent Skill: Systematic-debugging |

---

### 12.6. Mô hình kết hợp tối ưu (Recommended Stack)

Cả ba mô hình không loại trừ nhau mà bổ sung cho nhau theo tầng:

1. **Tầng nền — Copilot Instructions:** Định nghĩa rule bất biến (tech stack, comment language, naming convention, skill trigger mapping). Hoạt động ngầm, không cần nhắc.
2. **Tầng workflow — Agent Skills:** Kích hoạt cho các domain lặp lại, phức tạp, cần kiểm soát chất lượng (feature development, testing, review). Cung cấp workflow có cấu trúc và hard gate.
3. **Tầng linh hoạt — Raw Prompting:** Dùng cho những gì không nằm trong skill nào hoặc task một lần không đáng tạo skill.

Mô hình này đảm bảo:
1. Quy ước chung được tuân thủ tự động (Instructions).
2. Quy trình phức tạp được thực hiện đúng và nhất quán (Skills).
3. Không over-engineer cho tác vụ đơn giản (Raw Prompting).
