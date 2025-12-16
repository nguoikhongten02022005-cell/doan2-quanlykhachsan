
function checkLoginStatus() {
    var currentUserStr = localStorage.getItem('currentUser');
    var nutDangNhap = document.getElementById('nutDangNhap');
    var userDropdown = document.getElementById('userDropdown');
    var userName = document.getElementById('userName');
    
    if (!nutDangNhap || !userDropdown) return;
    
    if (currentUserStr) {
        try {
            var userData = JSON.parse(currentUserStr);
            
            // --- ĐOẠN CODE MỚI THÊM VÀO ---
            // Lấy dữ liệu mới nhất từ danh sách gốc (customers hoặc accounts)
            var customers = JSON.parse(localStorage.getItem('customers') || '[]');
            var admins = JSON.parse(localStorage.getItem('accounts') || '[]');
            var allUsers = customers.concat(admins);
            
            // Tìm user hiện tại trong danh sách gốc bằng ID hoặc Username
            var freshUser = null;
            for (var i = 0; i < allUsers.length; i++) {
                if (allUsers[i].username === userData.username) {
                    freshUser = allUsers[i];
                    break;
                }
            }

            // Nếu tìm thấy, cập nhật lại thông tin từ dữ liệu mới nhất
            if (freshUser) {
                // Cập nhật các thông tin quan trọng từ dữ liệu gốc
                userData.name = freshUser.name || userData.name;
                userData.email = freshUser.email || userData.email;
                userData.role = freshUser.role || userData.role;
                // Lưu ngược lại để đồng bộ
                localStorage.setItem('currentUser', JSON.stringify(userData));
            }
            // --- HẾT ĐOẠN CODE MỚI ---
            
            // Đã đăng nhập - ẩn nút đăng nhập, HIỆN dropdown
            nutDangNhap.style.display = 'none';
            userDropdown.style.display = 'flex';
            if (userName) {
                // Hiển thị tên mới nhất (được cập nhật từ dữ liệu gốc)
                userName.textContent = userData.name || userData.username || 'User';
            }
        } catch (e) {
            // Lỗi parse data - reset vị trí đăng nhập
            sessionStorage.clear();
            localStorage.removeItem('currentUser');
            nutDangNhap.style.display = 'flex';
            userDropdown.style.display = 'none';
        }
    } else {
        // Chưa đăng nhập - HIỆN nút đăng nhập, ẩn dropdown
        nutDangNhap.style.display = 'flex';
        userDropdown.style.display = 'none';
    }
}



// --- ensureAuthenticated: kiểm tra đăng nhập, nếu chưa thì chuyển tới login ---
function ensureAuthenticated(options = {}) {
    try {
        var currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                return JSON.parse(currentUserStr);
            } catch (e) {
                console.warn('Lỗi parse currentUser:', e);
            }
        }
    } catch (e) {
        console.warn('Lỗi đọc currentUser:', e);
    }

    // Nếu chưa đăng nhập, hỏi và điều hướng tới login với returnUrl
    var message = options.message || 'Bạn cần đăng nhập để tiếp tục. Chuyển đến trang đăng nhập?';
    if (confirm(message)) {
        var returnUrl = options.returnUrl || window.location.href;
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(returnUrl);
    }
    return null;
}

function getCurrentUserData() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
        return null;
    }
}

// Lắng nghe khi localStorage thay đổi (ví dụ: đăng nhập ở tab popup hoặc tab khác)
window.addEventListener('storage', function (e) {
    if (e.key === 'currentUser' || e.key === 'authToken' || e.key === 'bookings') {
        try {
            if (typeof checkLoginStatus === 'function') checkLoginStatus();
        } catch (err) {
            console.warn('Lỗi khi cập nhật trạng thái đăng nhập sau storage event:', err);
        }
        try {
            if (typeof capNhatTomTatDonHang === 'function') capNhatTomTatDonHang();
        } catch (err) {
            // ignore
        }
    }
});

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
        // Nếu không có adults/children, thì parse từ capacity
        roomOrCapacity = roomOrCapacity.capacity;
    }
    
    // Xử lý capacity dạng string (dữ liệu cũ)
    if (!roomOrCapacity) return { adults: 2, children: 0 };
    var cap = roomOrCapacity.toString().toLowerCase();
    var adultsMatch = cap.match(/(\d+)\s*(?:người\s*lớn|nguoi\s*lon|adults?)/i);
    var childrenMatch = cap.match(/(\d+)\s*(?:trẻ\s*em|tre\s*em|children?|kids?)/i);
    return {
        adults: adultsMatch ? parseInt(adultsMatch[1]) : 2,
        children: childrenMatch ? parseInt(childrenMatch[1]) : 0
    };
}

