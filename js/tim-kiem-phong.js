var nhanPhongTim = null;
var traPhongTim = null;
var khachTim = { nguoiLon: 1, treEm: 0, phong: 1 };
var cacPhongTimThay = [];
var thang1Tim = new Date();
var thang2Tim = new Date();

document.addEventListener('DOMContentLoaded', function() {
    thang1Tim.setDate(1);
    thang2Tim = new Date(thang1Tim.getFullYear(), thang1Tim.getMonth() + 1, 1);
    
    checkLoginStatus();
    khoiTaoMenuDiDong();
    khoiTaoDatePickerTimKiem();
    khoiTaoChonKhachTimKiem();
    khoiTaoNutTimKiemChinh();
    khoiTaoSapXep();
    khoiTaoChuyenDoiXem();
    loadSearchDataFromURL();
});

function khoiTaoDatePickerTimKiem() {
    var truongNgay = document.querySelector('.truong-ngay-thang');
    if (!truongNgay) return;
    
    var popupHTML = `
        <div class="hop-lich-tim" id="hopLichTim" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 10px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 20px; z-index: 10000; min-width: 600px; width: max-content; max-width: 90vw;">
            <div class="khung-lich-tim" style="display: flex; align-items: center; gap: 20px;">
                <button type="button" class="dieu-huong-thang-tim" id="thangTruocTim" style="background: #f5f5f5; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0;"
                        onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                        onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="lich-kep-tim" style="display: flex; gap: 30px; flex: 1;">
                    <div class="thang-tim" style="flex: 1;">
                        <div class="tieu-de-thang-tim" id="tieuDeThang1Tim" style="text-align: center; font-weight: 600; font-size: 16px; margin-bottom: 15px; color: #333; text-transform: capitalize;"></div>
                        <div class="luoi-lich-tim" id="lich1Tim" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;"></div>
                    </div>
                    
                    <div class="thang-tim" style="flex: 1;">
                        <div class="tieu-de-thang-tim" id="tieuDeThang2Tim" style="text-align: center; font-weight: 600; font-size: 16px; margin-bottom: 15px; color: #333; text-transform: capitalize;"></div>
                        <div class="luoi-lich-tim" id="lich2Tim" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;"></div>
                    </div>
                </div>
                
                <button type="button" class="dieu-huong-thang-tim" id="thangSauTim" style="background: #f5f5f5; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0;"
                        onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                        onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    truongNgay.style.position = 'relative';
    truongNgay.insertAdjacentHTML('beforeend', popupHTML);
    
    truongNgay.addEventListener('click', function(e) {
        e.stopPropagation();
        var popup = document.getElementById('hopLichTim');
        var khachPopup = document.getElementById('hopKhachTim');
        
        if (khachPopup) khachPopup.style.display = 'none';
        
        if (popup && (popup.style.display === 'none' || !popup.style.display || popup.style.display === '')) {
            popup.style.display = 'block';
            taoHaiLichTim();
        } else if (popup) {
            popup.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        var popup = document.getElementById('hopLichTim');
        if (popup && !truongNgay.contains(e.target)) {
            popup.style.display = 'none';
        }
    });
    
    document.getElementById('thangTruocTim').addEventListener('click', function(e) {
        e.stopPropagation();
        thang1Tim.setMonth(thang1Tim.getMonth() - 1);
        thang2Tim.setMonth(thang2Tim.getMonth() - 1);
        taoHaiLichTim();
    });
    
    document.getElementById('thangSauTim').addEventListener('click', function(e) {
        e.stopPropagation();
        thang1Tim.setMonth(thang1Tim.getMonth() + 1);
        thang2Tim.setMonth(thang2Tim.getMonth() + 1);
        taoHaiLichTim();
    });
}

function taoHaiLichTim() {
    taoLichTim('lich1Tim', thang1Tim, 'tieuDeThang1Tim');
    taoLichTim('lich2Tim', thang2Tim, 'tieuDeThang2Tim');
}

function taoLichTim(calendarId, monthDate, titleId) {
    var calendar = document.getElementById(calendarId);
    var title = document.getElementById(titleId);
    
    if (!calendar || !title) return;
    
    var monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    
    var year = monthDate.getFullYear();
    var month = monthDate.getMonth();
    
    title.textContent = monthNames[month] + ' năm ' + year;
    calendar.innerHTML = '';
    
    var dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (var i = 0; i < dayNames.length; i++) {
        var header = document.createElement('div');
        header.className = 'tieu-de-ngay-tim';
        header.textContent = dayNames[i];
        header.style.cssText = 'text-align: center; font-weight: 600; padding: 8px; color: #666; font-size: 12px;';
        calendar.appendChild(header);
    }
    
    var firstDay = new Date(year, month, 1);
    var lastDate = new Date(year, month + 1, 0).getDate();
    var startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    for (var j = 0; j < startDay; j++) {
        var emptyDay = document.createElement('div');
        emptyDay.className = 'o-lich-tim';
        calendar.appendChild(emptyDay);
    }
    
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (var day = 1; day <= lastDate; day++) {
        var dayElement = document.createElement('div');
        dayElement.className = 'o-lich-tim';
        dayElement.textContent = day;
        dayElement.style.cssText = 'padding: 10px; text-align: center; cursor: pointer; border-radius: 4px; transition: all 0.2s;';
        
        var cellDate = new Date(year, month, day);
        cellDate.setHours(0, 0, 0, 0);
        
        if (cellDate.getTime() === today.getTime()) {
            dayElement.style.background = '#e3f2fd';
            dayElement.style.fontWeight = '600';
        }
        
        if (cellDate < today) {
            dayElement.style.color = '#ccc';
            dayElement.style.cursor = 'not-allowed';
        } else {
            if (nhanPhongTim && cellDate.getTime() === nhanPhongTim.getTime()) {
                dayElement.style.background = '#1976d2';
                dayElement.style.color = '#fff';
                dayElement.style.fontWeight = '600';
            }
            
            if (traPhongTim && cellDate.getTime() === traPhongTim.getTime()) {
                dayElement.style.background = '#1976d2';
                dayElement.style.color = '#fff';
                dayElement.style.fontWeight = '600';
            }
            
            if (nhanPhongTim && traPhongTim && 
                cellDate > nhanPhongTim && cellDate < traPhongTim) {
                dayElement.style.background = '#bbdefb';
            }
            
            (function(date) {
                dayElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    chonNgayTim(new Date(date));
                });
                
                dayElement.addEventListener('mouseenter', function() {
                    if (cellDate >= today) {
                        this.style.background = this.style.background || '#f5f5f5';
                    }
                });
            })(cellDate);
        }
        
        calendar.appendChild(dayElement);
    }
}

function chonNgayTim(date) {
    date.setHours(0, 0, 0, 0);
    
    if (!nhanPhongTim || (nhanPhongTim && traPhongTim)) {
        nhanPhongTim = new Date(date);
        traPhongTim = null;
    } else if (date > nhanPhongTim) {
        traPhongTim = new Date(date);
    } else {
        nhanPhongTim = new Date(date);
        traPhongTim = null;
    }
    
    capNhatHienThiNgayTim();
    taoHaiLichTim();
    
    if (nhanPhongTim && traPhongTim) {
        setTimeout(function() {
            var popup = document.getElementById('hopLichTim');
            if (popup) popup.style.display = 'none';
        }, 300);
    }
}

function capNhatHienThiNgayTim() {
    var display = document.getElementById('hienThiNgayTim');
    if (!display) return;
    
    if (nhanPhongTim && traPhongTim) {
        display.textContent = formatDateVN(nhanPhongTim) + ' — ' + formatDateVN(traPhongTim);
    } else if (nhanPhongTim) {
        display.textContent = formatDateVN(nhanPhongTim) + ' — Ngày trả phòng';
    } else {
        display.textContent = 'Ngày nhận phòng – Ngày trả phòng';
    }
}

function formatDateVN(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    return (day < 10 ? '0' + day : day) + '/' + (month < 10 ? '0' + month : month) + '/' + year;
}

function khoiTaoChonKhachTimKiem() {
    var truongKhach = document.querySelector('.truong-khach-phong');
    if (!truongKhach) return;
    
    var popupHTML = `
        <div class="hop-khach-tim" id="hopKhachTim" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 10px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 24px; z-index: 10000; min-width: 320px; width: max-content;">
            <div class="hang-khach-tim" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="nhan-khach-tim" style="font-size: 15px; font-weight: 500; color: #333;">
                    <i class="fas fa-user" style="margin-right: 8px; color: #1976d2;"></i> Người lớn
                </div>
                <div class="dieu-khien-khach-tim" style="display: flex; align-items: center; gap: 16px;">
                    <button type="button" class="nut-khach-tim minus-tim" data-target="nguoiLon" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">−</button>
                    <span class="so-khach-tim" id="soNguoiLonTim" style="font-size: 18px; font-weight: 600; min-width: 30px; text-align: center; color: #333;">1</span>
                    <button type="button" class="nut-khach-tim plus-tim" data-target="nguoiLon" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">+</button>
                </div>
            </div>
            
            <div class="hang-khach-tim" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="nhan-khach-tim" style="font-size: 15px; font-weight: 500; color: #333;">
                    <i class="fas fa-child" style="margin-right: 8px; color: #059669;"></i> Trẻ em
                </div>
                <div class="dieu-khien-khach-tim" style="display: flex; align-items: center; gap: 16px;">
                    <button type="button" class="nut-khach-tim minus-tim" data-target="treEm" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">−</button>
                    <span class="so-khach-tim" id="soTreEmTim" style="font-size: 18px; font-weight: 600; min-width: 30px; text-align: center; color: #333;">0</span>
                    <button type="button" class="nut-khach-tim plus-tim" data-target="treEm" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">+</button>
                </div>
            </div>
            
            <div class="hang-khach-tim" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <div class="nhan-khach-tim" style="font-size: 15px; font-weight: 500; color: #333;">
                    <i class="fas fa-door-open" style="margin-right: 8px; color: #9333ea;"></i> Phòng
                </div>
                <div class="dieu-khien-khach-tim" style="display: flex; align-items: center; gap: 16px;">
                    <button type="button" class="nut-khach-tim minus-tim" data-target="phong" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">−</button>
                    <span class="so-khach-tim" id="soPhongTim" style="font-size: 18px; font-weight: 600; min-width: 30px; text-align: center; color: #333;">1</span>
                    <button type="button" class="nut-khach-tim plus-tim" data-target="phong" style="background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"
                            onmouseenter="this.style.background='#1976d2'; this.style.color='#fff'"
                            onmouseleave="this.style.background='#f5f5f5'; this.style.color='#333'">+</button>
                </div>
            </div>
            
            <button type="button" class="nut-xong-khach-tim" id="nutXongKhachTim" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #fff; border: none; padding: 12px 24px; border-radius: 8px; width: 100%; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                    onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(25,118,210,0.4)'"
                    onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <i class="fas fa-check"></i> Xong
            </button>
        </div>
    `;
    
    truongKhach.style.position = 'relative';
    truongKhach.insertAdjacentHTML('beforeend', popupHTML);
    
    truongKhach.addEventListener('click', function(e) {
        e.stopPropagation();
        var popup = document.getElementById('hopKhachTim');
        var datePopup = document.getElementById('hopLichTim');
        
        if (datePopup) datePopup.style.display = 'none';
        
        if (popup && (popup.style.display === 'none' || !popup.style.display || popup.style.display === '')) {
            popup.style.display = 'block';
        } else if (popup) {
            popup.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        var popup = document.getElementById('hopKhachTim');
        if (popup && !truongKhach.contains(e.target)) {
            popup.style.display = 'none';
        }
    });
    
    var btns = document.querySelectorAll('.nut-khach-tim');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var target = this.getAttribute('data-target');
            var isPlus = this.classList.contains('plus-tim');
            
            if (isPlus) {
                if (target === 'nguoiLon' && khachTim.nguoiLon < 20) khachTim.nguoiLon++;
                if (target === 'treEm' && khachTim.treEm < 10) khachTim.treEm++;
                if (target === 'phong' && khachTim.phong < 10) khachTim.phong++;
            } else {
                if (target === 'nguoiLon' && khachTim.nguoiLon > 1) khachTim.nguoiLon--;
                if (target === 'treEm' && khachTim.treEm > 0) khachTim.treEm--;
                if (target === 'phong' && khachTim.phong > 1) khachTim.phong--;
            }
            
            capNhatHienThiKhachTim();
        });
    }
    
    document.getElementById('nutXongKhachTim').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('hopKhachTim').style.display = 'none';
    });
}

function capNhatHienThiKhachTim() {
    document.getElementById('soNguoiLonTim').textContent = khachTim.nguoiLon;
    document.getElementById('soTreEmTim').textContent = khachTim.treEm;
    document.getElementById('soPhongTim').textContent = khachTim.phong;
    
    var display = document.getElementById('hienThiKhachTim');
    if (display) {
        display.textContent = khachTim.nguoiLon + ' người lớn · ' + khachTim.treEm + ' trẻ em · ' + khachTim.phong + ' phòng';
    }
}

function khoiTaoNutTimKiemChinh() {
    var nutTim = document.getElementById('nutTimKiemChinh');
    if (nutTim) {
        nutTim.addEventListener('click', function() {
            timKiemPhong();
        });
    }
}

function timKiemPhong() {
    if (!nhanPhongTim || !traPhongTim) {
        alert('Vui lòng chọn ngày nhận phòng và trả phòng!');
        return;
    }
    
    if (isNaN(nhanPhongTim.getTime()) || isNaN(traPhongTim.getTime()) || nhanPhongTim >= traPhongTim) {
        alert('Ngày không hợp lệ!');
        return;
    }

    var rooms = storageService.ensureRoomsSeeded();
    var bookings = storageService.getBookings();
    
    if (rooms.length === 0) {
        alert('Chưa có phòng nào trong hệ thống!');
        return;
    }

    var checkIn = new Date(nhanPhongTim);
    var checkOut = new Date(traPhongTim);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    function isRoomBooked(roomId, checkInDate, checkOutDate) {
        for (var i = 0; i < bookings.length; i++) {
            var b = bookings[i];
            // Chỉ kiểm tra các đơn đã xác nhận (confirmed) hoặc đang ở (checkedin) hoặc hoàn thành (completed)
            // KHÔNG kiểm tra pending vì chưa thanh toán, phòng vẫn còn trống
            if (b.roomId == roomId && (b.status === 'confirmed' || b.status === 'checkedin' || b.status === 'completed')) {
                var bStart = new Date(b.checkIn || b.checkin);
                var bEnd = new Date(b.checkOut || b.checkout);
                if (isNaN(bStart.getTime()) || isNaN(bEnd.getTime())) continue;
                bStart.setHours(0, 0, 0, 0);
                bEnd.setHours(0, 0, 0, 0);
                // Kiểm tra xem khoảng thời gian có trùng nhau không
                if (checkInDate < bEnd && checkOutDate > bStart) return true;
            }
        }
        return false;
    }

    var ketQua = [];
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        
        if (room.status !== 'available') continue;
        
        var cap = parseCapacity(room);
        if (cap.adults < khachTim.nguoiLon || cap.children < khachTim.treEm) continue;
        
        if (isRoomBooked(room.id, checkIn, checkOut)) continue;
        
        ketQua.push(room);
    }

    cacPhongTimThay = ketQua;

    if (ketQua.length === 0) {
        hienThiKhongCoKetQua();
    } else {
        hienThiKetQuaTimKiem(ketQua);
    }
}

function hienThiKhongCoKetQua() {
    var noiDungKetQua = document.getElementById('noiDungKetQua');
    var container = document.getElementById('searchResultsContainer');
    var soLuongKetQua = document.getElementById('soLuongKetQua');
    
    if (noiDungKetQua) noiDungKetQua.style.display = 'block';
    if (soLuongKetQua) soLuongKetQua.textContent = '0';
    
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <i class="fas fa-search" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 10px; font-size: 24px;">Không tìm thấy phòng phù hợp</h3>
                <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                    Rất tiếc, không có phòng nào phù hợp với tiêu chí tìm kiếm của bạn.<br>
                    Vui lòng thử thay đổi ngày hoặc số khách.
                </p>
                <button onclick="window.location.href='index.html'" style="background: #1976d2; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-arrow-left"></i> Quay về trang chủ
                </button>
            </div>
        `;
    }
}

