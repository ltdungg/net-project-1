# Kết quả Selenium E2E

Ngày kiểm thử: **22/10/2026**, múi giờ Asia/Ho_Chi_Minh. Phạm vi: 70 ca chạy UI thật → BFF → Java → PostgreSQL/Redis; không mock API nghiệp vụ.

## Môi trường

Node 24.21.0, TypeScript, Vitest 4.1.11, selenium-webdriver 4.51.0, Chrome for Testing 156.0.8078.47 headless do Selenium Manager quản lý. Frontend Vinext dev tại `18787`, Java tại `18080`, DB `net_commerce_e2e` tại `55432`, Redis tại `56379`. Compose project riêng `net-commerce-e2e`, Flyway V1–V7.

Firefox và chế độ có cửa sổ có cấu hình hỗ trợ nhưng chưa được xác minh trong chiến dịch này. Không chạy production hoặc staging dùng chung.

Sau xác minh đã dừng frontend và Compose project E2E, xóa `.dev.vars` tạm do runner tạo; giữ volume E2E và Docker daemon. Khởi động lại theo hướng dẫn trước khi chạy suite.

## Các lượt xác minh

| Lượt | Cách chạy | Kết quả |
| --- | --- | --- |
| Tuần tự đầy đủ | 1 worker, không retry | **68 PASS / 2 FAIL / 0 SKIP**, 213,85 giây |
| Chạy lại fail | `--rerun-failed` | Chọn đúng CART-006 và ORDER-010, cả hai vẫn FAIL; 68 ca không chọn; 38,01 giây |
| Smoke sau sửa quản lý profile | Chọn `@smoke`, headless | **6 PASS / 0 FAIL**, 18 giây |
| Song song cuối | 3 worker, không retry | **68 PASS / 2 FAIL / 0 SKIP**, 97,63 giây |

Báo cáo tuần tự: [HTML](../../test-results/selenium/2026-10-22T15-34-37-664Z/report.html). Báo cáo rerun: [HTML](../../test-results/selenium/2026-10-22T15-38-42-368Z/report.html). Các báo cáo/screenshot/log là artifact local được gitignore; bảng ca và tài liệu bàn giao được lưu trong source.

Báo cáo bàn giao cuối: [HTML chạy song song](../../test-results/selenium/2026-10-22T15-49-31-571Z/report.html), [JSON](../../test-results/selenium/2026-10-22T15-49-31-571Z/results.json), [JUnit](../../test-results/selenium/2026-10-22T15-49-31-571Z/junit.xml). [Bảng 70 ca](TEST_CASES.md) phản ánh lượt này. Hai lượt đầy đủ tuần tự và song song cùng chỉ fail CART-006 và ORDER-010.

Trong quá trình kiểm tra có hai sự cố môi trường được ghi nhận riêng:

- Lượt song song đầu có một lỗi tải module với 14 dòng `ERR_NETWORK_CHANGED` trong Chrome tại ORDER-003. Ca này pass ở lượt tuần tự tiếp theo. Không thêm retry để che lỗi.
- Lượt song song kế tiếp bị dừng với exit code 130 khi `/tmp` đầy do profile Chrome tự sinh còn sót sau nhiều chiến dịch thử. Đã dọn đúng profile thuộc tác vụ, dọn dữ liệu lượt bị ngắt và sửa fixture để dùng profile UUID tại thư mục kết quả rồi tự xóa. Lượt bị dừng không được coi là một full run thành công.

## Bug ứng dụng được tái hiện

### BUG-SEL-001 — Giỏ hàng bỏ qua lỗi vượt tồn kho

- **Mức độ:** Medium. **Test:** CART-006, marker `@known_bug` và `@regression`.
- **Tiền điều kiện:** SKU riêng tồn S=1; giỏ đang có 1 sản phẩm.
- **Bước:** mở giỏ, bấm Tăng.
- **Kỳ vọng:** giữ số lượng 1 và hiển thị thông báo không đủ tồn kho cho khách.
- **Thực tế:** PATCH `/api/commerce/cart/items/<id>` trả **409**; giỏ giữ số lượng cũ nhưng không có thông báo lỗi. Test timeout khi chờ `[role="alert"]`.
- **Nguyên nhân:** `app/gio-hang/cart-client.tsx`, hàm `change()` khoảng dòng 102–110 không kiểm tra `response.ok`, chỉ gọi `load()` sau request. Lỗi đổi số lượng chưa được nối vào UI.
- **Evidence:** [ảnh](../../test-results/selenium/2026-10-22T15-34-37-664Z/CART-006/failure.png), [console/HTTP 409](../../test-results/selenium/2026-10-22T15-34-37-664Z/CART-006/browser.log), [các bước](../../test-results/selenium/2026-10-22T15-34-37-664Z/CART-006/steps.log).
- **Gợi ý sửa:** kiểm tra response thao tác cart và hiển thị lỗi có ngữ nghĩa; không sửa nghiệp vụ trong lượt viết test này.

