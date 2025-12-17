// JavaScript cho trang đăng nhập - login.html
// Code đơn giản dễ hiểu cho người mới bắt đầu

// Chờ trang web tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Thiết lập tab navigation
    setupTabs();
    
    // Thiết lập password toggle
    setupPasswordToggle();
    
    // Thiết lập form đăng nhập
    setupLoginForm();
    
    // Thiết lập form đăng ký
    setupRegisterForm();
});

// Thiết lập chuyển đổi tab
function setupTabs() {
    var tabButtons = document.querySelectorAll('.nut-tab');
    var tabContents = document.querySelectorAll('.noi-dung-tab');
    
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener('click', function() {
            var targetTab = this.getAttribute('data-tab');
            
            // Xóa active class từ tất cả tab buttons
            for (var j = 0; j < tabButtons.length; j++) {
                tabButtons[j].classList.remove('active');
            }
            
            // Xóa active class từ tất cả tab contents
            for (var k = 0; k < tabContents.length; k++) {
                tabContents[k].classList.remove('active');
            }
            
            // Thêm active class cho tab được chọn
            this.classList.add('active');
            
            // Hiển thị nội dung tab tương ứng
            if (targetTab === 'login') {
                document.getElementById('loginTab').classList.add('active');
            } else if (targetTab === 'register') {
                document.getElementById('registerTab').classList.add('active');
            }
        });
    }
}

