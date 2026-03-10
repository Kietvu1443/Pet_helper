# Pet Support - Hỗ Trợ & Bảo Vệ Vật Nuôi

Website hỗ trợ và bảo vệ vật nuôi - Node.js + Express (MVC)

## 🐳 Chạy bằng Docker (khuyên dùng)

Yêu cầu: đã cài Docker Desktop.

### Chạy lần đầu

```bash
docker compose up --build
```

Sau khi chạy xong, mở: http://localhost:3000

UI quản lý DB (phpMyAdmin): http://localhost:8080

### Chạy lại (không build lại)

```bash
docker compose up
```

### Chạy nền

```bash
docker compose up -d
```

### Dừng container

```bash
docker compose down
```

### Xóa cả dữ liệu DB (làm mới hoàn toàn)

```bash
docker compose down -v
```

Ghi chú:

- DB chạy trong service `db` (MySQL 8), app chạy trong service `app`.
- UI DB chạy trong service `phpmyadmin` (cổng `8080`).
- MySQL Docker map ra máy host cổng `3307` (để không trùng XAMPP `3306`).
- File `database/schema.sql` được chạy tự động khi khởi tạo DB lần đầu.
- Thông tin DB đã được cấu hình sẵn trong `docker-compose.yml`.

Đăng nhập phpMyAdmin:

- Server: `db`
- Username: `root`
- Password: `root123`

### Sync dữ liệu XAMPP -> Docker (1 lệnh)

Chạy trọn bộ backup + restore chỉ với 1 lệnh:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-xampp-to-docker.ps1
```

Backup raw từ XAMPP:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-xampp.ps1 -DbName pet_helper
```

Restore vào Docker (đổi tên file theo backup vừa tạo):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-docker.ps1 -SqlFile .\backups\pet_helper_YYYYMMDD_HHMMSS.sql
```

Tùy chọn:

- Nếu muốn import đè mà không reset DB trước: thêm `-NoReset`
- Nếu XAMPP có mật khẩu root: thêm `-Password your_password` khi chạy backup

Lưu ý encoding tiếng Việt:

- Script đã được cấu hình để dump/import theo `utf8mb4` an toàn trên Windows.
- Nếu bạn từng thấy dữ liệu dạng `M??o T??y`, hãy **backup lại từ XAMPP bằng script mới** rồi restore lại Docker.
- File dump cũ đã lỗi encoding thường không phục hồi chính xác, nên ưu tiên tạo dump mới.

## 🚀 Chạy

```bash
npm install
npm start
```

Mở http://localhost:3000

---

## 📁 Cấu trúc MVC

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  (Chạy JavaScript client-side và các trang web hiệu ứng     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP Request/Response
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js)                        │
├─────────────────┬───────────────────┬───────────────────────┤
│     MODEL       │    CONTROLLER     │        VIEW           │
│   (models/)     │   (controller/)   │      (views/)         │
├─────────────────┼───────────────────┼───────────────────────┤
│ Xử lý DATABASE  │ Xử lý LOGIC       │ Hiển thị HTML         │
│ - Đọc/ghi DB    │ - Nhận request    │ - Template EJS        │
│ - Query SQL     │ - Gọi Model       │ - Gửi HTML về browser │
│                 │ - Trả về View     │                       │
└─────────────────┴───────────────────┴───────────────────────┘
```

## 📂 Mỗi thư mục làm gì

| Thư mục       | File              | Chạy ở đâu       | Chức năng                             |
| ------------- | ----------------- | ---------------- | ------------------------------------- |
| `models/`     | `*.model.js`      | Server           | Làm việc với **database** (CRUD)      |
| `views/`      | `*.ejs`           | Server → Browser | **Hiển thị HTML** cho người dùng      |
| `controller/` | `*.controller.js` | Server           | **Xử lý logic**, kết nối Model ↔ View |
| `routes/`     | `*.route.js`      | Server           | **Điều hướng URL** đến Controller     |
| `public/`     | `*.js, *.css`     | Browser          | **Tương tác UI** (click, popup, CSS)  |

## 🔄 Luồng xử lý

```
1. Người dùng truy cập URL (ví dụ: /adopt)
         ↓
2. routes/adopt.route.js → Điều hướng đến controller
         ↓
3. controller/adopt.controller.js → Xử lý logic, gọi model
         ↓
4. models/pet.model.js → Lấy dữ liệu từ database
         ↓
5. views/adopt/index.ejs → Render HTML với dữ liệu
         ↓
6. Browser hiển thị trang + chạy JavaScript client
```

taskkill /F /IM node.exe

## 💡 Lưu ý quan trọng

- **Server-side JS** (`routes/`, `controller/`, `models/`) → KHÔNG có `document`, `window`
- **Client-side JS** (`<script>` trong `.ejs` hoặc `public/*.js`) → CÓ `document`, `window`
- SweetAlert2, jQuery, DOM manipulation → Phải đặt ở **client-side**

---

## 🗄️ Kết nối MySQL

### Cài đặt package

```bash
npm install mysql2
```

### Cấu hình kết nối (`config/db.js`)

```javascript
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost", // Địa chỉ MySQL server
  port: 3306, // Port mặc định
  user: "root", // Username
  password: "", // Password (để trống nếu không có)
  database: "pethelper", // Tên database
  connectionLimit: 10,
});

module.exports = { pool };
```

### Sử dụng trong Models

```javascript
const { pool } = require("../config/db");

// SELECT
const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);

// INSERT
const [result] = await pool.execute(
  "INSERT INTO users (name, email) VALUES (?, ?)",
  [name, email],
);

// UPDATE
await pool.execute("UPDATE users SET name = ? WHERE id = ?", [name, id]);
```

### Khởi tạo Database

```bash
# Chạy file schema.sql trong MySQL
mysql -u root -p < database/schema.sql
```

---

## 🔐 Hệ thống phân quyền

| Role     | Giá trị | Quyền hạn             |
| -------- | ------- | --------------------- |
| 👑 Admin | 0       | Toàn quyền + Quản trị |
| 🛠️ Staff | 1       | Thêm/sửa/xóa thú cưng |
| 👤 User  | 2       | Xem và nhận nuôi      |

### Cập nhật role cho tài khoản

```sql
-- Đổi thành Admin
UPDATE users SET role = 0 WHERE display_name = 'TênTàiKhoản';

-- Đổi thành Staff
UPDATE users SET role = 1 WHERE display_name = 'TênTàiKhoản';
```

### Tài khoản mặc định

- **Tên đăng nhập:** `Admin`
- **Mật khẩu:** `admin123`

⚠️ Nhắc nhở: Mã hoá mật khẩu đang TẮT. Khi deploy, hãy uncomment 3 dòng bcrypt trong models/User.js.
