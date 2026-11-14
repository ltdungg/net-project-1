# Deploy NÉT lên AWS bằng một EC2

Terraform tạo **1 EC2 Ubuntu 24.04**, ổ đĩa gp3 40 GiB, một Elastic IP cố
định và mạng VPC riêng. Docker Compose chạy Caddy, frontend, API Java,
PostgreSQL và Redis trên máy đó. Không cần ECR, RDS, load balancer hay GitHub
public; script gửi mã nguồn từ máy bạn qua SSH rồi build trên EC2.

Cổng SSH 22 mở từ mọi IP (`0.0.0.0/0`), đăng nhập bằng key pair `aws-key-pair`.
Bạn không cần khai báo IP máy cá nhân. Các cổng web 80/443 cũng được mở;
PostgreSQL, Redis và API giao tiếp trong mạng Docker.

Mặc định dùng `t3.medium` (4 GiB RAM), thêm 2 GiB swap để hỗ trợ build.
AWS tính phí EC2, ổ đĩa và IPv4 public; cấu hình này không mặc định miễn phí.

## 1. Chuẩn bị

Chạy từ thư mục gốc repository trên Linux, macOS hoặc WSL. Máy bạn cần:

- Terraform >= 1.6 và < 2, AWS CLI, Bash, SSH, tar, curl, OpenSSL.
- AWS credential có quyền quản lý EC2, Elastic IP, VPC, security group và đọc key pair (`ec2:DescribeKeyPairs`).
- Không cần cài Docker, Node hay Java trên máy của bạn để deploy.

Đăng nhập AWS theo cách bạn đang dùng:

```bash
# Nếu dùng access key, nhập khi AWS CLI hỏi:
aws configure --profile default

# Hoặc nếu tài khoản dùng SSO:
# aws configure sso --profile my-profile
# aws sso login --profile my-profile
```

Dùng key pair **`aws-key-pair`** đã tạo trên AWS, trong cùng account và region
với EC2. Terraform tra cứu key pair này theo tên. Lưu file private key đã tải
từ AWS, ví dụ tại `~/.ssh/aws-key-pair.pem`, rồi đặt quyền:

```bash
chmod 400 ~/.ssh/aws-key-pair.pem
```

Nếu lưu file ở nơi khác, sửa `SSH_PRIVATE_KEY` trong `.envrc`. Không cần file
`.pub`. Nếu key có passphrase, nạp vào SSH agent bằng
`ssh-add ~/.ssh/aws-key-pair.pem` (agent cần đang chạy).
Xem [hướng dẫn key pair của AWS](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-key-pairs.html).

## 2. Điền `.envrc`

File `.envrc` đã được chuẩn bị trong workspace. Với bản clone mới, tạo từ mẫu:

```bash
cp -n .envrc.example .envrc
chmod 600 .envrc
```

Mở `.envrc` và sửa:

| Biến | Giá trị cần điền |
| --- | --- |
| `AWS_PROFILE` | Tên profile đã đăng nhập; mặc định `default` |
| `AWS_REGION` | Mặc định `ap-southeast-1` (Singapore) |
| `TF_VAR_key_pair_name` | Tên key pair có sẵn trên AWS: `aws-key-pair` |
| `SSH_PRIVATE_KEY` | File private key đã tải từ AWS; mặc định `~/.ssh/aws-key-pair.pem` |
| `POSTGRES_PASSWORD` | Mật khẩu database riêng |
| `JWT_SECRET` | Khóa ký đăng nhập riêng |
| `PAYMENT_WEBHOOK_SECRET` | Khóa webhook riêng |
| `ADMIN_EMAILS` | Email bạn sẽ dùng để đăng ký tài khoản quản trị |
| `DOMAIN` | Để trống để chạy qua IP; điền tên miền nếu dùng HTTPS |

Trong workspace hiện tại, ba secret ứng dụng đã được sinh và điền vào `.envrc`.
Email quản trị dùng `demo.admin@example.test`, giống tài khoản demo local.
Nếu tạo `.envrc` mới từ mẫu, chạy lệnh dưới **ba lần**, chép mỗi kết quả vào một
biến secret khác nhau:

```bash
openssl rand -hex 32
```

Giữ các giá trị secret cố định giữa những lần deploy. Đặc biệt, thay
`POSTGRES_PASSWORD` trong `.envrc` không tự đổi mật khẩu trong database đã tạo.

`.envrc` và Terraform state được Git bỏ qua. Private key chỉ dùng trên máy bạn
để kết nối SSH, không được gửi lên EC2 hoặc đưa vào Terraform state. Terraform
tham chiếu key pair có sẵn và không tạo/xóa key pair đó. Secret ứng dụng được
gửi qua SSH vào `.env` quyền `600` trên EC2, không đưa vào
Terraform state hoặc EC2 user data. Chỉ các thiết lập frontend không chứa secret
được đưa vào `frontend.env`.

