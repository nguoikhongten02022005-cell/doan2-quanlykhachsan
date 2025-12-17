// Biến toàn cục cho trang tìm kiếm
var bayGioTim = new Date();
var thang1Tim = new Date(bayGioTim.getFullYear(), bayGioTim.getMonth(), 1);
var thang2Tim = new Date(bayGioTim.getFullYear(), bayGioTim.getMonth() + 1, 1);
var nhanPhongTim = null;
var traPhongTim = null;

// Parse YYYY-MM-DD into local Date (avoid timezone issues)
function parseDateYYYYMMDD(s) {
    if (!s) return null;
    var parts = s.split('-').map(Number);
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Simple HTML escape for inserted text to reduce XSS risk
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- Helper: parse giữ giờ nếu có, hoặc trả về 00:00 local khi chỉ có YYYY-MM-DD ---
//  - endOfDay = true: nếu chuỗi chỉ có YYYY-MM-DD -> coi là 23:59:59.999 của ngày đó
function _toDateTime(v, endOfDay) {
    if (endOfDay === undefined) endOfDay = false;
    if (!v) return null;
    if (v instanceof Date) {
        var d = new Date(v.getTime());
        if (endOfDay) d.setHours(23,59,59,999);
        return d;
    }
    var s = String(v).trim();
    // Nếu dạng YYYY-MM-DD -> trả về Date ở 00:00 (hoặc 23:59:59.999 nếu endOfDay=true)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        var p = s.split('-').map(Number);
        var d = new Date(p[0], p[1] - 1, p[2]);
        if (endOfDay) d.setHours(23,59,59,999);
        else d.setHours(0,0,0,0);
        return d;
    }
    // Nếu chuỗi ISO có thời gian
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
        if (endOfDay && !/T|:/.test(s)) parsed.setHours(23,59,59,999);
        return parsed;
    }
    return null;
}

// --- Helper: kiểm tra phòng có sẵn cho khoảng [checkin, checkout) không ---
function isRoomAvailableForPeriod(roomId, checkin, checkout) {
    var start = _toDateTime(checkin, false);
    var end = _toDateTime(checkout, false);
    if (!start || !end || start >= end) return false;

    var bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch (e) {
        console.warn('Không parse được bookings:', e);
        bookings = [];
    }

    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        if (!b) continue;
        if (String(b.roomId) !== String(roomId)) continue;
        var status = (b.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'canceled') continue;

        var bs = _toDateTime(b.checkIn || b.checkin, false);
        // Nếu booking lưu dạng chỉ date (YYYY-MM-DD), coi checkout là end-of-day
        var be = _toDateTime(b.checkOut || b.checkout, true);
        if (!bs || !be) continue;

        // overlap (half-open): start < be && end > bs
        if (start < be && end > bs) {
            return false; // phòng bị chiếm
        }
    }
    return true; // không có booking chồng lấp
}

document.addEventListener('DOMContentLoaded', function() {
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
                        this.classList.add('hover');
                    }
                });

                dayElement.addEventListener('mouseleave', function() {
                    this.classList.remove('hover');
                });
            })(cellDate);
        }
        
        calendar.appendChild(dayElement);
    }
}

function chonNgayTim(date) {
    date.setHours(0, 0, 0, 0);
    
    if (!nhanPhongTim || (nhanPhongTim && traPhongTim)) {
        // Chọn ngày nhận phòng mới
        nhanPhongTim = new Date(date);
        traPhongTim = null;
    } else if (nhanPhongTim && !traPhongTim) {
        // Chọn ngày trả phòng
        if (date > nhanPhongTim) {
            traPhongTim = new Date(date);
        } else {
            // Nếu chọn ngày trước ngày nhận phòng, đặt lại ngày nhận phòng
            nhanPhongTim = new Date(date);
            traPhongTim = null;
        }
    }
    
    // Cập nhật hiển thị
    var hienThiNgay = document.getElementById('hienThiNgayTim');
    if (hienThiNgay) {
        if (nhanPhongTim && traPhongTim) {
            hienThiNgay.textContent = formatDate(nhanPhongTim) + ' - ' + formatDate(traPhongTim);
        } else if (nhanPhongTim) {
            hienThiNgay.textContent = formatDate(nhanPhongTim) + ' - Chọn ngày trả phòng';
        } else {
            hienThiNgay.textContent = 'Ngày nhận phòng – Ngày trả phòng';
        }
    }
    
    // Đóng popup lịch
    var popup = document.getElementById('hopLichTim');
    if (popup && nhanPhongTim && traPhongTim) {
        popup.style.display = 'none';
    }
    
    // Cập nhật lại lịch
    taoHaiLichTim();
    
    return date;
}

