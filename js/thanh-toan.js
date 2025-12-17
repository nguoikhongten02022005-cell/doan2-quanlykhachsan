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

function getNumericPrice(b) {
    var p = (b && (b.price || b.totalAmount || b.total)) || 0;
    if (typeof p === 'string') p = p.replace(/[^\d.-]/g, '');
    var n = Number(p);
    return isNaN(n) ? 0 : n;
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
        
        var price = getNumericPrice(booking) || 1000000;
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
        // Với gateway thực tế, thay bằng callback success từ gateway
        var paymentOk = true; // giả lập thành công

        if (paymentOk) {
            // finalize = true => mark confirmed/paid
            luuThongTinDatPhong(true);
            hienThiThongBaoThanhCong(phuongThuc);
        } else {
            // Lưu thông tin nhưng giữ pending
            luuThongTinDatPhong(false);
            alert('Thanh toán thất bại. Vui lòng thử lại.');
            // khôi phục nút
            nutThanhToan.disabled = false;
            nutThanhToan.innerHTML = '<i class="fas fa-lock"></i><span>Thanh toán ngay</span>';
        }
    }, 2000);
}

function luuThongTinDatPhong(finalize = false) {
    // Lấy tất cả booking hiện có
    var allBookings = [];
    try {
        allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch(e) {
        allBookings = [];
    }

    // Lấy các booking đang ở trạng thái pending (những booking trong giỏ)
    var bookings = allBookings.filter(function(booking) {
        var status = (booking.status || 'pending').toLowerCase();
        return status === 'pending';
    });

    var hoTen = document.getElementById('hoTen').value.trim();
    var email = document.getElementById('email').value.trim();
    var soDienThoai = document.getElementById('soDienThoai').value.trim();
    var cmnd = document.getElementById('cmnd').value.trim();
    var ghiChu = document.getElementById('ghiChu').value.trim();
    var phuongThuc = (document.querySelector('input[name="phuongThuc"]:checked') || {}).value || 'ngan-hang';

    // Lấy thông tin user hiện tại nếu có
    var currentUser = localStorage.getItem('currentUser');
    var userId = null;
    if (currentUser) {
        try {
            var userInfo = JSON.parse(currentUser);
            userId = userInfo.id || userInfo.username;
        } catch (e) {}
    }

    // Cập nhật các booking pending với thông tin khách hàng và trạng thái
    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];

        if (userId && !b.userId) {
            b.userId = userId;
            b.customerId = userId;
        }

        b.customerInfo = {
            hoTen: hoTen,
            email: email,
            soDienThoai: soDienThoai,
            cmnd: cmnd,
            ghiChu: ghiChu,
            phuongThuc: phuongThuc
        };
        b.customer = hoTen;
        b.email = email;
        b.phone = soDienThoai;
        b.paymentDate = new Date().toISOString();

        if (finalize) {
            b.status = 'confirmed';
        } else {
            b.status = 'pending';
        }

        if (phuongThuc === 'tien-mat') b.paymentMethod = 'Tiền mặt';
        else if (phuongThuc === 'ngan-hang') b.paymentMethod = 'Chuyển khoản';
        else if (phuongThuc === 'vnpay') b.paymentMethod = 'VNPay';
        else b.paymentMethod = phuongThuc;
    }

    // Lưu toàn bộ allBookings (vì bookings là reference tới các phần tử trong allBookings,
    // việc sửa bookings[i] cũng sửa allBookings). Ghi lại vào localStorage.
    try {
        localStorage.setItem('bookings', JSON.stringify(allBookings));
    } catch (e) {
        console.error('Không thể lưu bookings lên localStorage:', e);
    }

    // Sau khi lưu, cập nhật giao diện / chuyển hướng hoặc gọi lại hàm tìm kiếm nếu cần
    // Ví dụ: nếu đang ở trang thanh toán, có thể chuyển đến trang hoàn tất
    // hoặc nếu cần refresh trang tìm kiếm hiện tại thì gọi lại loadSearchDataFromURL() hoặc performSearch()
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

