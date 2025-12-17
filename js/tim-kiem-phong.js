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

        // Sử dụng displayResults để render với cấu trúc mới
        if (typeof displayResults === 'function') {
            displayResults(availableRooms);
        } else {
            // Fallback: render đơn giản nếu displayResults không tồn tại
            container.innerHTML = '<div class="thong-bao-khong-tim-thay"><p>Lỗi: Không thể hiển thị kết quả</p></div>';
        }

    } catch (ex) {
        console.error('performSearch lỗi:', ex);
    }
}

function displayResults(rooms) {
  const container = document.getElementById('searchResultsContainer');
  const headerCount = document.getElementById('soLuongKetQua');
  const resultSection = document.getElementById('noiDungKetQua');

  if (!container) return;

  const total = Array.isArray(rooms) ? rooms.length : 0;
  if (headerCount) headerCount.textContent = String(total);
  if (resultSection) resultSection.style.display = 'block';

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `
      <div class="thong-bao-khong-tim-thay">
        <i class="fas fa-search"></i>
        <h3>Không tìm thấy phòng trống</h3>
        <p>Rất tiếc, không có phòng nào phù hợp trong khoảng thời gian này.</p>
        <a href="index.html" class="nut-xem-tinh-trang">Quay lại trang chủ</a>
      </div>`;
    return;
  }

  // helper nội bộ: normalize tiện ích
  function normalizeAmenities(amenities) {
    if (!amenities) return [];
    if (Array.isArray(amenities)) {
      return amenities.map(x => String(x || '').trim()).filter(Boolean);
    }
    return String(amenities)
      .split(/[,;|]/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  // helper nội bộ: map tiện ích -> icon + text
  function getAmenityIconAndText(amenity) {
    const aLower = String(amenity || '').toLowerCase();
    if (aLower.includes('wifi')) return { icon: 'fas fa-wifi', text: 'Wifi miễn phí' };
    if (aLower.includes('tv')) return { icon: 'fas fa-tv', text: 'TV màn hình phẳng' };
    if (aLower.includes('mini') || aLower.includes('bar')) return { icon: 'fas fa-glass-martini-alt', text: 'Minibar' };
    if (aLower.includes('điều hòa') || aLower.includes('dieu hoa') || aLower.includes('ac')) return { icon: 'fas fa-snowflake', text: 'Điều hòa' };
    if (aLower.includes('bàn') || aLower.includes('ban') || aLower.includes('desk')) return { icon: 'fas fa-desktop', text: 'Bàn làm việc' };
    if (aLower.includes('bồn tắm') || aLower.includes('bon tam') || aLower.includes('bath')) return { icon: 'fas fa-bath', text: 'Bồn tắm' };
    return { icon: 'fas fa-check', text: amenity };
  }

  // Render đúng cấu trúc DOM theo CSS tim-kiem-phong.css
  container.innerHTML = '';

  rooms.forEach(room => {
    const roomId = (room && room.id != null) ? String(room.id) : '';
    const priceVal = Number(room && room.price) || 0;

    // --- CARD ---
    const card = document.createElement('div');
    // Giữ thêm class the-phong-ket-qua để không phá các rule grid-view đang có
    card.className = 'the-phong the-phong-ket-qua';
    card.dataset.price = String(priceVal);

    // Click vào card -> chi tiết
    if (roomId) {
      card.addEventListener('click', () => {
        window.location.href = 'room-detail.html?id=' + encodeURIComponent(roomId);
      });
    }

    // --- Ảnh ---
    const anhWrap = document.createElement('div');
    anhWrap.className = 'anh-phong';

    const img = document.createElement('img');
    img.alt = (room && room.name) ? room.name : 'Phòng khách sạn';
    img.src =
      (room && room.image) ||
      'https://images.unsplash.com/photo-1560067174-8943bd2d0c1f?auto=format&fit=crop&w=1200&q=60';
    anhWrap.appendChild(img);

    card.appendChild(anhWrap);

    // --- Nội dung ---
    const noiDung = document.createElement('div');
    noiDung.className = 'noi-dung-phong';

    // Header: Tên + sức chứa (đúng style index)
    const tieuDe = document.createElement('div');
    tieuDe.className = 'tieu-de-phong';

    const h3 = document.createElement('h3');
    h3.textContent = (room && room.name) ? room.name : 'Phòng';
    tieuDe.appendChild(h3);

    // Sức chứa
    let cap = { adults: 2, children: 0 };
    if (typeof parseCapacity === 'function') cap = parseCapacity(room);

    const adults = Number(cap && cap.adults) || 0;
    const children = Number(cap && cap.children) || 0;

    const sucChua = document.createElement('div');
    sucChua.className = 'suc-chua-phong';
    sucChua.innerHTML =
      '<i class="fas fa-users"></i>' +
      '<span>' + adults + ' người lớn · ' + children + ' trẻ em</span>';

    tieuDe.appendChild(sucChua);
    noiDung.appendChild(tieuDe);

    // Label tiện ích (giống index screenshot)
    const label = document.createElement('div');
    label.className = 'dich-vu-label';
    label.textContent = 'Dịch vụ đặc biệt:';
    noiDung.appendChild(label);

    // Tiện ích
    const tienIchBox = document.createElement('div');
    tienIchBox.className = 'tien-ich-phong-tim-kiem';

    const amenitiesArr = normalizeAmenities(room && room.amenities);
    // Giới hạn 6 cái để không tràn layout
    amenitiesArr.slice(0, 6).forEach(a => {
      const info = getAmenityIconAndText(a);
      const chip = document.createElement('span');
      chip.className = 'tien-ich';
      chip.innerHTML = `<i class="${info.icon}"></i> ${info.text}`;
      tienIchBox.appendChild(chip);
    });

    noiDung.appendChild(tienIchBox);

    // --- Phần dưới: giá + CTA (đúng CSS .phan-duoi/.price-cta/.btns-cta) ---
    const phanDuoi = document.createElement('div');
    phanDuoi.className = 'phan-duoi';

    const priceCta = document.createElement('div');
    priceCta.className = 'price-cta';

    const gia = document.createElement('div');
    gia.className = 'gia-phong';
    const giaText = (typeof formatPrice === 'function')
      ? formatPrice(priceVal)
      : priceVal.toLocaleString('vi-VN');
    gia.textContent = giaText + ' đ / đêm';

    const btns = document.createElement('div');
    btns.className = 'btns-cta';

    const btnDetail = document.createElement('button');
    btnDetail.type = 'button';
    btnDetail.className = 'btn-detail';
    btnDetail.textContent = 'Chi Tiết';
    btnDetail.addEventListener('click', (e) => {
      e.stopPropagation();
      if (roomId) window.location.href = 'room-detail.html?id=' + encodeURIComponent(roomId);
    });

    const btnBook = document.createElement('button');
    btnBook.type = 'button';
    btnBook.className = 'btn-book';
    btnBook.textContent = 'Đặt Ngay';
    btnBook.addEventListener('click', (e) => {
      e.stopPropagation();
      if (roomId) window.location.href = 'room-detail.html?id=' + encodeURIComponent(roomId) + '&action=book';
    });

    btns.appendChild(btnDetail);
    btns.appendChild(btnBook);

    priceCta.appendChild(gia);
    priceCta.appendChild(btns);

    phanDuoi.appendChild(priceCta);
    noiDung.appendChild(phanDuoi);

    card.appendChild(noiDung);
    container.appendChild(card);
  });
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
/* ===== Transform search cards into balanced layout (image left, info right) ===== */
(function(){
  function transformCard(card){
    if(!card || card.dataset.transformed === '1') return;
    card.dataset.transformed = '1';

    // 1) Ensure .anh-phong exists and contains an IMG (wrap if needed)
    var anh = card.querySelector('.anh-phong');
    var img = card.querySelector('img');
    if(!anh && img){
      var wrapper = document.createElement('div');
      wrapper.className = 'anh-phong';
      // move image into wrapper
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    } else if (anh && !anh.querySelector('img') && img){
      anh.appendChild(img);
    }

    // 2) Ensure .noi-dung-phong exists: gather everything _except_ .anh-phong and .price-cta
    var noi = card.querySelector('.noi-dung-phong');
    if(!noi){
      noi = document.createElement('div');
      noi.className = 'noi-dung-phong';
      // Move nodes (that are not .anh-phong or .price-cta) into noi
      var children = Array.from(card.children);
      children.forEach(function(ch){
        if(ch === null) return;
        if(ch.classList && (ch.classList.contains('anh-phong') || ch.classList.contains('price-cta'))) return;
        // Some generators may create inner wrappers; preserve them
        noi.appendChild(ch);
      });
      // Insert noi before existing price-cta if any, else append
      var existingPrice = card.querySelector('.price-cta');
      if(existingPrice) card.insertBefore(noi, existingPrice);
      else card.appendChild(noi);
    }

    // 3) Ensure bottom container .phan-duoi exists inside noi
    var phan = noi.querySelector('.phan-duoi');
    if(!phan){
      phan = document.createElement('div');
      phan.className = 'phan-duoi';
      noi.appendChild(phan);
    }

    // 4) Move existing .price-cta from card into phan (so price+buttons are in bottom right)
    var priceCta = card.querySelector('.price-cta');
    if(priceCta){
      phan.appendChild(priceCta);
    } else {
      // if missing, try to create small price-cta from any .gia-phong found inside noi
      var priceNode = noi.querySelector('.gia-phong') || noi.querySelector('.gia-chinh');
      if(priceNode){
        var pc = document.createElement('div');
        pc.className = 'price-cta';
        // clone priceNode to avoid moving it from top if present
        pc.appendChild(priceNode.cloneNode(true));
        var btns = document.createElement('div');
        btns.className = 'btns-cta';
        var bd = document.createElement('button'); bd.className='btn-detail'; bd.textContent='Chi Tiết';
        var bb = document.createElement('button'); bb.className='btn-book'; bb.textContent='Đặt Ngay';
        btns.appendChild(bd); btns.appendChild(bb);
        pc.appendChild(btns);
        phan.appendChild(pc);
      }
    }

    // 5) Hook up buttons (if not already)
    var btnDetail = phan.querySelector('.btn-detail');
    var btnBook = phan.querySelector('.btn-book');
    var onclickAttr = card.getAttribute('onclick') || '';
    var match = onclickAttr.match(/room-detail\.html\?id=(\d+)/);
    var roomId = match ? match[1] : null;

    if(btnDetail){
      btnDetail.addEventListener('click', function(e){
        e.stopPropagation();
        if(roomId) window.location.href = 'room-detail.html?id=' + roomId;
        else {
          // try to find a link inside card or click card
          var a = card.querySelector('a');
          if(a && a.href) window.location.href = a.href;
          else card.click();
        }
      });
    }
    if(btnBook){
      btnBook.addEventListener('click', function(e){
        e.stopPropagation();
        if(roomId) window.location.href = 'room-detail.html?id=' + roomId + '&action=book';
        else card.click();
      });
    }

    // final minor tweak: ensure card is flex and children order correct (anh-phong then noi-dung-phong then (price if any))
    card.style.display = 'flex';
  }

  // Transform existing cards
  var container = document.querySelector('.noi-dung-ket-qua') || document.getElementById('searchResultsContainer') || document.querySelector('.danh-sach-ket-qua');
  if(container){
    var cards = container.querySelectorAll('.the-phong');
    cards.forEach(transformCard);

    // Observe new cards (AJAX/pagination)
    var mo = new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.addedNodes && m.addedNodes.length){
          m.addedNodes.forEach(function(node){
            if(node.nodeType === 1 && node.classList.contains('the-phong')) transformCard(node);
            else {
              var found = node.querySelectorAll ? node.querySelectorAll('.the-phong') : [];
              Array.prototype.forEach.call(found, transformCard);
            }
          });
        }
      });
    });
    mo.observe(container, { childList:true, subtree:true });
    // keep it alive (do NOT disconnect) so future pages also get transformed
  } else {
    // fallback: try again when DOM ready
    document.addEventListener('DOMContentLoaded', function(){
      var c = document.querySelector('.noi-dung-ket-qua') || document.getElementById('searchResultsContainer') || document.querySelector('.danh-sach-ket-qua');
      if(c){
        var cs = c.querySelectorAll('.the-phong'); cs.forEach(transformCard);
      }
    });
  }
})();
