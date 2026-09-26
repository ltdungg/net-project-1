# Bảng payment_events

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Receipt sự kiện mock/provider và kết quả xử lý.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| payment_id | varchar(64) | Có | FK payments; SET NULL |
| provider | varchar(60) | Không | — |
| provider_event_id | varchar(160) | Không | Không rỗng |
| event_type | varchar(80) | Không | payment.succeeded/failed/refunded |
| signature_valid | boolean | Không | false |
| payload_json | jsonb | Không | Provider payload |
| processed_at | timestamptz | Có | Không trước created_at |
| processing_error | text | Có | — |
| created_at | timestamptz | Không | now() |

UNIQUE(provider, provider_event_id); index payment_id/created_at và partial index
unprocessed. Bảng không có processing_status, received_at, payload_hash hoặc
error_code riêng.

Webhook xác minh HMAC raw body trước khi áp state; duplicate không lặp side
effect. payload_json có thể chứa dữ liệu nhạy cảm provider nên cần retention/redaction.

Kiểm thử signature, duplicate, unknown event, out-of-order và processing_error.

