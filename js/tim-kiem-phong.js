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

    // Bắt đầu lọc
    const availableRooms = rooms.filter(room => {
        // A. Lọc theo trạng thái phòng (bảo trì thì bỏ qua)
        if (room.status === 'maintenance') return false;

        // B. Lọc theo sức chứa
        // Parse capacity từ chuỗi của phòng (VD: "2 người lớn, 1 trẻ em")
        let roomAdults = 2; // Mặc định
        if (room.adults) {
            roomAdults = parseInt(room.adults);
        } else if (room.capacity) {
            const match = room.capacity.toString().match(/(\d+)\s*người lớn/);
            if (match) roomAdults = parseInt(match[1]);
        }
        
        // Nếu số khách lớn hơn sức chứa phòng quá nhiều -> Bỏ qua
        if (adults > roomAdults + 1) return false; // Cho phép ghép thêm 1 người

        // C. Kiểm tra trùng lịch (Logic quan trọng nhất)
        // Nếu có bất kỳ đơn đặt nào trùng thời gian -> Loại bỏ phòng này
        const isBooked = bookings.some(booking => {
            // Chỉ kiểm tra các đơn của đúng phòng này và chưa bị hủy
            if (String(booking.roomId) !== String(room.id) || booking.status === 'cancelled') {
                return false;
            }
            
            // Lấy ngày từ booking (hỗ trợ cả checkIn/checkOut và checkin/checkout)
            const bookingStart = normalizeDate(booking.checkIn || booking.checkin);
            const bookingEnd = normalizeDate(booking.checkOut || booking.checkout);
            
            if (!bookingStart || !bookingEnd) return false;

            // Logic kiểm tra 2 khoảng thời gian có giao nhau không:
            // Khoảng thời gian giao nhau khi:
            // - Ngày bắt đầu tìm kiếm < Ngày kết thúc đặt phòng VÀ
            // - Ngày kết thúc tìm kiếm > Ngày bắt đầu đặt phòng
            // Lưu ý: Cho phép checkout và checkin cùng ngày (không coi là trùng)
            return (searchStart < bookingEnd && searchEnd > bookingStart);
        });

        return !isBooked; // Giữ lại nếu KHÔNG bị trùng lịch
    });

    // 4. Hiển thị kết quả ra màn hình
    displayResults(availableRooms);
}

function displayResults(rooms) {
    const container = document.getElementById('searchResultsContainer');
    const headerCount = document.getElementById('soLuongKetQua');
    const resultSection = document.getElementById('noiDungKetQua');

    if (headerCount) headerCount.textContent = rooms.length;
    
    // Đảm bảo khung kết quả hiển thị (vì trong HTML bạn để display: none)
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
        
        // Tạo danh sách tiện nghi ngắn gọn (lấy 3 cái đầu)
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
                            <p class="suc-chua-phong">${room.adults || 2} người lớn, ${room.children || 0} trẻ em</p>
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
