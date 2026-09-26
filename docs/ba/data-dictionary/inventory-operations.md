# Bảng inventory_operations

**Nguồn:** V1, constraint V3  
**Mục đích:** Header chứng từ nhập, chuyển, kiểm kê hoặc điều chỉnh tồn.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| operation_number | varchar(100) | Không | UNIQUE |
| type | varchar(30) | Không | receipt/transfer/stocktake/adjustment |
| status | varchar(30) | Không | posted; draft/posted/cancelled |
| source_warehouse_id | varchar(64) | Có | FK warehouses |
| destination_warehouse_id | varchar(64) | Có | FK warehouses |
| reference_number | varchar(120) | Có | Mã chứng từ ngoài |
| idempotency_key | varchar(160) | Không | UNIQUE |
| reason | varchar(500) | Không | — |
| notes | text | Có | — |
| created_by | varchar(64) | Có | FK users; SET NULL |
| posted_by | varchar(64) | Có | FK users; SET NULL |
| posted_at | timestamptz | Có | Bắt buộc khi status=posted |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

API hiện tạo posted ngay, một dòng item mỗi request; không có draft/review/
approval workflow. idempotency_key được scope theo operation type và actor.
Operation number có prefix RCV/TRF/CNT/ADJ.

Kiểm thử replay, timestamp posted, kho nguồn/đích, rollback toàn transaction.

