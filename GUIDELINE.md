### I. CÁC LUỒNG NGƯỜI DÙNG CHÍNH (USER FLOWS)

#### 1. Luồng Trang chủ & Thông tin chung
*   **Trang chủ:** Người dùng xem thông tin về nghệ sĩ (line-up), thông tin sự kiện, tin hướng dẫn và timeline của chương trình.
*   **Điều hướng:** Từ trang chủ có 2 nhánh chính là đi đến trang **YEP ICON** (Cuộc thi) hoặc trang **BUY TICKET** (Mua vé).

#### 2. Luồng Cuộc thi YEP ICON (Phụ thuộc vào thời gian)
*   **Giai đoạn trước khi có Shortlist:** Hiển thị thông tin cuộc thi và nút **"Register"**. Khi click sẽ dẫn đến link đăng ký (Google Form hoặc trang nội bộ).
*   **Giai đoạn sau khi có Shortlist:** Giao diện thay đổi sang phần bình chọn (**Vote**). Người dùng xem danh sách đội (Đội 1, Đội 2...) và click "Vote" để dẫn đến link bình chọn.

#### 3. Luồng Mua vé (Buy Ticket) - Luồng chính
Đây là luồng phức tạp nhất, chia làm các bước:
*   **Bước 1: Chọn đối tượng.** Người dùng xem bảng giá và chiết khấu. Sau đó chọn mình là **Vinnunian** (Sinh viên, giảng viên, nhân viên, cựu sinh viên VinUni) hay **Non-Vinnunian** (Người ngoài).
    *   *Trường hợp đặc biệt (Early Bird):* Chỉ dành cho Vinnunian.
*   **Bước 2: Nhập thông tin cá nhân cơ bản.**
    *   Vinnunian: Chọn Faculty/Staff/Student/Alumni.
    *   Non-Vinnunian: Nhập thông tin nơi ở/cơ sở công tác.
*   **Bước 3: Chọn số lượng vé & Merch.**
    *   Chọn số lượng vé.
    *   Chọn thêm các vật phẩm đi kèm (Merch A, Merch B). Hệ thống tự tính tổng tiền (giá vé khác nhau tùy đối tượng).
*   **Bước 4: Xác nhận (Confirmation).** Hiển thị tóm tắt đơn hàng (Vé, Merch, Tổng tiền). Cho phép nhập **Mã giảm giá**. Xác nhận lại Email và SĐT.
*   **Bước 5: Thanh toán.** Chuyển hướng đến cổng thanh toán.
*   **Bước 6: Hoàn tất.** Thông báo thành công, hướng dẫn kiểm tra email nhận vé và cách nhận Merch tại booth vào ngày sự kiện.

---

### II. CÁC YÊU CẦU HỆ THỐNG (REQUIREMENTS)

#### 1. Yêu cầu chức năng (Functional Requirements)

**A. Quản lý nội dung (CMS):**
*   Cho phép cập nhật danh sách nghệ sĩ, timeline sự kiện.
*   Thay đổi trạng thái trang YEP ICON (từ Đăng ký sang Bình chọn).

**B. Hệ thống Bán vé & Merch:**
*   **Phân loại giá:** Hệ thống phải cấu hình được các mức giá khác nhau cho Vinnunian và Non-Vinnunian.
*   **Cấu hình Early Bird:** Có tính năng bật/tắt bán vé sớm (chỉ cho phép Vinnunian truy cập trong thời gian này).
*   **Quản lý Merch:** Cho phép chọn mua kèm nhiều loại merch với số lượng tùy chọn.
*   **Tính toán:** Tự động tính tổng tiền theo số lượng và loại đối tượng.
*   **Mã giảm giá (Discount Code):** Có ô nhập mã và kiểm tra tính hợp lệ của mã để trừ tiền trực tiếp trên đơn hàng.

**C. Thông tin khách hàng & Bảo mật:**
*   Phân loại người dùng theo dropdown (Student, Staff, Alumni...).
*   Ghi nhận Email và SĐT để gửi vé điện tử.

**D. Thanh toán & Giao dịch:**
*   Tích hợp cổng thanh toán trực tuyến.
*   Gửi email xác nhận tự động (E-ticket) sau khi thanh toán thành công.

#### 2. Yêu cầu giao diện (UI/UX Requirements)
*   **Trang chủ:** Phải hiển thị bắt mắt thông tin nghệ sĩ và timeline.
*   **Responsive:** Giao diện cần hoạt động tốt trên cả máy tính và điện thoại (vì người dùng thường mua vé qua mobile).
*   **Trạng thái trống (Empty states):** Thông báo rõ ràng nếu vé Early Bird đã hết hoặc chưa đến giờ bán.
*   **Chỉ dẫn (Instruction):** Có các dòng note nhắc nhở (VD: "Vé sẽ được gửi về mail", "Nhận merch tại booth").

#### 3. Yêu cầu nghiệp vụ (Business Logic)
*   **Kiểm soát đối tượng:** Cần có cơ chế xác thực nếu là Vinnunian (ví dụ: yêu cầu email đuôi @vinuni.edu.vn) để tránh việc người ngoài mua vé giá rẻ của nội bộ.
*   **Quy trình nhận Merch:** Hệ thống cần lưu vết những ai đã mua merch để nhân viên đối soát tại booth vào "ID-day".

---

### Tóm tắt luồng đi của dữ liệu:
1.  **Input:** Loại người dùng -> Thông tin cá nhân -> Số lượng vé/merch -> Mã giảm giá.
2.  **Processing:** Kiểm tra điều kiện Early Bird -> Áp mức giá tương ứng -> Tính tổng tiền -> Xử lý thanh toán.
3.  **Output:** Email vé điện tử -> Danh sách đối soát Merch cho Ban tổ chức.
