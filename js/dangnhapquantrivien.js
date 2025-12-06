// Đăng nhập quản trị viên

document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    
    // Xử lý nút đăng nhập
    var loginBtn = document.querySelector('.nut-xac-thuc');
    if (loginBtn) {
        loginBtn.addEventListener('click', dangNhap);
    }
    
    // Xử lý Enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            dangNhap();
        }
    });
});



// Hàm đăng nhập
function dangNhap() {
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;

    if (!username || !password) {
        showToast('Vui lòng nhập đầy đủ thông tin!');
        return false;
    }

    // Lấy danh sách tài khoản từ localStorage
    var accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    
    // Tìm tài khoản admin phù hợp
    var user = null;
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].username === username && accounts[i].password === password) {
            if (accounts[i].role === 'admin' || accounts[i].role === 'staff') {
                user = accounts[i];
                break;
            }
        }
    }

    if (user) {
        // Lưu thông tin đăng nhập
        var loginData = {
            username: user.username,
            email: user.email || '',
            role: user.role,
            loginTime: new Date().toISOString()
        };
        
        sessionStorage.setItem('userLogin', JSON.stringify(loginData));
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userName', user.username);
        localStorage.setItem('userLogin', JSON.stringify(loginData));
        
        window.location.href = 'quantrivien.html';
        return false;
    } else {
        showToast('Sai tên đăng nhập hoặc mật khẩu!');
        return false;
    }
}

// Hiển thị thông báo
function showToast(message) {
    var toast = document.getElementById('toast-notification');
    var toastMessage = toast.querySelector('.toast-message');
    
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    toast.classList.add('show');
    
    setTimeout(function() {
        hideToast();
    }, 3000);
}

function hideToast() {
    var toast = document.getElementById('toast-notification');
    toast.classList.remove('show');
}