Script tự đọc `.envrc`, không bắt buộc cài direnv. Nếu đã dùng direnv, chạy
`direnv allow` sau khi sửa. Với lệnh Terraform chạy thủ công, dùng `source .envrc`
trước.

## 3. Deploy

```bash
bash scripts/deploy-aws.sh
```

Terraform hiện danh sách tài nguyên và yêu cầu nhập `yes`. Sau đó script đợi
EC2 cài Docker, gửi source, build lần lượt backend/frontend, chạy Compose,
nạp seed demo khi các service sẵn sàng và kiểm tra `/api/health`.
Lần đầu cần chờ tải dependency và build. Node.js để chạy seed được tự cài trên
EC2 nếu chưa có; máy của bạn vẫn không cần cài Node.js.

Khi hoàn tất, script in URL `http://<ELASTIC_IP>`. Mở URL đó để dùng website.
Deploy bằng IP tự nạp bộ dữ liệu demo giống local: **96 khách hàng, 3 nhân sự,
279 đơn hàng**, phiếu vận chuyển, voucher và dashboard mẫu.

| Vai trò | Email | Mật khẩu demo |
| --- | --- | --- |
| Admin | `demo.admin@example.test` | `NetDemo2026!` |
| Quản lý | `demo.manager@example.test` | `NetDemo2026!` |
| Nhân viên | `demo.staff@example.test` | `NetDemo2026!` |
| Khách hàng | `customer01@example.test` đến `customer96@example.test` | `NetDemo2026!` |

Seed sao lưu database trước khi nạp tại `platform/work/demo-data/` trong thư mục
release trên EC2, rồi ghi trong một transaction có kiểm tra tính nhất quán.
Deploy lại, kể cả `--app-only`, không tạo trùng hoặc đặt lại mật khẩu/dữ liệu đã
thay đổi. Nếu seed thất bại, script dừng và không báo deploy thành công.
`ADMIN_EMAILS` vẫn dùng để cấp quyền cho email đăng ký thêm ngoài bộ seed.

Chế độ IP dùng `APP_ENV=local` vì ứng dụng hiện chỉ cho cookie đăng nhập qua
HTTP ở chế độ này. Đây là bản demo: có token xác minh email phục vụ phát triển
và chức năng thanh toán giả lập. `LOCAL_AUTH_BYPASS` luôn tắt. Dùng dữ liệu thử
cho chế độ này. Frontend giữ runtime Wrangler local hiện có của dự án.

## 4. HTTPS nếu có tên miền

1. Deploy bằng IP theo bước trên, hoặc chỉ tạo hạ tầng bằng các lệnh sau:

   ```bash
   source .envrc
   terraform -chdir=infra/aws init
   terraform -chdir=infra/aws apply
   terraform -chdir=infra/aws output -raw public_ip
   ```

2. Tạo bản ghi DNS **A**, ví dụ `shop.example.com`, trỏ về Elastic IP. Đợi DNS
   cập nhật. Không để bản ghi AAAA trỏ sang máy khác.
3. Đặt `DOMAIN="shop.example.com"` trong `.envrc`, rồi chạy:

   ```bash
   bash scripts/deploy-aws.sh --app-only
   ```