function loadSearchDataFromURL() {
  try {
    var params = new URLSearchParams(window.location.search);
    var checkinStr = params.get('checkin');
    var checkoutStr = params.get('checkout');
    var adults = parseInt(params.get('adults') || '1', 10) || 1;
    var children = parseInt(params.get('children') || '0', 10) || 0;
    var roomsCount = parseInt(params.get('rooms') || '1', 10) || 1;

    // chọn hàm parse ngày nếu có
    var parseFn = null;
    if (typeof _toDateTime === 'function') parseFn = _toDateTime;
    else if (typeof parseDateYYYYMMDD === 'function') parseFn = function(s){ return (s ? parseDateYYYYMMDD(s) : null); };
    else parseFn = function(s){ return s ? new Date(s) : null; };

    var cin = parseFn(checkinStr);
    var cout = parseFn(checkoutStr);

    // nếu thiếu checkout thì mặc định = ngày tiếp theo
    if (!cin) {
      // fallback: hôm nay
      cin = new Date();
      cin.setHours(0,0,0,0);
    }
    if (!cout || !(cout instanceof Date) || isNaN(cout.getTime())) {
      cout = new Date(cin.getFullYear(), cin.getMonth(), cin.getDate() + 1);
      cout.setHours(0,0,0,0);
    }

    // cập nhật globals (nếu trang dùng chúng)
    if (typeof nhanPhongTim !== 'undefined') nhanPhongTim = new Date(cin);
    if (typeof traPhongTim !== 'undefined') traPhongTim = new Date(cout);

    // cập nhật hiển thị người/khách (nếu có element tương ứng)
    var hienThiKhach = document.getElementById('hienThiKhachTim') || document.querySelector('.hienThiKhach');
    if (hienThiKhach) {
      hienThiKhach.textContent = adults + ' người lớn · ' + children + ' trẻ em · ' + roomsCount + ' phòng';
    }
    var hienThiNgay = document.getElementById('hienThiNgayTim');
    if (hienThiNgay && typeof formatDate === 'function') {
      hienThiNgay.textContent = formatDate(cin) + ' - ' + formatDate(cout);
    }

    console.log('loadSearchDataFromURL ->', { checkinStr, checkoutStr, cin, cout, adults, children, roomsCount });

    if (typeof performSearch === 'function') {
      performSearch(cin, cout, adults, children);
    } else {
      console.error('performSearch chưa được định nghĩa khi gọi loadSearchDataFromURL');
    }
  } catch (e) {
    console.error('Lỗi loadSearchDataFromURL:', e);
  }
}