// Hiển thị thông báo thanh toán thành công rồi chuyển về trang chủ
function hienThiThongBaoThanhCong(type) {
    try {
        var title = 'Đặt phòng thành công!';
        var message = 'Cảm ơn bạn đã đặt phòng. ';
        if (type === 'tien-mat') {
            message += 'Vui lòng thanh toán tại quầy lễ tân khi đến nhận phòng.';
        } else if (type === 'ngan-hang') {
            message += 'Vui lòng chuyển khoản theo hướng dẫn. Sau khi nhận thanh toán chúng tôi sẽ xác nhận đơn của bạn.';
        } else {
            message += 'Thông tin đặt phòng đã được lưu.';
        }

        var div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = '50%';
        div.style.top = '18%';
        div.style.transform = 'translateX(-50%)';
        div.style.zIndex = 12000;
        div.style.minWidth = '320px';
        div.style.maxWidth = '90%';
        div.style.background = '#fff';
        div.style.borderRadius = '10px';
        div.style.boxShadow = '0 18px 50px rgba(0,0,0,0.35)';
        div.style.padding = '18px 20px';
        div.style.textAlign = 'left';
        div.innerHTML = '<h3 style="margin:0 0 8px 0;color:#0b2540">' + title + '</h3>'
                      + '<div style="color:#334155; font-size:14px; line-height:1.45;">' + message + '</div>'
                      + '<div style="text-align:right; margin-top:12px;"><button id="okThanhToanBtn" style="background:#0b63d6;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600">OK</button></div>';

        document.body.appendChild(div);

        var backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.inset = '0';
        backdrop.style.background = 'rgba(0,0,0,0.45)';
        backdrop.style.zIndex = 11990;
        document.body.appendChild(backdrop);

        function finish() {
            try { document.body.removeChild(div); document.body.removeChild(backdrop); } catch(e){}
            window.location.href = 'index.html';
        }

        var okBtn = document.getElementById('okThanhToanBtn');
        if (okBtn) okBtn.addEventListener('click', finish);

        setTimeout(function(){ finish(); }, 3000);
    } catch (e) {
        alert('Đặt phòng thành công! Xin chờ chuyển hướng về trang chủ.');
        window.location.href = 'index.html';
    }
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

// ---- Promo UI: render + interactions ----
(function(){
    function formatDateShort(d) {
        if (!d) return '—';
        var dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return dt.toISOString().split('T')[0];
    }

    function getPromotions() {
        try { return JSON.parse(localStorage.getItem('promotions')||'[]'); } catch(e){ return []; }
    }

    function isPromoActive(p) {
        var now = new Date();
        if (p.startDate && new Date(p.startDate) > now) return false;
        if (p.endDate && new Date(p.endDate) < now) return false;
        var max = Number(p.maxUses || p.soluong || 0);
        var used = Number(p.usedCount || 0);
        if (max > 0 && used >= max) return false;
        return true;
    }

    function renderPromos() {
        var promos = getPromotions();
        var container = document.getElementById('promoList');
        if (!container) return;
        if (!promos || promos.length === 0) {
            container.innerHTML = '<div style="padding:20px;color:#475569">Không có mã giảm giá.</div>';
            return;
        }
        var html = '';
        promos.forEach(function(p){
            var active = isPromoActive(p);
            var desc = p.description || (p.discountType === 'percent' ? (p.discountValue + '%') : (p.discountValue + ' đ'));
            html += '<div class="promo-item">';
            html += '<div class="promo-left">';
            html += '<div><div class="promo-code">' + (p.code || p.id || '') + '</div>';
            html += '<div class="promo-desc">' + desc + '</div>';
            html += '<div class="promo-meta">Thời gian: ' + (p.startDate?formatDateShort(p.startDate):'—') + ' → ' + (p.endDate?formatDateShort(p.endDate):'—') + '</div></div>';
            html += '</div>';
            html += '<div class="promo-actions">';
            html += '<div class="promo-percent">' + (p.discountType === 'percent' ? (p.discountValue + '%') : '') + '</div>';
            html += '<button class="btn-copy" data-code="' + (p.code||p.id||'') + '" title="Sao chép mã"><i class="fas fa-copy"></i> Copy</button>';
            html += '<button class="btn-apply" data-code="' + (p.code||p.id||'') + '"' + (active? '':' disabled') + '>' + (active? 'Áp dụng':'Hết hạn') + '</button>';
            html += '</div></div>';
        });
        container.innerHTML = html;

        // bind copy
        container.querySelectorAll('.btn-copy').forEach(function(btn){
            btn.addEventListener('click', function(){
                var code = this.getAttribute('data-code') || '';
                if (!code) return alert('Mã rỗng');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(code).then(function(){ alert('Đã copy: ' + code); });
                } else {
                    var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select();
                    document.execCommand('copy'); document.body.removeChild(ta);
                    alert('Đã copy: ' + code);
                }
            });
        });

        // bind apply
        container.querySelectorAll('.btn-apply').forEach(function(btn){
            btn.addEventListener('click', function(){
                if (this.disabled) return;
                var code = this.getAttribute('data-code') || '';
                applyPromoFromModal(code);
            });
        });
    }

    // Thay thế hàm applyPromoFromModal bằng bản đặc hiệu cho thanh-toan.html
    function applyPromoFromModal(code) {
        if (!code) {
            alert('Mã rỗng');
            return;
        }

        // 1) Tìm ô nhập mã trên trang (theo id bạn đang dùng)
        var maInput = document.getElementById('inputMaGiamGia') 
                   || document.querySelector('input[placeholder*="MÃ GIẢM"]') 
                   || document.querySelector('input[placeholder*="MÃ giảm"]') 
                   || document.querySelector('input[name*="ma"]');

        if (!maInput) {
            alert('Không tìm thấy ô nhập mã giảm giá trên trang.');
            return;
        }

        // 2) Điền mã vào ô
        maInput.value = code;
        // (nếu input có event listener oninput, dispatch input để trigger các xử lý)
        try {
            maInput.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {}

        // 3) Tìm nút Áp dụng chính xác theo id bạn dùng
        var applyBtn = document.getElementById('nutApDungMa') 
                    || document.getElementById('nutApDung') 
                    || document.querySelector('button[onclick*="apDungMaGiamGia"]') 
                    || Array.from(document.querySelectorAll('button')).find(function(b){ return /áp dụng/i.test(b.textContent); });

        // 4) Click nút Áp dụng nếu tìm thấy để hệ thống xử lý mã như bình thường
        if (applyBtn) {
            try {
                applyBtn.click();
            } catch (e) {
                // fallback: gọi hàm áp dụng nếu tồn tại
                if (typeof apDungMaGiamGia === 'function') {
                    try { apDungMaGiamGia(); } catch (err) { console.warn(err); }
                }
            }
        } else {
            // Nếu không tìm thấy, cảnh báo và đóng modal
            alert('Đã gán mã: ' + code + '. Vui lòng nhấn "Áp dụng" để xác nhận.');
        }

        // 5) Đóng modal (nếu có)
        try { 
            var modalEl = document.getElementById('promoModal');
            if (modalEl) {
                // nếu dùng class "show" để animate, remove
                modalEl.classList.remove('show');
                setTimeout(function(){ modalEl.style.display = 'none'; }, 220);
            }
        } catch (e) { /* không quan trọng */ }
    }

    // modal open/close (query DOM lazily to avoid null when script loads early)
    var modal = null;
    function getModal() { return document.getElementById('promoModal'); }
    function openPromosModal() {
        modal = getModal();
        if (!modal) return;
        modal.style.display = 'block';
        setTimeout(function(){ modal.classList.add('show'); }, 10);
        renderPromos();
        // focus first button for accessibility
        var first = modal.querySelector('.btn-apply:not([disabled])') || modal.querySelector('.btn-copy');
        if (first) first.focus();
    }
    function closePromosModal() {
        modal = modal || getModal();
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(function(){ modal.style.display = 'none'; }, 220);
    }

    // events
    document.addEventListener('DOMContentLoaded', function(){
        var xemBtn = document.getElementById('xemMaGiamGiaBtn');
        if (xemBtn) xemBtn.addEventListener('click', openPromosModal);
        var close = document.getElementById('promoClose');
        if (close) close.addEventListener('click', closePromosModal);
        var closef = document.getElementById('promoCloseFooter');
        if (closef) closef.addEventListener('click', closePromosModal);
        // click backdrop to close
        var backdropEl = getModal() ? getModal().querySelector('.promo-modal-backdrop') : null;
        if (backdropEl) backdropEl.addEventListener('click', closePromosModal);
        // ESC to close
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && modal && modal.style.display === 'block') closePromosModal();
        });
    });

    // expose apply helper for other scripts
    window.applyPromoFromModal = applyPromoFromModal;
})();