Caddy tự cấp/gia hạn chứng chỉ và chuyển HTTP sang HTTPS khi DNS trỏ đúng, các
cổng 80/443 truy cập được. Xem [tài liệu HTTPS của Caddy](https://caddyserver.com/docs/automatic-https).
Script đặt `APP_ENV=production`, bật cookie Secure và tắt các chức năng chỉ dành
cho local. Chế độ này **bỏ qua seed demo**; dữ liệu đã có từ lần deploy trước
được giữ nguyên. Ứng dụng hiện chưa tích hợp gửi email production; cần bổ sung gửi
email trước khi sử dụng luồng đăng ký/quên mật khẩu với người dùng thật.

## 5. Cập nhật và xem log

Sau khi sửa code hoặc thiết lập ứng dụng trong `.envrc`:

```bash
bash scripts/deploy-aws.sh --app-only
```

Sau khi sửa cấu hình EC2/mạng, chạy lại lệnh deploy đầy đủ. Đổi mạng trên máy cá
nhân không cần cập nhật cấu hình SSH.

SSH vào máy:

```bash
source .envrc
IP=$(terraform -chdir=infra/aws output -raw public_ip)
ssh -i "$SSH_PRIVATE_KEY" "ubuntu@$IP"
```

Trên EC2:

```bash
cd /opt/net-commerce/current
docker compose ps
docker compose logs --tail 100 api commerce proxy
docker compose restart
```

Docker tự khởi động cùng EC2 và các container tự chạy lại. Mỗi lần deploy tạo
một thư mục `release-*`; `current` trỏ tới lần deploy đã chạy Compose và bước seed
thành công (hoặc bỏ qua seed ở production).
Các volume database, Redis, upload và chứng chỉ dùng chung giữa các lần deploy.
Build không phải quy trình zero-downtime; cập nhật có thể gián đoạn ngắn.

Nếu deploy lỗi: log cài Docker nằm ở `/var/log/cloud-init-output.log`. Nếu build
hoặc khởi động container lỗi, vào thư mục `release-*` vừa tạo để chạy
`docker compose logs --tail 100`. Có thể sửa nguyên nhân rồi chạy lại script.
Nếu HTTPS chưa lên, kiểm tra DNS và log service `proxy`.

Phần build, khởi động và seed trên EC2 nằm trong `infra/aws/deploy-app.sh`, được
gửi cùng từng release rồi gọi qua SSH. Nếu bản script cũ báo
`REMOTE: command not found`, kiểm tra website và container trước: ứng dụng có
thể đã chạy xong trước khi báo lỗi. Dùng các file đã cập nhật cho lần deploy
tiếp theo: `bash scripts/deploy-aws.sh --app-only`; dữ liệu seed đã có được giữ nguyên.

## 6. Sao lưu và xóa tài nguyên

Sao lưu PostgreSQL về máy bạn, chạy từ gốc repository:

```bash
source .envrc
IP=$(terraform -chdir=infra/aws output -raw public_ip)
ssh -i "$SSH_PRIVATE_KEY" "ubuntu@$IP" \
  'cd /opt/net-commerce/current && docker compose exec -T postgres pg_dump -U net -d net_commerce' \
  > net-commerce-backup.sql
```

Đây chỉ là bản sao database. Ảnh upload nằm trong Docker volume `uploads_data`;
cần sao lưu thêm volume này hoặc snapshot EBS nếu muốn giữ đầy đủ dữ liệu.

Khi không dùng nữa:

```bash
source .envrc
terraform -chdir=infra/aws destroy
```

**Destroy xóa cả EC2, ổ đĩa và dữ liệu trên đó.** Thay đổi yêu cầu thay thế EC2
(ví dụ sửa `bootstrap.sh`) cũng xóa ổ đĩa cũ; luôn xem Terraform plan và sao lưu
trước khi chấp nhận. AMI Ubuntu mới được phát hành không tự thay thế EC2 đang chạy.
Giữ `infra/aws/terraform.tfstate` để Terraform quản lý/xóa đúng tài nguyên.
Không chạy `docker compose down -v` nếu muốn giữ dữ liệu. Dừng EC2 vẫn có thể
phát sinh phí ổ đĩa và IPv4; dùng `destroy` khi muốn gỡ toàn bộ cấu hình này.

Các file hạ tầng nằm trong [`infra/aws`](../infra/aws). Docker được cài từ
[APT repository chính thức](https://docs.docker.com/engine/install/ubuntu/).

Đã kiểm tra `terraform fmt`, `terraform validate`, cú pháp Bash, cấu hình Compose
và Caddy. Stack Docker thử riêng dùng image ứng dụng có sẵn đã chạy qua proxy:
health, trang chủ, catalog, đăng ký/xác minh email, quyền admin, cookie đăng nhập
và kiểm tra origin. Với `.envrc` hiện tại, `terraform plan` đã đọc AWS thành công,
tìm được key pair `aws-key-pair` và AMI Ubuntu; kế hoạch tạo 12 tài nguyên.
Sau lần deploy lên AWS, kiểm tra trực tiếp xác nhận các service đang chạy,
trang chủ/catalog/health trả HTTP 200 và seed có đủ 96 khách hàng, 3 nhân sự,
279 đơn hàng. Chưa thử cấp chứng chỉ HTTPS trên AWS.

Bước seed khi deploy đã được thử trên database riêng: nạp đủ 96 khách hàng,
3 nhân sự, 279 đơn hàng; admin/khách hàng đăng nhập được. Chạy lại giữ nguyên số
bản ghi, tên và mật khẩu đã sửa, đồng thời không tạo thêm bản sao lưu seed.

Sau khi tách script chạy trên EC2, đã kiểm thử mô phỏng toàn bộ luồng đóng gói,
gửi qua SSH và thực thi file cho demo/production. Lỗi build hoặc seed được trả
về nguyên mã lỗi và không báo deploy thành công.
