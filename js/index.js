var bayGio = new Date();
var thang1 = new Date(bayGio.getFullYear(), bayGio.getMonth(), 1);
var thang2 = new Date(bayGio.getFullYear(), bayGio.getMonth() + 1, 1);
var nhanPhong = null;
var traPhong = null;
var khach = { nguoiLon: 1, treEm: 0, phong: 1 };

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadRoomsDynamic();
    khoiTaoChonNgay();
    khoiTaoChonKhach();
    capNhatNgayHienThi();
    capNhatKhachHienThi();
    khoiTaoMenuDiDong();
    khoiTaoHieuUngCuon();
    khoiTaoBanTin();
    khoiTaoCuonMuiTen();
    khoiTaoNutTim();
    khoiTaoAnhNen();
});

function loadRoomsDynamic() {
    var roomsContainer = document.getElementById('roomsContainer');
    if (!roomsContainer) return;
    
    var rooms = storageService.ensureRoomsSeeded();
    
    if (rooms.length === 0) {
        roomsContainer.innerHTML = '<p class="text-center" style="padding: 40px; color: #666;">Chưa có phòng nào. Vui lòng thêm phòng trong trang quản trị.</p>';
        return;
    }
    
    // Lấy danh sách bookings để kiểm tra phòng đã đặt
    var bookings = storageService.getBookings();
    
    // Hàm kiểm tra phòng đã được đặt chưa
    function isRoomCurrentlyBooked(roomId) {
        for (var i = 0; i < bookings.length; i++) {
            var b = bookings[i];
            // Nếu phòng có đơn đặt và chưa hủy thì ẩn
            if (b.roomId == roomId && b.status !== 'cancelled') {
                return true;
            }
        }
        return false;
    }
    
    var html = '';
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        
        // Bỏ qua phòng không available
        if (room.status !== 'available') continue;
        
        // Bỏ qua phòng đang được đặt
        if (isRoomCurrentlyBooked(room.id)) continue;
        
        var cap = parseCapacity(room);
        var adults = cap.adults.toString();
        var children = cap.children.toString();
        
        var amenitiesArray = room.amenities ? room.amenities.split(',') : [];
        for (var j = 0; j < amenitiesArray.length; j++) {
            amenitiesArray[j] = amenitiesArray[j].trim();
        }
        var amenitiesHTML = '';
        for (var k = 0; k < Math.min(amenitiesArray.length, 5); k++) {
            var amenity = amenitiesArray[k];
            var icon = 'fas fa-check';
            if (amenity.toLowerCase().indexOf('wifi') !== -1) icon = 'fas fa-wifi';
            else if (amenity.toLowerCase().indexOf('tv') !== -1) icon = 'fas fa-tv';
            else if (amenity.toLowerCase().indexOf('minibar') !== -1 || amenity.toLowerCase().indexOf('mini bar') !== -1) icon = 'fas fa-glass-martini';
            else if (amenity.toLowerCase().indexOf('điều hòa') !== -1) icon = 'fas fa-snowflake';
            else if (amenity.toLowerCase().indexOf('bàn làm việc') !== -1) icon = 'fas fa-laptop';
            else if (amenity.toLowerCase().indexOf('ban công') !== -1) icon = 'fas fa-door-open';
            else if (amenity.toLowerCase().indexOf('phòng tắm') !== -1 || amenity.toLowerCase().indexOf('bồn tắm') !== -1) icon = 'fas fa-bath';
            
            amenitiesHTML += '<span class="tien-ich"><i class="' + icon + '"></i> ' + amenity + '</span>';
        }
        
        // Format price
        var price = formatPrice(room.price);
        
        // Get type label
        var typeLabel = room.type;
        if (room.type === 'Standard') typeLabel = 'Tiêu chuẩn';
        else if (room.type === 'Deluxe') typeLabel = 'Cao cấp';
        else if (room.type === 'VIP') typeLabel = 'VIP';
        else if (room.type === 'Suite') typeLabel = 'Suite';
        
        html += '<div class="the-phong" onclick="window.location.href=\'room-detail.html?id=' + room.id + '\'" style="cursor: pointer;">';
        html += '<div class="anh-phong">';
        html += '<img src="' + (room.image || '../img/khachsan1(1).jpg') + '" alt="' + room.name + '" onerror="this.src=\'../img/khachsan1(1).jpg\'">';
        html += '<div class="nhan-phong">Tầng ' + (room.floor || '1') + '</div>';
        html += '</div>';
        html += '<div class="noi-dung-phong">';
        html += '<div class="tieu-de-phong">';
        html += '<h3 class="ten-phong">' + room.name + '</h3>';
        html += '<div class="gia-phong">' + price + '</div>';
        html += '</div>';
        html += '<div class="loai-phong">';
        html += '<span class="dia-diem-phong">' + (room.hotel || 'QuickStay Hotel') + '</span>';
        html += '<span class="hang-phong">' + typeLabel + '</span>';
        html += '</div>';
        html += '<div class="danh-gia-phong">';
        html += '<div class="sao">';
        html += '<i class="fas fa-star"></i>';
        html += '<span>' + adults + ' người lớn</span>';
        html += '</div>';
        html += '<div class="luot-danh-gia">';
        html += '<i class="fas fa-bed"></i>';
        html += '<span>' + children + ' trẻ em</span>';
        html += '</div>';
        html += '</div>';
        html += '<p class="mo-ta-phong">';
        html += room.description || 'Phòng hiện đại, tiện nghi đầy đủ, phù hợp cho chuyến nghỉ dưỡng thoải mái.';
        html += '</p>';
        html += '<div class="tien-ich-phong">';
        html += amenitiesHTML;
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }
    
    roomsContainer.innerHTML = html;
}

