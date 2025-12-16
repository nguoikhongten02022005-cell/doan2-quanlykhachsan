// JavaScript cho trang thanh toán

// Biến global để lưu mã giảm giá đang áp dụng
var maGiamGiaDangApDung = null;
var tongTienGoc = 0;

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    var authUser = ensureAuthenticated({
        message: 'Bạn cần đăng nhập để tiếp tục thanh toán. Chuyển đến trang đăng nhập?',
        returnUrl: window.location.href
    });
    if (!authUser) return;
    khoiTaoMenuDiDong();
    diemThongTinUser();
    taiDuLieuGioHang();
    khoiTaoPhuongThucThanhToan();
    khoiTaoFormValidation();
    khoiTaoNutThanhToan();
    khoiTaoMaGiamGia();
});

// Tự động điền thông tin user vào form
function diemThongTinUser() {
    var userInfo = getCurrentUserData();
    if (userInfo) {
        if (userInfo.name) document.getElementById('hoTen').value = userInfo.name;
        if (userInfo.email) document.getElementById('email').value = userInfo.email;
        if (userInfo.phone) document.getElementById('soDienThoai').value = userInfo.phone;
    }
}

// khoiTaoMenuDiDong đã được chuyển sang common.js

function taiDuLieuGioHang() {
    var allBookings = storageService.getBookings();
    // Chỉ lấy các booking chưa thanh toán (status = 'pending' hoặc không có status)
    var bookings = allBookings.filter(function(booking) {
        var status = booking.status || 'pending';
        return status === 'pending';
    });
    
    var container = document.getElementById('danhSachPhong');
    
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Không có phòng nào trong giỏ hàng</p>';
        // Nếu không có booking nào, chuyển về trang chủ
        setTimeout(function() {
            alert('Giỏ hàng trống! Bạn sẽ được chuyển về trang chủ.');
            window.location.href = 'index.html';
        }, 1000);
        return;
    }
    
    var html = '';
    var tongTien = 0;
    
    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        var checkInDate = booking.checkIn || booking.checkin || '2025-01-01';
        var checkOutDate = booking.checkOut || booking.checkout || '2025-01-02';
        
        var checkIn = new Date(checkInDate);
        var checkOut = new Date(checkOutDate);
        
        if (isNaN(checkIn.getTime())) checkIn = new Date('2025-01-01');
        if (isNaN(checkOut.getTime())) checkOut = new Date('2025-01-02');
        
        var soDem = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (soDem <= 0) soDem = 1;
        
        var price = parseInt(booking.price) || 1000000;
        var thanhTien = price * soDem;
        tongTien += thanhTien;
        
        html += taoThePhongTomTat(booking, soDem, thanhTien);
    }
    
    container.innerHTML = html;
    capNhatTongTien(tongTien);
}

function taoThePhongTomTat(booking, soDem, thanhTien) {
    return `
        <div class="the-phong-tom-tat">
            <div class="anh-phong-tom-tat">
                <img src="${booking.image || '../img/khachsan1(2).jpg'}" alt="${booking.roomName}">
            </div>
            <div class="thong-tin-phong-tom-tat">
                <div class="ten-phong-tom-tat">${booking.roomName || 'Phòng Deluxe'}</div>
                <div class="chi-tiet-phong-tom-tat">
                    ${formatDate(new Date(booking.checkIn || '2025-01-01'))} - ${formatDate(new Date(booking.checkOut || '2025-01-02'))} • ${soDem} đêm
                </div>
                <div class="gia-phong-tom-tat">${formatPrice(thanhTien)}</div>
            </div>
        </div>
    `;
}

function capNhatTongTien(tongTien) {
    tongTienGoc = tongTien; // Lưu tổng tiền gốc
    
    var phiDichVu = Math.round(tongTien * 0.05); // 5% phí dịch vụ
    var thueVAT = Math.round(tongTien * 0.1); // 10% thuế VAT
    var tienSauPhi = tongTien + phiDichVu + thueVAT;
    
    // Áp dụng giảm giá nếu có
    var tienGiamGia = 0;
    if (maGiamGiaDangApDung) {
        tienGiamGia = tinhTienGiamGia(tienSauPhi, maGiamGiaDangApDung);
    }
    
    var tongCong = tienSauPhi - tienGiamGia;
    
    document.getElementById('tamTinh').textContent = formatPrice(tongTien);
    document.getElementById('phiDichVu').textContent = formatPrice(phiDichVu);
    document.getElementById('thueVAT').textContent = formatPrice(thueVAT);
    
    // Hiển thị tiền giảm giá nếu có
    var dongGiamGia = document.getElementById('dongGiamGia');
    if (tienGiamGia > 0) {
        dongGiamGia.style.display = 'flex';
        document.getElementById('tienGiamGia').textContent = '-' + formatPrice(tienGiamGia);
    } else {
        dongGiamGia.style.display = 'none';
    }
    
    document.getElementById('tongCong').textContent = formatPrice(tongCong);
}