// Hàm format Giá tiền
function formatPrice(price) {
    if (!price) return '0 đ';
    var priceNum = parseInt(price.toString().replace(/\D/g, '')) || 0;
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

// Hàm chuẩn hóa ngày tháng (reset giờ về 0 để so sánh chính xác)
function normalizeDate(dateInput) {
    if (!dateInput) return null;
    var d = new Date(dateInput);
    // Reset giờ về 0 để so sánh chính xác
    d.setHours(0, 0, 0, 0);
    return d;
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
    alert('Cảm ơn bạn đã đăng ký newsletter!\nChúng tôi sẽ gửi ưu đãi tới ' + email);
    
    // Reset form
    emailInput.value = '';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.background = '#10b981';
}

// Toggle hiển/ẩn mật khẩu (dùng chung)
function setupPasswordToggle(container = document) {
    var toggleButtons = container.querySelectorAll('.nut-hien-mk');
    
    for (var i = 0; i < toggleButtons.length; i++) {
        toggleButtons[i].addEventListener('click', function() {
            var targetId = this.getAttribute('data-target');
            var passwordInput = document.getElementById(targetId);
            var icon = this.querySelector('i');
            
            if (!passwordInput) return;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
            } else {
                passwordInput.type = 'password';
                if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
            }
        });
    }
}

// Global error handlers for easier debugging
window.addEventListener('error', function(e) {
    try { console.error('Global error:', e.error || e.message || e); } catch(_){}
});
window.addEventListener('unhandledrejection', function(e) {
    try { console.error('Unhandled rejection:', e.reason || e); } catch(_){}
});

// Helper for dev: dump bookings
function dumpBookings() {
    try {
        console.log('localStorage.bookings:', localStorage.getItem('bookings'));
        if (window.storageService && typeof window.storageService.getBookings === 'function') {
            console.log('storageService.getBookings():', storageService.getBookings());
        }
    } catch (e) { console.warn(e); }
}

/* ==============================================
   KHỞI TẠO DỮ LIỆU MẪU (CHẠY 1 LẦN DUY NHẤT)
   ============================================== */
