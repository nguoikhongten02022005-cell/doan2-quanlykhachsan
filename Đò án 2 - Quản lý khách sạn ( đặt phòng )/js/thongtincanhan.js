var currentUser = null;
var allBookings = [];
var currentFilter = 'all';
var currentPage = 1;
var itemsPerPage = 5;

window.onload = function() {
    checkAuth();
    loadUserInfo();
    loadBookings();
    showSection('bookings'); // Mặc định hiển thị đơn hàng
};

function checkAuth() {
    var userLogin = localStorage.getItem('currentUser');
    
    if (!userLogin) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userLogin);
    } catch (e) {
        window.location.href = 'login.html';
    }
}

function loadUserInfo() {
    if (!currentUser) return;
    
    // Lấy customers để có thông tin đầy đủ
    var customers = JSON.parse(localStorage.getItem('customers') || '[]');
    var userDetail = customers.find(function(c) { 
        return c.username === currentUser.username || c.id === currentUser.id;
    });
    
    if (userDetail) {
        currentUser = userDetail;
    }
    
    // Hiển thị thông tin trong sidebar
    var displayUserName = document.getElementById('displayUserName');
    var displayUserEmail = document.getElementById('displayUserEmail');
    
    if (displayUserName) {
        displayUserName.textContent = currentUser.name || currentUser.username || 'Khách';
    }
    
    if (displayUserEmail) {
        displayUserEmail.textContent = currentUser.email || 'email@example.com';
    }
    
    // Hiển thị avatar nếu có
    var userAvatar = document.getElementById('userAvatar');
    if (userAvatar && currentUser.avatar) {
        // Nếu có avatar, thay icon bằng img
        userAvatar.outerHTML = '<img src="' + currentUser.avatar + '" alt="Avatar" id="userAvatar" style="width: 100%; height: 100%; object-fit: cover;">';
    }
    
    // Load thông tin vào form
    loadProfileForm();
}

function loadProfileForm() {
    if (!currentUser) return;
    
    var username = document.getElementById('username');
    var fullName = document.getElementById('fullName');
    var email = document.getElementById('email');
    var phone = document.getElementById('phone');
    
    if (username) username.value = currentUser.username || '';
    if (fullName) fullName.value = currentUser.name || '';
    if (email) email.value = currentUser.email || '';
    if (phone) phone.value = currentUser.phone || '';
}

function showSection(section) {
    // Ẩn tất cả sections
    var sections = document.querySelectorAll('.content-section');
    sections.forEach(function(s) {
        s.style.display = 'none';
    });
    
    // Cập nhật active menu
    var menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(function(item) {
        item.classList.remove('active');
    });
    
    // Hiện section được chọn
    var sectionTitle = document.getElementById('sectionTitle');
    var sectionSubtitle = document.getElementById('sectionSubtitle');
    
    if (section === 'info') {
        document.getElementById('info-section').style.display = 'block';
        if (sectionTitle) sectionTitle.textContent = 'Thông tin cá nhân';
        if (sectionSubtitle) sectionSubtitle.textContent = 'Quản lý thông tin tài khoản của bạn';
    } else if (section === 'bookings') {
        document.getElementById('bookings-section').style.display = 'block';
        if (sectionTitle) sectionTitle.textContent = 'Đặt phòng của tôi';
        if (sectionSubtitle) sectionSubtitle.textContent = 'Theo dõi đặt phòng và lịch sử khách sạn của bạn';
    }
    
    return false;
}

function loadBookings() {
    if (!currentUser) return;
    
    // Lấy tất cả bookings từ localStorage
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Lọc bookings của user hiện tại
    allBookings = bookings.filter(function(booking) {
        return booking.userId === currentUser.id || 
               booking.userId === currentUser.username ||
               booking.customerId === currentUser.id ||
               booking.customerId === currentUser.username ||
               booking.email === currentUser.email ||
               booking.email === currentUser.username;
    });
    
    // Sắp xếp theo ngày đặt mới nhất
    allBookings.sort(function(a, b) {
        var dateA = new Date(a.bookingDate || a.createdAt || 0);
        var dateB = new Date(b.bookingDate || b.createdAt || 0);
        return dateB - dateA;
    });
    
    displayBookings();
}