function khoiTaoPhuongThucThanhToan() {
    // Vì chỉ còn Chuyển khoản ngân hàng, ta luôn hiển thị formNganHang
    var formNganHang = document.getElementById('formNganHang');
    if (formNganHang) {
        formNganHang.style.display = 'block';
    }
    // Đảm bảo radio ngân-hang được checked (nếu còn)
    var bankRadio = document.querySelector('input[name="phuongThuc"][value="ngan-hang"]');
    if (bankRadio) bankRadio.checked = true;
}

function khoiTaoFormValidation() {
    // Format số điện thoại
    var soDienThoaiInput = document.getElementById('soDienThoai');
    if (soDienThoaiInput) {
        soDienThoaiInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
        });
    }
    
    // Format CMND
    var cmndInput = document.getElementById('cmnd');
    if (cmndInput) {
        cmndInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
        });
    }
}

function khoiTaoNutThanhToan() {
    var nutThanhToan = document.getElementById('nutThanhToan');
    var formThanhToan = document.getElementById('formThanhToan');
    
    if (!nutThanhToan || !formThanhToan) return;
    
    nutThanhToan.addEventListener('click', function() {
        if (kiemTraForm()) {
            thucHienThanhToan();
        }
    });
}

function kiemTraForm() {
    var hoTen = document.getElementById('hoTen').value.trim();
    var email = document.getElementById('email').value.trim();
    var soDienThoai = document.getElementById('soDienThoai').value.trim();
    var cmnd = document.getElementById('cmnd').value.trim();
    
    if (!hoTen) {
        alert('Vui lòng nhập họ và tên');
        return false;
    }
    
    if (!email || !isValidEmail(email)) {
        alert('Vui lòng nhập email hợp lệ');
        return false;
    }
    
    if (!soDienThoai || soDienThoai.length < 10) {
        alert('Vui lòng nhập số điện thoại hợp lệ');
        return false;
    }
    
    if (!cmnd || cmnd.length < 9) {
        alert('Vui lòng nhập CMND/CCCD hợp lệ');
        return false;
    }
    
    // Không cần kiểm tra thêm gì vì 2 phương thức đều chỉ cần thông tin cơ bản
    
    return true;
}

function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function thucHienThanhToan() {
    var nutThanhToan = document.getElementById('nutThanhToan');
    var phuongThuc = document.querySelector('input[name="phuongThuc"]:checked').value;
    
    // Disable nút thanh toán
    nutThanhToan.disabled = true;
    nutThanhToan.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang xử lý...</span>';
    
    // Simulate thanh toán
    setTimeout(function() {
        luuThongTinDatPhong();
        
        if (phuongThuc === 'tien-mat') {
            // Thanh toán tại khách sạn
            hienThiThongBaoThanhCong('tien-mat');
        } else if (phuongThuc === 'ngan-hang') {
            // Chuyển khoản ngân hàng
            hienThiThongBaoThanhCong('ngan-hang');
        }
    }, 2000);
}

