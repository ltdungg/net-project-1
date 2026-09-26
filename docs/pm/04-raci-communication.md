# RACI và kế hoạch truyền thông

## 1. Viết tắt vai trò

Đội delivery gồm đúng 5 người: **PM** = Project Manager kiêm PO/BA/UAT coordinator; **FE** = Frontend Engineer kiêm UI/UX implementation; **BE1** = Backend Engineer 1 kiêm technical/domain lead; **BE2** = Backend Engineer 2 phụ trách transaction/integration; **DO** = DevOps Engineer kiêm platform/security/NFR quality gate.

Giảng viên/hội đồng hoặc Sponsor giả định không được tính trong 5 người delivery;
họ chỉ duyệt phạm vi/evidence. Mọi trách nhiệm thực thi phải thuộc PM, FE, BE1,
BE2 hoặc DO.

## 2. Ma trận RACI

| Hoạt động/sản phẩm bàn giao | PM | FE | BE1 | BE2 | DO | Phê duyệt/đầu vào ngoài đội |
|---|---|---|---|---|---|---|
| Charter, scope, timeline, RAID | A/R | C | C | C | C | Người phê duyệt xác nhận baseline |
| PRD, BRD, use case, rules, RTM | A/R | C | C | C | C | Người phê duyệt được tham vấn |
| Backlog priority và acceptance | A/R | C | C | C | C | Người phê duyệt xử lý escalation |
| UI flows, prototype, responsive design | A | R | C | C | C | Người phê duyệt được tham vấn |
| Java/BFF architecture, schema và API conventions | C | C | A/R | R | R | — |
| Auth/catalog/customer segments/cart/order/report/Copilot backend | C | C | A/R | C | C | — |
| Inventory/payment mock/webhook/manual fulfillment backend | C | C | C | A/R | C | Provider thật ngoài baseline |
| Docker/CI/health/log/security và recovery design | C | C | C | C | A/R | Cloud/DR production ngoài baseline |
| Frontend storefront/admin delivery | C | A/R | C | C | C | — |
| Unit/API/integration test | A for gate | R frontend | R BE1 scope | R BE2 scope | R platform/E2E | — |
| UAT execution và sign-off pack | A/R | R | R | R | R | Business signs off |
| Content/catalog/policy demo readiness | A/R | C | C | C | I | Người phê duyệt xác nhận |
| Đạt/Không đạt nghiệm thu | R | C | C | C | C | Giảng viên/hội đồng hoặc Sponsor giả định quyết định |
| Docker release candidate và nghiệm thu | A for coordination | C | C | C | R | Giảng viên/Sponsor được thông báo |
| Quyết định mở rộng lên production/provider thật | R | C | C | C | C | Sponsor/owner chịu trách nhiệm phê duyệt |

Mỗi dòng chỉ nên có một `A`; bảng phải được cập nhật khi tên người cụ thể được bổ nhiệm.

## 3. Các cuộc họp định kỳ

| Cuộc họp | Tần suất | Thành phần | Mục đích/kết quả | Thời lượng |
|---|---|---|---|---|
| Daily stand-up | Daily | Đủ 5 thành viên delivery | Progress, plan, blockers | 15 min |
| Backlog refinement | 2×/week | PM, FE, BE1, BE2, DO | Ready stories, questions, estimate | 45 min |
| Sprint planning | Every 2 weeks | 5-person team | Sprint goal/forecast | 90 min |
| Sprint review/demo | Every 2 weeks | Đội + người phê duyệt | Accepted value, feedback | 60 min |
| Retrospective | Every 2 weeks | 5-person team | Improvement actions with owner | 45 min |
| Project status/RAID | Weekly | 5 người; người phê duyệt nhận báo cáo | Forecast, milestones, RAID, decisions | 30 min |
| Decision slot | Weekly/on demand | Người phê duyệt, PM, kỹ sư liên quan | Scope/risk/known-limit decision | 30 min |
| Nghiệm thu stand-up | Hằng ngày trong tuần 8 | 5 thành viên + đầu mối phê duyệt khi cần | Readiness, lỗi và evidence | 15–30 min |

## 4. Tài liệu truyền thông

| Tài liệu | Người nhận | Người phụ trách | Tần suất/thời điểm | Kênh |
|---|---|---|---|---|
| Weekly status report | Đội/người phê duyệt | PM | Weekly | Repository/email |
| Product backlog | Đội delivery | PM | Continuous | Jira equivalent |
| Requirements/RTM | Đội/người phê duyệt | PM | Per change/review | Repository |
| RAID/decision/change logs | Đội/người phê duyệt | PM | Weekly/on event | Repository/project space |
| Design/prototype | Đội/người phê duyệt | FE | Per iteration | Design tool |
| Technical ADR/API docs | Engineering | BE1 | Per decision/change | Repository |
| Platform/runbook docs | Team/support | DO | Per environment/release | Repository/ops space |
| Release notes, known limits và hướng dẫn chạy | Người chấm/người tiếp nhận | PM | Release candidate | Repository/ops space |

## 5. Mẫu báo cáo trạng thái hằng tuần

```text
RAG status: Scope / Schedule / Cost / Quality / Risk
This week: outcomes completed
Next week: outcomes planned
Milestones: baseline date, forecast date, variance
Delivery metrics: accepted scope, remaining scope, defects by severity
Top risks/issues/dependencies: owner, action, due date
Decisions/change requests needed: decision owner and deadline
Budget/capacity: actual/forecast if tracked
```

## 6. Luồng báo cáo vượt cấp

1. Team resolves operational blocker trong 1 business day nếu trong quyền.
2. PM/PO/TL xử lý cross-team, scope hoặc technical trade-off.
3. Người phê duyệt xử lý ngày, scope tolerance và blocker vượt quyền đội.
4. Security/privacy incident đi theo incident response ngay, không chờ cadence dự án.

## 7. Quy ước làm việc

- Quyết định quan trọng được ghi bằng decision ID, owner, ngày và rationale.
- Feedback không làm thay đổi scope cho đến khi được đưa vào backlog/change process.
- Repository là source of truth cho requirement, mã nguồn và release status;
  không coi màn hình demo hoặc dữ liệu seed là bằng chứng production.
- Blocker có owner, next action và due date; không chỉ ghi mô tả.