// formatPrice đã được chuyển sang common.js

function khoiTaoChonNgay() {
    var field = document.getElementById('truongNgay');
    var popup = document.getElementById('hopNgay');
    var checkinEl = document.getElementById('checkinInput');
    var checkoutEl = document.getElementById('checkoutInput');
    
    if (!field || !popup) return;

    function moHopNgay(e) {
        e.preventDefault();
        e.stopPropagation();
        var guestsPopup = document.getElementById('hopKhach');
        if (guestsPopup) guestsPopup.classList.remove('show');
        if (popup.classList.contains('show')) {
            popup.classList.remove('show');
        } else {
            popup.classList.add('show');
            taoHaiLich();
        }
    }

    field.addEventListener('click', moHopNgay);
    if (checkinEl) {
        checkinEl.setAttribute('readonly', 'readonly');
        checkinEl.addEventListener('mousedown', moHopNgay);
        checkinEl.addEventListener('focus', moHopNgay);
    }
    if (checkoutEl) {
        checkoutEl.setAttribute('readonly', 'readonly');
        checkoutEl.addEventListener('mousedown', moHopNgay);
        checkoutEl.addEventListener('focus', moHopNgay);
    }
    
    document.addEventListener('click', function(e) {
        if (!field.contains(e.target) && !popup.contains(e.target)) {
            popup.classList.remove('show');
        }
    });
    
    var prevBtn = document.getElementById('thangTruoc');
    var nextBtn = document.getElementById('thangSau');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            thang1.setMonth(thang1.getMonth() - 1);
            thang2.setMonth(thang2.getMonth() - 1);
            taoHaiLich();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            thang1.setMonth(thang1.getMonth() + 1);
            thang2.setMonth(thang2.getMonth() + 1);
            taoHaiLich();
        });
    }
    
    var quickBtns = document.querySelectorAll('.nut-nhanh');
    for (var m = 0; m < quickBtns.length; m++) {
        quickBtns[m].addEventListener('click', function(e) {
            e.preventDefault();
            for (var n = 0; n < quickBtns.length; n++) {
                quickBtns[n].classList.remove('active');
            }
            this.classList.add('active');
        });
    }
}

function taoHaiLich() {
    taoLich('lich1', thang1, 'tieuDeThang1');
    taoLich('lich2', thang2, 'tieuDeThang2');
}