function luuThongTinDatPhong() {
    var allBookings = storageService.getBookings();
    // Chỉ cập nhật các booking chưa thanh toán (status = 'pending')
    var bookings = allBookings.filter(function(booking) {
        var status = booking.status || 'pending';
        return status === 'pending';
    });
    
    var hoTen = document.getElementById('hoTen').value.trim();
    var email = document.getElementById('email').value.trim();
    var soDienThoai = document.getElementById('soDienThoai').value.trim();
    var cmnd = document.getElementById('cmnd').value.trim();
    var ghiChu = document.getElementById('ghiChu').value.trim();
    var phuongThuc = document.querySelector('input[name="phuongThuc"]:checked').value;
    
    // Lấy thông tin user hiện tại
    var currentUser = localStorage.getItem('currentUser');
    var userId = null;
    if (currentUser) {
        try {
            var userInfo = JSON.parse(currentUser);
            userId = userInfo.id || userInfo.username;
        } catch(e) {
        }
    }
    
    // Cập nhật thông tin khách hàng cho các booking chưa thanh toán
    for (var i = 0; i < bookings.length; i++) {
        // Đảm bảo có userId
        if (userId && !bookings[i].userId) {
            bookings[i].userId = userId;
            bookings[i].customerId = userId;
        }
        
        bookings[i].customerInfo = {
            hoTen: hoTen,
            email: email,
            soDienThoai: soDienThoai,
            cmnd: cmnd,
            ghiChu: ghiChu,
            phuongThuc: phuongThuc
        };
        bookings[i].customer = hoTen;
        bookings[i].email = email;
        bookings[i].phone = soDienThoai;
        bookings[i].status = 'pending';
        bookings[i].paymentDate = new Date().toISOString();
        
        // Cập nhật phương thức thanh toán
        if (phuongThuc === 'tien-mat') {
            bookings[i].paymentMethod = 'Tiền mặt';
        } else if (phuongThuc === 'ngan-hang') {
            bookings[i].paymentMethod = 'Chuyển khoản';
        } else if (phuongThuc === 'vnpay') {
            bookings[i].paymentMethod = 'VNPay';
        }
        
        // Lưu thông tin mã giảm giá nếu có
        if (maGiamGiaDangApDung) {
            bookings[i].promotion = {
                code: maGiamGiaDangApDung.code,
                discountValue: maGiamGiaDangApDung.discountValue,
                discountType: maGiamGiaDangApDung.discountType
            };
        }
    }
    
    // Cập nhật lại vào allBookings
    for (var i = 0; i < bookings.length; i++) {
        var bookingId = bookings[i].id;
        var index = allBookings.findIndex(function(b) { return b.id === bookingId; });
        if (index !== -1) {
            allBookings[index] = bookings[i];
        }
    }
    
    storageService.saveBookings(allBookings);
    
    // Cập nhật số lượng đã sử dụng của mã giảm giá
    if (maGiamGiaDangApDung) {
        capNhatSoLuongMaGiamGia(maGiamGiaDangApDung.code);
    }
}

function capNhatSoLuongMaGiamGia(code) {
    var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    for (var i = 0; i < promotions.length; i++) {
        if (promotions[i].code && promotions[i].code.toUpperCase() === code.toUpperCase()) {
            // Tăng số lượng đã sử dụng
            promotions[i].usedCount = (promotions[i].usedCount || 0) + 1;
            promotions[i].soLuongDaSuDung = promotions[i].usedCount;
            break;
        }
    }
    
    localStorage.setItem('promotions', JSON.stringify(promotions));
}

function hienThiThongBaoThanhCong(loaiThanhToan) {
    var message = '';
    if (loaiThanhToan === 'tien-mat') {
        message = 'Đặt phòng thành công!\n\nBạn sẽ thanh toán trực tiếp tại quầy lễ tân khách sạn khi nhận phòng.\n\nChúng tôi đã gửi email xác nhận đến bạn.';
    } else if (loaiThanhToan === 'ngan-hang') {
        message = 'Đặt phòng thành công!\n\nVui lòng chuyển khoản theo thông tin:\n- Ngân hàng: Vietcombank\n- STK: 0123456789\n- Chủ TK: KHACH SAN QUICKSTAY\n- Nội dung: Mã đặt phòng + Họ tên\n\nSau khi chuyển khoản, phòng của bạn sẽ được xác nhận trong vòng 24h.';
    }
    
    alert(message);
    
    // KHÔNG xóa bookings - giữ lại để quản trị viên quản lý
    // Chỉ cập nhật status thành 'confirmed' (đã được làm trong luuThongTinDatPhong)
    
    // Chuyển về trang chủ
    window.location.href = 'index.html';
}

function formatDate(date) {
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

function formatPrice(price) {
    if (!price) return '0 ₫';
    var priceNum = parseInt(price.toString().replace(/\D/g, ''));
    return new Intl.NumberFormat('vi-VN').format(priceNum) + ' ₫';
}

function khoiTaoMaGiamGia() {
    var inputMaGiamGia = document.getElementById('inputMaGiamGia');
    if (inputMaGiamGia) {
        // Tự động chuyển thành chữ in hoa
        inputMaGiamGia.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
        
        // Cho phép nhấn Enter để áp dụng
        inputMaGiamGia.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                apDungMaGiamGia();
            }
        });
    }
}

