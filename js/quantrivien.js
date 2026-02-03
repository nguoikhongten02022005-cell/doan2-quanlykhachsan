var editingRoomId = null;
var editingAmenityId = null;
var editingPromotionId = null;
var editingAccountId = null;
var editingAccountType = null; // 'admin' hoặc 'customer'

// Hàm map loại phòng về 4 loại chuẩn
function mapRoomType(type) {
    var validTypes = ['Standard', 'Deluxe', 'VIP', 'Suite'];
    if (!type || validTypes.indexOf(type) === -1) {
        // Map các loại cũ sang loại mới
        if (type === 'Studio') return 'Standard';
        if (type === 'Royal' || type === 'Penthouse') return 'Suite';
        return 'Standard';
    }
    return type;
}

window.onload = function() {
    loadAllData();
    showSection('dashboard');
    
    var searchRoomInput = document.getElementById('searchRoom');
    if (searchRoomInput) {
        searchRoomInput.addEventListener('input', function() {
            searchRooms(this.value);
        });
    }
    
    var searchOrderInput = document.getElementById('searchOrder');
    if (searchOrderInput) {
        searchOrderInput.addEventListener('input', function() {
            searchOrders(this.value);
        });
    }
};

function loadAllData() {
    loadDashboard();
    loadRooms();
    loadAmenities();
    loadOrders();
    loadPromotions();
    loadAccounts();
    loadRevenueData();
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'dangnhapquantrivien.html';
    }
}

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

function loadDashboard() {
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    document.getElementById('totalRooms').textContent = rooms.length;
    document.getElementById('totalBookings').textContent = bookings.length;
    
    var totalRevenue = 0;
    var activeGuests = 0;
    var confirmedOrders = 0;
    var pendingOrders = 0;
    
    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        var status = booking.status || 'pending';
        
        if (status === 'cancelled') {
            continue;
        }
        
        var amountStr = booking.totalAmount || booking.total;
        if (!amountStr) continue;
        
        var numericAmount = parseInt(amountStr.toString().replace(/[^\d]/g, '')) || 0;
        totalRevenue += numericAmount;
        
        if (status === 'checkedin') {
            activeGuests++;
        }
        
        if (status === 'confirmed') {
            confirmedOrders++;
        }
        
        if (status === 'pending') {
            pendingOrders++;
        }
    }
    
    document.getElementById('totalRevenue').textContent = formatMoney(totalRevenue);
    document.getElementById('activeGuests').textContent = activeGuests;
    document.getElementById('confirmedOrders').textContent = confirmedOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
}

function loadRooms() {
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    displayRooms(rooms);
}

// Hàm kiểm tra phòng có đang được đặt không (CHỈ tính các trạng thái còn chiếm phòng)
function isRoomCurrentlyBooked(roomId) {
  var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');

  for (var i = 0; i < bookings.length; i++) {
    var b = bookings[i];
    if (!b) continue;

    var status = (b.status || 'pending').toLowerCase();

    // completed / cancelled => không còn chiếm phòng
    if (status === 'cancelled' || status === 'canceled' || status === 'completed') continue;

    if (String(b.roomId) === String(roomId)) return true;
  }
  return false;
}

function displayRooms(rooms) {
    var html = '';
    
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        
        // Tự động tính toán trạng thái dựa trên bookings
        var actualStatus = room.status; // Mặc định dùng status từ phòng
        
        // Giữ nguyên trạng thái maintenance (bảo trì) - không tự động thay đổi
        if (room.status === 'maintenance') {
            actualStatus = 'maintenance';
        } else if (isRoomCurrentlyBooked(room.id)) {
            // Nếu phòng đang được đặt, chuyển sang "occupied"
            actualStatus = 'occupied';
        } else if (room.status === 'occupied') {
            // Nếu phòng không còn được đặt nữa và status hiện tại là occupied, chuyển về available
            actualStatus = 'available';
        }
        
        // Map loại phòng về 4 loại chuẩn để hiển thị
        var displayType = mapRoomType(room.type);
        
        html += '<tr>';
        html += '<td><img src="' + room.image + '" alt="' + room.name + '"></td>';
        html += '<td>' + room.name + '</td>';
        html += '<td>' + displayType + '</td>';
        html += '<td>' + room.price + ' đ</td>';
        html += '<td>' + room.floor + '</td>';
        html += '<td><span class="status-badge ' + actualStatus + '">' + getStatus(actualStatus) + '</span></td>';
        html += '<td>';
        html += '<button class="action-btn edit" onclick="editRoom(' + room.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="action-btn delete" onclick="deleteRoom(' + room.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    
    if (html === '') {
        html = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">Không tìm thấy phòng nào phù hợp</td></tr>';
    }
    
    document.getElementById('roomsList').innerHTML = html;
}

function searchRooms(keyword) {
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    
    if (!keyword || keyword.trim() === '') {
        displayRooms(rooms);
        return;
    }
    
    keyword = keyword.toLowerCase().trim();
    
    var filteredRooms = rooms.filter(function(room) {
        var name = (room.name || '').toLowerCase();
        var type = (room.type || '').toLowerCase();
        var floor = (room.floor || '').toString().toLowerCase();
        var price = (room.price || '').toString();
        var status = getStatus(room.status).toLowerCase();
        
        return name.indexOf(keyword) !== -1 || 
               type.indexOf(keyword) !== -1 || 
               floor.indexOf(keyword) !== -1 || 
               price.indexOf(keyword) !== -1 ||
               status.indexOf(keyword) !== -1;
    });
    
    displayRooms(filteredRooms);
}

function loadAmenities() {
    // Đảm bảo dữ liệu tiện nghi đã được khởi tạo
    if (typeof khoiTaoDuLieuHeThong === 'function') {
        khoiTaoDuLieuHeThong();
    }
    
    try {
        var amenitiesStr = localStorage.getItem('amenities');
        var amenities = [];
        
        // Kiểm tra và parse dữ liệu
        if (amenitiesStr && amenitiesStr !== 'null' && amenitiesStr !== '[]') {
            try {
                amenities = JSON.parse(amenitiesStr);
                if (!Array.isArray(amenities)) {
                    console.error('Dữ liệu tiện nghi không phải là mảng, đang khởi tạo lại...');
                    amenities = [];
                    // Khởi tạo lại dữ liệu mẫu
                    if (typeof khoiTaoDuLieuHeThong === 'function') {
                        khoiTaoDuLieuHeThong();
                    }
                    amenitiesStr = localStorage.getItem('amenities');
                    if (amenitiesStr) {
                        amenities = JSON.parse(amenitiesStr);
                    }
                }
            } catch (e) {
                console.error('Lỗi parse dữ liệu tiện nghi:', e);
                amenities = [];
                // Khởi tạo lại dữ liệu mẫu
                if (typeof khoiTaoDuLieuHeThong === 'function') {
                    khoiTaoDuLieuHeThong();
                }
                amenitiesStr = localStorage.getItem('amenities');
                if (amenitiesStr) {
                    try {
                        amenities = JSON.parse(amenitiesStr);
                    } catch (e2) {
                        console.error('Lỗi parse lại dữ liệu:', e2);
                    }
                }
            }
        } else {
            // Nếu không có dữ liệu hoặc dữ liệu rỗng, khởi tạo lại
            console.log('Không tìm thấy dữ liệu tiện nghi, đang khởi tạo lại...');
            if (typeof khoiTaoDuLieuHeThong === 'function') {
                khoiTaoDuLieuHeThong();
            }
            amenitiesStr = localStorage.getItem('amenities');
            if (amenitiesStr) {
                try {
                    amenities = JSON.parse(amenitiesStr);
                } catch (e) {
                    console.error('Lỗi parse dữ liệu sau khi khởi tạo:', e);
                }
            }
        }
        
        var html = '';
        
        if (amenities.length === 0) {
            html = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #999;">Chưa có tiện nghi nào. Vui lòng thêm tiện nghi mới.</td></tr>';
        } else {
            for (var i = 0; i < amenities.length; i++) {
                var amenity = amenities[i];
                html += '<tr>';
                html += '<td>' + (amenity.name || '-') + '</td>';
                html += '<td>' + (amenity.description || '-') + '</td>';
                html += '<td>';
                html += '<button class="action-btn edit" onclick="editAmenity(' + amenity.id + ')"><i class="fas fa-edit"></i></button>';
                html += '<button class="action-btn delete" onclick="deleteAmenity(' + amenity.id + ')"><i class="fas fa-trash"></i></button>';
                html += '</td>';
                html += '</tr>';
            }
        }
        
        var amenitiesListEl = document.getElementById('amenitiesList');
        if (amenitiesListEl) {
            amenitiesListEl.innerHTML = html;
            console.log('Đã load ' + amenities.length + ' tiện nghi');
        } else {
            console.error('Không tìm thấy element amenitiesList');
        }
    } catch (e) {
        console.error('Lỗi khi load tiện nghi:', e);
    }
}

function openAmenityModal() {
    editingAmenityId = null;
    document.getElementById('amenityForm').reset();
    document.getElementById('amenityModalTitle').textContent = 'Thêm tiện nghi';
    document.getElementById('amenityModal').classList.add('show');
}

function editAmenity(id) {
    editingAmenityId = id;
    var amenities = JSON.parse(localStorage.getItem('amenities') || '[]');
    var amenity = amenities.find(function(a) { return a.id == id; });
    
    if (amenity) {
        document.getElementById('amenityName').value = amenity.name;
        document.getElementById('amenityDescription').value = amenity.description || '';
        document.getElementById('amenityModalTitle').textContent = 'Sửa tiện nghi';
        document.getElementById('amenityModal').classList.add('show');
    }
}

