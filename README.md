# Pet Support - Hỗ Trợ & Bảo Vệ Vật Nuôi

Website hỗ trợ và bảo vệ vật nuôi - Node.js + Express (MVC)

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
