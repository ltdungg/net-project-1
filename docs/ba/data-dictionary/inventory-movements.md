# Bảng inventory_movements

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Sổ cái biến động và dấu vết reservation.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| inventory_item_id | varchar(64) | Không | FK inventory_items |
| type | varchar(40) | Không | Service dùng opening, receipt, transfer_out, transfer_in, stocktake, manual_adjustment, reservation, release, sale |
| quantity_delta | integer | Không | Có thể bằng 0 cho reservation/release |
| balance_after | integer | Không | ≥0; là on_hand sau nghiệp vụ |
| reference_type | varchar(60) | Có | order, fulfillment, inventory_operation, migration… |
| reference_id | varchar(64) | Có | ID nguồn |
| reason | varchar(500) | Không | — |
| idempotency_key | varchar(160) | Có | UNIQUE |
| actor_user_id | varchar(64) | Có | FK users; SET NULL |
| created_at | timestamptz | Không | now() |

Index (inventory_item_id, created_at DESC) và partial
(reference_type, reference_id, created_at DESC). Bảng không có reserved_delta,
reason_code hay note riêng.

Ứng dụng không update/delete movement; database chưa có trigger append-only.
Kiểm thử key lặp, balance_after, cặp transfer, sale theo fulfillment và redaction.

