const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Đổi model sang Nvidia Nemotron 3 Nano 30B (free)
const MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

let chatHistory = [];
let isOpen = false;

// ===== HÀM PHỤ =====
const MAX_HISTORY_TURNS = 10;     // giới hạn lịch sử gửi lên model
const MAX_ROOM_CONTEXT = 12;      // số phòng tối đa đưa vào prompt
const MAX_AMENITIES_PER_ROOM = 8;

function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function normalizeVN(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchContext() {
  // Trang tìm kiếm của bạn có querystring ?checkin=...&checkout=...&adults=...&children=...&rooms=...
  const p = new URLSearchParams(window.location.search);
  const checkin = p.get('checkin') || '';
  const checkout = p.get('checkout') || '';
  const adults = toInt(p.get('adults'), 0);
  const children = toInt(p.get('children'), 0);
  const rooms = toInt(p.get('rooms'), 1);

  // số đêm để tính tổng tiền (nếu parse được)
  let nights = 0;
  try {
    if (checkin && checkout) {
      const a = new Date(checkin);
      const b = new Date(checkout);
      const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
      nights = Number.isFinite(diff) && diff > 0 ? diff : 0;
    }
  } catch (_) {}

  return { checkin, checkout, adults, children, rooms, nights };
}

function safeParseCapacity(room) {
  // ưu tiên dùng parseCapacity sẵn có trong project (đang được gọi ở buildSystemPrompt cũ)
  if (typeof parseCapacity === 'function') return parseCapacity(room);

  // fallback: thử đọc các field phổ biến
  const adults = toInt(room.adults ?? room.maxAdults ?? room.capacityAdults, 0);
  const children = toInt(room.children ?? room.maxChildren ?? room.capacityChildren, 0);
  return { adults, children };
}

function parsePriceNumber(room) {
  const raw = (room.price ?? '').toString();
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function getAmenityList(room) {
  const s = (room.amenities || '').toString();
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function roomSummary(room) {
  const cap = safeParseCapacity(room);
  const price = parsePriceNumber(room);
  const amenities = getAmenityList(room).slice(0, MAX_AMENITIES_PER_ROOM);
  return {
    id: room.id ?? room.roomId ?? room._id ?? '',
    name: room.name || '',
    type: room.type || 'Standard',
    price,
    adults: cap.adults,
    children: cap.children,
    amenities
  };
}

function scoreRoom(room, userMsgNorm, ctx) {
  const name = normalizeVN(room.name || '');
  const type = normalizeVN(room.type || '');
  const amen = normalizeVN((room.amenities || '').toString());
  let score = 0;

  // match theo keyword
  if (userMsgNorm && (name.includes(userMsgNorm) || type.includes(userMsgNorm))) score += 8;

  // match theo từng từ
  const tokens = userMsgNorm.split(' ').filter(Boolean);
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (name.includes(t)) score += 3;
    if (type.includes(t)) score += 2;
    if (amen.includes(t)) score += 2;
  }

  // ưu tiên phòng đủ sức chứa theo ngữ cảnh
  const cap = safeParseCapacity(room);
  if (ctx.adults || ctx.children) {
    if (cap.adults >= ctx.adults && cap.children >= ctx.children) score += 6;
    else score -= 6;
  }

  // nếu hỏi rẻ/giá tốt => ưu tiên giá thấp
  if (userMsgNorm.includes('re') || userMsgNorm.includes('gia') || userMsgNorm.includes('khuyen mai')) {
    const price = parsePriceNumber(room);
    if (price > 0) score += Math.max(0, 5 - Math.floor(price / 1000000)); // giá thấp hơn thì điểm cao hơn
  }

  return score;
}

function pickRelevantRooms(rooms, userMessage, ctx) {
  const msgNorm = normalizeVN(userMessage || '');
  const list = rooms
    .filter(r => (r.status || '').toLowerCase() === 'available') // giữ logic cũ
    .map(r => ({ room: r, score: scoreRoom(r, msgNorm, ctx) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ROOM_CONTEXT)
    .map(x => roomSummary(x.room));

  return list;
}

// Hàm xây dựng system prompt từ dữ liệu thực tế
function buildSystemPrompt(userMessage = '') {
    try {
        var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        
        // Lấy ngữ cảnh tìm kiếm và phòng liên quan
        var ctx = getSearchContext();
        var relevantRooms = pickRelevantRooms(rooms, userMessage, ctx);
        
        // Nhóm phòng theo type và tính toán thông tin
        var roomsByType = {};
        var allAmenities = new Set();
        
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            if (room.status !== 'available') continue;
            
            var type = room.type || 'Standard';
            if (!roomsByType[type]) {
                roomsByType[type] = {
                    prices: [],
                    capacities: [],
                    amenities: new Set(),
                    names: []
                };
            }
            
            if (room.price) {
                var priceNum = parseInt(room.price.toString().replace(/\D/g, ''));
                if (priceNum > 0) {
                    roomsByType[type].prices.push(priceNum);
                }
            }
            
            var cap = parseCapacity(room);
            roomsByType[type].capacities.push(cap);
            roomsByType[type].names.push(room.name || 'Phòng ' + type);
            
            if (room.amenities) {
                var amenityList = room.amenities.split(',');
                for (var j = 0; j < amenityList.length; j++) {
                    var amenity = amenityList[j].trim();
                    if (amenity) {
                        roomsByType[type].amenities.add(amenity);
                        allAmenities.add(amenity);
                    }
                }
            }
        }
        
        // Kiểm tra xem có phòng nào không
        var typeKeys = Object.keys(roomsByType);
        if (typeKeys.length === 0 || rooms.length === 0) {
            return `Bạn là trợ lý AI của khách sạn QuickStay. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện và chính xác.

THÔNG TIN KHÁCH SẠN:
- Tên: QuickStay Hotel
- Dịch vụ chính: Đặt phòng khách sạn trực tuyến

HIỆN TẠI KHÔNG CÓ PHÒNG NÀO ĐANG CÓ SẴN.
Vui lòng hướng dẫn khách liên hệ trực tiếp hoặc quay lại sau.

NHIỆM VỤ:
- Trả lời lịch sự, thân thiện
- Hướng dẫn khách liên hệ hoặc quay lại sau`;
        }
        
        // Đếm tổng số phòng có sẵn
        var totalAvailableRooms = 0;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].status === 'available') {
                totalAvailableRooms++;
            }
        }
        
        // Tính toán thông tin cho từng loại phòng (chỉ tính 1 lần)
        for (var type in roomsByType) {
            var typeData = roomsByType[type];
            
            // Đếm số lượng phòng của loại này
            typeData.count = typeData.names.length;
            
            // Tính giá min/max
            if (typeData.prices.length > 0) {
                typeData.minPrice = Math.min.apply(null, typeData.prices);
                typeData.maxPrice = Math.max.apply(null, typeData.prices);
                typeData.priceRange = typeData.minPrice === typeData.maxPrice 
                    ? formatPrice(typeData.minPrice) 
                    : formatPrice(typeData.minPrice) + ' - ' + formatPrice(typeData.maxPrice);
            }
            
            // Tính capacity tối đa
            typeData.maxAdults = 0;
            typeData.maxChildren = 0;
            for (var k = 0; k < typeData.capacities.length; k++) {
                if (typeData.capacities[k].adults > typeData.maxAdults) {
                    typeData.maxAdults = typeData.capacities[k].adults;
                }
                if (typeData.capacities[k].children > typeData.maxChildren) {
                    typeData.maxChildren = typeData.capacities[k].children;
                }
            }
        }
        
        // Xây dựng prompt
        var prompt = `Bạn là trợ lý AI của khách sạn QuickStay.

QUY TẮC BẮT BUỘC:
- Trả lời bằng tiếng Việt, thân thiện, đúng trọng tâm.
- CHỈ dùng dữ liệu trong <DATA>. Nếu thiếu dữ liệu: nói "Hệ thống hiện chưa có thông tin đó" và hướng dẫn khách xem chi tiết/đặt trên website.
- Khi tư vấn phòng: ưu tiên phòng phù hợp số người, nêu giá/đêm, tiện nghi chính, và đề xuất 2-3 lựa chọn.
- Nếu khách hỏi tổng tiền: Tổng = (giá/đêm) * (số đêm) * (số phòng). Nếu thiếu ngày hoặc không tính được số đêm thì hỏi lại.

<DATA>
SEARCH_CONTEXT:
- Check-in: ${ctx.checkin || 'chưa chọn'}
- Check-out: ${ctx.checkout || 'chưa chọn'}
- Số đêm: ${ctx.nights || 'chưa xác định'}
- Khách: ${ctx.adults} người lớn, ${ctx.children} trẻ em
- Số phòng: ${ctx.rooms}

TỔNG SỐ PHÒNG CÓ SẴN: ${totalAvailableRooms} phòng

TOP PHÒNG LIÊN QUAN (ưu tiên dùng để trả lời):
${relevantRooms.map((r, i) => {
  const priceText = r.price ? (typeof formatPrice === 'function' ? formatPrice(r.price) : (r.price.toLocaleString('vi-VN') + ' đ')) : 'chưa có giá';
  return `${i+1}. ${r.name || ('Phòng ' + r.type)} | Loại: ${r.type} | Giá: ${priceText}/đêm | Sức chứa: ${r.adults} NL, ${r.children} TE | Tiện nghi: ${r.amenities.join(', ') || 'chưa có'}`;
}).join('\n')}

CÁC LOẠI PHÒNG VÀ GIÁ (theo đêm):\n`;
        
        var typeIndex = 1;
        for (var type in roomsByType) {
            var typeData = roomsByType[type];
            if (!typeData.priceRange) continue;
            
            prompt += `${typeIndex}. ${type}: ${typeData.priceRange} - Có ${typeData.count} phòng (tối đa ${typeData.maxAdults} người lớn, ${typeData.maxChildren} trẻ em)\n`;
            typeIndex++;
        }
        
        // Tiện nghi
        if (allAmenities.size > 0) {
            prompt += `\nTIỆN NGHI CÓ SẴN:\n`;
            var amenitiesList = Array.from(allAmenities).slice(0, 20);
            for (var m = 0; m < amenitiesList.length; m++) {
                prompt += `- ${amenitiesList[m]}\n`;
            }
        }
        
        // Chi tiết từng loại phòng
        prompt += `\nCHI TIẾT TỪNG LOẠI PHÒNG:\n`;
        typeIndex = 1;
        for (var type in roomsByType) {
            var typeData = roomsByType[type];
            if (!typeData.priceRange) continue;
            
            prompt += `${typeIndex}. ${type}:\n`;
            prompt += `   - Số lượng: ${typeData.count} phòng\n`;
            prompt += `   - Giá: ${typeData.priceRange}/đêm\n`;
            prompt += `   - Sức chứa: Tối đa ${typeData.maxAdults} người lớn, ${typeData.maxChildren} trẻ em\n`;
            
            if (typeData.amenities.size > 0) {
                var amenitiesList = Array.from(typeData.amenities).slice(0, 10);
                prompt += `   - Tiện nghi: ${amenitiesList.join(', ')}\n`;
            }
            
            if (typeData.names.length > 0) {
                prompt += `   - Ví dụ: ${typeData.names.slice(0, 3).join(', ')}\n`;
            }
            
            prompt += `\n`;
            typeIndex++;
        }
        
        prompt += `</DATA>

NHIỆM VỤ:
- Trả lời chính xác theo dữ liệu.
- Nếu khách hỏi "còn phòng không" hoặc "gợi ý phòng": dùng TOP PHÒNG LIÊN QUAN ở trên.
- Nếu khách hỏi tiện nghi: chỉ liệt kê tiện nghi có trong dữ liệu.
- Khi khách hỏi "có bao nhiêu phòng" hoặc "số lượng phòng", hãy trả lời: Tổng số ${totalAvailableRooms} phòng, và liệt kê số lượng từng loại
- Hướng dẫn khách đặt phòng qua website
- Giải đáp thắc mắc về dịch vụ
- Luôn lịch sự, thân thiện`;
        
        return prompt;
    } catch (error) {
        console.error('Error building system prompt:', error);
        return `Bạn là trợ lý AI của khách sạn QuickStay. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện và chính xác.

THÔNG TIN KHÁCH SẠN:
- Tên: QuickStay Hotel
- Dịch vụ chính: Đặt phòng khách sạn trực tuyến

Vui lòng hướng dẫn khách xem thông tin chi tiết trên website hoặc liên hệ trực tiếp.`;
    }
}

