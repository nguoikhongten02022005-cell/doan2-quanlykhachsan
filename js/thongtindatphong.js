// JavaScript cho trang giỏ hàng

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    khoiTaoMenuDiDong();
    taiDanhSachPhongGio();
    capNhatTomTatDonHang();
});

function taiDanhSachPhongGio() {
    var allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    // Chỉ lấy các booking chưa thanh toán (status = 'pending' hoặc không có status)
    var bookings = allBookings.filter(function(booking) {
        var status = booking.status || 'pending';
        return status === 'pending';
    });
    
    var container = document.getElementById('danhSachPhongGio');
    
    if (!container) {
        return;
    }
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="thong-bao-khong-co">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Bạn chưa có phòng nào trong giỏ hàng</p>
            </div>
        `;
        return;
    }
    
    var html = '';
    for (var i = 0; i < bookings.length; i++) {
        html += taoThePhongGio(bookings[i], i);
    }
    container.innerHTML = html;
    
    // Cập nhật số lượng phòng
    document.getElementById('soPhongTrongGio').textContent = bookings.length;
}

function taoThePhongGio(booking, index) {
    // Ưu tiên dùng checkIn/checkOut (ISO format YYYY-MM-DD) để tính toán chính xác
    var checkInDate = booking.checkIn || booking.checkin || '2025-01-01';
    var checkOutDate = booking.checkOut || booking.checkout || '2025-01-02';
    
    var checkIn = new Date(checkInDate);
    var checkOut = new Date(checkOutDate);
    
    // Kiểm tra ngày hợp lệ
    if (isNaN(checkIn.getTime())) {
        checkIn = new Date('2025-01-01');
    }
    if (isNaN(checkOut.getTime())) {
        checkOut = new Date('2025-01-02');
    }
    
    // Tính số đêm từ dates (LUÔN TÍNH LẠI để đảm bảo chính xác)
    var soDem = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (soDem <= 0) soDem = 1;
    
    // Xử lý giá tiền - lấy từ booking object
    var price = parseInt(booking.price) || 0;
    if (price <= 0) price = 1000000; // Giá mặc định 1 triệu
    
    // Lấy tên phòng từ booking.room hoặc booking.roomName
    var roomName = booking.room || booking.roomName || 'Phòng khách sạn';
    var roomType = booking.roomType || 'Standard';
    var roomNumber = booking.number || '101';
    var roomFloor = booking.floor || '1';
    var hotel = booking.hotel || 'QuickStay Hotel';
    
    var amenities = booking.amenities ? booking.amenities.split(',') : ['WiFi', 'TV', 'Mini Bar', 'Điều hòa'];
    var amenitiesHTML = '';
    for (var i = 0; i < Math.min(amenities.length, 4); i++) {
        amenitiesHTML += '<span class="tien-ich-tag-gio">' + amenities[i].trim() + '</span>';
    }
    if (amenities.length > 4) {
        amenitiesHTML += '<span class="tien-ich-tag-gio">+' + (amenities.length - 4) + ' khác</span>';
    }
    
    // Lấy số khách từ booking.guests
    var nguoiLon = booking.guests && booking.guests.nguoiLon ? booking.guests.nguoiLon : (booking.adults || 2);
    var treEm = booking.guests && booking.guests.treEm ? booking.guests.treEm : (booking.children || 0);
    
    return `
        <div class="the-phong-gio">
            <div class="anh-phong-gio">
                <img src="${booking.image || '../img/khachsan1(2).jpg'}" alt="${roomName}">
            </div>
            
            <div class="noi-dung-phong-gio">
                <h3 class="ten-khach-san-gio">${roomName}</h3>
                <p class="chi-tiet-phong-gio">${hotel} • Phòng ${roomNumber} • Tầng ${roomFloor} • ${roomType}</p>
                
                <div class="chi-tiet-dat-phong-gio">
                    <div class="chi-tiet-item-gio">
                        <i class="fas fa-calendar-check"></i>
                        <span>Nhận phòng</span>
                        <span>${formatDate(checkIn)}</span>
                    </div>
                    <div class="chi-tiet-item-gio">
                        <i class="fas fa-calendar-times"></i>
                        <span>Trả phòng</span>
                        <span>${formatDate(checkOut)}</span>
                    </div>
                    <div class="chi-tiet-item-gio">
                        <i class="fas fa-users"></i>
                        <span>Khách</span>
                        <span>${nguoiLon} NL + ${treEm} TE</span>
                    </div>
                    <div class="chi-tiet-item-gio">
                        <i class="fas fa-bed"></i>
                        <span>Số đêm</span>
                        <span>${soDem} đêm</span>
                    </div>
                </div>
                
                <div class="tien-ich-phong-gio">
                    ${amenitiesHTML}
                </div>
                
                <div class="gia-phong-gio">
                    <div class="gia-don-vi">${formatPrice(price)}/đêm × ${soDem} đêm</div>
                    <div class="gia-tong">${formatPrice(price * soDem)}</div>
                </div>
            </div>
            
            <div class="nut-hanh-dong-gio">
                <button class="nut-sua" onclick="suaPhong(${index})">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="nut-xoa" onclick="xoaPhong(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function capNhatTomTatDonHang() {
    var allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    // Chỉ tính các booking chưa thanh toán (status = 'pending' hoặc không có status)
    var bookings = allBookings.filter(function(booking) {
        var status = booking.status || 'pending';
        return status === 'pending';
    });
    
    var tongSoPhong = bookings.length;
    var tongSoDem = 0;
    var tongTien = 0;
    
    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        
        // Ưu tiên dùng checkIn/checkOut (ISO format YYYY-MM-DD)
        var checkInDate = booking.checkIn || booking.checkin || '2025-01-01';
        var checkOutDate = booking.checkOut || booking.checkout || '2025-01-02';
        
        var checkIn = new Date(checkInDate);
        var checkOut = new Date(checkOutDate);
        
        // Kiểm tra ngày hợp lệ
        if (isNaN(checkIn.getTime())) {
            checkIn = new Date('2025-01-01');
        }
        if (isNaN(checkOut.getTime())) {
            checkOut = new Date('2025-01-02');
        }
        
        // Tính số đêm (LUÔN TÍNH LẠI)
        var soDem = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (soDem <= 0) soDem = 1;
        
        // Xử lý giá tiền
        var price = parseInt(booking.price) || 0;
        if (price <= 0) price = 1000000; // Giá mặc định 1 triệu
        
        var tongTienPhong = price * soDem;
        
        tongSoDem += soDem;
        tongTien += tongTienPhong;
    }
    
    document.getElementById('tongSoPhong').textContent = tongSoPhong + ' phòng';
    document.getElementById('tongSoDem').textContent = tongSoDem + ' đêm';
    document.getElementById('tongTien').textContent = formatPrice(tongTien);
}

