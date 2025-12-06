const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'x-ai/grok-4.1-fast:free';

let chatHistory = [];
let isOpen = false;

// Hàm xây dựng system prompt từ dữ liệu thực tế
function buildSystemPrompt() {
    try {
        var rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        
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
        var prompt = `Bạn là trợ lý AI của khách sạn QuickStay. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện và chính xác.

THÔNG TIN KHÁCH SẠN:
- Tên: QuickStay Hotel
- Dịch vụ chính: Đặt phòng khách sạn trực tuyến
- TỔNG SỐ PHÒNG CÓ SẴN: ${totalAvailableRooms} phòng

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
        
        prompt += `NHIỆM VỤ:
- Trả lời CHÍNH XÁC về số lượng phòng, giá phòng, loại phòng, tiện nghi dựa trên thông tin trên
- Khi khách hỏi "có bao nhiêu phòng" hoặc "số lượng phòng", hãy trả lời: Tổng số ${totalAvailableRooms} phòng, và liệt kê số lượng từng loại
- Hướng dẫn khách đặt phòng qua website
- Giải đáp thắc mắc về dịch vụ
- Luôn lịch sự, thân thiện

LƯU Ý:
- CHỈ cung cấp thông tin có trong danh sách trên
- Khi trả lời về số lượng phòng, luôn cung cấp cả tổng số và số lượng từng loại
- Nếu không biết, hướng dẫn khách xem chi tiết trên website hoặc liên hệ hotline
- Giá có thể thay đổi, khuyến khích khách kiểm tra trên website để có giá chính xác nhất`;
        
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
        const dynamicSystemPrompt = buildSystemPrompt();
        
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
                    ...chatHistory
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Lỗi ${response.status}: ${response.statusText}`);
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
