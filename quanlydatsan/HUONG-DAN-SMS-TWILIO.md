# Hướng dẫn cài đặt và triển khai OTP SMS

Đồ án dùng **Twilio Verify** để gửi và kiểm tra mã OTP; backend dùng API HTTPS gọi ra Twilio. MongoDB chỉ lưu thông tin đăng ký chờ xác thực, với thời gian hiệu lực tối đa 5 phút. Mã OTP không được ghi vào MongoDB.

## 1. Tạo Twilio Verify Service

1. Tạo tài khoản tại [Twilio](https://www.twilio.com/try-twilio), xác minh email và số điện thoại của bạn.
2. Trong Twilio Console, mở **Identity → Verify → Overview** rồi chọn **Try out Verify** để thử luồng OTP.
3. Tạo một Verify Service. Lấy:
   - **Account SID** — thường bắt đầu bằng `AC`.
   - **Auth Token** — xem trong thông tin tài khoản; đây là bí mật.
   - **Verify Service SID** — thường bắt đầu bằng `VA`.
4. Với tài khoản Trial, thêm/xác minh số nhận thử trong trang Try out Verify. Trong Trial chỉ gửi được tới số đã xác minh; tài liệu Twilio hiện ghi tối đa 5 số xác minh cho tài khoản.
5. Ghi lại các SID/secret riêng tư để nhập vào biến môi trường backend. Không gửi Auth Token trong tin nhắn, không commit vào Git.

> **Giới hạn Trial:** Twilio hiện cấp 40 lượt Verify và 100 SMS unit; tài khoản Trial hết hạn sau 30 ngày. Trial dùng mẫu OTP của Twilio, không dùng nội dung SMS tùy chỉnh. Khi nâng cấp, Twilio áp dụng chính sách và giá theo quốc gia/nhà mạng; xem [hạn mức Trial](https://www.twilio.com/docs/usage/trials), [hướng dẫn Verify Trial](https://www.twilio.com/docs/usage/trials/try-out-verify) và [giá Verify](https://www.twilio.com/en-us/verify/pricing). Đây là hạn mức theo tài liệu hiện tại, có thể thay đổi.

## 2. Cấu hình khi chạy thử trên máy

### Backend

Tạo `backend/.env` từ file `backend/.env.example`. Điền cấu hình MongoDB, JWT và Twilio:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/dat-san-bong
JWT_SECRET=<chuoi-bi-mat-ngau-nhien-dai>
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=http://localhost:4200

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_VERIFY_SERVICE_SID=VA...
```

Giữ nguyên các biến email nếu cần tính năng gửi email; chúng không liên quan tới OTP SMS. Tạo `JWT_SECRET` ngẫu nhiên trong PowerShell bằng:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Chạy MongoDB local, sau đó trong terminal:

```powershell
cd D:\datsanbongMini\quanlydatsan\backend
npm install
npm run dev
```

Backend gọi ra `https://verify.twilio.com`; máy chạy Node.js cần có kết nối Internet outbound HTTPS. **Không cần webhook hay URL public cho Twilio khi chỉ gửi/xác minh OTP.**

### Frontend

Trong terminal thứ hai:

```powershell
cd D:\datsanbongMini\quanlydatsan\frontend
npm install
npm start
```

Mở `http://localhost:4200`, chọn đăng ký, nhập số nhận đã xác minh ở Twilio Trial, rồi nhập OTP nhận được. Có thể nhập số Việt Nam như `0912345678` hoặc dạng quốc tế `+84912345678`; backend sẽ chuẩn hóa sang định dạng E.164.

### API đăng ký

- `POST /api/auth/register/request-otp` với body `name`, `email`, `password`, `phone`: tạo bản đăng ký chờ trong MongoDB và yêu cầu Twilio Verify gửi OTP.
- `POST /api/auth/register/verify-otp` với body `phone`, `code`, `password`: yêu cầu Twilio xác minh; chỉ khi được duyệt mới tạo user.

Bản đăng ký chờ hết hạn sau 5 phút và có TTL index ở `pendingregistrations`. Hệ thống giới hạn 5 lần nhập sai và chờ tối thiểu 1 phút trước khi gửi lại OTP. TTL monitor của MongoDB có thể xóa document trễ một chút, nhưng API từ chối bản ghi ngay khi đã quá `expiresAt`.

## 3. Triển khai lên hosting

Để khách dùng trình duyệt truy cập ứng dụng đã deploy, backend cần có URL công khai qua HTTPS. Các bước tổng quát:

1. Tạo database MongoDB có thể truy cập từ máy chủ backend (ví dụ MongoDB Atlas). Cấu hình database user và network access theo hướng dẫn của dịch vụ; không mở quyền truy cập rộng hơn mức cần thiết.
2. Deploy thư mục backend lên một Node.js hosting hỗ trợ biến môi trường và kết nối outbound HTTPS. Đặt các biến:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` nếu nhà cung cấp yêu cầu; nếu hosting tự cấp `PORT`, ứng dụng sẽ dùng giá trị đó
   - `CLIENT_ORIGIN` bằng **origin chính xác** của frontend, ví dụ `https://ten-ung-dung.example`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
3. Đảm bảo hosting backend cho phép outbound HTTPS tới `verify.twilio.com`. Không đặt Twilio Auth Token trong source code, Angular hoặc biến môi trường frontend.
4. Trong `frontend/src/environments/environment.production.ts`, đổi `apiUrl` thành URL backend HTTPS kết thúc bằng `/api`, ví dụ:

   ```ts
   export const environment = {
     apiUrl: 'https://ten-api.example.com/api'
   };
   ```

   URL này là cấu hình công khai của frontend, **không** phải secret. Các service dùng cấu hình chung này; file `environment.ts` vẫn trỏ tới localhost cho phát triển.
5. Build frontend production:

   ```powershell
   cd D:\datsanbongMini\quanlydatsan\frontend
   npm run build
   ```

   Deploy nội dung `frontend/dist/frontend/browser` tới static hosting. Nếu output folder thực tế của Angular khác, dùng thư mục `browser` được tạo trong `dist/frontend`.
6. Cập nhật `CLIENT_ORIGIN` thành domain frontend cuối cùng và deploy lại backend nếu cần.
7. Thêm/xác minh số nhận trong Twilio Trial, mở trang đăng ký trên domain frontend và thử OTP. Xem lỗi và trạng thái SMS/Verify trong **Twilio Console → Logs**; không ghi token hoặc OTP vào log ứng dụng.

> Không dùng `http://localhost:5000` làm API URL trong frontend đã deploy: trên máy người truy cập, `localhost` trỏ về chính máy của họ chứ không phải máy chủ backend.

## 4. Khắc phục sự cố

| Tình huống | Kiểm tra |
|---|---|
| API báo dịch vụ SMS chưa cấu hình (`503`) | Ba biến `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` đã được đặt trong môi trường **backend** chưa? Khởi động lại backend sau khi đổi `.env`. |
| Twilio từ chối gửi OTP (`502`) | Với Trial, số đích phải được xác minh; kiểm tra số E.164, SID, token, Verify Service SID, trạng thái Trial/hạn mức và Logs trong Console. |
| Trình duyệt không gọi được API | Kiểm tra `environment.production.ts`, backend HTTPS đang chạy, CORS `CLIENT_ORIGIN` trùng origin frontend và không có dấu `/` cuối. |
| OTP nhập đúng nhưng đăng ký hết hạn | Hoàn tất xác minh trong 5 phút; nếu hết hạn, yêu cầu mã mới. |
| Gửi lại bị từ chối (`429`) | Chờ ít nhất một phút trước khi gửi lại; Trial còn bị giới hạn số người nhận và quota. |

## 5. Bảo mật và chi phí

- Mỗi yêu cầu gửi OTP có thể tiêu tốn quota/chi phí. Không mở demo công khai mà không giới hạn lưu lượng; endpoint hiện giới hạn theo số điện thoại nhưng chưa có rate limit toàn cục theo IP.
- Trial phù hợp để trình diễn với số đã xác minh, không phù hợp cho người dùng công khai tùy ý. Muốn gửi cho khách hàng thật, cần nâng cấp tài khoản và kiểm tra yêu cầu tuân thủ/quy định cho quốc gia nhận.
- Không chụp/chia sẻ màn hình có Auth Token hoặc thông tin xác thực; không đưa `.env` vào file ZIP nộp công khai.