function suaPhong(index) {
    alert('Chức năng sửa phòng sẽ được phát triển');
}

function xoaPhong(index) {
    if (confirm('Bạn có chắc muốn xóa phòng này khỏi giỏ hàng?')) {
        var allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        // Lấy danh sách booking chưa thanh toán để tìm đúng index
        var pendingBookings = allBookings.filter(function(booking) {
            var status = booking.status || 'pending';
            return status === 'pending';
        });
        
        if (index >= 0 && index < pendingBookings.length) {
            // Tìm booking tương ứng trong allBookings và xóa
            var bookingToDelete = pendingBookings[index];
            var deleteIndex = allBookings.findIndex(function(b) {
                return b.id === bookingToDelete.id;
            });
            
            if (deleteIndex !== -1) {
                allBookings.splice(deleteIndex, 1);
                localStorage.setItem('bookings', JSON.stringify(allBookings));
                taiDanhSachPhongGio();
                capNhatTomTatDonHang();
                alert('Đã xóa phòng khỏi giỏ hàng!');
            }
        }
    }
}

function formatDate(date) {
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

// formatPrice đã được chuyển sang common.js

function khoiTaoDuLieuMau() {
    // Không xóa bookings - giữ lại dữ liệu đặt phòng của người dùng
    // localStorage.removeItem('bookings');
    
    // Nếu muốn test với dữ liệu mẫu, bỏ comment dòng dưới:
    // taoBookingMau();
}

// Hàm tạo booking mẫu để test
function taoBookingMau() {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Chỉ tạo nếu chưa có booking nào
    if (bookings.length === 0) {
        var today = new Date();
        var checkin = new Date(today);
        checkin.setDate(today.getDate() + 2);
        
        var checkout = new Date(today);
        checkout.setDate(today.getDate() + 5);
        
        var sampleBooking = {
            id: 'BK' + Date.now(),
            roomId: 2,
            room: 'Phòng Genesis Luxury Royal Suite',
            roomType: 'VIP',
            image: '../img/khachsan2(1).jpg',
            price: 8000000,
            hotel: 'QuickStay Hotel VIP',
            floor: '20',
            number: '2001',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, Phòng tắm jacuzzi',
            customer: 'Khách hàng',
            email: 'customer@example.com',
            phone: '0123456789',
            checkin: formatDateStr(checkin),
            checkout: formatDateStr(checkout),
            nights: 3,
            total: formatPrice(8000000 * 3),
            totalAmount: 8000000 * 3,
            status: 'pending',
            guests: {
                nguoiLon: 2,
                treEm: 0,
                phong: 1
            },
            bookingDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        bookings.push(sampleBooking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        console.log('Đã tạo booking mẫu');
    }
}

function formatDateStr(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;
    return day + '/' + month + '/' + year;
}


// Xử lý nút thanh toán
document.getElementById('nutThanhToan').addEventListener('click', function() {
    var allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    // Chỉ kiểm tra các booking chưa thanh toán
    var bookings = allBookings.filter(function(booking) {
        var status = booking.status || 'pending';
        return status === 'pending';
    });
    
    if (bookings.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    // Chuyển đến trang thanh toán
    window.location.href = 'thanh-toan.html';
});