function khoiTaoDuLieuHeThong() {
    // 1. Khởi tạo danh sách Phòng (12 phòng mẫu)
    if (!localStorage.getItem('rooms')) {
        var sampleRooms = [
            {
                id: 1, name: 'Phòng The Peak Suite', type: 'Suite', price: 500000,
                capacity: '4 người lớn, 2 trẻ em', floor: '15', hotel: 'QuickStay Hotel Suite',
                description: 'Phòng hiện đại, tiện nghi đầy đủ, phù hợp cho chuyến nghỉ dưỡng thoải mái.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc',
                image: '../img/khachsan1(1).jpg', status: 'available',
                images: ['../img/khachsan1(1).jpg', '../img/khachsan1(2).jpg', '../img/khachsan1(3).jpg', '../img/khachsan1(4).jpg', '../img/khachsan1(5).jpg']
            },
            {
                id: 2, name: 'Phòng Genesis Luxury Royal Suite', type: 'VIP', price: 800000,
                capacity: '6 người lớn, 3 trẻ em', floor: '20', hotel: 'QuickStay Hotel VIP',
                description: 'Phòng Genesis Luxury Royal Suite với không gian sang trọng và view thành phố tuyệt đẹp.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, Phòng tắm jacuzzi',
                image: '../img/khachsan2(1).jpg', status: 'available',
                images: ['../img/khachsan2(1).jpg', '../img/khachsan2(2).jpg', '../img/khachsan2(3).jpg', '../img/khachsan2(4).jpg', '../img/khachsan2(5).jpg']
            },
            {
                id: 3, name: 'Phòng Modern Deluxe', type: 'Deluxe', price: 350000,
                capacity: '3 người lớn, 1 trẻ em', floor: '10', hotel: 'QuickStay Hotel Deluxe',
                description: 'Phòng Modern Deluxe với thiết kế hiện đại, không gian thoáng mát và tiện nghi đầy đủ.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Tủ quần áo',
                image: '../img/khachsan3(1).jpg', status: 'available',
                images: ['../img/khachsan3(1).jpg', '../img/khachsan3(2).jpg', '../img/khachsan3(3).jpg', '../img/khachsan3(4).jpg', '../img/khachsan3(5).jpg']
            },
            {
                id: 4, name: 'Phòng The Song Premium Apartment', type: 'Premium', price: 600000,
                capacity: '4 người lớn, 2 trẻ em', floor: '18', hotel: 'QuickStay Hotel Premium',
                description: 'Phòng The Song Premium Apartment với view sông tuyệt đẹp, không gian sang trọng và tiện nghi cao cấp.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View sông, Phòng khách riêng',
                image: '../img/khachsan4(1).jpg', status: 'available',
                images: ['../img/khachsan4(1).jpg', '../img/khachsan4(2).jpg', '../img/khachsan4(3).jpg', '../img/khachsan4(4).jpg', '../img/khachsan4(5).jpg']
            },
            {
                id: 5, name: 'Phòng Luxury Premium', type: 'Premium', price: 450000,
                capacity: '3 người lớn, 2 trẻ em', floor: '16', hotel: 'QuickStay Hotel Premium',
                description: 'Phòng Luxury Premium với thiết kế hiện đại, không gian sang trọng và tiện nghi cao cấp.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố',
                image: '../img/khachsan5(1).jpg', status: 'available',
                images: ['../img/khachsan5(1).jpg', '../img/khachsan5(2).jpg', '../img/khachsan5(3).jpg', '../img/khachsan5(4).jpg', '../img/khachsan5(5).jpg']
            },
            {
                id: 6, name: 'Phòng Modern Executive', type: 'Executive', price: 550000,
                capacity: '4 người lớn, 2 trẻ em', floor: '22', hotel: 'QuickStay Hotel Executive',
                description: 'Phòng Modern Executive với thiết kế tối giản, không gian rộng rãi và view thành phố tuyệt đẹp.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, Phòng khách riêng',
                image: '../img/khachsan6(1).jpg', status: 'available',
                images: ['../img/khachsan6(1).jpg', '../img/khachsan6(2).jpg', '../img/khachsan6(3).jpg', '../img/khachsan6(4).jpg', '../img/khachsan6(5).jpg']
            },
            {
                id: 7, name: 'Phòng Royal Palace', type: 'Royal', price: 700000,
                capacity: '5 người lớn, 3 trẻ em', floor: '25', hotel: 'QuickStay Hotel Royal',
                description: 'Phòng Royal Palace với thiết kế sang trọng, không gian rộng rãi và tiện nghi cao cấp nhất.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố, Phòng khách riêng, Butler service',
                image: '../img/khachsan7(1).jpg', status: 'available',
                images: ['../img/khachsan7(1).jpg', '../img/khachsan7(2).jpg', '../img/khachsan7(3).jpg', '../img/khachsan7(4).jpg']
            },
            {
                id: 8, name: 'Phòng Luxury Penthouse', type: 'Penthouse', price: 900000,
                capacity: '6 người lớn, 4 trẻ em', floor: '30', hotel: 'QuickStay Hotel Penthouse',
                description: 'Phòng Luxury Penthouse với thiết kế tối giản hiện đại, không gian rộng rãi và view toàn cảnh thành phố.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View toàn cảnh, Phòng khách riêng, Butler service, Thang máy riêng',
                image: '../img/khachsan8(1).jpg', status: 'available',
                images: ['../img/khachsan8(1).jpg', '../img/khachsan8(2).jpg', '../img/khachsan8(3).jpg', '../img/khachsan8(4).jpg', '../img/khachsan8(5).jpg']
            },
            {
                id: 9, name: 'Phòng Modern Studio', type: 'Studio', price: 320000,
                capacity: '2 người lớn, 1 trẻ em', floor: '8', hotel: 'QuickStay Hotel Studio',
                description: 'Phòng Modern Studio với thiết kế tối giản, không gian thoải mái và tiện nghi hiện đại phù hợp cho khách du lịch.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Điều hòa, Bàn làm việc, Tủ quần áo, Mini kitchen',
                image: '../img/khachsan9(1).jpg', status: 'available',
                images: ['../img/khachsan9(1).jpg', '../img/khachsan9(2).jpg', '../img/khachsan9(3).jpg', '../img/khachsan9(4).jpg', '../img/khachsan9(5).jpg']
            },
            {
                id: 10, name: 'Phòng Executive Deluxe', type: 'Deluxe', price: 480000,
                capacity: '4 người lớn, 2 trẻ em', floor: '14', hotel: 'QuickStay Hotel Executive',
                description: 'Phòng Executive Deluxe với thiết kế sang trọng, không gian rộng rãi và tiện nghi cao cấp phù hợp cho khách doanh nhân.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố, Phòng khách riêng, Butler service',
                image: '../img/khachsan10(1).jpg', status: 'available',
                images: ['../img/khachsan10(1).jpg', '../img/khachsan10(2).jpg', '../img/khachsan10(3).jpg', '../img/khachsan10(4).jpg', '../img/khachsan10(5).jpg']
            },
            {
                id: 11, name: 'Phòng Comfort Studio', type: 'Studio', price: 280000,
                capacity: '2 người lớn, 1 trẻ em', floor: '6', hotel: 'QuickStay Hotel Comfort',
                description: 'Phòng Comfort Studio với thiết kế ấm cúng, không gian thoải mái và tiện nghi cơ bản phù hợp cho khách du lịch ngắn hạn.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Điều hòa, Bàn làm việc, Tủ quần áo, Mini kitchen, Máy giặt',
                image: '../img/khachsan11(1).jpg', status: 'available',
                images: ['../img/khachsan11(1).jpg', '../img/khachsan11(2).jpg', '../img/khachsan11(3).jpg', '../img/khachsan11(4).jpg', '../img/khachsan11(5).jpg']
            },
            {
                id: 12, name: 'Phòng City View Deluxe', type: 'Deluxe', price: 420000,
                capacity: '3 người lớn, 1 trẻ em', floor: '12', hotel: 'QuickStay Hotel City',
                description: 'Phòng City View Deluxe với view thành phố tuyệt đẹp, thiết kế sang trọng và tiện nghi cao cấp.',
                amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố, Phòng khách riêng, City view',
                image: '../img/khachsan12(1).jpg', status: 'available',
                images: ['../img/khachsan12(1).jpg', '../img/khachsan12(2).jpg', '../img/khachsan12(3).jpg', '../img/khachsan12(4).jpg', '../img/khachsan12(5).jpg']
            }
        ];
        localStorage.setItem('rooms', JSON.stringify(sampleRooms));
        console.log('Đã khởi tạo dữ liệu Phòng mẫu.');
    }

    // 2. Khởi tạo Tiện nghi
    if (!localStorage.getItem('amenities')) {
        var demoAmenities = [
            { id: 1, name: 'Wifi miễn phí', description: 'Wifi tốc độ cao miễn phí' },
            { id: 2, name: 'TV màn hình phẳng', description: 'TV LCD 42 inch' },
            { id: 3, name: 'Điều hòa', description: 'Điều hòa 2 chiều' },
            { id: 4, name: 'Minibar', description: 'Tủ lạnh mini với đồ uống' },
            { id: 5, name: 'Bàn làm việc', description: 'Bàn làm việc hiện đại' }
        ];
        localStorage.setItem('amenities', JSON.stringify(demoAmenities));
        console.log('Đã khởi tạo dữ liệu Tiện nghi mẫu.');
    }

    // 3. Khởi tạo Mã giảm giá
    if (!localStorage.getItem('promotions')) {
        var today = new Date();
        var nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        var nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);
        
        var samplePromotions = [
            {
                id: 1, code: 'SUMMER2025', discountType: 'percent', discountValue: 20,
                maxDiscount: 2000000, minAmount: 1000000,
                startDate: today.toISOString().split('T')[0], endDate: nextYear.toISOString().split('T')[0],
                maxUses: 100, usedCount: 0, description: 'Giảm 20% cho đơn hàng từ 1 triệu'
            },
            {
                id: 2, code: 'FLASHSALE15', discountType: 'percent', discountValue: 15,
                maxDiscount: 1500000, minAmount: 500000,
                startDate: today.toISOString().split('T')[0], endDate: nextMonth.toISOString().split('T')[0],
                maxUses: 200, usedCount: 0, description: 'Flash Sale - Giảm 15% cho đơn từ 500k'
            }
        ];
        localStorage.setItem('promotions', JSON.stringify(samplePromotions));
        console.log('Đã khởi tạo Mã giảm giá mẫu.');
    }

    // 4. Khởi tạo Tài khoản Admin và Khách hàng mẫu
    var accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    var hasAdmin = false;
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].role === 'admin') {
            hasAdmin = true;
            break;
        }
    }
    
    if (!hasAdmin) {
        accounts.push({
            id: Date.now(), username: 'admin', password: '1',
            email: 'admin@quickstay.com', role: 'admin', status: 'active',
            name: 'Administrator'
        });
        localStorage.setItem('accounts', JSON.stringify(accounts));
        console.log('Đã khởi tạo tài khoản Admin (admin/1).');
    }
}

// Tự động chạy hàm này khi file script được load
khoiTaoDuLieuHeThong();
