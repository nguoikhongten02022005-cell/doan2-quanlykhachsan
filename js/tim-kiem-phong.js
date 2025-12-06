document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    khoiTaoMenuDiDong();

    const urlParams = new URLSearchParams(window.location.search);
    const checkinDate = urlParams.get('checkin');
    const checkoutDate = urlParams.get('checkout');
    const adults = parseInt(urlParams.get('adults')) || 1;
    const children = parseInt(urlParams.get('children')) || 0;

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

    if (checkinDate && checkoutDate) {
        performSearch(checkinDate, checkoutDate, adults, children);
    } else {
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

function formatDateVN(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function normalizeDate(dateString) {
    if (!dateString) return null;
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString + 'T00:00:00');
    }
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
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