function taoLich(calendarId, monthDate, titleId) {
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
        header.className = 'tieu-de-ngay';
        header.textContent = dayNames[i];
        calendar.appendChild(header);
    }
    
    var firstDay = new Date(year, month, 1);
    var lastDate = new Date(year, month + 1, 0).getDate();
    var startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    for (var j = 0; j < startDay; j++) {
        var emptyDay = document.createElement('div');
        emptyDay.className = 'o-lich vo-hieu';
        calendar.appendChild(emptyDay);
    }
    
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (var day = 1; day <= lastDate; day++) {
        var dayElement = document.createElement('div');
        dayElement.className = 'o-lich';
        dayElement.textContent = day;
        
        var cellDate = new Date(year, month, day);
        cellDate.setHours(0, 0, 0, 0);
        
        if (cellDate.getTime() === today.getTime()) {
            dayElement.classList.add('hom-nay');
        }
        
        if (cellDate < today) {
            dayElement.classList.add('qua-khu');
        } else {
            if (nhanPhong && cellDate.getTime() === nhanPhong.getTime()) {
                dayElement.classList.add('bat-dau');
            }
            
            if (traPhong && cellDate.getTime() === traPhong.getTime()) {
                dayElement.classList.add('ket-thuc');
            }
            
            if (nhanPhong && traPhong && 
                cellDate > nhanPhong && cellDate < traPhong) {
                dayElement.classList.add('trong-khoang');
            }
            
            (function(date) {
                dayElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    chonNgay(new Date(date));
                });
            })(cellDate);
        }
        
        calendar.appendChild(dayElement);
    }
}

function chonNgay(date) {
    date.setHours(0, 0, 0, 0);
    
    if (!nhanPhong || (nhanPhong && traPhong)) {
        nhanPhong = new Date(date);
        traPhong = null;
    } else if (date > nhanPhong) {
        traPhong = new Date(date);
    } else {
        nhanPhong = new Date(date);
        traPhong = null;
    }
    
    capNhatNgayHienThi();
    taoHaiLich();
    
    if (nhanPhong && traPhong) {
        setTimeout(function() {
            var popup = document.getElementById('hopNgay');
            if (popup) {
                popup.classList.remove('show');
            }
        }, 500);
    }
}

function capNhatNgayHienThi() {
    var dateDisplay = document.getElementById('hienThiNgay');
    if (dateDisplay) {
        if (nhanPhong && traPhong) {
            dateDisplay.textContent = dinhDangNgay(nhanPhong) + ' — ' + dinhDangNgay(traPhong);
            dateDisplay.style.color = '#333';
        } else if (nhanPhong) {
            dateDisplay.textContent = dinhDangNgay(nhanPhong) + ' — Ngày trả phòng';
            dateDisplay.style.color = '#333';
        } else {
            dateDisplay.textContent = 'Ngày nhận phòng — Ngày trả phòng';
            dateDisplay.style.color = '#999';
        }
    }

    var ci = document.getElementById('checkinInput');
    var co = document.getElementById('checkoutInput');
    if (ci) {
        ci.value = nhanPhong ? dinhDangNgayYMD(nhanPhong) : '';
    }
    if (co) {
        co.value = traPhong ? dinhDangNgayYMD(traPhong) : '';
    }
}

function dinhDangNgay(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    return (day < 10 ? '0' + day : day) + '/' + (month < 10 ? '0' + month : month) + '/' + date.getFullYear();
}

function dinhDangNgayYMD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var dd = d < 10 ? '0' + d : '' + d;
    var mm = m < 10 ? '0' + m : '' + m;
    return y + '-' + mm + '-' + dd;
}

function khoiTaoChonKhach() {
    var field = document.getElementById('truongKhach');
    var popup = document.getElementById('hopKhach');
    
    if (!field || !popup) return;
    
    field.addEventListener('click', function(e) {
        e.stopPropagation();
        var datePopup = document.getElementById('hopNgay');
        if (datePopup) datePopup.classList.remove('show');
        popup.classList.toggle('show');
    });
    
    document.addEventListener('click', function(e) {
        if (!field.contains(e.target) && !popup.contains(e.target)) {
            popup.classList.remove('show');
        }
    });
    
    var guestBtns = document.querySelectorAll('.nut-khach');
    for (var i = 0; i < guestBtns.length; i++) {
        guestBtns[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var target = this.dataset.target;
            var isPlus = this.classList.contains('plus');

            if (isPlus) {
                if (target === 'nguoiLon' && khach.nguoiLon < 30) khach.nguoiLon++;
                if (target === 'treEm' && khach.treEm < 10) khach.treEm++;
                if (target === 'phong' && khach.phong < 30) khach.phong++;
            } else {
                if (target === 'nguoiLon' && khach.nguoiLon > 1) khach.nguoiLon--;
                if (target === 'treEm' && khach.treEm > 0) khach.treEm--;
                if (target === 'phong' && khach.phong > 1) khach.phong--;
            }

            capNhatKhachHienThi();
        });
    }
    
    var doneBtn = document.getElementById('nutXongKhach');
    if (doneBtn) {
        doneBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            popup.classList.remove('show');
        });
    }
}