// Thiết lập hiển thị/ẩn mật khẩu
function setupPasswordToggle() {
    var toggleButtons = document.querySelectorAll('.nut-hien-mk');
    
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

// Thiết lập form đăng nhập - (CẬP NHẬT: kiểm tra cả customers và accounts)
function setupLoginForm() {
    var loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var username = document.getElementById('loginUsername').value.trim();
        var password = document.getElementById('loginPassword').value;
        var rememberMe = document.getElementById('rememberMe').checked;

        // Validation đơn giản
        if (!username || !password) {
            showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        if (username.length < 3) {
            showNotification('Tên đăng nhập phải có ít nhất 3 ký tự!', 'error');
            return;
        }

        // Lấy cả customers và accounts để tìm người dùng
        var customers = JSON.parse(localStorage.getItem('customers') || '[]');
        var accounts  = JSON.parse(localStorage.getItem('accounts')  || '[]');
        var allUsers = customers.concat(accounts || []);

        // So sánh không phân biệt hoa/thường
        var unameLower = username.toLowerCase();
        var foundUser = null;
        for (var i = 0; i < allUsers.length; i++) {
            var u = allUsers[i];
            if (!u || !u.username) continue;
            if (String(u.username).toLowerCase() === unameLower) {
                foundUser = u;
                break;
            }
        }

        if (!foundUser) {
            showNotification('Tên đăng nhập không tồn tại!', 'error');
            return;
        }

        // Kiểm tra mật khẩu (nếu có)
        if (foundUser.password && foundUser.password !== password) {
            showNotification('Mật khẩu không đúng!', 'error');
            return;
        }

        // Hiển thị loading trên button
        showButtonLoading(loginForm.querySelector('.nut-xac-thuc'));

        // Giả lập đăng nhập
        setTimeout(function() {
            var userData = {
                id: foundUser.id,
                username: foundUser.username,
                email: foundUser.email || '',
                name: foundUser.name || foundUser.username,
                phone: foundUser.phone || '',
                role: foundUser.role || 'customer',
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe,
                sessionToken: 'token-' + Date.now()
            };

            localStorage.setItem('authToken', userData.sessionToken);
            localStorage.setItem('currentUser', JSON.stringify(userData));

            showNotification('Đăng nhập thành công! Xin chào ' + (foundUser.name || foundUser.username), 'success');

            // Redirect: nếu có returnUrl dùng returnUrl, nếu role là admin -> quản trị, ngược lại về index
            var urlParams = new URLSearchParams(window.location.search);
            var returnUrl = urlParams.get('returnUrl');

            setTimeout(function() {
                if (returnUrl) {
                    window.location.href = decodeURIComponent(returnUrl);
                } else if (userData.role && userData.role.toLowerCase() === 'admin') {
                    window.location.href = 'quantrivien.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1200);

        }, 800);
    });
}

// Thiết lập form đăng ký
function setupRegisterForm() {
    var registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var fullName = document.getElementById('fullName').value.trim();
        var username = document.getElementById('registerUsername').value.trim();
        var email = document.getElementById('registerEmail').value.trim();
        var password = document.getElementById('registerPassword').value;
        var confirmPassword = document.getElementById('confirmPassword').value;
        var agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (!fullName || !username || !email || !password || !confirmPassword) {
            showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }
        
        if (username.length < 3) {
            showNotification('Tên đăng nhập phải có ít nhất 3 ký tự!', 'error');
            return;
        }
        
        // Kiểm tra username đã tồn tại chưa
        var customers = JSON.parse(localStorage.getItem('customers') || '[]');
        for (var i = 0; i < customers.length; i++) {
            if (customers[i].username === username) {
                showNotification('Tên đăng nhập đã tồn tại!', 'error');
                return;
            }
        }
        
        if (!isValidEmail(email)) {
            showNotification('Email không hợp lệ!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        if (!agreeTerms) {
            showNotification('Vui lòng đồng ý với điều khoản sử dụng!', 'error');
            return;
        }
        
        // Hiển thị loading
        showButtonLoading(this.querySelector('.nut-xac-thuc'));
        
        // Xử lý đăng ký (delay nhỏ để UX mượt mà)
        setTimeout(function() {
            var newUser = {
                id: Date.now(), // Tạo ID duy nhất
                username: username, // Tên đăng nhập
                password: password, // Lưu mật khẩu
                name: fullName, // Tên đầy đủ
                email: email,
                phone: '',
                role: 'customer', // Vai trò khách hàng
                registerTime: new Date().toISOString()
            };
            
            // Lưu thông tin khách hàng mới vào "customers" để thống nhất với trang quản trị
            customers.push(newUser);
            localStorage.setItem('customers', JSON.stringify(customers));
            
            // Tự động đăng nhập sau khi đăng ký
            var userData = {
                id: newUser.id,
                username: username,
                email: email,
                name: newUser.name,
                phone: '',
                role: 'customer',
                loginTime: new Date().toISOString()
            };
            
            // Chỉ lưu vào currentUser
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            showNotification('Đăng ký thành công! Đăng nhập tự động...', 'success');
            
            // Kiểm tra có returnUrl không
            var urlParams = new URLSearchParams(window.location.search);
            var returnUrl = urlParams.get('returnUrl');
            
            // Chuyển về trang trước đó hoặc trang chủ sau 1.5 giây
            setTimeout(function() {
                if (returnUrl) {
                    window.location.href = decodeURIComponent(returnUrl);
                } else {
                    window.location.href = 'index.html';
                }
            }, 1500);
            
        }, 300); // Giảm delay để thông báo hiển thị nhanh hơn
    });
}

// Hiển thị loading trên button
function showButtonLoading(button) {
    var btnText = button.querySelector('.chu-nut');
    var btnLoader = button.querySelector('.tai-nut');
    
    button.disabled = true;
    if (btnText) btnText.style.opacity = '0';
    if (btnLoader) btnLoader.style.display = 'block';
    
    // Tắt loading sau 3 giây (backup)
    setTimeout(function() {
        button.disabled = false;
        if (btnText) btnText.style.opacity = '1';
        if (btnLoader) btnLoader.style.display = 'none';
    }, 3000);
}

// Hiển thị thông báo
function showNotification(message, type) {
    var notification = document.getElementById('notification');
    var icon = notification.querySelector('.bieu-tuong-thong-bao');
    var messageElement = notification.querySelector('.thong-diep-thong-bao');
    
    // Xóa class cũ
    notification.className = 'thong-bao';
    
    // Thêm class mới
    notification.classList.add(type);
    
    // Cập nhật icon
    icon.className = 'bieu-tuong-thong-bao fas';
    if (type === 'success') {
        icon.classList.add('fa-check-circle');
    } else if (type === 'error') {
        icon.classList.add('fa-exclamation-circle');
    } else if (type === 'warning') {
        icon.classList.add('fa-exclamation-triangle');
    } else {
        icon.classList.add('fa-info-circle');
    }
    
    // Cập nhật message
    messageElement.textContent = message;
    
    // Hiển thị notification
    notification.classList.add('show');
    
    // Tự động ẩn sau 4 giây
    setTimeout(function() {
        notification.classList.remove('show');
    }, 4000);
}

// Kiểm tra email hợp lệ
function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