function performSearch(checkin, checkout, adults, children) {
        try {
            // đảm bảo inputs là Date/DateTime (giữ giờ nếu có)
            var searchStart = (typeof _toDateTime === 'function') ? _toDateTime(checkin) : (checkin ? new Date(checkin) : null);
            var searchEnd = (typeof _toDateTime === 'function') ? _toDateTime(checkout) : (checkout ? new Date(checkout) : null);

        console.log('performSearch called', { searchStart, searchEnd, adults, children });

        var container = document.getElementById('searchResultsContainer');
        var resultsBlock = document.getElementById('noiDungKetQua'); // block chứa header + results
        if (!container) {
            console.error('searchResultsContainer không tìm thấy.');
            return;
        }

        // validate ngày
        if (!searchStart || !searchEnd || searchStart >= searchEnd) {
            if (resultsBlock) resultsBlock.style.display = 'none';
            container.innerHTML = '<div class="thong-bao-khong-tim-thay"><i class="fas fa-exclamation-triangle"></i><h3>Ngày không hợp lệ</h3><p>Ngày trả phòng phải sau ngày nhận phòng.</p></div>';
            return;
        }

        // load rooms/bookings an toàn
        var rooms = [];
        var bookings = [];
        try { rooms = JSON.parse(localStorage.getItem('rooms') || '[]'); } catch(e){ rooms = []; console.warn('parse rooms error', e); }
        try { bookings = JSON.parse(localStorage.getItem('bookings') || '[]'); } catch(e){ bookings = []; console.warn('parse bookings error', e); }

        // nếu không có rooms, thử seed (nếu storageService hỗ trợ)
        if ((!rooms || rooms.length === 0) && window.storageService && typeof storageService.ensureRoomsSeeded === 'function') {
            try {
                storageService.ensureRoomsSeeded();
                rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
            } catch(e){ console.warn('Không seed được rooms tự động', e); }
        }

        var availableRooms = rooms.filter(function(room) {
            try {
                if (!room) return false;
                if (room.status && room.status !== 'available') return false;

                // capacity
                var cap = { adults: 2, children: 0 };
                if (typeof parseCapacity === 'function') cap = parseCapacity(room);
                else if (room.capacity) {
                    var ma = String(room.capacity).match(/(\d+)\s*người lớn/i);
                    var mc = String(room.capacity).match(/(\d+)\s*trẻ em/i);
                    if (ma) cap.adults = parseInt(ma[1]);
                    if (mc) cap.children = parseInt(mc[1]);
                }

                if ((adults || 0) > (cap.adults || 0)) return false;
                if ((children || 0) > (cap.children || 0)) {
                    var tot = (cap.adults || 0) + (cap.children || 0);
                    var gtot = (adults || 0) + (children || 0);
                    if (gtot > tot) return false;
                }

                // kiểm tra booking overlap (bỏ qua cancelled) — dùng helper giữ giờ
                if (typeof isRoomAvailableForPeriod === 'function') {
                    if (!isRoomAvailableForPeriod(room.id, searchStart, searchEnd)) return false;
                } else {
                    // fallback: nếu không có helper, tạm coi phòng khả dụng
                }

                return true;
            } catch (err) {
                console.error('Lỗi khi lọc phòng', room && room.id, err);
                return false;
            }
        });

        console.log('availableRooms count =', availableRooms.length);

        // Hiển thị/nẨn khối kết quả
        if (resultsBlock) resultsBlock.style.display = (availableRooms && availableRooms.length > 0) ? 'block' : 'none';

        if (!availableRooms || availableRooms.length === 0) {
            container.innerHTML = '<div class="thong-bao-khong-tim-thay"><i class="fas fa-search"></i><h3>Không có phòng phù hợp</h3><p>Không tìm thấy phòng trống cho khoảng thời gian và số lượng khách bạn chọn.</p></div>';
            // cập nhật số lượng 0
            var s = document.getElementById('soLuongKetQua');
            if (s) s.textContent = '0';
            return;
        }

        // cập nhật số lượng
        var s = document.getElementById('soLuongKetQua');
        if (s) s.textContent = String(availableRooms.length);

        // render kết quả (sử dụng escapeHtml để tránh XSS nếu dữ liệu không an toàn)
        var html = '';
        for (var j = 0; j < availableRooms.length; j++) {
            var r = availableRooms[j];
            var name = escapeHtml(r.name || '');
            var img = escapeHtml(r.image || '');
            var price = (typeof formatPrice === 'function') ? formatPrice(r.price || 0) : (r.price || 0);
            html += '<div class="the-phong-tim-kiem" data-room-id="' + escapeHtml(String(r.id || '')) + '">';
            html += '  <div class="anh-phong-tim"><img src="' + img + '" alt="' + name + '"></div>';
            html += '  <div class="noi-dung-phong">';
            html += '    <h3 class="ten-phong-tim-kiem">' + name + '</h3>';
            html += '    <div class="thong-tin-con"><span class="gia">' + price + '</span></div>';
            html += '  </div>';
            html += '</div>';
        }
        container.innerHTML = html;

    } catch (ex) {
        console.error('performSearch lỗi:', ex);
    }
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

    // Build results via DOM to avoid XSS and set numeric data-price for sorting
    container.innerHTML = '';
    rooms.forEach(room => {
        const priceVal = Number(room.price) || 0;

        let cap = { adults: 2, children: 0 };
        if (typeof parseCapacity === 'function') {
            cap = parseCapacity(room);
        } else {
            if (room.capacity) {
                const matchAdults = room.capacity.toString().match(/(\d+)\s*người lớn/i);
                const matchChildren = room.capacity.toString().match(/(\d+)\s*trẻ em/i);
                if (matchAdults) cap.adults = parseInt(matchAdults[1]);
                if (matchChildren) cap.children = parseInt(matchChildren[1]);
            }
        }

        const amenitiesArray = room.amenities ? room.amenities.split(',').map(a => a.trim()).slice(0,5) : [];

        const outer = document.createElement('div');
        outer.className = 'the-phong-tim-kiem';
        outer.dataset.id = String(room.id);
        outer.dataset.price = String(priceVal);
        outer.addEventListener('click', function() { window.location.href = 'room-detail.html?id=' + encodeURIComponent(room.id); });

        const noiDung = document.createElement('div');
        noiDung.className = 'noi-dung-the-phong';

        const anhWrap = document.createElement('div');
        anhWrap.className = 'anh-phong-tim-kiem';
        const img = document.createElement('img');
        img.src = room.image || '';
        img.alt = room.name || '';
        img.onerror = function() { this.src = '../img/khachsan1(1).jpg'; };
        anhWrap.appendChild(img);
        const badge = document.createElement('span');
        badge.className = 'badge-giam-gia';
        badge.textContent = 'Ưu đãi';
        anhWrap.appendChild(badge);

        const thongTin = document.createElement('div');
        thongTin.className = 'thong-tin-phong-tim-kiem';

        const left = document.createElement('div');
        const h3 = document.createElement('h3'); h3.className = 'ten-phong-tim-kiem'; h3.textContent = room.name || '';
        const pCap = document.createElement('p'); pCap.className = 'suc-chua-phong'; pCap.textContent = cap.adults + ' người lớn, ' + cap.children + ' trẻ em';
        left.appendChild(h3); left.appendChild(pCap);

        const tienIchDiv = document.createElement('div'); tienIchDiv.className = 'tien-ich-phong-tim-kiem';
        amenitiesArray.forEach(amenity => {
            const span = document.createElement('span'); span.className = 'tien-ich';
            const i = document.createElement('i');
            const aLower = amenity.toLowerCase();
            let icon = 'fas fa-check';
            if (aLower.indexOf('wifi') !== -1) icon = 'fas fa-wifi';
            else if (aLower.indexOf('tv') !== -1) icon = 'fas fa-tv';
            else if (aLower.indexOf('minibar') !== -1 || aLower.indexOf('mini bar') !== -1) icon = 'fas fa-glass-martini';
            else if (aLower.indexOf('điều hòa') !== -1) icon = 'fas fa-snowflake';
            else if (aLower.indexOf('bàn làm việc') !== -1) icon = 'fas fa-laptop';
            else if (aLower.indexOf('ban công') !== -1) icon = 'fas fa-door-open';
            else if (aLower.indexOf('phòng tắm') !== -1 || aLower.indexOf('bồn tắm') !== -1) icon = 'fas fa-bath';
            i.className = icon; span.appendChild(i); span.appendChild(document.createTextNode(' ' + amenity));
            tienIchDiv.appendChild(span);
        });

        const right = document.createElement('div');
        const priceDiv = document.createElement('div'); priceDiv.className = 'gia-phong-tim-kiem'; priceDiv.textContent = formatPrice(priceVal);
        const actions = document.createElement('div'); actions.className = 'nut-hanh-dong';
        const btnDetail = document.createElement('button'); btnDetail.className = 'nut-chi-tiet'; btnDetail.textContent = 'Xem chi tiết';
        const btnBook = document.createElement('button'); btnBook.className = 'nut-dat-ngay'; btnBook.textContent = 'Đặt ngay';
        actions.appendChild(btnDetail); actions.appendChild(btnBook);

        right.appendChild(priceDiv); right.appendChild(actions);

        thongTin.appendChild(left);
        thongTin.appendChild(tienIchDiv);
        thongTin.appendChild(right);

        noiDung.appendChild(anhWrap);
        noiDung.appendChild(thongTin);
        outer.appendChild(noiDung);

        container.appendChild(outer);
    });
}