function deleteAmenity(id) {
    if (confirm('Bạn có chắc chắn muốn xóa tiện nghi này?')) {
        var amenities = JSON.parse(localStorage.getItem('amenities') || '[]');
        var amenityToDelete = amenities.find(function(a) { return a.id == id; });
        
        if (!amenityToDelete) {
            alert('Không tìm thấy tiện nghi!');
            return;
        }
        
        // Kiểm tra xem tiện nghi có đang được sử dụng trong phòng nào không
        var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        var isUsed = false;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].amenities && rooms[i].amenities.indexOf(amenityToDelete.name) !== -1) {
                isUsed = true;
                break;
            }
        }
        
        if (isUsed) {
            if (!confirm('Tiện nghi này đang được sử dụng trong một số phòng. Bạn vẫn muốn xóa?')) {
                return;
            }
        }
        
        amenities = amenities.filter(function(a) { return a.id != id; });
        localStorage.setItem('amenities', JSON.stringify(amenities));
        loadAmenities();
        
        // Đồng bộ dropdown tiện nghi trong form phòng nếu modal đang mở
        var roomModal = document.getElementById('roomModal');
        if (roomModal && roomModal.classList.contains('show')) {
            loadAmenitiesDropdown();
            // Xóa tiện nghi khỏi danh sách đã chọn nếu có
            if (selectedAmenities && selectedAmenities.indexOf(amenityToDelete.name) !== -1) {
                removeAmenityTag(amenityToDelete.name);
            }
        }
        
        alert('Đã xóa tiện nghi!');
    }
}

function saveAmenity(event) {
    event.preventDefault();
    
    var amenityData = {
        id: editingAmenityId || Date.now(),
        name: document.getElementById('amenityName').value.trim(),
        description: document.getElementById('amenityDescription').value.trim()
    };
    
    if (!amenityData.name) {
        alert('Vui lòng nhập tên tiện nghi!');
        return;
    }
    
    var amenities = JSON.parse(localStorage.getItem('amenities') || '[]');
    
    // Kiểm tra trùng tên (trừ khi đang sửa chính nó)
    if (!editingAmenityId) {
        for (var i = 0; i < amenities.length; i++) {
            if (amenities[i].name.toLowerCase() === amenityData.name.toLowerCase()) {
                alert('Tên tiện nghi đã tồn tại!');
                return;
            }
        }
    }
    
    if (editingAmenityId) {
        var index = amenities.findIndex(function(a) { return a.id == editingAmenityId; });
        if (index !== -1) {
            amenities[index] = amenityData;
        }
    } else {
        amenities.push(amenityData);
    }
    
    localStorage.setItem('amenities', JSON.stringify(amenities));
    closeModal('amenityModal');
    loadAmenities();
    
    // Đồng bộ dropdown tiện nghi trong form phòng nếu modal đang mở
    var roomModal = document.getElementById('roomModal');
    if (roomModal && roomModal.classList.contains('show')) {
        loadAmenitiesDropdown();
    }
    
    alert('Đã lưu tiện nghi!');
}

var currentPage = 1;
var itemsPerPage = 10;
var selectedOrders = [];

function loadOrders() {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var html = '';
    selectedOrders = [];
    
    var totalOrders = bookings.length;
    var pendingOrders = 0;
    var confirmedOrders = 0;
    var checkedinOrders = 0;
    var completedOrders = 0;
    var cancelledOrders = 0;
    var ordersRevenue = 0;
    
    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        
        if (booking.status === 'pending') pendingOrders++;
        else if (booking.status === 'confirmed') confirmedOrders++;
        else if (booking.status === 'checkedin') checkedinOrders++;
        else if (booking.status === 'completed') completedOrders++;
        else if (booking.status === 'cancelled') cancelledOrders++;
        
        if (booking.status === 'completed' && booking.totalAmount) {
            ordersRevenue += parseFloat(booking.totalAmount) || 0;
        }
        
        var paymentMethod = booking.paymentMethod || 'Tiền mặt';
        var paymentIcon = paymentMethod === 'VNPay' ? '<i class="fab fa-cc-visa"></i> VNPay' : '<i class="fas fa-money-bill"></i> Tiền mặt';
        
        html += '<tr>';
        html += '<td><input type="checkbox" class="row-checkbox" value="' + booking.id + '" onchange="updateSelectedCount()"></td>';
        html += '<td><div><strong>' + booking.customer + '</strong><br><small>' + booking.email + '</small></div></td>';
        html += '<td>' + booking.room + '</td>';
        html += '<td><div><small>Nhận: ' + booking.checkin + '</small><br><small>Trả: ' + booking.checkout + '</small></div></td>';
        html += '<td>' + paymentIcon + '</td>';
        html += '<td><span class="status-badge ' + booking.status + '">' + getBookingStatus(booking.status) + '</span></td>';
        html += '<td><strong>' + formatMoney(booking.totalAmount || booking.total) + '</strong></td>';
        html += '<td>';
        html += '<div class="action-dropdown">';
        html += '<button class="action-menu-btn" onclick="toggleActionMenu(event, \'' + booking.id + '\')"><i class="fas fa-ellipsis-v"></i></button>';
        html += '<div class="action-menu" id="menu-' + booking.id + '">';
        html += '<div class="action-menu-item" onclick="viewOrderDetail(\'' + booking.id + '\'); closeAllMenus();"><i class="fas fa-eye"></i> Xem chi tiết</div>';
        
        html += '<div class="action-menu-item has-submenu">';
        html += '<div class="submenu-trigger" onclick="toggleSubmenu(event, \'' + booking.id + '\')">';
        html += '<i class="fas fa-tag"></i> Trạng thái';
        html += '<i class="fas fa-chevron-right submenu-arrow"></i>';
        html += '</div>';
        html += '<div class="action-submenu" id="submenu-' + booking.id + '" onclick="event.stopPropagation();">';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'pending\'); closeAllMenus();"><i class="fas fa-clock"></i> Chờ xác nhận</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'confirmed\'); closeAllMenus();"><i class="fas fa-check-circle"></i> Đã xác nhận</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'checkedin\'); closeAllMenus();"><i class="fas fa-door-open"></i> Đang ở</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'completed\'); closeAllMenus();"><i class="fas fa-check-double"></i> Hoàn thành</div>';
        html += '<div class="action-menu-item danger" onclick="changeStatus(\'' + booking.id + '\', \'cancelled\'); closeAllMenus();"><i class="fas fa-times-circle"></i> Hủy đơn</div>';
        html += '</div>';
        html += '</div>';
        
        if (booking.status === 'completed') {
            html += '<div class="action-menu-item" onclick="printInvoice(\'' + booking.id + '\'); closeAllMenus();"><i class="fas fa-print"></i> Xuất hóa đơn</div>';
        }
        
        html += '</div>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }
    
    if (html === '') {
        html = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">Không có đơn hàng nào</td></tr>';
    }
    
    document.getElementById('ordersList').innerHTML = html;
    
    // Cập nhật stats
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('confirmedOrders').textContent = confirmedOrders;
    document.getElementById('checkedinOrders').textContent = checkedinOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('cancelledOrders').textContent = cancelledOrders;
    document.getElementById('ordersRevenue').textContent = formatMoney(ordersRevenue);
    
    updatePaginationInfo(totalOrders);
}

function updatePaginationInfo(total) {
    if (total === 0) {
        document.getElementById('paginationInfo').textContent = '0-0 của 0 đơn';
        return;
    }
    var start = (currentPage - 1) * itemsPerPage + 1;
    var end = Math.min(currentPage * itemsPerPage, total);
    var info = start + '-' + end + ' của ' + total + ' đơn';
    document.getElementById('paginationInfo').textContent = info;
}

function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1;
    loadOrders();
}

function filterOrders() {
    var filterStatus = document.getElementById('filterOrderStatus').value;
    var searchKeyword = document.getElementById('searchOrder') ? document.getElementById('searchOrder').value : '';
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var html = '';
    
    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        
        if (filterStatus && booking.status !== filterStatus) {
            continue;
        }
        
        if (searchKeyword && searchKeyword.trim() !== '') {
            var keyword = searchKeyword.toLowerCase().trim();
            var customer = (booking.customer || '').toLowerCase();
            var email = (booking.email || '').toLowerCase();
            var phone = (booking.phone || '').toLowerCase();
            var room = (booking.room || '').toLowerCase();
            
            if (customer.indexOf(keyword) === -1 && 
                email.indexOf(keyword) === -1 && 
                phone.indexOf(keyword) === -1 && 
                room.indexOf(keyword) === -1) {
                continue;
            }
        }
        
        var paymentMethod = booking.paymentMethod || 'Tiền mặt';
        var paymentIcon = paymentMethod === 'VNPay' ? '<i class="fab fa-cc-visa"></i> VNPay' : '<i class="fas fa-money-bill"></i> Tiền mặt';
        
        html += '<tr>';
        html += '<td><input type="checkbox" class="row-checkbox" value="' + booking.id + '" onchange="updateSelectedCount()"></td>';
        html += '<td><div><strong>' + booking.customer + '</strong><br><small>' + booking.email + '</small></div></td>';
        html += '<td>' + booking.room + '</td>';
        html += '<td><div><small>Nhận: ' + booking.checkin + '</small><br><small>Trả: ' + booking.checkout + '</small></div></td>';
        html += '<td>' + paymentIcon + '</td>';
        html += '<td><span class="status-badge ' + booking.status + '">' + getBookingStatus(booking.status) + '</span></td>';
        html += '<td><strong>' + formatMoney(booking.totalAmount || booking.total) + '</strong></td>';
        html += '<td>';
        html += '<div class="action-dropdown">';
        html += '<button class="action-menu-btn" onclick="toggleActionMenu(event, \'' + booking.id + '\')"><i class="fas fa-ellipsis-v"></i></button>';
        html += '<div class="action-menu" id="menu-' + booking.id + '">';
        html += '<div class="action-menu-item" onclick="viewOrderDetail(\'' + booking.id + '\'); closeAllMenus();"><i class="fas fa-eye"></i> Xem chi tiết</div>';
        
        html += '<div class="action-menu-item has-submenu">';
        html += '<div class="submenu-trigger" onclick="toggleSubmenu(event, \'' + booking.id + '\')">';
        html += '<i class="fas fa-tag"></i> Trạng thái';
        html += '<i class="fas fa-chevron-right submenu-arrow"></i>';
        html += '</div>';
        html += '<div class="action-submenu" id="submenu-' + booking.id + '" onclick="event.stopPropagation();">';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'pending\'); closeAllMenus();"><i class="fas fa-clock"></i> Chờ xác nhận</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'confirmed\'); closeAllMenus();"><i class="fas fa-check-circle"></i> Đã xác nhận</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'checkedin\'); closeAllMenus();"><i class="fas fa-door-open"></i> Đang ở</div>';
        html += '<div class="action-menu-item" onclick="changeStatus(\'' + booking.id + '\', \'completed\'); closeAllMenus();"><i class="fas fa-check-double"></i> Hoàn thành</div>';
        html += '<div class="action-menu-item danger" onclick="changeStatus(\'' + booking.id + '\', \'cancelled\'); closeAllMenus();"><i class="fas fa-times-circle"></i> Hủy đơn</div>';
        html += '</div>';
        html += '</div>';
        
        if (booking.status === 'completed') {
            html += '<div class="action-menu-item" onclick="printInvoice(\'' + booking.id + '\'); closeAllMenus();"><i class="fas fa-print"></i> Xuất hóa đơn</div>';
        }
        
        html += '</div>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }
    
    if (html === '') {
        html = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">Không tìm thấy đơn hàng nào phù hợp</td></tr>';
    }
    
    document.getElementById('ordersList').innerHTML = html;
}