function capNhatKhachHienThi() {
    var nguoiLonEl = document.getElementById('soNguoiLon');
    var treEmEl = document.getElementById('soTreEm');
    var phongEl = document.getElementById('soPhong');
    if (nguoiLonEl) nguoiLonEl.textContent = khach.nguoiLon;
    if (treEmEl) treEmEl.textContent = khach.treEm;
    if (phongEl) phongEl.textContent = khach.phong;

    var chuoi = khach.nguoiLon + ' người lớn · ' + khach.treEm + ' trẻ em · ' + khach.phong + ' phòng';
    var hienThi = document.getElementById('hienThiKhach');
    if (hienThi) hienThi.textContent = chuoi;
}

function khoiTaoNutTim() {
    var searchBtn = document.getElementById('nutTim');
    if (!searchBtn) return;
    
    searchBtn.addEventListener('click', function() {
        if (!nhanPhong || !traPhong) {
            alert('Vui lòng chọn ngày nhận phòng và trả phòng!');
            return;
        }
        
        var petsCheckbox = document.getElementById('thuCung');
        
        var formatDateForURL = function(date) {
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            return year + '-' + month + '-' + day;
        };
        
        var searchData = {
            checkin: formatDateForURL(nhanPhong),
            checkout: formatDateForURL(traPhong),
            adults: khach.nguoiLon,
            children: khach.treEm,
            rooms: khach.phong,
            withPets: petsCheckbox ? petsCheckbox.checked : false
        };
        
        var url = 'tim-kiem-phong.html?checkin=' + encodeURIComponent(searchData.checkin) + 
                  '&checkout=' + encodeURIComponent(searchData.checkout) + 
                  '&adults=' + searchData.adults + 
                  '&children=' + searchData.children;
        window.location.href = url;
    });
}


// khoiTaoMenuDiDong đã được chuyển sang common.js

function khoiTaoHieuUngCuon() {
    var header = document.querySelector('.dau-trang');
    if (header) {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#fff';
            header.style.backdropFilter = 'none';
        }
    });
    }
}

function khoiTaoBanTin() {
    var form = document.querySelector('.bieu-mau-ban-tin');
    if (!form) return;
    
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button');
    
    if (button && input) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            var email = input.value.trim();
            
            if (!email || !hopLeEmail(email)) {
                alert('Vui lòng nhập email hợp lệ!');
                return;
            }
            
            var newsletters = JSON.parse(localStorage.getItem('newsletters') || '[]');
            
            if (newsletters.includes(email)) {
                alert('Email này đã được đăng ký!');
                return;
            }
            
            newsletters.push(email);
            localStorage.setItem('newsletters', JSON.stringify(newsletters));
            alert('Đăng ký thành công!');
            input.value = '';
        });
    }
}

function hopLeEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function khoiTaoCuonMuiTen() {
    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    for (var i = 0; i < anchorLinks.length; i++) {
        anchorLinks[i].addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            e.preventDefault();
            targetId = targetId.substring(1);
            var targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

function khoiTaoAnhNen() {
    var slides = document.querySelectorAll('.buoc-trinh-chieu');
    var currentSlide = 0;
    var khoangThoiGianSlide;
    
    if (!slides.length) return;
    
    function showSlide(index) {
        for (var i = 0; i < slides.length; i++) {
            slides[i].classList.remove('active');
        }
        
        slides[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide++;
        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }
        showSlide(currentSlide);
    }
    khoangThoiGianSlide = setInterval(nextSlide, 5000);
}

if (typeof window !== 'undefined' && window.location.pathname.includes('index.html')) {
    storageService.ensureRoomsSeeded();
}