// Hàm đọc tham số từ URL và thực hiện tìm kiếm tự động
function loadSearchDataFromURL() {
    // 1. Lấy tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const checkinStr = urlParams.get('checkin');
    const checkoutStr = urlParams.get('checkout');
    
    // Lấy số lượng khách, nếu không có thì mặc định là 1 người lớn
    const adults = parseInt(urlParams.get('adults')) || 1;
    const children = parseInt(urlParams.get('children')) || 0;
    const roomsCount = parseInt(urlParams.get('rooms')) || 1;

    // 2. Nếu có ngày checkin/checkout thì thực hiện tìm kiếm
    if (checkinStr && checkoutStr) {
        const cin = parseDateYYYYMMDD(checkinStr);
        const cout = parseDateYYYYMMDD(checkoutStr);
        
        // Reset giờ về 0 để so sánh chính xác (parseDate already creates local date)
        if (cin) cin.setHours(0, 0, 0, 0);
        if (cout) cout.setHours(0, 0, 0, 0);

        // Cập nhật biến toàn cục để lịch hiển thị đúng
        nhanPhongTim = cin;
        traPhongTim = cout;
        
        // Cập nhật tháng hiển thị trên lịch
        thang1Tim = new Date(cin.getFullYear(), cin.getMonth(), 1);
        thang2Tim = new Date(cin.getFullYear(), cin.getMonth() + 1, 1);
        
        // Cập nhật lại lịch để hiển thị ngày đã chọn
        taoHaiLichTim();

        // Cập nhật giao diện hiển thị ngày tháng trên thanh tìm kiếm
        const hienThiNgay = document.getElementById('hienThiNgayTim');
        if (hienThiNgay) {
            hienThiNgay.textContent = formatDate(cin) + ' - ' + formatDate(cout);
        }

        // Cập nhật giao diện hiển thị số khách
        const hienThiKhach = document.getElementById('hienThiKhachTim');
        if (hienThiKhach) {
            hienThiKhach.textContent = `${adults} người lớn · ${children} trẻ em · ${roomsCount} phòng`;
        }
        
        // Cập nhật số lượng trong popup (nếu cần)
        if (document.getElementById('soNguoiLonTim')) {
            document.getElementById('soNguoiLonTim').textContent = adults;
        }
        if (document.getElementById('soTreEmTim')) {
            document.getElementById('soTreEmTim').textContent = children;
        }
        if (document.getElementById('soPhongTim')) {
            document.getElementById('soPhongTim').textContent = roomsCount;
        }

        // 3. GỌI HÀM TÌM KIẾM CHÍNH
        performSearch(cin, cout, adults, children);
    }
}