function displayBookings() {
    var tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    // Lọc theo trạng thái
    var filteredBookings = currentFilter === 'all' 
        ? allBookings 
        : allBookings.filter(function(b) { return b.status === currentFilter; });
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message"><i class="fas fa-inbox"></i><p>Không có đơn hàng nào</p></td></tr>';
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    // Phân trang
    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    var pageBookings = filteredBookings.slice(start, end);
    
    var html = '';
    pageBookings.forEach(function(booking) {
        var statusText = getStatusText(booking.status);
        var statusClass = booking.status || 'pending';
        var paymentMethod = booking.paymentMethod || 'Chưa thanh toán';
        var paymentClass = 'cash';
        if (paymentMethod === 'VNPay') paymentClass = 'vnpay';
        else if (paymentMethod === 'Chuyển khoản') paymentClass = 'bank';
        else if (paymentMethod === 'Chưa thanh toán') paymentClass = 'pending';
        
        var paymentIcon = '<i class="fas fa-money-bill"></i>';
        if (paymentMethod === 'VNPay') paymentIcon = '<i class="fab fa-cc-visa"></i>';
        else if (paymentMethod === 'Chuyển khoản') paymentIcon = '<i class="fas fa-university"></i>';
        else if (paymentMethod === 'Chưa thanh toán') paymentIcon = '<i class="fas fa-clock"></i>';
        
        html += '<tr>';
        html += '<td><strong>#' + booking.id + '</strong></td>';
        html += '<td>' + formatDate(booking.bookingDate || booking.createdAt) + '</td>';
        html += '<td>' + (booking.roomName || booking.room || 'N/A') + '<br><small style="color: #9ca3af;">' + (booking.nights || 1) + ' đêm - ' + (booking.roomType || 'Standard') + '</small></td>';
        html += '<td><small style="color: #6b7280;">' + formatDateShort(booking.checkIn || booking.checkin) + '</small><br><small style="color: #6b7280;">đến ' + formatDateShort(booking.checkOut || booking.checkout) + '</small></td>';
        html += '<td><strong style="color: #dc2626;">' + formatMoney(booking.totalAmount || booking.total || 0) + '</strong></td>';
        html += '<td><span class="payment-badge ' + paymentClass + '">' + paymentIcon + ' ' + paymentMethod + '</span></td>';
        html += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
        html += '<td>';
        html += '<button class="btn-action btn-detail" onclick="viewBookingDetail(\'' + booking.id + '\')"><i class="fas fa-eye"></i> Chi tiết</button>';
        if (booking.status === 'pending' || booking.status === 'confirmed') {
            html += '<button class="btn-action btn-cancel" onclick="cancelBooking(\'' + booking.id + '\')"><i class="fas fa-times"></i> Hủy đơn</button>';
        }
        html += '</td>';
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
    
    // Hiển thị pagination
    document.getElementById('pagination').style.display = 'flex';
    updatePagination(filteredBookings.length);
}

function filterBookings(status) {
    currentFilter = status;
    currentPage = 1;
    
    // Cập nhật active tab
    var tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(function(tab) {
        tab.classList.remove('active');
        if (tab.getAttribute('data-status') === status) {
            tab.classList.add('active');
        }
    });
    
    displayBookings();
}

function updatePagination(totalItems) {
    var currentPageEl = document.getElementById('currentPage');
    var pageSizeEl = document.getElementById('pageSize');
    
    if (currentPageEl) {
        currentPageEl.textContent = totalItems;
    }
    
    if (pageSizeEl) {
        pageSizeEl.textContent = itemsPerPage;
    }
}

function changePage(direction) {
    var filteredBookings = currentFilter === 'all' 
        ? allBookings 
        : allBookings.filter(function(b) { return b.status === currentFilter; });
    
    var totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    
    if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    }
    
    displayBookings();
}

function viewBookingDetail(bookingId) {
    var booking = allBookings.find(function(b) { return b.id == bookingId; });
    
    if (!booking) {
        alert('Không tìm thấy đơn hàng!');
        return;
    }
    
    var html = '';
    
    // Mã đơn hàng
    html += '<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 25px;">';
    html += '<div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 5px;">Mã đơn hàng</div>';
    html += '<div style="font-size: 2rem; font-weight: bold;">#' + booking.id + '</div>';
    html += '</div>';
    
    // Thông tin phòng
    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-hotel"></i> Thông tin phòng</h3>';
    html += '<div class="detail-row"><span class="detail-label">Tên phòng:</span><span class="detail-value">' + (booking.roomName || booking.room || 'N/A') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Loại phòng:</span><span class="detail-value">' + (booking.roomType || booking.type || 'Standard') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Ngày nhận phòng:</span><span class="detail-value">' + formatDate(booking.checkIn || booking.checkin) + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Ngày trả phòng:</span><span class="detail-value">' + formatDate(booking.checkOut || booking.checkout) + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Số đêm:</span><span class="detail-value">' + (booking.nights || 1) + ' đêm</span></div>';
    html += '</div>';
    
    // Thông tin khách hàng
    var customerInfo = booking.customerInfo || {};
    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-user"></i> Thông tin khách hàng</h3>';
    html += '<div class="detail-row"><span class="detail-label">Họ tên:</span><span class="detail-value">' + (customerInfo.hoTen || booking.customer || 'N/A') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">' + (customerInfo.email || booking.email || 'N/A') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Số điện thoại:</span><span class="detail-value">' + (customerInfo.soDienThoai || booking.phone || 'N/A') + '</span></div>';
    if (customerInfo.cmnd) {
        html += '<div class="detail-row"><span class="detail-label">CMND/CCCD:</span><span class="detail-value">' + customerInfo.cmnd + '</span></div>';
    }
    html += '</div>';
    
    // Thông tin thanh toán
    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-credit-card"></i> Thông tin thanh toán</h3>';
    html += '<div class="detail-row"><span class="detail-label">Phương thức:</span><span class="detail-value">' + (booking.paymentMethod || 'Tiền mặt') + '</span></div>';
    html += '<div class="detail-row"><span class="detail-label">Trạng thái:</span><span class="detail-value"><span class="status-badge ' + (booking.status || 'pending') + '">' + getStatusText(booking.status) + '</span></span></div>';
    html += '<div class="detail-total">';
    html += '<div class="detail-row"><span class="detail-label" style="font-size: 1.1rem;">Tổng tiền:</span><span class="detail-value">' + formatMoney(booking.totalAmount || booking.total || 0) + '</span></div>';
    html += '</div>';
    html += '</div>';
    
    document.getElementById('bookingDetailContent').innerHTML = html;
    document.getElementById('bookingDetailModal').classList.add('show');
}

function closeModal() {
    document.getElementById('bookingDetailModal').classList.remove('show');
}

function cancelBooking(bookingId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        return;
    }
    
    var bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    var index = bookings.findIndex(function(b) { return b.id == bookingId; });
    
    if (index !== -1) {
        bookings[index].status = 'cancelled';
        bookings[index].cancelledTime = new Date().toISOString();
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        alert('Đã hủy đơn hàng thành công!');
        loadBookings();
    } else {
        alert('Không tìm thấy đơn hàng!');
    }
}

