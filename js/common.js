// ============================================
// FILE CHUNG - Các hàm dùng chung cho toàn b? website
// ============================================

// Hàm ki?m tra tr?ng thái ðãng nh?p và c?p nh?t UI
function checkLoginStatus() {
    var currentUserStr = localStorage.getItem('currentUser');
    var nutDangNhap = document.getElementById('nutDangNhap');
    var userDropdown = document.getElementById('userDropdown');
    var userName = document.getElementById('userName');
    
    if (!nutDangNhap || !userDropdown) return;
    
    if (currentUserStr) {
        try {
            var userData = JSON.parse(currentUserStr);
            
            // --- ÐO?N CODE M?I THÊM VÀO ---
            // L?y d? li?u m?i nh?t t? danh sách g?c (customers ho?c accounts)
            var customers = JSON.parse(localStorage.getItem('customers') || '[]');
            var admins = JSON.parse(localStorage.getItem('accounts') || '[]');
            var allUsers = customers.concat(admins);
            
            // T?m user hi?n t?i trong danh sách g?c b?ng ID ho?c Username
            var freshUser = null;
            for (var i = 0; i < allUsers.length; i++) {
                if (allUsers[i].username === userData.username) {
                    freshUser = allUsers[i];
                    break;
                }
            }

            // N?u t?m th?y, c?p nh?t l?i thông tin t? d? li?u m?i nh?t
            if (freshUser) {
                // C?p nh?t các thông tin quan tr?ng t? d? li?u g?c
                userData.name = freshUser.name || userData.name;
                userData.email = freshUser.email || userData.email;
                userData.role = freshUser.role || userData.role;
                // Lýu ngý?c l?i ð? ð?ng b?
                localStorage.setItem('currentUser', JSON.stringify(userData));
            }
            // --- H?T ÐO?N CODE M?I ---
            
            // Ð? ðãng nh?p - ?N nút ðãng nh?p, HI?N dropdown
            nutDangNhap.style.display = 'none';
            userDropdown.style.display = 'flex';
            if (userName) {
                // Hi?n th? tên m?i nh?t (ð? ðý?c c?p nh?t t? d? li?u g?c)
                userName.textContent = userData.name || userData.username || 'User';
            }
        } catch (e) {
            // L?i parse data - reset v? chýa ðãng nh?p
            sessionStorage.clear();
            localStorage.removeItem('currentUser');
            nutDangNhap.style.display = 'flex';
            userDropdown.style.display = 'none';
        }
    } else {
        // Chýa ðãng nh?p - HI?N nút ðãng nh?p, ?N dropdown
        nutDangNhap.style.display = 'flex';
        userDropdown.style.display = 'none';
    }
}



// --- ensureAuthenticated: ki?m tra ðãng nh?p, n?u chýa th? chuy?n t?i login ---
function ensureAuthenticated(options) {`r`n    // X? l? tham s? options ð? týõng thích v?i tr?nh duy?t c?`r`n    options = options || {};
    try {
        var currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                return JSON.parse(currentUserStr);
            } catch (e) {
                console.warn('L?i parse currentUser:', e);
            }
        }
    } catch (e) {
        console.warn('L?i ð?c currentUser:', e);
    }

    // N?u chýa ðãng nh?p, h?i và ði?u hý?ng t?i login v?i returnUrl
    var message = options.message || 'B?n c?n ðãng nh?p ð? ti?p t?c. Chuy?n ð?n trang ðãng nh?p?';
    if (confirm(message)) {
        var returnUrl = options.returnUrl || window.location.href;
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(returnUrl);
    }
    return null;
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

// Ðãng xu?t
function dangXuat(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (confirm('B?n có ch?c ch?n mu?n ðãng xu?t?')) {
        sessionStorage.clear();
        localStorage.removeItem('userLogin');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
    return false;
}

// Ðóng menu khi click bên ngoài
document.addEventListener('click', function(e) {
    var userDropdown = document.getElementById('userDropdown');
    if (!userDropdown || userDropdown.contains(e.target)) return;
    
    var menu = document.getElementById('userDropdownMenu');
    var btn = document.querySelector('.user-dropdown-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');
});

// Kh?i t?o menu di ð?ng (hamburger menu)
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
    
    // Ðóng menu khi click vào link
    var mobileLinks = document.querySelectorAll('.lien-ket-menu-di-dong a');
    for (var i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].addEventListener('click', closeMobileMenu);
    }
}