function searchOrders(keyword) {
    filterOrders();
}

function viewOrderDetail(id) {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var booking = bookings.find(function(b) { return b.id == id; });
    
    if (!booking) {
        alert('Không tìm thấy đơn hàng!');
        return;
    }
    
    // Lấy thông tin chi tiết
    var customerInfo = booking.customerInfo || {};
    var guests = booking.guests || {};
    var checkinDate = booking.checkIn || booking.checkin || '';
    var checkoutDate = booking.checkOut || booking.checkout || '';
    
    // Tính số đêm
    var nights = booking.nights || 1;
    if (checkinDate && checkoutDate) {
        var cin = new Date(checkinDate);
        var cout = new Date(checkoutDate);
        if (!isNaN(cin.getTime()) && !isNaN(cout.getTime())) {
            nights = Math.ceil((cout - cin) / (1000 * 60 * 60 * 24));
        }
    }
    
    // Lấy thông tin phương thức thanh toán
    var paymentMethod = 'Chưa xác định';
    if (customerInfo.phuongThuc === 'ngan-hang') {
        paymentMethod = '🏦 Chuyển khoản ngân hàng';
    } else if (customerInfo.phuongThuc === 'tien-mat') {
        paymentMethod = '💵 Tiền mặt tại khách sạn';
    } else if (booking.paymentMethod) {
        paymentMethod = booking.paymentMethod;
    }
    
    // Tạo HTML chi tiết
    var html = '';
    
    // Mã đơn hàng
    html += '<div style="text-align: center; margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">';
    html += '<div style="font-size: 14px; color: #666; margin-bottom: 5px;">Mã đơn hàng</div>';
    html += '<div style="font-size: 24px; font-weight: bold; color: #1976d2;">#' + booking.id + '</div>';
    html += '</div>';
    
    // Thông tin khách hàng
    html += '<div class="order-detail-section">';
    html += '<h4>Thông tin khách hàng</h4>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Họ và tên:</span>';
    html += '<span class="order-detail-value">' + (customerInfo.hoTen || booking.customer || 'Chưa có') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
        html += '<span class="order-detail-label">Email:</span>';
    html += '<span class="order-detail-value">' + (customerInfo.email || booking.email || 'Chưa có') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
        html += '<span class="order-detail-label">Số điện thoại:</span>';
    html += '<span class="order-detail-value">' + (customerInfo.soDienThoai || booking.phone || 'Chưa có') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">CMND/CCCD:</span>';
    html += '<span class="order-detail-value">' + (customerInfo.cmnd || booking.idCard || 'Chưa có') + '</span>';
    html += '</div>';
    if (customerInfo.ghiChu) {
        html += '<div class="order-detail-row">';
        html += '<span class="order-detail-label">Ghi chú:</span>';
        html += '<span class="order-detail-value">' + customerInfo.ghiChu + '</span>';
        html += '</div>';
    }
    html += '</div>';
    
    // Thông tin phòng
    html += '<div class="order-detail-section">';
    html += '<h4>Thông tin phòng</h4>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Tên phòng:</span>';
    html += '<span class="order-detail-value">' + (booking.roomName || booking.room || 'Chưa có') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Loại phòng:</span>';
    html += '<span class="order-detail-value">' + (booking.roomType || booking.type || 'Standard') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Số phòng:</span>';
    html += '<span class="order-detail-value">Phòng ' + (booking.number || '101') + ' - Tầng ' + (booking.floor || '1') + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Số khách:</span>';
    html += '<span class="order-detail-value">' + (guests.nguoiLon || 2) + ' người lớn, ' + (guests.treEm || 0) + ' trẻ em</span>';
    html += '</div>';
    if (booking.amenities) {
        html += '<div class="order-detail-row">';
        html += '<span class="order-detail-label">Tiện nghi:</span>';
        html += '<span class="order-detail-value" style="text-align: right; max-width: 60%;">' + booking.amenities + '</span>';
        html += '</div>';
    }
    html += '</div>';
    
    // Thông tin đặt phòng
    html += '<div class="order-detail-section">';
    html += '<h4>📅 Thông tin đặt phòng</h4>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Ngày nhận phòng:</span>';
    html += '<span class="order-detail-value">' + formatDateVN(checkinDate) + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Ngày trả phòng:</span>';
    html += '<span class="order-detail-value">' + formatDateVN(checkoutDate) + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Số đêm:</span>';
    html += '<span class="order-detail-value">' + nights + ' đêm</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Ngày đặt:</span>';
    html += '<span class="order-detail-value">' + formatDateVN(booking.bookingDate || booking.createdAt) + '</span>';
    html += '</div>';
    html += '</div>';
    
    // Thông tin thanh toán
    html += '<div class="order-detail-section">';
    html += '<h4>Thông tin thanh toán</h4>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Phương thức:</span>';
    html += '<span class="order-detail-value">' + paymentMethod + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Giá mỗi đêm:</span>';
    html += '<span class="order-detail-value">' + formatMoney(booking.price || 0) + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Số đêm:</span>';
    html += '<span class="order-detail-value">' + nights + ' đêm</span>';
    html += '</div>';
    html += '<div class="order-detail-row" style="border-top: 2px solid #1976d2; padding-top: 12px; margin-top: 8px;">';
    html += '<span class="order-detail-label" style="font-size: 16px; color: #1976d2;">Tổng tiền:</span>';
    html += '<span class="order-detail-value" style="font-size: 18px; color: #1976d2; font-weight: 600;">' + formatMoney(booking.totalAmount || booking.total || (booking.price * nights)) + '</span>';
    html += '</div>';
    html += '<div class="order-detail-row">';
    html += '<span class="order-detail-label">Trạng thái:</span>';
    html += '<span class="order-detail-value"><span class="order-status-badge status-' + (booking.status || 'pending') + '">' + getBookingStatus(booking.status) + '</span></span>';
    html += '</div>';
    html += '</div>';
    
    // Hiển thị modal
    document.getElementById('orderDetailContent').innerHTML = html;
    document.getElementById('orderDetailModal').classList.add('show');
}

function formatDateVN(dateString) {
    if (!dateString) return 'Chưa có';
    var date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
}

function confirmOrder(id) {
    if (confirm('Xác nhận đơn hàng này?')) {
        var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        var index = bookings.findIndex(function(b) { return b.id == id; });
        
        if (index !== -1) {
            bookings[index].status = 'confirmed';
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadOrders();
            alert('Đã xác nhận đơn hàng!');
        }
    }
}

function checkinOrder(id) {
    if (confirm('Khách đã đến và nhận phòng?')) {
        var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        var index = bookings.findIndex(function(b) { return b.id == id; });
        
        if (index !== -1) {
            bookings[index].status = 'checkedin';
            bookings[index].checkinTime = new Date().toISOString();
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadOrders();
            alert('Khách đã check-in thành công!');
        }
    }
}

function completeOrder(id) {
    if (confirm('Hoàn thành đơn hàng này?')) {
        var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        var index = bookings.findIndex(function(b) { return b.id == id; });
        
        if (index !== -1) {
            bookings[index].status = 'completed';
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadOrders();
            loadDashboard();
            alert('Đơn hàng đã hoàn thành!');
        }
    }
}

function printInvoice(id) {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var booking = bookings.find(function(b) { return b.id == id; });
    
    if (booking) {
        alert('Xuất hóa đơn cho:\n\nĐơn hàng: #' + booking.id + '\nKhách: ' + booking.customer + '\nTổng tiền: ' + formatMoney(booking.totalAmount || booking.total) + '\n\n(Chức năng in hóa đơn đang phát triển...)');
    }
}

function cancelOrder(id) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        var index = bookings.findIndex(function(b) { return b.id == id; });
        
        if (index !== -1) {
            bookings[index].status = 'cancelled';
            bookings[index].cancelledTime = new Date().toISOString();
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadOrders();
            alert('Đã hủy đơn hàng!');
        }
    }
}

