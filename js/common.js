// ============================================
// FILE CHUNG - Các hàm dùng chung cho toàn bộ website
// ============================================

// Hàm lấy thông tin người dùng hiện tại (có kiểm tra token)
function getCurrentUserData() {
    var currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;

    try {
        var userData = JSON.parse(currentUser);
        var sessionToken = localStorage.getItem('authToken');

        // Tự động tạo token giả lập nếu chưa có (phục vụ kiểm tra đăng nhập)
        if (!sessionToken) {
            sessionToken = 'token-' + Date.now();
            localStorage.setItem('authToken', sessionToken);
        }

        if (!userData.sessionToken) {
            userData.sessionToken = sessionToken;
            localStorage.setItem('currentUser', JSON.stringify(userData));
        }

        return userData;
    } catch (e) {
        sessionStorage.clear();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return null;
    }
}

// Kiểm tra đăng nhập, nếu chưa thì hỏi chuyển hướng sang trang login
function ensureAuthenticated(options) {
    var user = getCurrentUserData();
    var token = localStorage.getItem('authToken');

    if (user && token) return user;

    // Nếu thiếu token nhưng đã có user, tạo mới token để tiếp tục
    if (user && !token) {
        var newToken = 'token-' + Date.now();
        localStorage.setItem('authToken', newToken);
        user.sessionToken = newToken;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    if (options && options.redirect === false) return null;

    var message = (options && options.message) || 'Bạn cần đăng nhập để tiếp tục. Chuyển đến trang đăng nhập?';
    if (confirm(message)) {
        var returnUrl = options && options.returnUrl ? options.returnUrl : window.location.href;
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(returnUrl);
    }
    return null;
}

// Hàm kiểm tra trạng thái đăng nhập và cập nhật UI
function checkLoginStatus() {
    var userData = getCurrentUserData();
    var nutDangNhap = document.getElementById('nutDangNhap');
    var userDropdown = document.getElementById('userDropdown');
    var userName = document.getElementById('userName');

    if (!nutDangNhap || !userDropdown) return;

    if (userData) {
        // Đã đăng nhập - ẨN nút đăng nhập, HIỆN dropdown
        nutDangNhap.style.display = 'none';
        userDropdown.style.display = 'flex';
        if (userName) {
            // Ưu tiên hiển thị name (họ tên đầy đủ)
            userName.textContent = userData.name || userData.username || 'User';
        }
    } else {
        // Chưa đăng nhập - HIỆN nút đăng nhập, ẨN dropdown
        nutDangNhap.style.display = 'flex';
        userDropdown.style.display = 'none';
    }
}

// Toggle user menu dropdown
function toggleUserMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    var menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.toggle('show');
}

// Đăng xuất
function dangXuat(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        sessionStorage.clear();
        localStorage.removeItem('userLogin');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    }
    return false;
}

// Đóng menu khi click bên ngoài
document.addEventListener('click', function(e) {
    var userDropdown = document.getElementById('userDropdown');
    if (!userDropdown || userDropdown.contains(e.target)) return;
    
    var menu = document.getElementById('userDropdownMenu');
    var btn = document.querySelector('.user-dropdown-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');
});

// Khởi tạo menu di động (hamburger menu)
function khoiTaoMenuDiDong() {
    var hamburgerBtn = document.getElementById('nutMenu');
    var mobileMenu = document.getElementById('menuDiDong');
    var mobileOverlay = document.getElementById('nenDiDong');
    var mobileCloseBtn = document.getElementById('dongMenu');
    
    if (!hamburgerBtn || !mobileMenu) return;
    
    hamburgerBtn.addEventListener('click', function() {
        mobileMenu.classList.add('active');
        if (mobileOverlay) {
            mobileOverlay.classList.add('active');
            mobileOverlay.style.display = 'block';
        }
        mobileMenu.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
            mobileOverlay.style.display = 'none';
        }
        document.body.style.overflow = '';
        setTimeout(function() {
            mobileMenu.style.display = 'none';
        }, 300);
    }
    
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);
    
    // Đóng menu khi click vào link
    var mobileLinks = document.querySelectorAll('.lien-ket-menu-di-dong a');
    for (var i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].addEventListener('click', closeMobileMenu);
    }
}

// Hàm parse capacity từ string hoặc object
function parseCapacity(roomOrCapacity) {
    // Nếu là object (room), kiểm tra adults và children trực tiếp
    if (typeof roomOrCapacity === 'object' && roomOrCapacity !== null) {
        if (roomOrCapacity.adults !== undefined && roomOrCapacity.children !== undefined) {
            return {
                adults: parseInt(roomOrCapacity.adults) || 2,
                children: parseInt(roomOrCapacity.children) || 0
            };
        }
        // Nếu không có adults/children, thử parse từ capacity
        roomOrCapacity = roomOrCapacity.capacity;
    }
    
    // Xử lý capacity dạng string (dữ liệu cũ)
    if (!roomOrCapacity) return { adults: 2, children: 0 };
    var cap = roomOrCapacity.toString().toLowerCase();
    var adultsMatch = cap.match(/(\d+)\s*(?:người\s*lớn|nguoi\s*lon|adults?)/);
    var childrenMatch = cap.match(/(\d+)\s*(?:trẻ\s*em|tre\s*em|children?|kids?)/);
    return {
        adults: adultsMatch ? parseInt(adultsMatch[1]) : 2,
        children: childrenMatch ? parseInt(childrenMatch[1]) : 0
    };
}

// Hàm format giá tiền
function formatPrice(price) {
    if (!price) return '0 đ';
    var priceNum = parseInt(price.toString().replace(/\D/g, ''));
    return new Intl.NumberFormat('vi-VN').format(priceNum) + ' đ';
}

// Hàm format ngày tháng
function formatDate(date) {
    if (!date) return '';
    var d = new Date(date);
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;
    return day + '/' + month + '/' + year;
}

// Hàm xử lý đăng ký newsletter (footer)
function handleNewsletter(btn) {
    var emailInput = document.getElementById('newsletterEmail');
    if (!emailInput || !emailInput.value.trim()) {
        alert('Vui lòng nhập email!');
        return;
    }
    
    var email = emailInput.value.trim();
    if (!isValidEmail(email)) {
        alert('Email không hợp lệ!');
        return;
    }
    
    // Simulate gửi email (localStorage hoặc console)
    console.log('Newsletter signup:', email);
    alert('Cảm ơn bạn đã đăng ký newsletter!\\nChúng tôi sẽ gửi ưu đãi đặc biệt đến ' + email);
    
    // Reset form
    emailInput.value = '';
    btn.disabled = true;
    btn.innerHTML = '&lt;i class="fas fa-check"&gt;&lt;/i&gt;';
    btn.style.background = '#10b981';
}