// Hàm khởi tạo chọn khách cho trang tìm kiếm
function khoiTaoChonKhachTimKiem() {
    var field = document.getElementById('truongKhachTim');
    var popup = document.getElementById('hopKhachTim');
    
    if (!field || !popup) return;
    
    field.addEventListener('click', function(e) {
        e.stopPropagation();
        var datePopup = document.getElementById('hopLichTim');
        if (datePopup) datePopup.style.display = 'none';
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    });
    
    document.addEventListener('click', function(e) {
        if (!field.contains(e.target) && !popup.contains(e.target)) {
            popup.style.display = 'none';
        }
    });
    
    var guestBtns = popup.querySelectorAll('.nut-khach');
    for (var i = 0; i < guestBtns.length; i++) {
        guestBtns[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var target = this.dataset.target;
            var isPlus = this.classList.contains('plus');
            var nguoiLonEl = document.getElementById('soNguoiLonTim');
            var treEmEl = document.getElementById('soTreEmTim');
            var phongEl = document.getElementById('soPhongTim');
            
            var nguoiLon = parseInt(nguoiLonEl ? nguoiLonEl.textContent : 1);
            var treEm = parseInt(treEmEl ? treEmEl.textContent : 0);
            var phong = parseInt(phongEl ? phongEl.textContent : 1);

            if (isPlus) {
                if (target === 'nguoiLon' && nguoiLon < 30) nguoiLon++;
                if (target === 'treEm' && treEm < 10) treEm++;
                if (target === 'phong' && phong < 30) phong++;
            } else {
                if (target === 'nguoiLon' && nguoiLon > 1) nguoiLon--;
                if (target === 'treEm' && treEm > 0) treEm--;
                if (target === 'phong' && phong > 1) phong--;
            }

            if (nguoiLonEl) nguoiLonEl.textContent = nguoiLon;
            if (treEmEl) treEmEl.textContent = treEm;
            if (phongEl) phongEl.textContent = phong;
            
            var hienThiKhach = document.getElementById('hienThiKhachTim');
            if (hienThiKhach) {
                hienThiKhach.textContent = `${nguoiLon} người lớn · ${treEm} trẻ em · ${phong} phòng`;
            }
        });
    }
    
    var doneBtn = document.getElementById('nutXongKhachTim');
    if (doneBtn) {
        doneBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            popup.style.display = 'none';
        });
    }
}