function changeStatus(id, newStatus) {
    var statusText = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'checkedin': 'Đang ở',
        'completed': 'Hoàn thành',
        'cancelled': 'Hủy đơn'
    };
    
    if (!confirm('Chuyển trạng thái đơn hàng sang "' + statusText[newStatus] + '"?')) {
        return;
    }
    
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var index = bookings.findIndex(function(b) { return b.id == id; });
    
    if (index !== -1) {
        bookings[index].status = newStatus;
        bookings[index].statusUpdatedTime = new Date().toISOString();
        
        // Lưu timestamp cho các trạng thái đặc biệt
        if (newStatus === 'checkedin') {
            bookings[index].checkinTime = new Date().toISOString();
        } else if (newStatus === 'cancelled') {
            bookings[index].cancelledTime = new Date().toISOString();
        }
        
        localStorage.setItem('bookings', JSON.stringify(bookings));
        loadOrders();
        loadRooms(); // Cập nhật lại trạng thái phòng
        alert('Đã chuyển sang "' + statusText[newStatus] + '"!');
    }
}

function toggleSubmenu(event, id) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    var allSubmenus = document.querySelectorAll('.action-submenu');
    for (var i = 0; i < allSubmenus.length; i++) {
        if (allSubmenus[i].id !== 'submenu-' + id) {
            allSubmenus[i].classList.remove('show');
        }
    }
    
    // Toggle submenu hiện tại
    var submenu = document.getElementById('submenu-' + id);
    if (!submenu) {
        console.error('Submenu not found: submenu-' + id);
        return;
    }
    
    var isShowing = submenu.classList.contains('show');
    
    if (!isShowing) {
        // Tính toán vị trí từ trigger button
        var trigger = event.currentTarget;
        var triggerRect = trigger.getBoundingClientRect();
        var menu = document.getElementById('menu-' + id);
        var menuRect = menu ? menu.getBoundingClientRect() : null;
        
        // Đặt submenu, kiểm tra xem bên phải hay bên trái
        if (menuRect) {
            var submenuWidth = 180;
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
            
            // Kiểm tra có đủ chỗ bên phải không
            if (menuRect.right + submenuWidth + 10 > windowWidth) {
                // Hiển thị bên trái menu chính
                submenu.style.left = (menuRect.left - submenuWidth - 4) + 'px';
            } else {
                // Hiển thị bên phải menu chính
                submenu.style.left = (menuRect.right + 4) + 'px';
            }
            
            // Kiểm tra vị trí top
            var submenuHeight = 200; // Ước tính
            if (triggerRect.top + submenuHeight > windowHeight) {
                submenu.style.top = (windowHeight - submenuHeight - 10) + 'px';
            } else {
                submenu.style.top = triggerRect.top + 'px';
            }
        }
    }
    
    submenu.classList.toggle('show');
}

function toggleActionMenu(event, id) {
    event.stopPropagation();
    var button = event.currentTarget;
    var menu = document.getElementById('menu-' + id);
    var allMenus = document.querySelectorAll('.action-menu');
    
    // Đóng tất cả menu khác
    for (var i = 0; i < allMenus.length; i++) {
        if (allMenus[i].id !== 'menu-' + id) {
            allMenus[i].classList.remove('show');
        }
    }
    
    // Toggle menu hiện tại
    var isShowing = menu.classList.contains('show');
    
    if (!isShowing) {
        // Tính toán vị trí
        var rect = button.getBoundingClientRect();
        var windowHeight = window.innerHeight;
        
        // Hiển thị menu tạm để lấy chiều cao thực
        menu.style.visibility = 'hidden';
        menu.classList.add('show');
        var menuHeight = menu.offsetHeight;
        menu.classList.remove('show');
        menu.style.visibility = 'visible';
        
        // Kiểm tra có đủ chỗ phía dưới không
        if (rect.bottom + menuHeight > windowHeight) {
            // Hiển thị phía trên
            menu.style.top = (rect.top - menuHeight - 4) + 'px';
        } else {
            // Hiển thị phía dưới
            menu.style.top = (rect.bottom + 4) + 'px';
        }
        
        // Tính vị trí left, đảm bảo không bị khuất mép phải
        var menuWidth = 180;
        var leftPos = rect.right - menuWidth;
        var windowWidth = window.innerWidth;
        
        // Nếu menu bị khuất bên phải, dịch sang trái
        if (leftPos + menuWidth > windowWidth - 20) {
            leftPos = windowWidth - menuWidth - 20;
        }
        // Nếu bị khuất bên trái
        if (leftPos < 10) {
            leftPos = 10;
        }
        
        menu.style.left = leftPos + 'px';
        menu.classList.add('show');
    } else {
        menu.classList.remove('show');
    }
}

function closeAllMenus() {
    var allMenus = document.querySelectorAll('.action-menu');
    for (var i = 0; i < allMenus.length; i++) {
        allMenus[i].classList.remove('show');
    }
    
    // Đóng tất cả submenu
    var allSubmenus = document.querySelectorAll('.action-submenu');
    for (var j = 0; j < allSubmenus.length; j++) {
        allSubmenus[j].classList.remove('show');
    }
}

// Đóng menu khi click ra ngoài
document.addEventListener('click', closeAllMenus);

function toggleSelectAll(checkbox) {
    var checkboxes = document.querySelectorAll('.row-checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = checkbox.checked;
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    var checkboxes = document.querySelectorAll('.row-checkbox:checked');
    var count = checkboxes.length;
    var bulkActions = document.getElementById('bulkActions');
    var selectAll = document.getElementById('selectAll');
    var selectAllHeader = document.getElementById('selectAllHeader');
    
    // Cập nhật số lượng đã chọn
    var selectedCountEl = document.getElementById('selectedCount');
    if (selectedCountEl) {
        selectedCountEl.textContent = count + ' đã chọn';
    }
    
    // Hiện/ẩn bulk actions bar
    if (count > 0) {
        bulkActions.style.display = 'flex';
    } else {
        bulkActions.style.display = 'none';
    }
    
    // Cập nhật trạng thái "Chọn tất cả"
    var allCheckboxes = document.querySelectorAll('.row-checkbox');
    if (selectAll) {
        selectAll.checked = (count === allCheckboxes.length && count > 0);
    }
    if (selectAllHeader) {
        selectAllHeader.checked = (count === allCheckboxes.length && count > 0);
    }
}

function applyBulkAction() {
    var action = document.getElementById('bulkActionSelect').value;
    if (!action) {
        alert('Vui lòng chọn thao tác!');
        return;
    }
    
    var checkboxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Vui lòng chọn ít nhất 1 đơn hàng!');
        return;
    }
    
    var ids = [];
    for (var i = 0; i < checkboxes.length; i++) {
        ids.push(checkboxes[i].value);
    }
    
    var confirmMsg = 'Bạn có chắc chắn muốn áp dụng thao tác này cho ' + ids.length + ' đơn hàng?';
    if (!confirm(confirmMsg)) {
        return;
    }
    
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var updated = 0;
    
    for (var i = 0; i < bookings.length; i++) {
        if (ids.indexOf(String(bookings[i].id)) !== -1) {
            if (action === 'confirm') {
                bookings[i].status = 'confirmed';
                updated++;
            } else if (action === 'checkin') {
                bookings[i].status = 'checkedin';
                bookings[i].checkinTime = new Date().toISOString();
                updated++;
            } else if (action === 'complete') {
                bookings[i].status = 'completed';
                updated++;
            } else if (action === 'cancel') {
                bookings[i].status = 'cancelled';
                bookings[i].cancelledTime = new Date().toISOString();
                updated++;
            }
        }
    }
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    loadOrders();
    loadRooms(); // Cập nhật lại trạng thái phòng
    
    alert('Đã cập nhật ' + updated + ' đơn hàng!');
    
    // Reset
    document.getElementById('bulkActionSelect').value = '';
    document.getElementById('bulkActions').style.display = 'none';
}