// Hàm parse capacity t? string ho?c object
function parseCapacity(roomOrCapacity) {
    // N?u là object (room), ki?m tra adults và children tr?c ti?p
    if (typeof roomOrCapacity === 'object' && roomOrCapacity !== null) {
        if (roomOrCapacity.adults !== undefined && roomOrCapacity.children !== undefined) {
            return {
                adults: parseInt(roomOrCapacity.adults) || 2,
                children: parseInt(roomOrCapacity.children) || 0
            };
        }
        // N?u không có adults/children, th? parse t? capacity
        roomOrCapacity = roomOrCapacity.capacity;
    }
    
    // X? l? capacity d?ng string (d? li?u c?)
    if (!roomOrCapacity) return { adults: 2, children: 0 };
    var cap = roomOrCapacity.toString().toLowerCase();
    var adultsMatch = cap.match(/(\d+)\s*(?:ngý?i\s*l?n|nguoi\s*lon|adults?)/);
    var childrenMatch = cap.match(/(\d+)\s*(?:tr?\s*em|tre\s*em|children?|kids?)/);
    return {
        adults: adultsMatch ? parseInt(adultsMatch[1]) : 2,
        children: childrenMatch ? parseInt(childrenMatch[1]) : 0
    };
}

// Hàm format giá ti?n
function formatPrice(price) {
    if (!price) return '0 ð';
    var priceNum = parseInt(price.toString().replace(/\D/g, ''));
    return new Intl.NumberFormat('vi-VN').format(priceNum) + ' ð';
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

// Hàm chu?n hóa ngày tháng (reset gi? v? 0 ð? so sánh chính xác)
function normalizeDate(dateInput) {
    if (!dateInput) return null;
    var d = new Date(dateInput);
    // Reset gi? v? 0 ð? so sánh chính xác
    d.setHours(0, 0, 0, 0);
    return d;
}

// Hàm x? l? ðãng k? newsletter (footer)
function handleNewsletter(btn) {
    var emailInput = document.getElementById('newsletterEmail');
    if (!emailInput || !emailInput.value.trim()) {
        alert('Vui l?ng nh?p email!');
        return;
    }
    
    var email = emailInput.value.trim();
    if (!isValidEmail(email)) {
        alert('Email không h?p l?!');
        return;
    }
    
    // Simulate g?i email (localStorage ho?c console)
    console.log('Newsletter signup:', email);
    alert('C?m õn b?n ð? ðãng k? newsletter!\\nChúng tôi s? g?i ýu ð?i ð?c bi?t ð?n ' + email);
    
    // Reset form
    emailInput.value = '';
    btn.disabled = true;
    btn.innerHTML = '&lt;i class="fas fa-check"&gt;&lt;/i&gt;';
    btn.style.background = '#10b981';
}

// Toggle hi?n/?n m?t kh?u (dùng chung)
function setupPasswordToggle(container = document) {
    var toggleButtons = container.querySelectorAll('.nut-hien-mk');
    
    for (var i = 0; i < toggleButtons.length; i++) {
        toggleButtons[i].addEventListener('click', function() {
            var targetId = this.getAttribute('data-target');
            var passwordInput = document.getElementById(targetId);
            var icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

/* ==============================================
   KH?I T?O D? LI?U M?U (CH?Y 1 L?N DUY NH?T)
   ============================================== */
function khoiTaoDuLieuHeThong() {
    // 1. Kh?i t?o danh sách Ph?ng (12 ph?ng chu?n)
    if (!localStorage.getItem('rooms')) {
        var sampleRooms = [
            {
                id: 1, name: 'Ph?ng The Peak Suite', type: 'Suite', price: 500000,
                capacity: '4 ngý?i l?n, 2 tr? em', floor: '15', hotel: 'QuickStay Hotel Suite',
                description: 'Ph?ng hi?n ð?i, ti?n nghi ð?y ð?, phù h?p cho chuy?n ngh? dý?ng tho?i mái.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c',
                image: '../img/khachsan1(1).jpg', status: 'available',
                images: ['../img/khachsan1(1).jpg', '../img/khachsan1(2).jpg', '../img/khachsan1(3).jpg', '../img/khachsan1(4).jpg', '../img/khachsan1(5).jpg']
            },
            {
                id: 2, name: 'Ph?ng Genesis Luxury Royal Suite', type: 'VIP', price: 800000,
                capacity: '6 ngý?i l?n, 3 tr? em', floor: '20', hotel: 'QuickStay Hotel VIP',
                description: 'Ph?ng Genesis Luxury Royal Suite v?i không gian sang tr?ng và view thành ph? tuy?t ð?p.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, Ph?ng t?m jacuzzi',
                image: '../img/khachsan2(1).jpg', status: 'available',
                images: ['../img/khachsan2(1).jpg', '../img/khachsan2(2).jpg', '../img/khachsan2(3).jpg', '../img/khachsan2(4).jpg', '../img/khachsan2(5).jpg']
            },
            {
                id: 3, name: 'Ph?ng Modern Deluxe', type: 'Deluxe', price: 350000,
                capacity: '3 ngý?i l?n, 1 tr? em', floor: '10', hotel: 'QuickStay Hotel Deluxe',
                description: 'Ph?ng Modern Deluxe v?i thi?t k? hi?n ð?i, không gian tho?i mái và ti?n nghi ð?y ð?.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, T? qu?n áo',
                image: '../img/khachsan3(1).jpg', status: 'available',
                images: ['../img/khachsan3(1).jpg', '../img/khachsan3(2).jpg', '../img/khachsan3(3).jpg', '../img/khachsan3(4).jpg', '../img/khachsan3(5).jpg']
            },
            {
                id: 4, name: 'Ph?ng The Song Premium Apartment', type: 'Premium', price: 600000,
                capacity: '4 ngý?i l?n, 2 tr? em', floor: '18', hotel: 'QuickStay Hotel Premium',
                description: 'Ph?ng The Song Premium Apartment v?i view sông tuy?t ð?p, không gian sang tr?ng và ti?n nghi cao c?p.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View sông, Ph?ng khách riêng',
                image: '../img/khachsan4(1).jpg', status: 'available',
                images: ['../img/khachsan4(1).jpg', '../img/khachsan4(2).jpg', '../img/khachsan4(3).jpg', '../img/khachsan4(4).jpg', '../img/khachsan4(5).jpg']
            },
            {
                id: 5, name: 'Ph?ng Luxury Premium', type: 'Premium', price: 450000,
                capacity: '3 ngý?i l?n, 2 tr? em', floor: '16', hotel: 'QuickStay Hotel Premium',
                description: 'Ph?ng Luxury Premium v?i thi?t k? hi?n ð?i, không gian sang tr?ng và ti?n nghi cao c?p.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View thành ph?',
                image: '../img/khachsan5(1).jpg', status: 'available',
                images: ['../img/khachsan5(1).jpg', '../img/khachsan5(2).jpg', '../img/khachsan5(3).jpg', '../img/khachsan5(4).jpg', '../img/khachsan5(5).jpg']
            },
            {
                id: 6, name: 'Ph?ng Modern Executive', type: 'Executive', price: 550000,
                capacity: '4 ngý?i l?n, 2 tr? em', floor: '22', hotel: 'QuickStay Hotel Executive',
                description: 'Ph?ng Modern Executive v?i thi?t k? t?i gi?n, không gian r?ng r?i và view thành ph? tuy?t ð?p.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View thành ph?, Ph?ng khách riêng',
                image: '../img/khachsan6(1).jpg', status: 'available',
                images: ['../img/khachsan6(1).jpg', '../img/khachsan6(2).jpg', '../img/khachsan6(3).jpg', '../img/khachsan6(4).jpg', '../img/khachsan6(5).jpg']
            },
            {
                id: 7, name: 'Ph?ng Royal Palace', type: 'Royal', price: 700000,
                capacity: '5 ngý?i l?n, 3 tr? em', floor: '25', hotel: 'QuickStay Hotel Royal',
                description: 'Ph?ng Royal Palace v?i thi?t k? sang tr?ng, không gian r?ng r?i và ti?n nghi cao c?p nh?t.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View thành ph?, Ph?ng khách riêng, Butler service',
                image: '../img/khachsan7(1).jpg', status: 'available',
                images: ['../img/khachsan7(1).jpg', '../img/khachsan7(2).jpg', '../img/khachsan7(3).jpg', '../img/khachsan7(4).jpg']
            },
            {
                id: 8, name: 'Ph?ng Luxury Penthouse', type: 'Penthouse', price: 900000,
                capacity: '6 ngý?i l?n, 4 tr? em', floor: '30', hotel: 'QuickStay Hotel Penthouse',
                description: 'Ph?ng Luxury Penthouse v?i thi?t k? t?i gi?n hi?n ð?i, không gian r?ng r?i và view toàn c?nh thành ph?.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View toàn c?nh, Ph?ng khách riêng, Butler service, Private elevator',
                image: '../img/khachsan8(1).jpg', status: 'available',
                images: ['../img/khachsan8(1).jpg', '../img/khachsan8(2).jpg', '../img/khachsan8(3).jpg', '../img/khachsan8(4).jpg', '../img/khachsan8(5).jpg']
            },
            {
                id: 9, name: 'Ph?ng Modern Studio', type: 'Studio', price: 320000,
                capacity: '2 ngý?i l?n, 1 tr? em', floor: '8', hotel: 'QuickStay Hotel Studio',
                description: 'Ph?ng Modern Studio v?i thi?t k? t?i gi?n, không gian tho?i mái và ti?n nghi hi?n ð?i phù h?p cho khách du l?ch.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Ði?u h?a, Bàn làm vi?c, T? qu?n áo, Mini kitchen',
                image: '../img/khachsan9(1).jpg', status: 'available',
                images: ['../img/khachsan9(1).jpg', '../img/khachsan9(2).jpg', '../img/khachsan9(3).jpg', '../img/khachsan9(4).jpg', '../img/khachsan9(5).jpg']
            },
            {
                id: 10, name: 'Ph?ng Executive Deluxe', type: 'Deluxe', price: 480000,
                capacity: '4 ngý?i l?n, 2 tr? em', floor: '14', hotel: 'QuickStay Hotel Executive',
                description: 'Ph?ng Executive Deluxe v?i thi?t k? sang tr?ng, không gian r?ng r?i và ti?n nghi cao c?p phù h?p cho khách doanh nhân.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View thành ph?, Ph?ng khách riêng, Butler service',
                image: '../img/khachsan10(1).jpg', status: 'available',
                images: ['../img/khachsan10(1).jpg', '../img/khachsan10(2).jpg', '../img/khachsan10(3).jpg', '../img/khachsan10(4).jpg', '../img/khachsan10(5).jpg']
            },
            {
                id: 11, name: 'Ph?ng Comfort Studio', type: 'Studio', price: 280000,
                capacity: '2 ngý?i l?n, 1 tr? em', floor: '6', hotel: 'QuickStay Hotel Comfort',
                description: 'Ph?ng Comfort Studio v?i thi?t k? ?m cúng, không gian tho?i mái và ti?n nghi cõ b?n phù h?p cho khách du l?ch ng?n h?n.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Ði?u h?a, Bàn làm vi?c, T? qu?n áo, Mini kitchen, Washing machine',
                image: '../img/khachsan11(1).jpg', status: 'available',
                images: ['../img/khachsan11(1).jpg', '../img/khachsan11(2).jpg', '../img/khachsan11(3).jpg', '../img/khachsan11(4).jpg', '../img/khachsan11(5).jpg']
            },
            {
                id: 12, name: 'Ph?ng City View Deluxe', type: 'Deluxe', price: 420000,
                capacity: '3 ngý?i l?n, 1 tr? em', floor: '12', hotel: 'QuickStay Hotel City',
                description: 'Ph?ng City View Deluxe v?i view thành ph? tuy?t ð?p, thi?t k? sang tr?ng và ti?n nghi cao c?p phù h?p cho khách du l?ch và công tác.',
                amenities: 'Wifi mi?n phí, TV màn h?nh ph?ng, Minibar, Ði?u h?a, Bàn làm vi?c, Ban công, View thành ph?, Ph?ng khách riêng, City view',
                image: '../img/khachsan12(1).jpg', status: 'available',
                images: ['../img/khachsan12(1).jpg', '../img/khachsan12(2).jpg', '../img/khachsan12(3).jpg', '../img/khachsan12(4).jpg', '../img/khachsan12(5).jpg']
            }
        ];
        localStorage.setItem('rooms', JSON.stringify(sampleRooms));
        console.log('? Ð? kh?i t?o d? li?u Ph?ng m?u.');
    }

    // 2. Kh?i t?o Ti?n nghi
    if (!localStorage.getItem('amenities')) {
        var demoAmenities = [
            { id: 1, name: 'Wifi mi?n phí', description: 'Wifi t?c ð? cao mi?n phí' },
            { id: 2, name: 'TV màn h?nh ph?ng', description: 'TV LCD 42 inch' },
            { id: 3, name: 'Ði?u h?a', description: 'Ði?u h?a 2 chi?u' },
            { id: 4, name: 'Minibar', description: 'T? l?nh mini v?i ð? u?ng' },
            { id: 5, name: 'Bàn làm vi?c', description: 'Bàn làm vi?c hi?n ð?i' }
        ];
        localStorage.setItem('amenities', JSON.stringify(demoAmenities));
        console.log('? Ð? kh?i t?o d? li?u Ti?n nghi m?u.');
    }

    // 3. Kh?i t?o M? gi?m giá
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
                maxUses: 100, usedCount: 0, description: 'Gi?m 20% cho ðõn hàng t? 1 tri?u'
            },
            {
                id: 2, code: 'FLASHSALE15', discountType: 'percent', discountValue: 15,
                maxDiscount: 1500000, minAmount: 500000,
                startDate: today.toISOString().split('T')[0], endDate: nextMonth.toISOString().split('T')[0],
                maxUses: 200, usedCount: 0, description: 'Flash Sale - Gi?m 15% cho ðõn t? 500k'
            }
        ];
        localStorage.setItem('promotions', JSON.stringify(samplePromotions));
        console.log('? Ð? kh?i t?o M? gi?m giá m?u.');
    }

    // 4. Kh?i t?o Tài kho?n Admin và Khách hàng m?u
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
        console.log('? Ð? kh?i t?o tài kho?n Admin (admin/1).');
    }
}

// T? ð?ng ch?y hàm này khi file script ðý?c load
khoiTaoDuLieuHeThong();