function initChatbot() {
    const button = document.getElementById('chatbotButton');
    const window = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('chatbotClose');
    const sendBtn = document.getElementById('chatbotSend');
    const input = document.getElementById('chatbotInput');

    if (!button || !window) return;

    button.addEventListener('click', () => {
        isOpen = !isOpen;
        window.classList.toggle('active', isOpen);
        if (isOpen) {
            input.focus();
            if (chatHistory.length === 0) {
                addMessage('bot', 'Xin chào! 👋 Tôi là trợ lý AI của QuickStay. Tôi có thể giúp gì cho bạn?', false);
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        isOpen = false;
        window.classList.remove('active');
    });

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function addMessage(sender, text, addToHistory = true) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    if (addToHistory && (sender === 'user' || sender === 'bot')) {
        chatHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: text });
    }
}

function showTyping() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-bubble">
            <div class="chatbot-typing">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
}

async function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSend');
    
    if (!input || !sendBtn) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    sendBtn.disabled = true;
    showTyping();
    
    try {
        // Đọc dữ liệu thực tế từ localStorage và tạo system prompt động
        const dynamicSystemPrompt = buildSystemPrompt(message);
        const trimmedHistory = chatHistory.slice(-MAX_HISTORY_TURNS);
        
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin || 'http://localhost',
                'X-Title': 'QuickStay Hotel'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: dynamicSystemPrompt },
                    ...trimmedHistory
                ],
                temperature: 0.3,
                max_tokens: 500,
                // ✅ thêm cái này
                provider: { allow_fallbacks: true }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('OpenRouter status:', response.status);
            console.log('OpenRouter errorData:', errorData);
            throw new Error(errorData?.error?.message || `Lỗi ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const botMessage = data.choices?.[0]?.message?.content || 'Xin lỗi, không thể xử lý yêu cầu.';
        
        hideTyping();
        addMessage('bot', botMessage);
        
    } catch (error) {
        console.error('Chatbot error:', error);
        hideTyping();
        
        let errorMsg = 'Xin lỗi, tôi gặp sự cố. ';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('CORS')) {
            errorMsg += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMsg += 'Lỗi xác thực API. Vui lòng liên hệ quản trị viên.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            errorMsg += 'Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
            errorMsg += 'Yêu cầu không hợp lệ. Vui lòng thử lại.';
        } else {
            errorMsg += error.message || 'Vui lòng thử lại hoặc liên hệ hotline: 1900-xxxx';
        }
        
        addMessage('bot', errorMsg);
    } finally {
        sendBtn.disabled = false;
        if (input) input.focus();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