### BUG-SEL-002 — Khách vãng lai không vào được thanh toán online

- **Mức độ:** High trong luồng online local. **Test:** ORDER-010, marker `@known_bug` và `@regression`.
- **Tiền điều kiện:** khách không đăng nhập, có giỏ hợp lệ.
- **Bước:** checkout online; tạo đơn thành công; bấm Tiếp tục thanh toán trong cùng phiên.
- **Kỳ vọng:** token của đơn cho phép khách xem giao dịch, mock confirm và chuyển payment_status sang paid.
- **Thực tế:** UI báo `Không tìm thấy giao dịch hoặc bạn chưa có quyền mở đơn này.`; không có nút xác nhận. GET `/api/commerce/orders/<id>/guest?token=...` trả **400**.
- **Nguyên nhân:** `app/thanh-toan/[id]/online-payment-client.tsx` dòng 34–35 truyền token bằng query; `backend/.../order/OrderController.java` dòng 53–57 yêu cầu header `X-Guest-Order-Token`. Trang tracking đã dùng header đúng.
- **Đối chứng:** ORDER-006 (online member) và ORDER-001 (guest COD/tracking) pass.
- **Evidence:** [ảnh](../../test-results/selenium/2026-10-22T15-34-37-664Z/ORDER-010/failure.png), [console/HTTP 400, token đã che](../../test-results/selenium/2026-10-22T15-34-37-664Z/ORDER-010/browser.log), [các bước](../../test-results/selenium/2026-10-22T15-34-37-664Z/ORDER-010/steps.log).
- **Gợi ý sửa:** đồng bộ cách gửi token của payment với trang tracking và API contract. Test giữ kỳ vọng thành công để làm regression sau khi sửa.

Không dùng skip/xfail hay đổi assertion để hai bug thành PASS. Full suite vẫn trả exit code 1; chưa phải release gate xanh.

## Chất lượng bộ test và phạm vi thay đổi

- `npm run typecheck`, `npx oxlint e2e/selenium`, `git diff --check`: đã pass.
- Guard production đã được thử bằng URL ngoài localhost: bị từ chối trước khi tạo request.
- Hai ca fail có screenshot, steps log, browser log; HTML/JSON/JUnit/bảng Markdown được tạo.
- Explicit waits, implicit=0, native click; không XPath, không sleep cố định, không retry test.
- Lỗi helper thứ tự FK payments ở giai đoạn thử nghiệm đã sửa; dữ liệu lượt cũ và lượt bị ngắt đã được cleanup theo namespace. Không tính lỗi helper thành bug ứng dụng.
- Kiểm tra sau lượt cuối: 0 tài khoản/sản phẩm/promotion thuộc namespace test; 0 đơn, giỏ, payment, fulfillment, reservation, audit/outbox còn lại. Bốn giỏ rỗng từ lượt đầu lỗi cleanup được đối chiếu thời điểm tạo với log thao tác rồi xóa theo đúng UUID; không xóa toàn bảng. Thư mục profile riêng trống, không còn Chrome/ChromeDriver của lượt chạy.
- Chỉ sửa/thêm test, tài liệu test, dependency/script và tùy chọn TypeScript phục vụ script test. Không sửa UI/API/migration/logic nghiệp vụ, không commit credential thật.

## Giới hạn và CI/CD

Chưa bao phủ đầy đủ báo cáo/tài chính, phân khúc, promotion admin, upload, mọi phép inventory/fulfillment, đa kho và provider thật. Không chạy lại unit suite cũ để suy ra kết quả mới; lỗi security cũ trong README không phải phát hiện mới của Selenium.

Console còn cảnh báo hydration/asset, auth/me 401 của khách và refresh 429 khi nhiều lượt dùng chung IP trong cửa sổ rate limit. Không vô hiệu hóa rate limit. Số điện thoại checkout sai hiện chỉ báo chung `Không thể tạo đơn`; test xác nhận không có đơn mới, nhưng UX nên chỉ rõ trường sai.

CI đề xuất: Node 24 + Docker, mỗi job stack E2E riêng; 3 worker, no-retry; upload HTML/screenshot/log/JSON/JUnit bằng bước always; dừng và dọn stack do job sở hữu. `@smoke` có 6 ca; regression còn hai bug đang mở. Xem [hướng dẫn lệnh](HƯỚNG_DẪN_CHẠY_TEST.md).
