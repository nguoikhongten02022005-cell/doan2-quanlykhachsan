document.addEventListener('DOMContentLoaded', function() {
    // 1. Lấy tham số từ URL khi trang vừa tải xong
    const urlParams = new URLSearchParams(window.location.search);
    const checkinDate = urlParams.get('checkin');
    const checkoutDate = urlParams.get('checkout');
    // Mặc định là 1 người lớn, 0 trẻ em nếu không có tham số
    const adults = parseInt(urlParams.get('adults')) || 1;
    const children = parseInt(urlParams.get('children')) || 0;

    // 2. Hiển thị lại thông tin đã chọn lên thanh tìm kiếm
    if (checkinDate && checkoutDate) {
        const hienThiNgay = document.getElementById('hienThiNgayTim');
        if (hienThiNgay) {
            hienThiNgay.textContent = `${formatDateVN(checkinDate)} — ${formatDateVN(checkoutDate)}`;
        }
    }
    
    const hienThiKhach = document.getElementById('hienThiKhachTim');
    if (hienThiKhach) {
        hienThiKhach.textContent = `${adults} người lớn · ${children} trẻ em`;
    }

    // 3. Thực hiện tìm kiếm và lọc phòng (chỉ khi có đủ thông tin)
    if (checkinDate && checkoutDate) {
        performSearch(checkinDate, checkoutDate, adults, children);
    } else {
        // Hiển thị thông báo nếu thiếu thông tin
        const container = document.getElementById('searchResultsContainer');
        if (container) {
            container.innerHTML = `
                <div class="thong-bao-khong-tim-thay">
                    <i class="fas fa-info-circle"></i>
                    <h3>Vui lòng chọn ngày nhận và trả phòng</h3>
                    <p>Bạn cần chọn ngày nhận và trả phòng để tìm kiếm.</p>
                    <a href="index.html" class="nut-xem-tinh-trang">Quay lại trang chủ</a>
                </div>`;
        }
    }
});

// Hàm định dạng ngày hiển thị (VD: 01/01/2025)
function formatDateVN(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Hàm chuẩn hóa ngày (chỉ lấy phần ngày, bỏ qua giờ/phút/giây)
function normalizeDate(dateString) {
    if (!dateString) return null;
    // Nếu là định dạng YYYY-MM-DD, parse trực tiếp
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString + 'T00:00:00');
    }
    // Nếu là định dạng khác, parse và reset về 00:00:00
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
}

// Hàm thực hiện logic tìm kiếm
function performSearch(checkin, checkout, adults, children) {
    // Lấy dữ liệu phòng và đơn hàng từ localStorage
    const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Chuẩn hóa ngày để so sánh chính xác (chỉ so sánh ngày, không so sánh giờ)
    const searchStart = normalizeDate(checkin);
    const searchEnd = normalizeDate(checkout);
    
    // Kiểm tra tính hợp lệ của ngày
    if (!searchStart || !searchEnd || searchStart >= searchEnd) {
        const container = document.getElementById('searchResultsContainer');
        if (container) {
            container.innerHTML = `
                <div class="thong-bao-khong-tim-thay">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Ngày không hợp lệ</h3>
                    <p>Ngày trả phòng phải sau ngày nhận phòng.</p>
                    <a href="index.html" class="nut-xem-tinh-trang">Quay lại trang chủ</a>
                </div>`;
        }
        return;
    }

    const availableRooms = rooms.filter(room => {
        // A. Lọc theo trạng thái phòng
        if (room.status === 'maintenance') return false;

        // B. Lọc theo sức chứa (SỬA LẠI: Dùng parseCapacity từ common.js)
        let cap = { adults: 2, children: 0 };
        
        // Kiểm tra nếu hàm parseCapacity có sẵn (từ common.js)
        if (typeof parseCapacity === 'function') {
            cap = parseCapacity(room);
        } else {
            // Fallback nếu không load được common.js
            if (room.capacity) {
                const matchAdults = room.capacity.toString().match(/(\d+)\s*người lớn/i);
                const matchChildren = room.capacity.toString().match(/(\d+)\s*trẻ em/i);
                if (matchAdults) cap.adults = parseInt(matchAdults[1]);
                if (matchChildren) cap.children = parseInt(matchChildren[1]);
            }
        }

        // Logic so sánh chặt chẽ:
        // 1. Số người lớn tìm kiếm phải <= Sức chứa người lớn của phòng
        if (adults > cap.adults) return false;

        // 2. Số trẻ em tìm kiếm phải <= Sức chứa trẻ em của phòng
        // (Hoặc tổng số người phải phù hợp nếu bạn muốn linh động hơn)
        if (children > cap.children) {
             // Nếu trẻ em vượt quá, kiểm tra xem có thể bù bằng chỗ người lớn còn dư không
             // Ví dụ: Phòng 4 NL, 0 TE. Khách: 2 NL, 1 TE => Vẫn ở được
             const totalCapacity = cap.adults + cap.children;
             const totalGuests = adults + children;
             if (totalGuests > totalCapacity) return false;
        }

        // C. Kiểm tra trùng lịch (Giữ nguyên logic cũ của bạn)
        const isBooked = bookings.some(booking => {
            if (String(booking.roomId) !== String(room.id) || booking.status === 'cancelled') {
                return false;
            }
            const bookingStart = normalizeDate(booking.checkIn || booking.checkin);
            const bookingEnd = normalizeDate(booking.checkOut || booking.checkout);
            if (!bookingStart || !bookingEnd) return false;
            return (searchStart < bookingEnd && searchEnd > bookingStart);
        });

        return !isBooked;
    });
    // --- KẾT THÚC SỬA LỖI LOGIC LỌC ---

    // 4. Hiển thị kết quả ra màn hình
    displayResults(availableRooms);
}

