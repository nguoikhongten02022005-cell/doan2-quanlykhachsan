// Dịch vụ lưu trữ tập trung (localStorage) có kiểm tra try/catch
// Cung cấp các hàm: getRooms, getBookings, saveBooking, saveBookings, ensureRoomsSeeded

var storageService = (function() {
    function safeParse(raw, fallback) {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Lỗi parse localStorage:', e);
            return fallback;
        }
    }

    function setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Không thể lưu dữ liệu vào localStorage:', e);
        }
    }

    function toNumber(v) {
        if (v === undefined || v === null) return 0;
        if (typeof v === 'number') return v;
        var s = String(v).replace(/[^\d.\-]/g, '');
        var n = Number(s);
        return isNaN(n) ? 0 : n;
    }

    function normalizeDateStr(s) {
        if (!s) return null;
        if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    }

    // Dữ liệu phòng mẫu dùng làm fallback khi chưa có dữ liệu thật
    var sampleRooms = [
        {
            id: 1,
            name: 'Phòng The Peak Suite',
            type: 'Suite',
            price: 500000,
            capacity: '4 người lớn, 2 trẻ em',
            floor: '15',
            hotel: 'QuickStay Hotel Suite',
            description: 'Phòng hiện đại, tiện nghi đầy đủ, phù hợp cho chuyến nghỉ dưỡng thoải mái.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc',
            image: '../img/khachsan1(1).jpg',
            images: [
                '../img/khachsan1(1).jpg',
                '../img/khachsan1(2).jpg',
                '../img/khachsan1(3).jpg',
                '../img/khachsan1(4).jpg',
                '../img/khachsan1(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 2,
            name: 'Phòng Genesis Luxury Royal Suite',
            type: 'VIP',
            price: 800000,
            capacity: '6 người lớn, 3 trẻ em',
            floor: '20',
            hotel: 'QuickStay Hotel VIP',
            description: 'Phòng Genesis Luxury Royal Suite với không gian sang trọng và view thành phố tuyệt đẹp.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, Phòng tắm jacuzzi',
            image: '../img/khachsan2(1).jpg',
            images: [
                '../img/khachsan2(1).jpg',
                '../img/khachsan2(2).jpg',
                '../img/khachsan2(3).jpg',
                '../img/khachsan2(4).jpg',
                '../img/khachsan2(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 3,
            name: 'Phòng Modern Deluxe',
            type: 'Deluxe',
            price: 350000,
            capacity: '3 người lớn, 1 trẻ em',
            floor: '10',
            hotel: 'QuickStay Hotel Deluxe',
            description: 'Phòng Modern Deluxe với thiết kế hiện đại, không gian thoải mái và tiện nghi đầy đủ.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Tủ quần áo',
            image: '../img/khachsan3(1).jpg',
            images: [
                '../img/khachsan3(1).jpg',
                '../img/khachsan3(2).jpg',
                '../img/khachsan3(3).jpg',
                '../img/khachsan3(4).jpg',
                '../img/khachsan3(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 4,
            name: 'Phòng Classic Deluxe',
            type: 'Deluxe',
            price: 380000,
            capacity: '4 người lớn, 2 trẻ em',
            floor: '12',
            hotel: 'QuickStay Hotel Deluxe',
            description: 'Phòng Classic Deluxe với thiết kế cổ điển sang trọng và tiện nghi cao cấp.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công',
            image: '../img/khachsan4(1).jpg',
            images: [
                '../img/khachsan4(1).jpg',
                '../img/khachsan4(2).jpg',
                '../img/khachsan4(3).jpg',
                '../img/khachsan4(4).jpg',
                '../img/khachsan4(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 5,
            name: 'Phòng Luxury Ocean Suite',
            type: 'Suite',
            price: 650000,
            capacity: '4 người lớn, 2 trẻ em',
            floor: '18',
            hotel: 'QuickStay Hotel Ocean',
            description: 'Phòng Luxury Ocean Suite với tầm nhìn ra biển tuyệt đẹp và tiện nghi cao cấp.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View biển',
            image: '../img/khachsan5(1).jpg',
            images: [
                '../img/khachsan5(1).jpg',
                '../img/khachsan5(2).jpg',
                '../img/khachsan5(3).jpg',
                '../img/khachsan5(4).jpg',
                '../img/khachsan5(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 6,
            name: 'Phòng Premium Family Suite',
            type: 'Suite',
            price: 750000,
            capacity: '5 người lớn, 3 trẻ em',
            floor: '22',
            hotel: 'QuickStay Hotel Family',
            description: 'Phòng Premium Family Suite rộng rãi, phù hợp cho gia đình với nhiều tiện nghi cao cấp.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, Kitchenette',
            image: '../img/khachsan6(1).jpg',
            images: [
                '../img/khachsan6(1).jpg',
                '../img/khachsan6(2).jpg',
                '../img/khachsan6(3).jpg',
                '../img/khachsan6(4).jpg',
                '../img/khachsan6(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 7,
            name: 'Phòng Royal Penthouse',
            type: 'Penthouse',
            price: 900000,
            capacity: '6 người lớn, 4 trẻ em',
            floor: '30',
            hotel: 'QuickStay Hotel Penthouse',
            description: 'Phòng Luxury Penthouse với thiết kế tối giản hiện đại, không gian rộng rãi và view toàn cảnh thành phố.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View toàn cảnh, Phòng khách riêng, Butler service, Private elevator',
            image: '../img/khachsan8(1).jpg',
            images: [
                '../img/khachsan8(1).jpg',
                '../img/khachsan8(2).jpg',
                '../img/khachsan8(3).jpg',
                '../img/khachsan8(4).jpg',
                '../img/khachsan8(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 9,
            name: 'Phòng Modern Studio',
            type: 'Studio',
            price: 320000,
            capacity: '2 người lớn, 1 trẻ em',
            floor: '8',
            hotel: 'QuickStay Hotel Studio',
            description: 'Phòng Modern Studio với thiết kế tối giản, không gian thoải mái và tiện nghi hiện đại phù hợp cho khách du lịch.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Điều hòa, Bàn làm việc, Tủ quần áo, Mini kitchen',
            image: '../img/khachsan9(1).jpg',
            images: [
                '../img/khachsan9(1).jpg',
                '../img/khachsan9(2).jpg',
                '../img/khachsan9(3).jpg',
                '../img/khachsan9(4).jpg',
                '../img/khachsan9(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 10,
            name: 'Phòng Executive Deluxe',
            type: 'Deluxe',
            price: 480000,
            capacity: '4 người lớn, 2 trẻ em',
            floor: '14',
            hotel: 'QuickStay Hotel Executive',
            description: 'Phòng Executive Deluxe với thiết kế sang trọng, không gian rộng rãi và tiện nghi cao cấp phù hợp cho khách doanh nhân.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố, Phòng khách riêng, Butler service',
            image: '../img/khachsan10(1).jpg',
            images: [
                '../img/khachsan10(1).jpg',
                '../img/khachsan10(2).jpg',
                '../img/khachsan10(3).jpg',
                '../img/khachsan10(4).jpg',
                '../img/khachsan10(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 11,
            name: 'Phòng Comfort Studio',
            type: 'Studio',
            price: 280000,
            capacity: '2 người lớn, 1 trẻ em',
            floor: '6',
            hotel: 'QuickStay Hotel Comfort',
            description: 'Phòng Comfort Studio với thiết kế ấm cúng, không gian thoải mái và tiện nghi cơ bản phù hợp cho khách du lịch ngắn hạn.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Điều hòa, Bàn làm việc, Tủ quần áo, Mini kitchen, Washing machine',
            image: '../img/khachsan11(1).jpg',
            images: [
                '../img/khachsan11(1).jpg',
                '../img/khachsan11(2).jpg',
                '../img/khachsan11(3).jpg',
                '../img/khachsan11(4).jpg',
                '../img/khachsan11(5).jpg'
            ],
            status: 'available'
        },
        {
            id: 12,
            name: 'Phòng City View Deluxe',
            type: 'Deluxe',
            price: 420000,
            capacity: '3 người lớn, 1 trẻ em',
            floor: '12',
            hotel: 'QuickStay Hotel City',
            description: 'Phòng City View Deluxe với view thành phố tuyệt đẹp, thiết kế sang trọng và tiện nghi cao cấp phù hợp cho khách du lịch và công tác.',
            amenities: 'Wifi miễn phí, TV màn hình phẳng, Minibar, Điều hòa, Bàn làm việc, Ban công, View thành phố, Phòng khách riêng, City view',
            image: '../img/khachsan12(1).jpg',
            images: [
                '../img/khachsan12(1).jpg',
                '../img/khachsan12(2).jpg',
                '../img/khachsan12(3).jpg',
                '../img/khachsan12(4).jpg',
                '../img/khachsan12(5).jpg'
            ],
            status: 'available'
        }
    ];

    function seedSampleRooms() {
        var clone = JSON.parse(JSON.stringify(sampleRooms));
        setData('rooms', clone);
        return clone;
    }

    function getRooms() {
        var rooms = safeParse(localStorage.getItem('rooms'), []);
        if (!rooms || rooms.length === 0) {
            rooms = seedSampleRooms();
        }
        return rooms;
    }

    function ensureRoomsSeeded() {
        return getRooms();
    }

    function getBookings() {
        return safeParse(localStorage.getItem('bookings'), []);
    }

    function saveBookings(bookings) {
        setData('bookings', bookings || []);
    }

    function saveBooking(booking) {
        var bookings = getBookings();
        booking = Object.assign({}, booking);
        booking.id = booking.id || ('BK' + Date.now());
        booking.price = toNumber(booking.price);
        booking.totalAmount = toNumber(booking.totalAmount) || booking.price * (booking.nights || 1);

        booking.checkIn = normalizeDateStr(booking.checkIn || booking.checkin);
        booking.checkOut = normalizeDateStr(booking.checkOut || booking.checkout);

        booking.status = booking.status || 'pending';
        booking.createdAt = booking.createdAt || new Date().toISOString();

        booking.guests = booking.guests || { nguoiLon: booking.adults || 2, treEm: booking.children || 0, phong: booking.rooms || 1 };

        bookings.push(booking);
        saveBookings(bookings);
        return booking;
    }

    return {
        getRooms: getRooms,
        ensureRoomsSeeded: ensureRoomsSeeded,
        getBookings: getBookings,
        saveBooking: saveBooking,
        saveBookings: saveBookings
    };
})();