// Hàm khởi tạo nút tìm kiếm chính
function khoiTaoNutTimKiemChinh() {
    var searchBtn = document.getElementById('nutTimKiemChinh');
    if (!searchBtn) return;
    
    searchBtn.addEventListener('click', function() {
        if (!nhanPhongTim || !traPhongTim) {
            alert('Vui lòng chọn ngày nhận phòng và trả phòng!');
            return;
        }
        
        var nguoiLonEl = document.getElementById('soNguoiLonTim');
        var treEmEl = document.getElementById('soTreEmTim');
        var phongEl = document.getElementById('soPhongTim');
        
        var adults = parseInt(nguoiLonEl ? nguoiLonEl.textContent : 1);
        var children = parseInt(treEmEl ? treEmEl.textContent : 0);
        var rooms = parseInt(phongEl ? phongEl.textContent : 1);
        
        var formatDateForURL = function(date) {
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            return year + '-' + month + '-' + day;
        };
        
        var url = 'tim-kiem-phong.html?checkin=' + encodeURIComponent(formatDateForURL(nhanPhongTim)) + 
                  '&checkout=' + encodeURIComponent(formatDateForURL(traPhongTim)) + 
                  '&adults=' + adults + 
                  '&children=' + children +
                  '&rooms=' + rooms;
        window.location.href = url;
    });
}