function displayResults(rooms) {
    const container = document.getElementById('searchResultsContainer');
    const headerCount = document.getElementById('soLuongKetQua');
    const resultSection = document.getElementById('noiDungKetQua');

    if (headerCount) headerCount.textContent = rooms.length;
    if (resultSection) resultSection.style.display = 'block';

    if (rooms.length === 0) {
        container.innerHTML = `
            <div class="thong-bao-khong-tim-thay">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy phòng trống</h3>
                <p>Rất tiếc, không có phòng nào phù hợp trong khoảng thời gian này.</p>
                <a href="index.html" class="nut-xem-tinh-trang">Quay lại trang chủ</a>
            </div>`;
        return;
    }

    let html = '';
    rooms.forEach(room => {
        // Format giá tiền
        const price = new Intl.NumberFormat('vi-VN').format(room.price) + ' ₫';
        
        // --- SỬA LỖI HIỂN THỊ DỮ LIỆU SỨC CHỨA ---
        let cap = { adults: 2, children: 0 };
        if (typeof parseCapacity === 'function') {
            cap = parseCapacity(room); // Dùng hàm chung để lấy số liệu chính xác từ chuỗi capacity
        } else {
            // Fallback nếu không load được common.js
            if (room.capacity) {
                const matchAdults = room.capacity.toString().match(/(\d+)\s*người lớn/i);
                const matchChildren = room.capacity.toString().match(/(\d+)\s*trẻ em/i);
                if (matchAdults) cap.adults = parseInt(matchAdults[1]);
                if (matchChildren) cap.children = parseInt(matchChildren[1]);
            }
        }
        
        // Tạo danh sách tiện nghi
        let amenitiesHtml = '';
        if (room.amenities) {
            const list = room.amenities.split(',').slice(0, 3);
            list.forEach(am => {
                amenitiesHtml += `<span>${am.trim()}</span>`;
            });
        }

        html += `
            <div class="the-phong-tim-kiem" onclick="window.location.href='room-detail.html?id=${room.id}'">
                <div class="noi-dung-the-phong">
                    <div class="anh-phong-tim-kiem">
                        <img src="${room.image}" alt="${room.name}" onerror="this.src='../img/khachsan1(1).jpg'">
                        <span class="badge-giam-gia">Ưu đãi</span>
                    </div>
                    <div class="thong-tin-phong-tim-kiem">
                        <div>
                            <h3 class="ten-phong-tim-kiem">${room.name}</h3>
                            <p class="suc-chua-phong">${cap.adults} người lớn, ${cap.children} trẻ em</p>
                        </div>
                        
                        <div class="tien-ich-phong-tim-kiem">
                            ${amenitiesHtml}
                            <span>+ thêm</span>
                        </div>
                        
                        <div>
                            <div class="gia-phong-tim-kiem">${price}</div>
                            <div class="nut-hanh-dong">
                                <button class="nut-chi-tiet">Xem chi tiết</button>
                                <button class="nut-dat-ngay">Đặt ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