function hienThiKetQuaTimKiem(rooms) {
    var soLuongKetQua = document.getElementById('soLuongKetQua');
    var container = document.getElementById('searchResultsContainer');
    var noiDungKetQua = document.getElementById('noiDungKetQua');
    var header = document.getElementById('searchResultsHeader');
    
    if (noiDungKetQua) noiDungKetQua.style.display = 'block';
    if (soLuongKetQua) soLuongKetQua.textContent = rooms.length;
    
    if (header) {
        var searchInfo = document.getElementById('searchInfoDisplay');
        if (!searchInfo) {
            searchInfo = document.createElement('div');
            searchInfo.id = 'searchInfoDisplay';
            searchInfo.style.cssText = 'margin-top: 12px; padding: 16px; background: #f0f9ff; border-left: 4px solid #1976d2; border-radius: 8px; font-size: 14px; color: #666;';
            header.querySelector('h1').after(searchInfo);
        }
        searchInfo.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
                <span><i class="fas fa-calendar-check" style="color: #1976d2; margin-right: 6px;"></i> <strong>Ngày:</strong> ${formatDateVN(nhanPhongTim)} - ${formatDateVN(traPhongTim)} (${Math.ceil((traPhongTim - nhanPhongTim) / (1000 * 60 * 60 * 24))} đêm)</span>
                <span><i class="fas fa-users" style="color: #1976d2; margin-right: 6px;"></i> <strong>Yêu cầu:</strong> ${khachTim.nguoiLon} người lớn, ${khachTim.treEm} trẻ em</span>
                <span><i class="fas fa-info-circle" style="color: #1976d2; margin-right: 6px;"></i> <em>Hiển thị phòng có đủ chỗ hoặc rộng hơn</em></span>
            </div>
        `;
    }
    
    if (container) {
        var html = '';
        for (var i = 0; i < rooms.length; i++) {
            html += taoThePhongTimKiem(rooms[i]);
        }
        container.innerHTML = html;
    }
    
    setTimeout(function() {
        var element = document.getElementById('noiDungKetQua');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function taoThePhongTimKiem(room) {
    var cap = parseCapacity(room);
    var adults = cap.adults.toString();
    var children = cap.children.toString();
    
    var price = formatPrice(room.price);
    var soDem = nhanPhongTim && traPhongTim ? Math.ceil((traPhongTim - nhanPhongTim) / (1000 * 60 * 60 * 24)) : 1;
    var tongTien = formatPrice(room.price * soDem);
    
    // Xử lý danh sách tiện ích của phòng (amenities)
    var amenitiesArray = room.amenities ? room.amenities.split(',') : [];
    for (var i = 0; i < amenitiesArray.length; i++) {
        amenitiesArray[i] = amenitiesArray[i].trim();
    }

    // Hiển thị tiện ích với style màu xanh dương
    var amenitiesHTML = '';
    for (var j = 0; j < amenitiesArray.length; j++) {
        var amenity = amenitiesArray[j];
        var icon = 'fas fa-check';
        if (amenity.toLowerCase().indexOf('wifi') !== -1) icon = 'fas fa-wifi';
        else if (amenity.toLowerCase().indexOf('tv') !== -1) icon = 'fas fa-tv';
        else if (amenity.toLowerCase().indexOf('điều hòa') !== -1) icon = 'fas fa-snowflake';
        else if (amenity.toLowerCase().indexOf('minibar') !== -1 || amenity.toLowerCase().indexOf('mini bar') !== -1) icon = 'fas fa-glass-martini';
        amenitiesHTML += '<span style="color: #1976d2; font-size: 14px; padding: 8px 14px; background: #ebf3ff; border-radius: 7px; display: inline-flex; align-items: center; gap: 7px; line-height: 1.5; border: 1px solid #b3d9ff;"><i class="' + icon + '" style="font-size: 14px;"></i> ' + amenity + '</span>';
    }
    
    var html = `
        <div class="the-phong" onclick="datPhongNgay(${room.id})" style="cursor: pointer;">
            <div class="anh-phong">
                <img src="${room.image || '../img/khachsan1(1).jpg'}" alt="${room.name}" onerror="this.src='../img/khachsan1(1).jpg'">
                <div class="nhan-phong">Tầng ${room.floor || '1'}</div>
            </div>
            <div class="noi-dung-phong">
                <div class="tieu-de-phong">
                    <h3 class="ten-phong">${room.name}</h3>
                    <div class="gia-phong">${price}</div>
                    <div style="color: #666; font-size: 14px; margin-top: 4px;">
                        <i class="fas fa-calculator" style="margin-right: 5px; color: #1976d2;"></i> ${soDem} đêm = <strong style="color: #1976d2;">${tongTien}</strong>
                    </div>
                </div>
                <div class="loai-phong">
                    <span class="dia-diem-phong">${room.hotel || 'QuickStay Hotel'}</span>
                    <span class="hang-phong">Phòng ${room.roomNumber || room.id}</span>
                </div>
                <div class="danh-gia-phong">
                    <div class="sao">
                        <i class="fas fa-users" style="color: #1976d2; margin-right: 7px; font-size: 15px;"></i>
                        <span>${adults} người lớn, ${children} trẻ em</span>
                    </div>
                    <div class="luot-danh-gia">
                        <i class="fas fa-check-circle" style="color: #1976d2; margin-right: 6px;"></i>
                        <span>Phù hợp yêu cầu</span>
                    </div>
                </div>
                <div style="background: #f0f9ff; border-left: 3px solid #1976d2; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; color: #1976d2;">
                    <i class="fas fa-check-circle" style="color: #1976d2; margin-right: 6px;"></i> <strong>Phù hợp:</strong> Phòng này có đủ chỗ cho ${khachTim.nguoiLon} người lớn, ${khachTim.treEm} trẻ em
                </div>
                <p class="mo-ta-phong">${room.description || 'Phòng hiện đại, tiện nghi đầy đủ.'}</p>
                <div class="tien-ich-phong">
                    ${amenitiesHTML}
                </div>
            </div>
        </div>
    `;
    
    return html;
}

function formatPrice(price) {
    if (!price) return '0đ';
    var num = typeof price === 'string' ? parseFloat(price.replace(/[^\d]/g, '')) : price;
    return num.toLocaleString('vi-VN') + 'đ';
}

function datPhongNgay(roomId) {
    if (!nhanPhongTim || !traPhongTim) {
        alert('Vui lòng chọn ngày nhận phòng và trả phòng!');
        return;
    }
    
    var searchData = {
        roomId: roomId,
        checkIn: nhanPhongTim.toISOString(),
        checkOut: traPhongTim.toISOString(),
        adults: khachTim.nguoiLon,
        children: khachTim.treEm,
        rooms: khachTim.phong
    };
    
    localStorage.setItem('searchData', JSON.stringify(searchData));
    
    window.location.href = 'room-detail.html?id=' + roomId + 
                          '&checkin=' + nhanPhongTim.toISOString().split('T')[0] + 
                          '&checkout=' + traPhongTim.toISOString().split('T')[0];
}

function toggleYeuThich(roomId) {
    var favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    var index = favorites.indexOf(roomId);
    
    if (index === -1) {
        favorites.push(roomId);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function khoiTaoSapXep() {
    var selectSapXep = document.getElementById('selectSapXep');
    if (selectSapXep) {
        selectSapXep.addEventListener('change', function() {
            sapXepKetQua(this.value);
        });
    }
}

function sapXepKetQua(sortBy) {
    if (!cacPhongTimThay || cacPhongTimThay.length === 0) return;
    
    var sorted = cacPhongTimThay.slice();
    
        if (sortBy === 'price-low') {
        sorted.sort(function(a, b) {
            return a.price - b.price;
        });
        } else if (sortBy === 'price-high') {
        sorted.sort(function(a, b) {
            return b.price - a.price;
        });
    } else if (sortBy === 'rating') {
        sorted.sort(function(a, b) {
            var ratingA = a.rating || 4.5;
            var ratingB = b.rating || 4.5;
            return ratingB - ratingA;
        });
    }
    
    hienThiKetQuaTimKiem(sorted);
}

function loadSearchDataFromURL() {
    var urlParams = new URLSearchParams(window.location.search);
    var checkIn = urlParams.get('checkin') || urlParams.get('checkIn');
    var checkOut = urlParams.get('checkout') || urlParams.get('checkOut');
    var adults = urlParams.get('adults');
    var children = urlParams.get('children');
    
    if (checkIn && checkOut) {
        try {
            if (checkIn.includes('T')) {
                nhanPhongTim = new Date(checkIn);
                traPhongTim = new Date(checkOut);
            } else {
                var checkInParts = checkIn.split('-');
                var checkOutParts = checkOut.split('-');
                nhanPhongTim = new Date(parseInt(checkInParts[0]), parseInt(checkInParts[1]) - 1, parseInt(checkInParts[2]));
                traPhongTim = new Date(parseInt(checkOutParts[0]), parseInt(checkOutParts[1]) - 1, parseInt(checkOutParts[2]));
            }
            
            nhanPhongTim.setHours(0, 0, 0, 0);
            traPhongTim.setHours(0, 0, 0, 0);
            
            if (isNaN(nhanPhongTim.getTime()) || isNaN(traPhongTim.getTime())) {
                return;
            }
            
            if (adults) khachTim.nguoiLon = parseInt(adults) || 1;
            if (children) khachTim.treEm = parseInt(children) || 0;
            
            capNhatHienThiNgayTim();
            capNhatHienThiKhachTim();
            
            setTimeout(function() {
                timKiemPhong();
            }, 500);
        } catch (e) {
            alert('Lỗi xử lý ngày tháng. Vui lòng thử lại!');
        }
    }
}

function khoiTaoChuyenDoiXem() {
    var nutXem = document.querySelectorAll('.nut-xem');
    for (var i = 0; i < nutXem.length; i++) {
        nutXem[i].addEventListener('click', function() {
            for (var j = 0; j < nutXem.length; j++) {
                nutXem[j].classList.remove('active');
            }
            this.classList.add('active');
            
            var view = this.getAttribute('data-view');
            var container = document.getElementById('searchResultsContainer');
            
            if (view === 'grid') {
                container.style.display = 'grid';
                container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
                container.style.gap = '20px';
            } else {
                container.style.display = 'block';
                container.style.gridTemplateColumns = 'none';
            }
        });
    }
}