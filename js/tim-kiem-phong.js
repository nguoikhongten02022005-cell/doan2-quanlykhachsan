// Biến toàn cục cho trang tìm kiếm
var bayGioTim = new Date();
var thang1Tim = new Date(bayGioTim.getFullYear(), bayGioTim.getMonth(), 1);
var thang2Tim = new Date(bayGioTim.getFullYear(), bayGioTim.getMonth() + 1, 1);
var nhanPhongTim = null;
var traPhongTim = null;

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

function performSearch(checkin, checkout, adults, children) {
    const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    const searchStart = normalizeDate(checkin);
    const searchEnd = normalizeDate(checkout);
    
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
        if (room.status !== 'available') return false;

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

        if (adults > cap.adults) return false;

        if (children > cap.children) {
             const totalCapacity = cap.adults + cap.children;
             const totalGuests = adults + children;
             if (totalGuests > totalCapacity) return false;
        }

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
 
        const price = formatPrice(room.price);
        
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
        
        let amenitiesHtml = '';
        if (room.amenities) {
            const amenitiesArray = room.amenities.split(',').map(a => a.trim());
            const list = amenitiesArray.slice(0, 5);
            list.forEach(amenity => {
                let icon = 'fas fa-check';
                const amenityLower = amenity.toLowerCase();
                if (amenityLower.indexOf('wifi') !== -1) icon = 'fas fa-wifi';
                else if (amenityLower.indexOf('tv') !== -1) icon = 'fas fa-tv';
                else if (amenityLower.indexOf('minibar') !== -1 || amenityLower.indexOf('mini bar') !== -1) icon = 'fas fa-glass-martini';
                else if (amenityLower.indexOf('điều hòa') !== -1) icon = 'fas fa-snowflake';
                else if (amenityLower.indexOf('bàn làm việc') !== -1) icon = 'fas fa-laptop';
                else if (amenityLower.indexOf('ban công') !== -1) icon = 'fas fa-door-open';
                else if (amenityLower.indexOf('phòng tắm') !== -1 || amenityLower.indexOf('bồn tắm') !== -1) icon = 'fas fa-bath';
                
                amenitiesHtml += `<span class="tien-ich"><i class="${icon}"></i> ${amenity}</span>`;
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
        const cin = new Date(checkinStr);
        const cout = new Date(checkoutStr);
        
        // Reset giờ về 0 để so sánh chính xác
        cin.setHours(0, 0, 0, 0);
        cout.setHours(0, 0, 0, 0);

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
                price: parseFloat(room.querySelector('.gia-phong-tim-kiem') ? 
                    room.querySelector('.gia-phong-tim-kiem').textContent.replace(/\D/g, '') : 0)
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