// Hàm khởi tạo sắp xếp kết quả
function khoiTaoSapXep() {
    var selectSapXep = document.getElementById('selectSapXep');
    if (!selectSapXep) return;
    
    selectSapXep.addEventListener('change', function() {
        var container = document.getElementById('searchResultsContainer');
        if (!container) return;
        
        var rooms = Array.from(container.querySelectorAll('.the-phong-tim-kiem'));
        if (rooms.length === 0) return;
        
        var sortValue = this.value;
        var sortedRooms = rooms.map(function(room) {
            return {
                element: room,
                price: parseFloat(room.dataset.price || (room.querySelector('.gia-phong-tim-kiem') ? room.querySelector('.gia-phong-tim-kiem').textContent.replace(/\D/g, '') : 0))
            };
        });
        
        if (sortValue === 'price-low') {
            sortedRooms.sort(function(a, b) { return a.price - b.price; });
        } else if (sortValue === 'price-high') {
            sortedRooms.sort(function(a, b) { return b.price - a.price; });
        }
        
        container.innerHTML = '';
        for (var i = 0; i < sortedRooms.length; i++) {
            container.appendChild(sortedRooms[i].element);
        }
    });
}

// Hàm khởi tạo chuyển đổi xem (danh sách/lưới)
function khoiTaoChuyenDoiXem() {
    var viewButtons = document.querySelectorAll('.nut-xem[data-view]');
    if (viewButtons.length === 0) return;
    
    for (var i = 0; i < viewButtons.length; i++) {
        viewButtons[i].addEventListener('click', function() {
            var view = this.dataset.view;
            var container = document.getElementById('searchResultsContainer');
            if (!container) return;
            
            // Xóa class active từ tất cả các nút
            for (var j = 0; j < viewButtons.length; j++) {
                viewButtons[j].classList.remove('active');
            }
            this.classList.add('active');
            
            // Áp dụng class cho container
            if (view === 'grid') {
                container.classList.add('grid-view');
                container.classList.remove('list-view');
            } else {
                container.classList.add('list-view');
                container.classList.remove('grid-view');
            }
        });
    }
}

/* ========= FIX CHÍNH XÁC: loại phòng đã đặt ra khỏi kết quả tìm kiếm ========= */

/* helper: bỏ dấu (để so sánh các trạng thái tiếng Việt không dấu) */
function _removeDiacritics(str) {
    if (!str) return '';
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* cho phép một số trạng thái "rỗng" / "trống" được coi là available */
function _isStatusConsideredAvailable(status) {
    if (!status) return true;
    var s = _removeDiacritics(String(status));
    var allowed = ['available', 'trong', 'trong', 'trong', 'trong', 'trong', 'trong', 'trong'];
    // normalize common labels
    allowed = ['available','trong','trong','trong','trong','vacant','empty','rong','trống'];
    for (var i=0;i<allowed.length;i++){
        if (s.indexOf(allowed[i]) !== -1) return true;
    }
    return false;
}

/* Strict helper: reuse _toDateTime so time component is preserved */
function _toMidnightDateStrict(v) {
    return _toDateTime(v);
}

function isRoomAvailableForPeriodStrict(roomId, checkin, checkout) {
    var start = _toDateTime(checkin, false);
    var end = _toDateTime(checkout, false);
    if (!start || !end || start >= end) return false;

    var bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch (e) {
        bookings = [];
    }

    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        if (!b) continue;
        if (String(b.roomId) !== String(roomId)) continue;

        var st = (b.status || '').toString().toLowerCase();
        if (st === 'cancelled' || st === 'canceled') continue;

        var bs = _toDateTime(b.checkIn || b.checkin, false);
        var be = _toDateTime(b.checkOut || b.checkout, true);
        if (!bs || !be) continue;

        if (start < be && end > bs) {
            return false;
        }
    }
    return true;
}

function _shouldShowRoom(room, checkin, checkout, adults, children) {
    if (! _isStatusConsideredAvailable(room.status) ) return false;

    if (adults || children) {
        var cap = { adults: 2, children: 0 };
        if (typeof parseCapacity === 'function') cap = parseCapacity(room);
        if (cap.adults < (adults || 0)) return false;
        if (cap.children < (children || 0)) return false;
    }

    if (!isRoomAvailableForPeriodStrict(room.id, checkin, checkout)) return false;

    return true;
}

/* NOTE: To apply, replace the room filtering in performSearch or displayResults to call
     _shouldShowRoom(room, searchStart, searchEnd, adults, children) and skip rooms that return false.
*/
