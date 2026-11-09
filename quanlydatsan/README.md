# Sân Nhà — Hệ thống quản lý và đặt sân bóng

Sân Nhà là đồ án web hỗ trợ khách tìm kiếm và đặt sân bóng trực tuyến, đồng thời cung cấp trang quản trị để quản lý sân, lịch đặt, tiền cọc và hoạt động kinh doanh. Giao diện và nội dung chính sử dụng tiếng Việt.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Tài khoản quản trị](#tài-khoản-quản-trị)
- [Các trang giao diện](#các-trang-giao-diện)
- [REST API](#rest-api)
- [Quy tắc nghiệp vụ](#quy-tắc-nghiệp-vụ)
- [Kiểm thử và build](#kiểm-thử-và-build)

## Tính năng

### Dành cho khách hàng

- Xem danh sách sân đang hoạt động; xem loại sân, vị trí, ảnh, mô tả và giá.
- Lọc sân theo loại sân; xem trang chi tiết và lịch còn trống.
- Chọn ngày, giờ bắt đầu và thời lượng; hệ thống chặn khung giờ đã qua, ngoài giờ mở cửa hoặc bị trùng.
- Đăng ký bằng OTP SMS xác thực số điện thoại (Twilio), đăng nhập và theo dõi các đơn trong **Lịch đặt**.
- Gửi yêu cầu xác nhận tiền cọc sau khi chuyển khoản ngoài ứng dụng.
- Tự hủy hoặc đổi lịch trước giờ bắt đầu ít nhất 12 tiếng.
- Đánh giá sân sau khi trận đấu kết thúc đối với đơn đã được xác nhận.
- Xem tin bóng đá được lấy từ RSS VnExpress Thể thao.
- Xem trang giới thiệu và hướng dẫn đặt sân.

### Dành cho quản trị viên

- **Tổng quan:** tiền cọc đã xác nhận, đơn chờ duyệt, yêu cầu cọc chờ xác nhận, tỷ lệ lấp đầy, sân được đặt nhiều, khung giờ phổ biến và tiền cọc theo ngày.
- **Chờ duyệt:** các đơn `pending` có cửa sổ thông báo tự bật khi phát hiện đơn mới; có badge, cảnh báo và thao tác duyệt/từ chối. Danh sách tự làm mới mỗi 15 giây khi trang quản trị đang mở.
- **Lịch sử đơn:** xem các đơn đã được xử lý, trạng thái đặt sân và trạng thái tiền cọc.
- **Quản lý sân:** thêm, sửa, tạm ngừng hoặc mở lại sân; tải tối đa 5 ảnh mỗi lần (JPG, PNG, WEBP, GIF; tối đa 5 MB/ảnh).
- **Quản lý tài khoản:** tìm kiếm user, cấp/hạ quyền admin; không cho tự hạ quyền hoặc hạ quyền admin cuối cùng.
- **Quản lý voucher:** tạo voucher phần trăm, số tiền hoặc khung giờ thấp điểm; bật/tắt voucher.
- Xác nhận tiền cọc khi khách báo đã chuyển; khách nhận email cập nhật khi đơn thay đổi nếu cấu hình email đã bật.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | Angular 21, standalone components, TypeScript 5.9, Angular Router, Reactive Forms, Signals |
| Giao diện | HTML, SCSS, Tailwind CSS 4 |
| Gọi API | Angular `HttpClient`, RxJS |
| Backend | Node.js, Express 5 |
| Cơ sở dữ liệu | MongoDB, Mongoose 8 |
| Xác thực | JSON Web Token (JWT), bcrypt, OTP SMS Twilio |
| Email | Nodemailer, SMTP |
| Tin tức | RSS VnExpress Thể thao, `fast-xml-parser`, cache phía server 10 phút |
| Tải ảnh | Multer; ảnh được lưu trong `backend/uploads/pitches` |
| Kiểm thử frontend | Vitest, Angular build/test |

## Cấu trúc dự án

```text
quanlydatsan/
├── README.md                         # Tài liệu tổng quan dự án
├── backend/                          # REST API và nghiệp vụ
│   ├── server.js                     # Khởi tạo Express, MongoDB và API
│   ├── package.json                  # Dependencies và lệnh backend
│   ├── .env.example                  # Mẫu biến môi trường (không chứa secrets)
│   ├── src/
│   │   ├── seed.js                   # Thêm dữ liệu sân mẫu
│   │   ├── controllers/              # Xử lý nghiệp vụ
│   │   │   ├── authController.js     # Đăng ký OTP, xác minh OTP, đăng nhập
│   │   │   ├── bookingController.js  # Đặt sân, lịch, tiền cọc
│   │   │   ├── newsController.js     # Lấy và cache tin bóng đá
│   │   │   ├── pitchController.js    # Quản lý và tra cứu sân
│   │   │   ├── reviewController.js   # Đánh giá sân
│   │   │   └── voucherController.js  # Quản lý mã khuyến mãi
│   │   ├── middleware/
│   │   │   ├── auth.js               # Xác thực JWT, phân quyền admin
│   │   │   └── pitchImageUpload.js   # Kiểm tra và lưu ảnh sân
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── Booking.js
│   │   │   ├── PendingRegistration.js # Thông tin đăng ký chờ OTP, tự hết hạn
│   │   │   ├── Pitch.js
│   │   │   ├── Review.js
│   │   │   ├── User.js
│   │   │   └── Voucher.js
│   │   ├── routes/                   # Khai báo REST endpoints
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── newsRoutes.js
│   │   │   ├── pitchRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   └── voucherRoutes.js
│   │   └── utils/
│   │       ├── email.js              # Gửi email thông báo
│   │       └── sms.js                # Gửi và xác minh OTP bằng Twilio Verify
│   └── uploads/pitches/              # Ảnh sân tải lên lúc chạy
└── frontend/                        # Ứng dụng Angular
    ├── angular.json                  # Cấu hình build, serve, test
    ├── package.json                 # Dependencies và lệnh frontend
    ├── tsconfig*.json                # Cấu hình TypeScript
    ├── public/                       # Tài nguyên tĩnh
    └── src/
        ├── environments/             # URL API local và production
        ├── main.ts                   # Điểm khởi chạy Angular
        ├── index.html                # HTML gốc
        ├── styles.scss               # SCSS giao diện chính
        ├── tailwind.css              # Điểm nạp Tailwind CSS
        ├── content-pages.scss        # Style các trang nội dung
        ├── typography.scss           # Quy tắc typography
        └── app/
            ├── app.ts                # Component gốc
            ├── app.html              # Template gốc
            ├── app.scss              # Style component gốc
            ├── app.config.ts         # Providers, HTTP, router, locale
            ├── app.routes.ts         # Khai báo điều hướng
            ├── app.spec.ts           # Unit tests
            ├── core/                 # Models, services, guards
            │   ├── admin-status.service.ts
            │   ├── admin.guard.ts
            │   ├── auth.interceptor.ts
            │   ├── auth.service.ts
            │   ├── booking.service.ts
            │   ├── models.ts
            │   ├── news.service.ts
            │   ├── pitch.service.ts
            │   ├── review.service.ts
            │   ├── user.guard.ts
            │   └── voucher.service.ts
            ├── pages/                # Các trang ứng dụng
            │   ├── about.component.ts
            │   ├── admin.component.ts
            │   ├── admin.component.html
            │   ├── auth.component.ts
            │   ├── auth.component.html
            │   ├── booking-guide.component.ts
            │   ├── home.component.ts
            │   ├── home.component.html
            │   ├── my-bookings.component.ts
            │   ├── news.component.ts
            │   ├── pitch-catalog.component.ts
            │   ├── pitch-detail.component.ts
            │   └── pitch-detail.component.html
            └── shared/               # Thành phần dùng chung
                ├── footer.component.ts
                └── header.component.ts
```

`node_modules/`, build output và file cấu hình môi trường riêng không được liệt kê. Ảnh trong `backend/uploads/pitches/` được tạo/lưu khi admin tải ảnh lên.

## Yêu cầu

- Node.js 20.19 trở lên (dự án hiện được phát triển với Node.js 24).
- npm.
- MongoDB local hoặc MongoDB Atlas.

## Cài đặt và chạy

Mở hai terminal tại thư mục dự án.

### 1. Backend

```powershell
cd backend
npm install
```

Tạo/cấu hình file `backend/.env` theo phần [Cấu hình môi trường](#cấu-hình-môi-trường), rồi khởi tạo dữ liệu sân mẫu và chạy API:

```powershell
npm run seed
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`. Kiểm tra:

```text
GET http://localhost:5000/api/health
```

Seed có thể chạy lại: dữ liệu sân mẫu còn thiếu sẽ được bổ sung, không xóa dữ liệu hiện có.

### 2. Frontend

Trong terminal thứ hai:

```powershell
cd frontend
npm install
npm start
```

Mở `http://localhost:4200`. Frontend bản development gọi API tại `http://localhost:5000/api`; khi deploy, cấu hình URL backend trong `frontend/src/environments/environment.production.ts`.

## Cấu hình môi trường

Các biến môi trường được backend đọc từ `backend/.env`:

| Biến | Mục đích |
|---|---|
| `MONGODB_URI` | URI kết nối MongoDB; bắt buộc |
| `JWT_SECRET` | Khóa ký JWT; bắt buộc, cần dùng giá trị riêng và đủ mạnh |
| `PORT` | Cổng backend; mặc định `5000` |
| `CLIENT_ORIGIN` | Origin frontend được phép gọi API; mặc định `http://localhost:4200` |
| `EMAIL_USER` | Tài khoản gửi email SMTP |
| `EMAIL_PASS` | Mật khẩu SMTP hoặc App Password |
| `EMAIL_HOST` | SMTP host; mặc định `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port; mặc định `587` |
| `EMAIL_SECURE` | Đặt `true` nếu dùng kết nối SMTP TLS trực tiếp |
| `ADMIN_EMAIL` | Địa chỉ nhận email khi khách báo đã chuyển cọc |
| `TWILIO_ACCOUNT_SID` | Account SID của Twilio |
| `TWILIO_AUTH_TOKEN` | Auth Token của Twilio; giữ bí mật |
| `TWILIO_VERIFY_SERVICE_SID` | SID của Twilio Verify Service, thường bắt đầu bằng `VA` |

Đồ án dùng **Twilio Verify** để phát và xác minh OTP. MongoDB chỉ lưu thông tin đăng ký chờ xác thực, tối đa 5 phút; OTP do Twilio quản lý và không được lưu trong MongoDB. Số điện thoại Việt Nam dạng `09xxxxxxxx` được chuẩn hóa sang E.164 (`+849xxxxxxxx`). Hướng dẫn cấu hình, kiểm tra Twilio Trial và triển khai xem [HUONG-DAN-SMS-TWILIO.md](./HUONG-DAN-SMS-TWILIO.md).

Email là tùy chọn. Nếu chưa cấu hình SMTP, tính năng đặt sân vẫn hoạt động nhưng email không được gửi. Trang tổng quan admin hiển thị trạng thái cấu hình email. **Không đưa `.env` hoặc giá trị bí mật lên Git/chia sẻ công khai.**

## Tài khoản quản trị

1. Đăng ký tài khoản thường bằng giao diện; cần xác minh số điện thoại qua mã OTP trước khi tài khoản được tạo.
2. Trong thư mục `backend`, chạy lệnh sau và thay email bằng email tài khoản của bạn:

```powershell
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const User=require('./src/models/User'); mongoose.connect(process.env.MONGODB_URI).then(async()=>{const result=await User.updateOne({email:process.argv[1]},{$set:{role:'admin'}}); console.log(result); await mongoose.disconnect();}).catch(error=>{console.error(error);process.exit(1);})" admin@example.com
```

3. Đăng xuất rồi đăng nhập lại để frontend nhận JWT chứa quyền admin. API đăng ký công khai không cho phép tự gửi role admin.

## Các trang giao diện

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ |
| `/san-bong` | Danh sách sân |
| `/san-bong/:id` | Chi tiết, giá, lịch đặt và đánh giá sân |
| `/cach-dat-san` | Hướng dẫn đặt sân |
| `/tin-tuc` | Tin bóng đá |
| `/gioi-thieu` | Giới thiệu Sân Nhà |
| `/dang-nhap` | Đăng nhập/đăng ký |
| `/lich-dat` | Lịch đặt của khách đã đăng nhập |
| `/admin` | Khu vực quản trị dành cho admin |

## REST API

Các endpoint có đánh dấu **Đăng nhập** yêu cầu JWT trong header `Authorization: Bearer <token>`. Endpoint **Admin** yêu cầu quyền quản trị.

### Xác thực và sân

| Method | Endpoint | Quyền |
|---|---|---|
| `POST` | `/api/auth/register/request-otp` | Công khai; gửi OTP đến điện thoại |
| `POST` | `/api/auth/register/verify-otp` | Công khai; xác minh OTP và tạo user |
| `POST` | `/api/auth/login` | Công khai |
| `GET` | `/api/pitches` | Công khai |
| `GET` | `/api/pitches/:id` | Công khai |
| `GET` | `/api/pitches/admin/all` | Admin |
| `POST` | `/api/pitches` | Admin |
| `PUT` | `/api/pitches/:id` | Admin |
| `DELETE` | `/api/pitches/:id` | Admin (ngừng kinh doanh) |
| `POST` | `/api/pitches/upload` | Admin |

### Đặt sân và tiền cọc

| Method | Endpoint | Quyền |
|---|---|---|
| `GET` | `/api/bookings/availability?pitchId=...&date=YYYY-MM-DD` | Công khai |
| `POST` | `/api/bookings` | Đăng nhập |
| `GET` | `/api/bookings/my-bookings` | Đăng nhập |
| `PUT` | `/api/bookings/:id/cancel` | Chủ đơn |
| `PUT` | `/api/bookings/:id/reschedule` | Chủ đơn |
| `PUT` | `/api/bookings/:id/payment-request` | Chủ đơn |
| `GET` | `/api/bookings/admin/all` | Admin |
| `PUT` | `/api/bookings/:id/status` | Admin |
| `PUT` | `/api/bookings/:id/payment-status` | Admin |

### Voucher, đánh giá và quản trị

| Method | Endpoint | Quyền |
|---|---|---|
| `GET` | `/api/vouchers` | Công khai (voucher đang hoạt động) |
| `GET` | `/api/vouchers/admin/all` | Admin |
| `POST` | `/api/vouchers` | Admin |
| `PUT` | `/api/vouchers/:id` | Admin (bật/tắt) |
| `GET` | `/api/reviews/pitch/:pitchId` | Công khai |
| `POST` | `/api/reviews` | Đăng nhập |
| `GET` | `/api/admin/status` | Admin (chỉ trả trạng thái email, không trả bí mật) |
| `GET` | `/api/admin/users` | Admin (danh sách tài khoản, không trả mật khẩu) |
| `PATCH` | `/api/admin/users/:id/role` | Admin (cấp/hạ quyền user) |
| `GET` | `/api/news` | Công khai |
| `GET` | `/api/health` | Công khai |

## Quy tắc nghiệp vụ

- Booking mới có trạng thái `pending`; admin duyệt thành `confirmed` hoặc từ chối/hủy.
- Chỉ booking `pending`/`confirmed` mới chiếm khung giờ; backend kiểm tra trùng để tránh đặt chồng.
- Giờ hoạt động: 06:00–22:00; không cho đặt giờ đã qua.
- Hủy/đổi lịch chỉ thực hiện trước giờ bắt đầu ít nhất 12 tiếng. Lịch đổi được tính lại giá và trở về `pending` để admin duyệt.
- Giá cọc mô phỏng bằng 30% tổng giá. Đây **không** phải tích hợp cổng thanh toán: khách chuyển tiền ngoài ứng dụng và gửi yêu cầu xác nhận; admin xác nhận thủ công.
- Nếu booking đã nhận cọc bị hủy hoặc đổi, hệ thống ghi nhận trạng thái cọc là hoàn lại. Việc hoàn tiền thực tế được xử lý ngoài hệ thống.
- Quy tắc giá: cuối tuần tăng 20%; khung 17:00–22:00 tăng 15%; khung 06:00–09:00 giảm 10%. Hệ số cuối tuần và khung giờ được cộng như trong logic hiện tại.
- Voucher phần trăm/số tiền được kiểm tra và áp dụng ở backend. Voucher `offpeak` chỉ dùng trong khung 09:00–17:00.
- Mỗi booking đã xác nhận chỉ được đánh giá một lần, sau khi trận đấu kết thúc.
- Tin RSS được cache trong 10 phút; nếu RSS tạm lỗi sau khi đã có dữ liệu cache, API trả dữ liệu cũ.
- Khi backend khởi động, booking cũ thiếu trường tiền cọc được bổ sung mặc định dựa trên 30% tổng giá.

## Kiểm thử và build

Chạy trong thư mục `frontend`:

```powershell
npm test -- --watch=false
npm run build
```

Chạy backend ở chế độ phát triển:

```powershell
cd backend
npm run dev
```
