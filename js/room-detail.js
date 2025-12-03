// Biến toàn cục
var currentRoom = null;
var bayGio = new Date();
var thang1 = new Date(bayGio.getFullYear(), bayGio.getMonth(), 1);
var thang2 = new Date(bayGio.getFullYear(), bayGio.getMonth() + 1, 1);
var nhanPhong = null;
var traPhong = null;

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadRoomDetail();
    khoiTaoChonNgay();
    capNhatNgayHienThi();
    capNhatThongTinKhach();
    khoiTaoMenuDiDong();
});

// Load chi tiết phòng
function loadRoomDetail() {
    // Lấy ID phòng từ URL
    var urlParams = new URLSearchParams(window.location.search);
    var roomId = urlParams.get('id');
    
    if (!roomId) {
        alert('Không tìm thấy phòng!');
        window.location.href = 'index.html';
        return;
    }
    
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    var room = null;
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].id == roomId) {
            room = rooms[i];
            break;
        }
    }
    
    if (!room) {
        alert('Phòng không tồn tại!');
        window.location.href = 'index.html';
        return;
    }
    
    currentRoom = room;
    
    document.title = room.name + ' - QuickStay';
    document.getElementById('roomName').textContent = room.name;
    
    loadRoomImages(room);
    document.getElementById('roomPrice').textContent = formatPrice(room.price);
    document.getElementById('bookingPrice').textContent = formatPrice(room.price);
    document.getElementById('roomHotel').textContent = room.hotel || 'QuickStay Hotel';
    document.getElementById('roomFloor').textContent = 'Tầng: ' + (room.floor || '1');
    document.getElementById('roomNumber').textContent = 'Số phòng: ' + (room.number || '101');
    document.getElementById('roomDescription').textContent = room.description || 'Phòng hiện đại, tiện nghi đầy đủ.';
    
    var amenitiesList = document.getElementById('amenitiesList');
    var amenitiesArray = room.amenities ? room.amenities.split(',') : [];
    for (var i = 0; i < amenitiesArray.length; i++) {
        amenitiesArray[i] = amenitiesArray[i].trim();
    }
    
    var amenitiesHTML = '';
    for (var j = 0; j < amenitiesArray.length; j++) {
        var amenity = amenitiesArray[j];
        var icon = 'fas fa-check';
        if (amenity.toLowerCase().indexOf('wifi') !== -1) icon = 'fas fa-wifi';
        else if (amenity.toLowerCase().indexOf('tv') !== -1) icon = 'fas fa-tv';
        else if (amenity.toLowerCase().indexOf('minibar') !== -1 || amenity.toLowerCase().indexOf('mini bar') !== -1) icon = 'fas fa-glass-martini';
        else if (amenity.toLowerCase().indexOf('điều hòa') !== -1) icon = 'fas fa-snowflake';
        else if (amenity.toLowerCase().indexOf('bàn làm việc') !== -1) icon = 'fas fa-laptop';
        else if (amenity.toLowerCase().indexOf('ban công') !== -1) icon = 'fas fa-door-open';
        else if (amenity.toLowerCase().indexOf('phòng tắm') !== -1 || amenity.toLowerCase().indexOf('bồn tắm') !== -1) icon = 'fas fa-bath';
        
        amenitiesHTML += '<div class="muc-tien-ich">';
        amenitiesHTML += '<i class="' + icon + '"></i>';
        amenitiesHTML += '<span>' + amenity + '</span>';
        amenitiesHTML += '</div>';
    }
    amenitiesList.innerHTML = amenitiesHTML;
    
    capNhatTongTien();
    
    capNhatThongTinKhach();
}

