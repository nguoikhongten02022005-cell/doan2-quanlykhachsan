// tim-kiem-san-pham.js
(function(){
    // Escape HTML safe insertion
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Seed sample products if none
    function ensureProductsSeeded() {
        try {
            var products = JSON.parse(localStorage.getItem('products') || '[]');
            if (!products || products.length === 0) {
                var sampleProducts = [
                    { id: 1, name: 'Tai nghe Không dây Premium', category: 'electronics', price: 1299000, rating: 4.6, image: '../img/product-headphone.jpg', description: 'Âm thanh sống động, chống ồn chủ động.' },
                    { id: 2, name: 'Máy xay sinh tố 1200W', category: 'home', price: 699000, rating: 4.2, image: '../img/product-blender.jpg', description: 'Công suất mạnh mẽ, dễ vệ sinh.' },
                    { id: 3, name: 'Son dưỡng cao cấp', category: 'beauty', price: 199000, rating: 4.8, image: '../img/product-lip.jpg', description: 'Dưỡng mềm mượt, có màu nhẹ.' },
                    { id: 4, name: 'Áo khoác Thu Đông', category: 'fashion', price: 899000, rating: 4.3, image: '../img/product-jacket.jpg', description: 'Chống gió, giữ ấm tốt.' },
                    { id: 5, name: 'Loa Bluetooth Mini', category: 'electronics', price: 349000, rating: 4.1, image: '../img/product-speaker.jpg', description: 'Thiết kế nhỏ gọn, bass ổn.' }
                ];
                localStorage.setItem('products', JSON.stringify(sampleProducts));
                return sampleProducts;
            }
            return products;
        } catch (e) {
            console.warn('error seeding products:', e);
            return [];
        }
    }

    // Lấy products từ localStorage
    function loadProducts() {
        var products = ensureProductsSeeded();
        try {
            products = JSON.parse(localStorage.getItem('products') || '[]');
        } catch (e) { products = ensureProductsSeeded(); }
        return products || [];
    }

    function performProductSearch() {
        var kw = (document.getElementById('inputKeyword').value || '').trim().toLowerCase();
        var cat = document.getElementById('selectCategory').value || '';
        var minP = parseInt(document.getElementById('priceMin').value) || 0;
        var maxP = parseInt(document.getElementById('priceMax').value) || 0;
        var sort = document.getElementById('selectSort').value || 'relevance';

        var products = loadProducts();

        // Filter
        var filtered = products.filter(function(p){
            if (!p) return false;
            if (cat && String(p.category) !== String(cat)) return false;
            if (minP && (Number(p.price) < minP)) return false;
            if (maxP && (Number(p.price) > maxP)) return false;
            if (kw) {
                var hay = (p.name + ' ' + (p.description || '')).toLowerCase();
                if (hay.indexOf(kw) === -1) return false;
            }
            return true;
        });

        // Sort
        if (sort === 'price-low') filtered.sort((a,b)=> (a.price||0)-(b.price||0));
        else if (sort === 'price-high') filtered.sort((a,b)=> (b.price||0)-(a.price||0));
        else if (sort === 'rating') filtered.sort((a,b)=> (b.rating||0)-(a.rating||0));
        // else relevance => keep order

        renderResults(filtered);
    }

    function renderResults(items) {
        var container = document.getElementById('productResultsContainer');
        var block = document.getElementById('productResultsBlock');
        var count = document.getElementById('productCount');

        if (!container || !block || !count) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="thong-bao-khong-tim-thay"><i class="fas fa-search"></i><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi từ khóa hoặc bộ lọc.</p></div>';
            block.style.display = 'block';
            count.textContent = '0';
            return;
        }

        count.textContent = String(items.length);
        block.style.display = 'block';
        container.innerHTML = '';

        items.forEach(function(p){
            var card = document.createElement('div');
            card.className = 'product-card';

            var thumb = document.createElement('div');
            thumb.className = 'thumb';
            var img = document.createElement('img');
            img.src = p.image || '../img/default-product.jpg';
            img.alt = p.name || '';
            img.onerror = function(){ this.src = '../img/default-product.jpg'; };
            thumb.appendChild(img);

            var body = document.createElement('div');
            body.className = 'body';

            var title = document.createElement('div');
            title.className = 'title';
            title.textContent = p.name || '';

            var desc = document.createElement('div');
            desc.className = 'desc';
            desc.textContent = p.description || '';

            var meta = document.createElement('div');
            meta.className = 'meta';
            var price = document.createElement('div');
            price.className = 'price';
            // formatPrice có trong common.js
            price.textContent = (typeof formatPrice === 'function') ? formatPrice(p.price) : (p.price + ' đ');

            var rating = document.createElement('div');
            rating.className = 'rating';
            rating.innerHTML = (p.rating ? (p.rating.toFixed(1) + ' <i class="fas fa-star" style="color:#fbbf24"></i>') : '');

            meta.appendChild(price);
            meta.appendChild(rating);

            var actions = document.createElement('div');
            actions.className = 'actions';
            var btnView = document.createElement('button');
            btnView.className = 'btn-secondary';
            btnView.textContent = 'Xem';
            btnView.addEventListener('click', function(e){
                e.stopPropagation();
                // Điều hướng chi tiết sản phẩm (nếu có)
                window.location.href = 'product-detail.html?id=' + encodeURIComponent(p.id);
            });
            var btnAdd = document.createElement('button');
            btnAdd.className = 'btn-primary';
            btnAdd.textContent = 'Thêm vào giỏ';
            btnAdd.addEventListener('click', function(e){
                e.stopPropagation();
                addToCart(p.id);
            });

            actions.appendChild(btnView);
            actions.appendChild(btnAdd);

            body.appendChild(title);
            body.appendChild(desc);
            body.appendChild(meta);
            body.appendChild(actions);

            card.appendChild(thumb);
            card.appendChild(body);

            container.appendChild(card);
        });
    }

    function addToCart(productId) {
        try {
            var cart = JSON.parse(localStorage.getItem('cart') || '[]');
            var found = false;
            for (var i=0;i<cart.length;i++){
                if (cart[i].productId == productId) { cart[i].qty = (cart[i].qty||1) + 1; found = true; break; }
            }
            if (!found) cart.push({ productId: productId, qty: 1 });
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Đã thêm sản phẩm vào giỏ');
        } catch (e) { console.error(e); alert('Lỗi khi thêm giỏ hàng'); }
    }

    function initViewButtons(){
        var viewButtons = document.querySelectorAll('.nut-xem[data-view]');
        var container = document.getElementById('productResultsContainer');
        if (!container) return;
        viewButtons.forEach(function(btn){
            btn.addEventListener('click', function(){
                viewButtons.forEach(b=>b.classList.remove('active'));
                this.classList.add('active');
                var view = this.dataset.view;
                if (view === 'list') {
                    container.classList.remove('grid-view'); container.classList.add('list-view');
                } else {
                    container.classList.add('grid-view'); container.classList.remove('list-view');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function(){
        ensureProductsSeeded();
        initViewButtons();

        document.getElementById('btnSearchProduct').addEventListener('click', performProductSearch);

        // search when pressing Enter in keyword field
        document.getElementById('inputKeyword').addEventListener('keydown', function(e){
            if (e.key === 'Enter') { performProductSearch(); }
        });

        // khởi tạo hiển thị mặc định: show all
        performProductSearch();
    });

})();