function apDungMaGiamGia() {
    var input = document.getElementById('inputMaGiamGia');
    var maGiamGia = input.value.trim().toUpperCase();
    var thongBao = document.getElementById('thongBaoMaGiamGia');
    
    if (!maGiamGia) {
        hienThiThongBaoMa('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }
    
    // Lấy danh sách mã giảm giá từ localStorage
    var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    // Tìm mã giảm giá
    var promotion = null;
    for (var i = 0; i < promotions.length; i++) {
        if (promotions[i].code && promotions[i].code.toUpperCase() === maGiamGia) {
            promotion = promotions[i];
            break;
        }
    }
    
    if (!promotion) {
        hienThiThongBaoMa('Mã giảm giá không tồn tại', 'error');
        return;
    }
    
    // Kiểm tra thời hạn
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    var startDate = new Date(promotion.startDate || promotion.ngayBatDau);
    var endDate = new Date(promotion.endDate || promotion.ngayKetThuc);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    if (today < startDate) {
        hienThiThongBaoMa('⏳ Mã chưa có hiệu lực', 'warning');
        return;
    }
    
    if (today > endDate) {
        hienThiThongBaoMa('⏰ Mã đã hết hạn', 'error');
        return;
    }
    
    // Kiểm tra số lượng
    var usedCount = parseInt(promotion.usedCount || promotion.soLuongDaSuDung || 0);
    var maxUses = parseInt(promotion.maxUses || promotion.soLuong || 999);
    
    if (usedCount >= maxUses) {
        hienThiThongBaoMa('📦 Mã đã hết lượt sử dụng', 'error');
        return;
    }
    
    // Lấy tổng tiền sau phí và thuế
    var phiDichVu = Math.round(tongTienGoc * 0.05);
    var thueVAT = Math.round(tongTienGoc * 0.1);
    var tongTienSauPhi = tongTienGoc + phiDichVu + thueVAT;
    
    // Kiểm tra điều kiện tối thiểu
    var minAmount = parseInt(promotion.minAmount || promotion.giaTriToiThieu || 0);
    if (tongTienSauPhi < minAmount) {
        hienThiThongBaoMa('Đơn hàng chưa đạt giá trị tối thiểu ' + formatPrice(minAmount), 'warning');
        return;
    }
    
    // Áp dụng mã giảm giá
    maGiamGiaDangApDung = promotion;
    
    // Cập nhật số lượng đã sử dụng trong localStorage
    for (var j = 0; j < promotions.length; j++) {
        if (promotions[j].id === promotion.id) {
            promotions[j].usedCount = (parseInt(promotions[j].usedCount) || 0) + 1;
            // Giảm maxUses đi 1 để hiển thị số lượng còn lại
            promotions[j].maxUses = Math.max(0, (parseInt(promotions[j].maxUses) || 0) - 1);
            break;
        }
    }
    localStorage.setItem('promotions', JSON.stringify(promotions));
    
    // Tính tiền giảm
    var tienGiam = tinhTienGiamGia(tongTienSauPhi, promotion);
    
    // Cập nhật UI
    capNhatTongTien(tongTienGoc);
    
    // Hiển thị thông báo thành công
    var discountText = promotion.discountType === 'percent' 
        ? promotion.discountValue + '%' 
        : formatPrice(promotion.discountValue);
    
    hienThiThongBaoMa(
        'Áp dụng thành công! Giảm ' + discountText + ' = ' + formatPrice(tienGiam), 
        'success'
    );
    
    // Disable input và nút
    input.disabled = true;
    document.getElementById('nutApDungMa').disabled = true;
    document.getElementById('nutApDungMa').style.opacity = '0.5';
}

function tinhTienGiamGia(tongTien, promotion) {
    var discountType = promotion.discountType || promotion.loaiGiam;
    var discountValue = parseFloat(promotion.discountValue || promotion.giaTriGiam || 0);
    var maxDiscount = parseFloat(promotion.maxDiscount || promotion.giamToiDa || 999999999);
    
    var tienGiam = 0;
    
    if (discountType === 'percent' || discountType === 'phan_tram') {
        // Giảm theo %
        tienGiam = Math.round((tongTien * discountValue) / 100);
        // Giới hạn giảm tối đa
        if (tienGiam > maxDiscount) {
            tienGiam = maxDiscount;
        }
    } else {
        // Giảm theo số tiền cố định
        tienGiam = discountValue;
        // Không cho giảm quá tổng tiền
        if (tienGiam > tongTien) {
            tienGiam = tongTien;
        }
    }
    
    return Math.round(tienGiam);
}

function hienThiThongBaoMa(message, type) {
    var thongBao = document.getElementById('thongBaoMaGiamGia');
    thongBao.style.display = 'block';
    thongBao.textContent = message;
    
    // Đổi màu theo loại thông báo
    if (type === 'success') {
        thongBao.style.color = '#059669';
        thongBao.style.background = '#f0fdf4';
        thongBao.style.borderLeft = '3px solid #059669';
    } else if (type === 'error') {
        thongBao.style.color = '#dc2626';
        thongBao.style.background = '#fef2f2';
        thongBao.style.borderLeft = '3px solid #dc2626';
    } else {
        thongBao.style.color = '#f59e0b';
        thongBao.style.background = '#fffbeb';
        thongBao.style.borderLeft = '3px solid #f59e0b';
    }
    
    thongBao.style.padding = '10px 12px';
    thongBao.style.borderRadius = '6px';
}