function datPhongNgay() {
    var currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        if (confirm('Bạn cần đăng nhập để đặt phòng. Chuyển đến trang đăng nhập?')) {
            var currentUrl = window.location.href;
            window.location.href = 'login.html?returnUrl=' + encodeURIComponent(currentUrl);
        }
        return;
    }
    
    if (!currentRoom) {
        alert('Không tìm thấy thông tin phòng!');
        return;
    }
    
    if (!nhanPhong || !traPhong) {
        alert('Vui lòng chọn ngày nhận và trả phòng!');
        return;
    }
    
    var cap = parseCapacity(currentRoom.capacity);
    var adults = cap.adults;
    var children = cap.children;
    
    var userInfo = JSON.parse(currentUser);
    
    var booking = {
        id: 'BK' + Date.now(),
        userId: userInfo.id || userInfo.username,
        customerId: userInfo.id || userInfo.username,
        roomId: currentRoom.id,
        room: currentRoom.name,
        roomName: currentRoom.name,
        roomType: currentRoom.type,
        image: currentRoom.image,
        price: currentRoom.price,
        hotel: currentRoom.hotel || 'QuickStay Hotel',
        floor: currentRoom.floor || '1',
        amenities: currentRoom.amenities || '',
        customer: userInfo.name || userInfo.username || 'Khách hàng',
        email: userInfo.email || 'customer@example.com',
        phone: userInfo.phone || '',
        checkIn: nhanPhong.toISOString().split('T')[0],
        checkOut: traPhong.toISOString().split('T')[0],
        checkin: formatDate(nhanPhong),
        checkout: formatDate(traPhong),
        nights: tinhSoDem(),
        total: document.getElementById('totalPrice').textContent,
        totalAmount: parseFloat(currentRoom.price) * tinhSoDem(),
        status: 'pending',
        paymentMethod: 'Chưa thanh toán',
        guests: {
            nguoiLon: adults,
            treEm: children,
            phong: 1
        },
        bookingDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // KHÔNG đánh dấu phòng là 'occupied' khi chỉ thêm vào giỏ hàng
    // Phòng chỉ bị đánh dấu là 'occupied' khi thanh toán thành công (status = 'confirmed')
    
    alert('Đã thêm phòng vào giỏ hàng! Bạn sẽ được chuyển đến trang giỏ hàng.');
    
    window.location.href = 'thongtindatphong.html';
}

// formatPrice, formatDate đã được chuyển sang common.js

function tinhSoDem() {
    if (!nhanPhong || !traPhong) return 1;
    var diff = Math.abs(traPhong - nhanPhong);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
}

function capNhatTongTien() {
    if (!currentRoom) return;
    
    var soDem = tinhSoDem();
    var giaPhong = parseFloat(currentRoom.price) || 0;
    var tongTien = giaPhong * soDem;
    
    document.getElementById('totalNights').textContent = soDem + ' đêm';
    document.getElementById('totalPrice').textContent = formatPrice(tongTien);
}

function khoiTaoChonNgay() {
    var field = document.getElementById('truongNgay');
    var popup = document.getElementById('hopNgay');
    
    if (!field || !popup) return;
    
    field.addEventListener('click', function(e) {
        e.stopPropagation();
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
    });
    
    document.addEventListener('click', function(e) {
        if (!field.contains(e.target) && !popup.contains(e.target)) {
            popup.style.display = 'none';
        }
    });
    
    // Khởi tạo lịch
    taoLich('lich1', thang1);
    taoLich('lich2', thang2);
    capNhatTieuDeThang();
    
    // Nút điều hướng tháng
    document.getElementById('thangTruoc').addEventListener('click', function() {
        thang1.setMonth(thang1.getMonth() - 1);
        thang2.setMonth(thang2.getMonth() - 1);
        taoLich('lich1', thang1);
        taoLich('lich2', thang2);
        capNhatTieuDeThang();
    });
    
    document.getElementById('thangSau').addEventListener('click', function() {
        thang1.setMonth(thang1.getMonth() + 1);
        thang2.setMonth(thang2.getMonth() + 1);
        taoLich('lich1', thang1);
        taoLich('lich2', thang2);
        capNhatTieuDeThang();
    });
}

