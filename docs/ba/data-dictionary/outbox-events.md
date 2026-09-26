# Bảng outbox_events

**Nguồn:** V1, constraint V3  
**Mục đích:** Sự kiện được commit cùng transaction nghiệp vụ.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| aggregate_type | varchar(80) | Không | user/order/fulfillment/customer… |
| aggregate_id | varchar(64) | Không | ID aggregate |
| event_type | varchar(120) | Không | Tên chữ thường có dấu chấm |
| payload_json | jsonb | Không | Payload tối thiểu |
| status | varchar(30) | Không | pending; pending/processing/processed/failed/dead_letter |
| attempts | integer | Không | 0; ≥0 |
| available_at | timestamptz | Không | now() |
| processed_at | timestamptz | Có | Không trước created_at |
| last_error | text | Có | — |
| created_at | timestamptz | Không | now() |

Index (status, available_at). Bảng không có schema_version, locked_at hoặc
last_error_code. Source hiện chỉ ghi event; chưa có dispatcher nên phần lớn row
có thể ở pending.

Payload không chứa password/raw token/secret. Consumer tương lai phải dedup theo
event ID, retry có backoff và chuyển dead_letter khi vượt ngưỡng.

Kiểm thử transaction rollback, replay idempotent, payload redaction và backlog.