function loadEmployees() {
    var employees = JSON.parse(localStorage.getItem('employees') || '[]');
    var html = '';
    
    for (var i = 0; i < employees.length; i++) {
        var employee = employees[i];
        html += '<tr>';
        html += '<td>' + employee.name + '</td>';
        html += '<td>' + employee.email + '</td>';
        html += '<td>' + employee.phone + '</td>';
        html += '<td>' + employee.role + '</td>';
        html += '<td>';
        html += '<button class="action-btn edit" onclick="editEmployee(' + employee.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="action-btn delete" onclick="deleteEmployee(' + employee.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    
    document.getElementById('employeesList').innerHTML = html;
}

function loadPromotions() {
    var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    var html = '';
    
    for (var i = 0; i < promotions.length; i++) {
        var promo = promotions[i];
        
        // Chỉ hiển thị % (0-100)
        var discountText = (promo.discountValue || 0) + '%';
        
        // Format số lượng - hiển thị số lượng còn lại (maxUses - usedCount)
        const maxUses = Number(promo.maxUses || 0);
        const used = Number(promo.usedCount || 0);
        const soLuongConLai = Math.max(0, maxUses - used);
        var quantityText = soLuongConLai;
        
        // Format ngày
        var startDate = promo.startDate ? formatDateDisplay(promo.startDate) : 'N/A';
        var endDate = promo.endDate ? formatDateDisplay(promo.endDate) : 'N/A';
        var dateText = startDate + ' - ' + endDate;
        
        html += '<tr>';
        html += '<td>' + promo.code + '</td>';
        html += '<td>' + discountText + '</td>';
        html += '<td>' + quantityText + '</td>';
        html += '<td>' + dateText + '</td>';
        html += '<td>';
        html += '<button class="action-btn edit" onclick="editPromotion(' + promo.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="action-btn delete" onclick="deletePromotion(' + promo.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    
    if (html === '') {
        html = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">Chưa có mã giảm giá nào</td></tr>';
    }
    
    document.getElementById('promotionsList').innerHTML = html;
}

// Helper function để format ngày
function formatDateDisplay(dateStr) {
    if (!dateStr) return 'N/A';
    var date = new Date(dateStr);
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

// Helper function để format giá tiền
function formatPrice(price) {
    if (!price) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function getRoleText(role) {
    var roles = {
        'customer': 'Khách hàng',
        'admin': 'Quản trị viên',
        'manager': 'Quản lý',
        'staff': 'Nhân viên'
    };
    return roles[role] || role;
}

// Load danh sách tiện nghi động từ Quản lý tiện nghi
function loadAmenitiesDropdown() {
    // Đảm bảo dữ liệu tiện nghi đã được khởi tạo
    if (typeof khoiTaoDuLieuHeThong === 'function') {
        khoiTaoDuLieuHeThong();
    }
    
    var amenities = JSON.parse(localStorage.getItem('amenities') || '[]');
    var dropdown = document.getElementById('amenitiesDropdown');
    
    if (!dropdown) {
        console.error('Không tìm thấy amenitiesDropdown');
        return;
    }
    
    var html = '';
    
    if (amenities.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: #999;">Chưa có tiện nghi nào. Vui lòng thêm tiện nghi trong mục "Quản lý tiện nghi".</div>';
    } else {
        for (var i = 0; i < amenities.length; i++) {
            var amenity = amenities[i];
            html += '<div class="multiselect-option" onclick="toggleAmenity(this, \'' + amenity.name.replace(/'/g, "\\'") + '\')">';
            html += '<input type="checkbox" value="' + amenity.name.replace(/"/g, '&quot;') + '">';
            html += '<span>' + amenity.name + '</span>';
            html += '</div>';
        }
    }
    
    dropdown.innerHTML = html;
}

function openRoomModal() {
    editingRoomId = null;
    document.getElementById('roomForm').reset();
    
    // Đặt giá trị mặc định cho số người
    document.getElementById('roomAdults').value = 2;
    document.getElementById('roomChildren').value = 0;
    
    // Load danh sách tiện nghi từ localStorage
    loadAmenitiesDropdown();
    
    // Reset custom multiselect
    if (typeof resetAmenities === 'function') {
        resetAmenities();
    }
    
    // Reset danh sách ảnh
    if (typeof resetImagesList === 'function') {
        resetImagesList();
    }
    
    document.getElementById('roomModalTitle').textContent = 'Thêm phòng mới';
    document.getElementById('roomModal').classList.add('show');
}

function editRoom(id) {
    console.log('editRoom called with id:', id);
    editingRoomId = id;
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    var room = rooms.find(function(r) { return r.id == id; });
    
    if (room) {
        // Load danh sách tiện nghi động từ localStorage
        loadAmenitiesDropdown();
        
        document.getElementById('roomName').value = room.name;
        document.getElementById('roomHotel').value = room.hotel || 'QuickStay Hotel';
        
        // Map loại phòng về 4 loại chuẩn
        var validTypes = ['Standard', 'Deluxe', 'VIP', 'Suite'];
        var roomType = room.type || 'Standard';
        if (validTypes.indexOf(roomType) === -1) {
            // Map các loại cũ sang loại mới
            if (roomType === 'Studio') roomType = 'Standard';
            else if (roomType === 'Royal' || roomType === 'Penthouse') roomType = 'Suite';
            else roomType = 'Standard';
        }
        document.getElementById('roomType').value = roomType;
        
        document.getElementById('roomPrice').value = room.price;
        document.getElementById('roomFloor').value = room.floor;
        
        // Xử lý số người lớn và trẻ em
        if (room.adults !== undefined && room.children !== undefined) {
            document.getElementById('roomAdults').value = room.adults;
            document.getElementById('roomChildren').value = room.children;
        } else if (room.capacity) {
            // Xử lý dữ liệu cũ (capacity dạng string)
            var capacityStr = room.capacity.toString();
            var adultsMatch = capacityStr.match(/(\d+)\s*người lớn/i);
            var childrenMatch = capacityStr.match(/(\d+)\s*trẻ em/i);
            document.getElementById('roomAdults').value = adultsMatch ? parseInt(adultsMatch[1]) : 2;
            document.getElementById('roomChildren').value = childrenMatch ? parseInt(childrenMatch[1]) : 0;
        } else {
            document.getElementById('roomAdults').value = 2;
            document.getElementById('roomChildren').value = 0;
        }
        
        document.getElementById('roomDescription').value = room.description || '';
        document.getElementById('roomStatus').value = room.status || 'available';
        
        // Load danh sách ảnh
        if (typeof loadRoomImages === 'function') {
            var images = room.images || [room.image];
            loadRoomImages(images);
        }
        
        // Load tiện nghi vào custom multiselect
        if (typeof loadRoomAmenities === 'function') {
            loadRoomAmenities(room.amenities || '');
        }
        
        document.getElementById('roomModalTitle').textContent = 'Sửa phòng';
        document.getElementById('roomModal').classList.add('show');
    }
}

function deleteRoom(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
        var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        rooms = rooms.filter(function(r) { return r.id != id; });
        localStorage.setItem('rooms', JSON.stringify(rooms));
        loadRooms();
        loadDashboard();
        alert('Đã xóa phòng!');
    }
}

function saveRoom(event) {
    event.preventDefault();
    
    var imagePath = document.getElementById('roomImage').value;
    
    // Lấy tất cả ảnh từ roomImages
    var imagesString = document.getElementById('roomImages').value;
    var images = [];
    if (imagesString) {
        try {
            images = JSON.parse(imagesString);
        } catch (e) {
            images = [imagePath];
        }
    } else if (imagePath) {
        images = [imagePath];
    }
    
    // Lấy tiện nghi từ hidden input
    var amenitiesString = document.getElementById('roomAmenities').value;
    
    // Kiểm tra phải chọn ít nhất 1 tiện nghi
    if (!amenitiesString || amenitiesString.trim() === '') {
        alert('Vui lòng chọn ít nhất 1 tiện nghi!');
        return;
    }
    
    var roomData = {
        id: editingRoomId || Date.now(),
        name: document.getElementById('roomName').value,
        hotel: document.getElementById('roomHotel').value,
        type: document.getElementById('roomType').value,
        price: parseInt(document.getElementById('roomPrice').value),
        floor: document.getElementById('roomFloor').value,
        adults: parseInt(document.getElementById('roomAdults').value) || 2,
        children: parseInt(document.getElementById('roomChildren').value) || 0,
        image: imagePath,
        images: images,
        description: document.getElementById('roomDescription').value,
        amenities: amenitiesString,
        status: document.getElementById('roomStatus').value
    };
    
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    
    if (editingRoomId) {
        var index = rooms.findIndex(function(r) { return r.id == editingRoomId; });
        if (index !== -1) {
            // Giữ lại ID cũ khi sửa
            roomData.id = rooms[index].id;
            rooms[index] = roomData;
        }
    } else {
        rooms.push(roomData);
    }
    
    localStorage.setItem('rooms', JSON.stringify(rooms));
    closeModal('roomModal');
    loadRooms();
    loadDashboard();
    alert('Đã lưu phòng thành công!');
}

function openEmployeeModal() {
    editingEmployeeId = null;
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeModal').classList.add('show');
}

function editEmployee(id) {
    editingEmployeeId = id;
    var employees = JSON.parse(localStorage.getItem('employees') || '[]');
    var employee = employees.find(function(e) { return e.id == id; });
    
    if (employee) {
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeEmail').value = employee.email;
        document.getElementById('employeePhone').value = employee.phone;
        document.getElementById('employeeRole').value = employee.role;
        document.getElementById('employeeModal').classList.add('show');
    }
}

function deleteEmployee(id) {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        var employees = JSON.parse(localStorage.getItem('employees') || '[]');
        employees = employees.filter(function(e) { return e.id != id; });
        localStorage.setItem('employees', JSON.stringify(employees));
        loadEmployees();
        alert('Đã xóa nhân viên!');
    }
}

function saveEmployee(event) {
    event.preventDefault();
    
    var employeeData = {
        id: editingEmployeeId || Date.now(),
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        phone: document.getElementById('employeePhone').value,
        role: document.getElementById('employeeRole').value
    };
    
    var employees = JSON.parse(localStorage.getItem('employees') || '[]');
    
    if (editingEmployeeId) {
        var index = employees.findIndex(function(e) { return e.id == editingEmployeeId; });
        if (index !== -1) {
            employees[index] = employeeData;
        }
    } else {
        employees.push(employeeData);
    }
    
    localStorage.setItem('employees', JSON.stringify(employees));
    closeModal('employeeModal');
    loadEmployees();
    alert('Đã lưu nhân viên!');
}

function openPromotionModal() {
    editingPromotionId = null;
    document.getElementById('promotionForm').reset();
    document.getElementById('promotionModal').classList.add('show');
}

function editPromotion(id) {
    editingPromotionId = id;
    var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    var promo = promotions.find(function(p) { return p.id == id; });
    
    if (promo) {
        document.getElementById('promotionCode').value = promo.code;
        document.getElementById('promotionDiscount').value = promo.discountValue || promo.discount;
        document.getElementById('promotionQuantity').value = promo.maxUses || promo.quantity;
        document.getElementById('promotionStart').value = promo.startDate || promo.start;
        document.getElementById('promotionEnd').value = promo.endDate || promo.end;
        document.getElementById('promotionModal').classList.add('show');
    }
}

// Xóa mã giảm giá
function deletePromotion(id) {
    if (confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
        var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        promotions = promotions.filter(function(p) { return p.id != id; });
        localStorage.setItem('promotions', JSON.stringify(promotions));
        loadPromotions();
        alert('Đã xóa mã giảm giá thành công!');
    }
}

function savePromotion(event) {
    event.preventDefault();
    
    var code = document.getElementById('promotionCode').value;
    var discount = document.getElementById('promotionDiscount').value;
    var quantity = document.getElementById('promotionQuantity').value;
    var start = document.getElementById('promotionStart').value;
    var end = document.getElementById('promotionEnd').value;
    
    // Validation: Kiểm tra giá trị giảm giá phải từ 0% đến 100%
    var discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        alert('Lỗi: Giá trị giảm giá phải từ 0% đến 100%!');
        return;
    }
    
    var promoData = {
        id: editingPromotionId || Date.now(),
        code: code,
        discountType: 'percent',
        discountValue: discountValue,
        maxDiscount: discountValue * 10000,
        minAmount: 0,
        maxUses: parseInt(quantity),
        usedCount: 0,
        startDate: start,
        endDate: end,
        description: 'Giảm ' + discount + '%'
    };
    
    var promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    if (editingPromotionId) {
        var index = promotions.findIndex(function(p) { return p.id == editingPromotionId; });
        if (index !== -1) {
            promoData.usedCount = promotions[index].usedCount || 0;
            promotions[index] = promoData;
        }
    } else {
        promotions.push(promoData);
    }
    
    localStorage.setItem('promotions', JSON.stringify(promotions));
    closeModal('promotionModal');
    loadPromotions();
    alert('Đã lưu mã giảm giá!');
}

function openAccountModal() {
    editingAccountId = null;
    document.getElementById('accountForm').reset();
    document.getElementById('accountModal').classList.add('show');
}

function editAccount(id) {
    editingAccountId = id;
    var customers = JSON.parse(localStorage.getItem('customers') || '[]');
    var account = customers.find(function(a) { return a.id == id; });
    
    if (account) {
        document.getElementById('accountUsername').value = account.username;
        document.getElementById('accountFullName').value = account.name;
        document.getElementById('accountEmail').value = account.email;
        document.getElementById('accountRole').value = account.role || 'customer';
        document.getElementById('accountModal').classList.add('show');
    }
}

function deleteAccount(id) {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
        var customers = JSON.parse(localStorage.getItem('customers') || '[]');
        customers = customers.filter(function(a) { return a.id != id; });
        localStorage.setItem('customers', JSON.stringify(customers));
        loadAccounts();
        alert('Đã xóa tài khoản!');
    }
}

function saveAccount(event) {
    event.preventDefault();
    
    var accountData = {
        id: editingAccountId || Date.now(),
        username: document.getElementById('accountUsername').value,
        name: document.getElementById('accountFullName').value,
        email: document.getElementById('accountEmail').value,
        password: document.getElementById('accountPassword').value,
        role: document.getElementById('accountRole').value,
        registerTime: new Date().toISOString()
    };
    
    var customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    if (editingAccountId) {
        var index = customers.findIndex(function(a) { return a.id == editingAccountId; });
        if (index !== -1) {
            // Giữ lại thông tin cũ nếu có
            accountData.firstName = customers[index].firstName;
            accountData.lastName = customers[index].lastName;
            customers[index] = accountData;
        }
    } else {
        customers.push(accountData);
    }
    
    localStorage.setItem('customers', JSON.stringify(customers));
    closeModal('accountModal');
    loadAccounts();
    alert('Đã lưu tài khoản!');
}

function getStatus(status) {
    if (status === 'available') return 'Trống';
    if (status === 'occupied') return 'Đã đặt';
    if (status === 'maintenance') return 'Bảo trì';
    return status;
}

function getBookingStatus(status) {
    if (status === 'pending') return 'Chờ xác nhận';
    if (status === 'confirmed') return 'Đã xác nhận';
    if (status === 'checkedin') return 'Đang ở';
    if (status === 'completed') return 'Hoàn thành';
    if (status === 'cancelled') return 'Đã hủy';
    return status;
}

function formatMoney(amount) {
    return amount.toLocaleString('vi-VN') + 'đ';
}

function loadRevenueData() {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    
    var revenueByType = {
        'Standard': 0,
        'Deluxe': 0,
        'VIP': 0,
        'Suite': 0
    };
    
    // Tính doanh thu theo loại phòng từ bookings
    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        if (!b) continue;

        // Chỉ tính các đơn đã hoàn thành hoặc đã xác nhận
        var status = (b.status || '').toLowerCase();
        if (status !== 'completed' && status !== 'confirmed') continue;

        var amount = parseInt((b.totalAmount || b.total || '0').toString().replace(/[^\d]/g, '')) || 0;
        var roomType = mapRoomType(b.roomType || b.type || 'Standard');

        if (!revenueByType[roomType]) revenueByType[roomType] = 0;
        revenueByType[roomType] += amount;
    }
    
    // Render dữ liệu lên giao diện
    var container = document.getElementById('revenueByType');
    if (container) {
        container.innerHTML = '';
        Object.keys(revenueByType).forEach(function(type) {
            container.innerHTML += '<div class="revenue-item"><span class="room-type">' + type + '</span><span class="revenue-amount">' + formatMoney(revenueByType[type]) + '</span></div>';
        });
    }
    
    var totalBookings = bookings.length;
    var confirmedBookings = 0;
    var cancelledBookings = 0;
    var pendingBookings = 0;
    
    for (var j = 0; j < bookings.length; j++) {
        var booking = bookings[j];
        if (booking.status === 'confirmed') confirmedBookings++;
        else if (booking.status === 'cancelled') cancelledBookings++;
        else if (booking.status === 'pending') pendingBookings++;
    }
    
    var revenueTotalBookingsEl = document.getElementById('revenueTotalBookings');
    var revenueConfirmedBookingsEl = document.getElementById('revenueConfirmedBookings');
    var revenueCancelledBookingsEl = document.getElementById('revenueCancelledBookings');
    var revenuePendingBookingsEl = document.getElementById('revenuePendingBookings');
    
    if (revenueTotalBookingsEl) revenueTotalBookingsEl.textContent = totalBookings;
    if (revenueConfirmedBookingsEl) revenueConfirmedBookingsEl.textContent = confirmedBookings;
    if (revenueCancelledBookingsEl) revenueCancelledBookingsEl.textContent = cancelledBookings;
    if (revenuePendingBookingsEl) revenuePendingBookingsEl.textContent = pendingBookings;
    
    // Tính top phòng bán chạy
    var roomBookingCount = {};
    for (var k = 0; k < bookings.length; k++) {
        var booking = bookings[k];
        if (booking.status !== 'cancelled') {
            var roomId = booking.roomId;
            roomBookingCount[roomId] = (roomBookingCount[roomId] || 0) + 1;
        }
    }
    
    var sortedRooms = Object.keys(roomBookingCount).sort(function(a, b) {
        return roomBookingCount[b] - roomBookingCount[a];
    });
    
    var topRoomsContainer = document.getElementById('topRooms');
    topRoomsContainer.innerHTML = '';
    
    if (sortedRooms.length === 0) {
        topRoomsContainer.innerHTML = '<div class="room-item"><span class="room-name">Chưa có dữ liệu</span><span class="booking-count">0 lần đặt</span></div>';
    } else {
        for (var l = 0; l < Math.min(sortedRooms.length, 5); l++) {
            var roomId = sortedRooms[l];
            var room = rooms.find(function(r) { return r.id == roomId; });
            var count = roomBookingCount[roomId];
            
            if (room) {
                var roomItem = document.createElement('div');
                roomItem.className = 'room-item';
                roomItem.innerHTML = '<span class="room-name">' + room.name + '</span><span class="booking-count">' + count + ' lần đặt</span>';
                topRoomsContainer.appendChild(roomItem);
            }
        }
    }
    
    loadRevenueChart('hour');
}

// Biến global cho time filter
var currentTimeFilter = 'hour';

// Toggle dropdown filter
function toggleTimeFilter() {
    var dropdown = document.getElementById('timeFilterDropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

function changeTimeFilter(filter) {
    currentTimeFilter = filter;
    
    var filterNames = {
        'hour': 'Giờ',
        'day': 'Ngày',
        'week': 'Tuần',
        'month': 'Tháng',
        'year': 'Năm'
    };
    
    document.getElementById('selectedTimeFilter').textContent = filterNames[filter];
    document.getElementById('timeFilterDropdown').style.display = 'none';
    
    loadRevenueChart(filter);
}

function loadRevenueChart(filter) {
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var weeklyRevenueContainer = document.getElementById('weeklyRevenue');
    var today = new Date();
    var chartData = [];
    
    if (filter === 'hour') {
        // Biểu đồ 24 giờ (0-23h)
        for (var h = 0; h < 24; h++) {
            var hourRevenue = 0;
            var hourBookings = 0;
            
            for (var n = 0; n < bookings.length; n++) {
                var booking = bookings[n];
                if (booking.bookingDate) {
                    var bookingDate = new Date(booking.bookingDate);
                    if (bookingDate.toDateString() === today.toDateString() && bookingDate.getHours() === h) {
                        if (booking.status !== 'cancelled') {
                            hourRevenue += parseFloat(booking.totalAmount) || 0;
                            hourBookings++;
                        }
                    }
                }
            }
            
            chartData.push({
                label: h.toString().padStart(2, '0') + 'h',
                revenue: hourRevenue,
                bookings: hourBookings,
                showLabel: true
            });
        }
    } else if (filter === 'day') {
        // Biểu đồ các ngày trong tháng hiện tại (1-30/31)
        var currentYear = today.getFullYear();
        var currentMonth = today.getMonth();
        var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (var day = 1; day <= daysInMonth; day++) {
            var date = new Date(currentYear, currentMonth, day);
            var dateStr = date.toISOString().split('T')[0];
            
            var dayRevenue = 0;
            var dayBookings = 0;
            
            for (var n = 0; n < bookings.length; n++) {
                var booking = bookings[n];
                if (booking.bookingDate && booking.bookingDate.startsWith(dateStr)) {
                    if (booking.status !== 'cancelled') {
                        dayRevenue += parseFloat(booking.totalAmount) || 0;
                        dayBookings++;
                    }
                }
            }
            
            var showLabel = true;
            chartData.push({
                label: day.toString(),
                revenue: dayRevenue,
                bookings: dayBookings,
                showLabel: showLabel
            });
        }
    } else if (filter === 'week') {
        // Biểu đồ 7 ngày trong tuần (T2 - CN)
        var dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        var dayNamesOrdered = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        
        // Tìm thứ 2 của tuần hiện tại
        var currentDay = today.getDay(); // 0 = CN, 1 = T2, ...
        var diff = currentDay === 0 ? -6 : 1 - currentDay; // Số ngày cần trừ để về T2
        var monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        
        for (var d = 0; d < 7; d++) {
            var date = new Date(monday);
            date.setDate(monday.getDate() + d);
            var dateStr = date.toISOString().split('T')[0];
            
            var dayRevenue = 0;
            var dayBookings = 0;
            
            for (var n = 0; n < bookings.length; n++) {
                var booking = bookings[n];
                if (booking.bookingDate && booking.bookingDate.startsWith(dateStr)) {
                    if (booking.status !== 'cancelled') {
                        dayRevenue += parseFloat(booking.totalAmount) || 0;
                        dayBookings++;
                    }
                }
            }
            
            chartData.push({
                label: dayNamesOrdered[d],
                revenue: dayRevenue,
                bookings: dayBookings,
                showLabel: true
            });
        }
    } else if (filter === 'month') {
        // Biểu đồ 12 tháng trong năm hiện tại
        var currentYear = today.getFullYear();
        var monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        
        for (var month = 1; month <= 12; month++) {
            var monthRevenue = 0;
            var monthBookings = 0;
            
            for (var n = 0; n < bookings.length; n++) {
                var booking = bookings[n];
                if (booking.bookingDate) {
                    var bookingDate = new Date(booking.bookingDate);
                    if (bookingDate.getFullYear() === currentYear && bookingDate.getMonth() + 1 === month) {
                        if (booking.status !== 'cancelled') {
                            monthRevenue += parseFloat(booking.totalAmount) || 0;
                            monthBookings++;
                        }
                    }
                }
            }
            
            chartData.push({
                label: monthNames[month - 1],
                revenue: monthRevenue,
                bookings: monthBookings,
                showLabel: true
            });
        }
    } else if (filter === 'year') {
        // Biểu đồ các năm (5 năm gần nhất)
        var currentYear = today.getFullYear();
        var startYear = currentYear - 4;
        
        for (var year = startYear; year <= currentYear; year++) {
            var yearRevenue = 0;
            var yearBookings = 0;
            
            for (var n = 0; n < bookings.length; n++) {
                var booking = bookings[n];
                if (booking.bookingDate) {
                    var bookingDate = new Date(booking.bookingDate);
                    if (bookingDate.getFullYear() === year) {
                        if (booking.status !== 'cancelled') {
                            yearRevenue += parseFloat(booking.totalAmount) || 0;
                            yearBookings++;
                        }
                    }
                }
            }
            
            chartData.push({
                label: year.toString(),
                revenue: yearRevenue,
                bookings: yearBookings,
                showLabel: true
            });
        }
    }
    
    // Render biểu đồ
    var chartHTML = '<div style="display: flex; align-items: flex-end; height: 240px; gap: ' + (chartData.length > 20 ? '1px' : '4px') + '; padding: 30px 15px 50px 15px; position: relative; background: linear-gradient(to bottom, rgba(102, 126, 234, 0.02) 0%, transparent 100%); border-radius: 8px;">';
    var maxValue = Math.max.apply(Math, chartData.map(function(d) { return d.bookings; }));
    if (maxValue === 0) maxValue = 4;
    
    // Xác định font size dựa trên số lượng items và filter
    var labelFontSize = '11px';
    if (chartData.length >= 28) {
        labelFontSize = '7px';  // Tháng có 28-31 ngày
    } else if (chartData.length > 20) {
        labelFontSize = '9px';
    }
    
    for (var i = 0; i < chartData.length; i++) {
        var data = chartData[i];
        var height = data.bookings > 0 ? (data.bookings / maxValue) * 180 : 3;
        var barColor = data.bookings > 0 ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb';
        
        chartHTML += '<div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; cursor: pointer;" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">';
        chartHTML += '<div style="background: ' + barColor + '; width: 100%; height: ' + height + 'px; border-radius: 4px 4px 0 0; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;" title="' + data.label + ': ' + data.bookings + ' đơn - ' + formatMoney(data.revenue) + '"></div>';
        if (data.showLabel) {
            chartHTML += '<div style="font-size: ' + labelFontSize + '; font-weight: 600; color: #1f2937; margin-top: 8px; position: absolute; bottom: -33px; white-space: nowrap;">' + data.label + '</div>';
        }
        chartHTML += '</div>';
    }
    
    // Thêm đường kẻ ngang (baseline) và grid lines
    chartHTML += '<div style="position: absolute; left: 15px; right: 15px; bottom: 50px; height: 2px; background: #d1d5db;"></div>';
    
    for (var g = 1; g <= 3; g++) {
        var gridHeight = (g * 25) + '%';
        chartHTML += '<div style="position: absolute; left: 15px; right: 15px; bottom: calc(50px + ' + gridHeight + '); height: 1px; background: rgba(209, 213, 219, 0.3);"></div>';
    }
    
    chartHTML += '</div>';
    weeklyRevenueContainer.innerHTML = chartHTML;
}

// Đóng dropdown khi click ra ngoài
document.addEventListener('click', function(e) {
    var dropdown = document.getElementById('timeFilterDropdown');
    if (dropdown && !e.target.closest('[onclick*="toggleTimeFilter"]') && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function showSection(sectionId) {
    var sections = document.querySelectorAll('.content-section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
        sections[i].style.display = 'none';
    }
    
    var targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    var titles = {
        'dashboard': 'Dashboard',
        'rooms': 'Quản lý phòng',
        'amenities': 'Quản lý tiện nghi',
        'orders': 'Quản lý đơn hàng',
        'promotions': 'Quản lý mã giảm giá',
        'accounts': 'Quản lý tài khoản'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
    
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    // Chỉ hiện phần báo cáo doanh thu khi ở Dashboard
    var revenueSection = document.getElementById('revenueSection');
    if (sectionId === 'dashboard') {
        if (revenueSection) {
            revenueSection.style.display = 'block';
        }
    } else {
        if (revenueSection) {
            revenueSection.style.display = 'none';
        }
    }
    
    if (sectionId === 'amenities') {
        loadAmenities();
    } else if (sectionId === 'rooms') {
        loadRooms();
    } else if (sectionId === 'orders') {
        loadOrders();
    } else if (sectionId === 'promotions') {
        loadPromotions();
    } else if (sectionId === 'accounts') {
        loadAccounts();
    }
    
    // Cập nhật active nav item
    var navItems = document.querySelectorAll('.nav-item');
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove('active');
    }
    
    var activeNav = document.querySelector('a[href="#' + sectionId + '"]');
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

function loadAccounts() {
    // Lấy từ cả accounts (admin/staff) và customers (khách hàng)
    var adminAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    var customerAccounts = JSON.parse(localStorage.getItem('customers') || '[]');

    // Đảm bảo luôn có một vài tài khoản mẫu (nếu chưa tồn tại)
    function ensureAccount(list, username, data) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].username === username) {
                return; // đã có, không thêm nữa
            }
        }
        list.push(data);
    }

    // Admin mẫu trong accounts
    ensureAccount(adminAccounts, 'admin', {
        id: Date.now(),
        username: 'admin',
        name: 'Quản trị viên',
        email: 'admin@example.com',
        password: '1',
        role: 'admin'
    });

    // Khách hàng mẫu trong customers
    ensureAccount(customerAccounts, 'nha', {
        id: Date.now() + 1,
        username: 'nha',
        name: 'Lại Văn Nhà',
        email: 'nha@example.com',
        password: 'Nha1234@',
        role: 'customer'
    });

    ensureAccount(customerAccounts, 'khach1', {
        id: Date.now() + 2,
        username: 'khach1',
        name: 'Nguyễn Văn A',
        email: 'khach1@example.com',
        password: 'Khach123@',
        role: 'customer'
    });

    // Lưu lại sau khi đảm bảo mẫu
    localStorage.setItem('accounts', JSON.stringify(adminAccounts));
    localStorage.setItem('customers', JSON.stringify(customerAccounts));

    // Gộp lại
    var allAccounts = adminAccounts.concat(customerAccounts);
    
    var tbody = document.getElementById('accountsList');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (allAccounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có tài khoản nào</td></tr>';
        return;
    }
    
    for (var i = 0; i < allAccounts.length; i++) {
        var account = allAccounts[i];
        var tr = document.createElement('tr');
        
        var roleName = 'Khách hàng';
        if (account.role === 'admin') roleName = 'Admin';
        else if (account.role === 'staff') roleName = 'Nhân viên';
        
        var fullName = account.name || 'N/A';
        
        tr.innerHTML = `
            <td>${account.username || 'N/A'}</td>
            <td>${fullName}</td>
            <td>${account.email || 'N/A'}</td>
            <td><span class="status-badge ${account.role === 'admin' ? 'confirmed' : 'pending'}">${roleName}</span></td>
            <td>
                <button class="btn-icon btn-edit" onclick="editAccount('${account.id}')" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteAccount('${account.id}')" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    }
}

function openAccountModal() {
    editingAccountId = null;
    editingAccountType = null;
    document.getElementById('accountForm').reset();
    document.querySelector('#accountModal .modal-header h3').textContent = 'Thêm tài khoản';
    document.getElementById('accountModal').classList.add('show');
}

function editAccount(id) {
    var adminAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    var customerAccounts = JSON.parse(localStorage.getItem('customers') || '[]');
    var account = null;

    // Tìm trong admin/staff trước
    for (var i = 0; i < adminAccounts.length; i++) {
        if (adminAccounts[i].id == id) {
            account = adminAccounts[i];
            editingAccountType = 'admin';
            break;
        }
    }

    // Nếu chưa thấy, tìm trong khách hàng
    if (!account) {
        for (var j = 0; j < customerAccounts.length; j++) {
            if (customerAccounts[j].id == id) {
                account = customerAccounts[j];
                editingAccountType = 'customer';
                break;
            }
        }
    }

    if (!account) {
        alert('Không tìm thấy tài khoản!');
        return;
    }

    editingAccountId = id;
    document.getElementById('accountUsername').value = account.username || '';
    document.getElementById('accountFullName').value = account.name || '';
    document.getElementById('accountEmail').value = account.email || '';
    document.getElementById('accountPassword').value = account.password || '';
    document.getElementById('accountRole').value = account.role || 'customer';

    document.querySelector('#accountModal .modal-header h3').textContent = 'Chỉnh sửa tài khoản';
    document.getElementById('accountModal').classList.add('show');
}

function saveAccount(event) {
    event.preventDefault();

    var username = document.getElementById('accountUsername').value.trim();
    var fullName = document.getElementById('accountFullName').value.trim();
    var email = document.getElementById('accountEmail').value.trim();
    var password = document.getElementById('accountPassword').value;
    var role = document.getElementById('accountRole').value;

    var adminAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    var customerAccounts = JSON.parse(localStorage.getItem('customers') || '[]');

    if (editingAccountId) {
        // Cập nhật tài khoản đang sửa
        var list = editingAccountType === 'admin' ? adminAccounts : customerAccounts;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id == editingAccountId) {
                list[i].username = username;
                list[i].name = fullName;
                list[i].email = email;
                list[i].password = password;
                list[i].role = role;

                // Đồng bộ với currentUser nếu đang sửa tài khoản hiện tại
                var currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        var userData = JSON.parse(currentUser);
                        if (userData.id == editingAccountId) {
                            userData.username = username;
                            userData.name = fullName;
                            userData.email = email;
                            userData.password = password;
                            userData.role = role;
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                        }
                    } catch (e) {
                        console.error('Lỗi sync currentUser:', e);
                    }
                }
                break;
            }
        }
    } else {
        // Thêm tài khoản mới
        var all = adminAccounts.concat(customerAccounts);
        for (var j = 0; j < all.length; j++) {
            if (all[j].username === username) {
                alert('Tên đăng nhập đã tồn tại!');
                return;
            }
        }

        var newAccount = {
            id: Date.now(),
            username: username,
            name: fullName,
            email: email,
            password: password,
            role: role,
            registerTime: new Date().toISOString()
        };

        if (role === 'admin' || role === 'staff') {
            adminAccounts.push(newAccount);
        } else {
            customerAccounts.push(newAccount);
        }
    }

    localStorage.setItem('accounts', JSON.stringify(adminAccounts));
    localStorage.setItem('customers', JSON.stringify(customerAccounts));
    closeModal('accountModal');
    loadAccounts();
    alert(editingAccountId ? 'Cập nhật tài khoản thành công!' : 'Thêm tài khoản thành công!');
}

function deleteAccount(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
        return;
    }

    // Không cho xóa tài khoản đang đăng nhập
    var currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            var userData = JSON.parse(currentUser);
            if (userData.id == id) {
                alert('Không thể xóa tài khoản đang đăng nhập!');
                return;
            }
        } catch (e) {
            console.error('Lỗi parse currentUser:', e);
        }
    }

    var adminAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    var customerAccounts = JSON.parse(localStorage.getItem('customers') || '[]');

    // Xóa trong adminAccounts
    adminAccounts = adminAccounts.filter(function(a) { return a.id != id; });
    // Xóa trong customerAccounts
    customerAccounts = customerAccounts.filter(function(a) { return a.id != id; });

    localStorage.setItem('accounts', JSON.stringify(adminAccounts));
    localStorage.setItem('customers', JSON.stringify(customerAccounts));
    loadAccounts();
    alert('Đã xóa tài khoản thành công!');
}

var selectedAmenities = [];

function toggleAmenitiesDropdown() {
    var dropdown = document.getElementById('amenitiesDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function toggleAmenity(element, value) {
    var checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        if (!selectedAmenities.includes(value)) {
            selectedAmenities.push(value);
        }
    } else {
        selectedAmenities = selectedAmenities.filter(function(item) {
            return item !== value;
        });
    }
    
    updateAmenitiesTags();
    updateHiddenInput();
}

function removeAmenityTag(value) {
    selectedAmenities = selectedAmenities.filter(function(item) {
        return item !== value;
    });
    
    // Bỏ check checkbox tương ứng
    var checkboxes = document.querySelectorAll('.multiselect-option input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].value === value) {
            checkboxes[i].checked = false;
            break;
        }
    }
    
    updateAmenitiesTags();
    updateHiddenInput();
}

function updateAmenitiesTags() {
    var tagsContainer = document.getElementById('selectedAmenitiesTags');
    tagsContainer.innerHTML = '';
    
    for (var i = 0; i < selectedAmenities.length; i++) {
        var tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = '<span>' + selectedAmenities[i] + '</span><span class="remove-tag" onclick="removeAmenityTag(\'' + selectedAmenities[i] + '\')">×</span>';
        tagsContainer.appendChild(tag);
    }
}

function updateHiddenInput() {
    document.getElementById('roomAmenities').value = selectedAmenities.join(', ');
}

function resetAmenities() {
    selectedAmenities = [];
    var checkboxes = document.querySelectorAll('.multiselect-option input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
    updateAmenitiesTags();
    updateHiddenInput();
}

function loadRoomAmenities(amenitiesString) {
    resetAmenities();
    if (amenitiesString) {
        var amenitiesList = amenitiesString.split(',').map(function(item) {
            return item.trim();
        });
        
        selectedAmenities = amenitiesList;
        
        // Check các checkbox tương ứng
        var checkboxes = document.querySelectorAll('.multiselect-option input[type="checkbox"]');
        for (var i = 0; i < checkboxes.length; i++) {
            if (amenitiesList.includes(checkboxes[i].value)) {
                checkboxes[i].checked = true;
            }
        }
        
        updateAmenitiesTags();
        updateHiddenInput();
    }
}

// Đóng dropdown khi click bên ngoài
document.addEventListener('click', function(e) {
    var multiselect = document.getElementById('amenitiesMultiSelect');
    if (multiselect && !multiselect.contains(e.target)) {
        document.getElementById('amenitiesDropdown').style.display = 'none';
    }
});

// Biến lưu danh sách ảnh đã chọn
var selectedImages = [];

// Xử lý upload nhiều ảnh
function handleMultipleImageUpload(input) {
    if (input.files && input.files.length > 0) {
        var files = Array.from(input.files);
        
        files.forEach(function(file) {
            var fileName = file.name;
            var filePath = '../img/' + fileName;
            
            // Đọc file để hiển thị preview
            var reader = new FileReader();
            reader.onload = function(e) {
                // Thêm vào danh sách
                selectedImages.push({
                    name: fileName,
                    path: filePath,
                    preview: e.target.result
                });
                
                // Cập nhật hiển thị
                updateImagesDisplay();
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input để có thể chọn lại
        input.value = '';
    }
}

// Hiển thị danh sách ảnh
function updateImagesDisplay() {
    var container = document.getElementById('imagesListContainer');
    var html = '';
    
    selectedImages.forEach(function(img, index) {
        html += '<div class="image-item">';
        html += '  <img src="' + img.preview + '" alt="' + img.name + '">';
        html += '  <span class="image-item-name">' + img.name + '</span>';
        html += '  <button type="button" class="image-item-delete" onclick="removeImage(' + index + ')">';
        html += '    <i class="fas fa-trash"></i>';
        html += '  </button>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Cập nhật hidden inputs
    if (selectedImages.length > 0) {
        // Ảnh chính (ảnh đầu tiên)
        document.getElementById('roomImage').value = selectedImages[0].path;
        
        // Tất cả các ảnh
        var allPaths = selectedImages.map(function(img) { return img.path; });
        document.getElementById('roomImages').value = JSON.stringify(allPaths);
    } else {
        document.getElementById('roomImage').value = '';
        document.getElementById('roomImages').value = '';
    }
}

// Xóa ảnh
function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagesDisplay();
}

// Reset danh sách ảnh
function resetImagesList() {
    selectedImages = [];
    document.getElementById('imagesListContainer').innerHTML = '';
    document.getElementById('roomImage').value = '';
    document.getElementById('roomImages').value = '';
}

// Load ảnh khi sửa phòng
function loadRoomImages(images) {
    selectedImages = [];
    
    if (!images || images.length === 0) {
        updateImagesDisplay();
        return;
    }
    
    images.forEach(function(imagePath) {
        if (imagePath) {
            var fileName = imagePath.split('/').pop();
            selectedImages.push({
                name: fileName,
                path: imagePath,
                preview: imagePath // Sử dụng đường dẫn thực làm preview
            });
        }
    });
    
    updateImagesDisplay();
}