function taoLich(id, thang) {
    var grid = document.getElementById(id);
    if (!grid) return;
    
    var firstDay = new Date(thang.getFullYear(), thang.getMonth(), 1);
    var lastDay = new Date(thang.getFullYear(), thang.getMonth() + 1, 0);
    var startDay = firstDay.getDay();
    
    var html = '';
    
    ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(function(day) {
        html += '<div class="tieu-de-ngay">' + day + '</div>';
    });
    
    for (var i = 0; i < startDay; i++) {
        html += '<div class="o-lich vo-hieu"></div>';
    }
    
    for (var day = 1; day <= lastDay.getDate(); day++) {
        var date = new Date(thang.getFullYear(), thang.getMonth(), day);
        var isToday = date.toDateString() === new Date().toDateString();
        var isSelected = (nhanPhong && date.toDateString() === nhanPhong.toDateString()) ||
                        (traPhong && date.toDateString() === traPhong.toDateString());
        var isInRange = nhanPhong && traPhong && date > nhanPhong && date < traPhong;
        var isPast = date < new Date().setHours(0, 0, 0, 0);
        
        var classes = ['o-lich'];
        if (isToday) classes.push('hom-nay');
        if (isSelected) classes.push('duoc-chon');
        if (isInRange) classes.push('trong-khoang');
        if (isPast) classes.push('qua-khu');
        
        html += '<div class="' + classes.join(' ') + '" data-date="' + date.toISOString() + '">' + day + '</div>';
    }
    
    grid.innerHTML = html;
    
    grid.querySelectorAll('.o-lich:not(.qua-khu)').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var dateStr = this.getAttribute('data-date');
            if (!dateStr) return;
            
            var date = new Date(dateStr);
            
            if (!nhanPhong || (nhanPhong && traPhong)) {
                nhanPhong = date;
                traPhong = null;
            } else if (date > nhanPhong) {
                traPhong = date;
            } else {
                nhanPhong = date;
                traPhong = null;
            }
            
            capNhatNgayHienThi();
            capNhatTongTien();
            taoLich('lich1', thang1);
            taoLich('lich2', thang2);
        });
    });
}

function capNhatTieuDeThang() {
    var thangNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                     'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    
    document.getElementById('tieuDeThang1').textContent = 
        thangNames[thang1.getMonth()] + ' năm ' + thang1.getFullYear();
    document.getElementById('tieuDeThang2').textContent = 
        thangNames[thang2.getMonth()] + ' năm ' + thang2.getFullYear();
}

function capNhatNgayHienThi() {
    var display = document.getElementById('hienThiNgay');
    if (!display) return;
    
    if (nhanPhong && traPhong) {
        display.textContent = formatDate(nhanPhong) + ' — ' + formatDate(traPhong);
    } else if (nhanPhong) {
        display.textContent = formatDate(nhanPhong) + ' — Ngày trả phòng';
    } else {
        display.textContent = 'Ngày nhận phòng — Ngày trả phòng';
    }
}

function capNhatThongTinKhach() {
    var display = document.getElementById('hienThiKhach');
    if (!display || !currentRoom) return;
    
    var cap = parseCapacity(currentRoom.capacity);
    var nguoiLon = cap.adults;
    var treEm = cap.children;
    
    display.textContent = nguoiLon + ' người lớn · ' + treEm + ' trẻ em · 1 phòng';
}

// khoiTaoMenuDiDong đã được chuyển sang common.js

function loadRoomImages(room) {
    var mainImage = document.getElementById('mainImage');
    var thumbnailContainer = document.getElementById('thumbnailContainer');
    var imageCounter = document.getElementById('imageCounter');
    
    var images = room.images || [room.image];
    
    if (mainImage) {
        mainImage.src = images[0];
        mainImage.alt = room.name;
    }
    
    if (imageCounter) {
        imageCounter.textContent = '1 / ' + images.length;
    }
    
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        
        for (var i = 0; i < images.length; i++) {
            var thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (i === 0) thumbnail.classList.add('active');
            
            var img = document.createElement('img');
            img.src = images[i];
            img.alt = room.name + ' - Ảnh ' + (i + 1);
            img.onclick = function(index) {
                return function() {
                    mainImage.src = images[index];
                    imageCounter.textContent = (index + 1) + ' / ' + images.length;
                    
                    var thumbnails = thumbnailContainer.querySelectorAll('.thumbnail');
                    for (var j = 0; j < thumbnails.length; j++) {
                        thumbnails[j].classList.remove('active');
                    }
                    this.parentElement.classList.add('active');
                };
            }(i);
            
            thumbnail.appendChild(img);
            thumbnailContainer.appendChild(thumbnail);
        }
    }
}