function enableEditMode() {
    var inputs = document.querySelectorAll('#profileForm input:not(#username)');
    inputs.forEach(function(input) {
        input.disabled = false;
    });
    
    document.querySelector('.form-actions').style.display = 'flex';
}

function cancelEditMode() {
    var inputs = document.querySelectorAll('#profileForm input');
    inputs.forEach(function(input) {
        input.disabled = true;
    });
    
    document.querySelector('.form-actions').style.display = 'none';
    loadProfileForm();
}

// Xử lý form cập nhật thông tin
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    var fullName = document.getElementById('fullName').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();
    
    // Cập nhật thông tin
    var customers = JSON.parse(localStorage.getItem('customers') || '[]');
    var index = customers.findIndex(function(c) { 
        return c.id === currentUser.id || c.username === currentUser.username;
    });
    
    if (index !== -1) {
        customers[index].name = fullName;
        customers[index].email = email;
        customers[index].phone = phone;
        
        localStorage.setItem('customers', JSON.stringify(customers));
        currentUser = customers[index];
        
        // Cập nhật vào currentUser
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        alert('Cập nhật thông tin thành công!');
        loadUserInfo();
        cancelEditMode();
    }
});

// Xử lý form đổi mật khẩu
document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    var currentPassword = document.getElementById('currentPassword').value;
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    
    // Kiểm tra mật khẩu hiện tại
    if (currentPassword !== currentUser.password) {
        alert('Mật khẩu hiện tại không đúng!');
        return;
    }
    
    // Kiểm tra mật khẩu mới
    if (newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }
    
    // Cập nhật mật khẩu
    var customers = JSON.parse(localStorage.getItem('customers') || '[]');
    var index = customers.findIndex(function(c) { 
        return c.id === currentUser.id || c.username === currentUser.username;
    });
    
    if (index !== -1) {
        customers[index].password = newPassword;
        localStorage.setItem('customers', JSON.stringify(customers));
        
        alert('Đổi mật khẩu thành công!');
        document.getElementById('passwordForm').reset();
    }
});

// dangXuat đã được chuyển sang common.js

function getStatusText(status) {
    var statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'checkedin': 'Đang ở',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
}

function formatMoney(amount) {
    if (!amount) return '0đ';
    var num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount;
    return num.toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    
    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return day + '/' + month;
}

// Đóng modal khi click overlay
document.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById('bookingDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
    }
});

