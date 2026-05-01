class RealPersonalAgent {
    constructor() {
        this.chatArea = document.getElementById('chatArea');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        
        // মেমোরি সিস্টেম – প্রসঙ্গ ধরে রাখে
        this.conversationHistory = [];
        this.userContext = {
            mood: null,
            lastTopic: null,
            pendingQuestions: [],
            decisions: []
        };
        
        // ইউজার ডেটা
        this.userName = this.getFromStorage('user_name', 'আপনি');
        this.agentName = this.getFromStorage('agent_name', 'পাপিয়া');
        
        this.init();
    }
    
    getFromStorage(key, defaultValue) {
        let val = localStorage.getItem(key);
        return val ? val : defaultValue;
    }
    
    saveToStorage(key, value) {
        localStorage.setItem(key, value);
    }
    
    init() {
        // UI এলিমেন্ট আপডেট
        document.querySelector('.agent-name').innerText = `(${this.agentName})`;
        document.querySelector('.agent-name').onclick = () => this.changeAgentName();
        
        this.sendBtn.onclick = () => this.handleUserInput();
        this.userInput.onkeypress = (e) => { if(e.key === 'Enter') this.handleUserInput(); };
        
        // ভয়েস
        if(this.voiceBtn) {
            this.voiceBtn.onclick = () => this.startVoice();
        }
        
        // চিপস
        document.querySelectorAll('.chip').forEach(chip => {
            chip.onclick = () => {
                this.userInput.value = chip.getAttribute('data-msg');
                this.handleUserInput();
            };
        });
        
        // মেমরি কাউন্ট আপডেট
        this.updateMemoryBadge();
        
        // স্বাগতম (টাইম বেজড)
        this.greetingBasedOnTime();
    }
    
    updateMemoryBadge() {
        let notes = JSON.parse(localStorage.getItem('agent_notes') || '[]');
        document.getElementById('memoryCount').innerText = notes.length;
    }
    
    changeAgentName() {
        let newName = prompt("আপনার অ্যাসিস্ট্যান্টের নতুন নাম দিন:", this.agentName);
        if(newName && newName.trim()) {
            this.agentName = newName.trim();
            this.saveToStorage('agent_name', this.agentName);
            document.querySelector('.agent-name').innerText = `(${this.agentName})`;
            this.addMessage(`ঠিক আছে, এখন থেকে আমাকে "${this.agentName}" নামে ডাকবেন।`, 'bot');
        }
    }
    
    greetingBasedOnTime() {
        const hour = new Date().getHours();
        let greeting = "";
        if(hour < 12) greeting = "শুভ সকাল";
        else if(hour < 17) greeting = "শুভ দুপুর";
        else greeting = "শুভ সন্ধ্যা";
        
        setTimeout(() => {
            this.addMessage(`${greeting} ${this.userName}। আমি ${this.agentName}। আপনার আজ কেমন কাটছে? খোলামেলা কথা বলুন, আমি আপনার পাশে আছি।`, 'bot');
        }, 800);
    }
    
    async startVoice() {
        if(!('webkitSpeechRecognition' in window)) {
            this.addMessage("ভয়েস সাপোর্টের জন্য Chrome ব্রাউজার ব্যবহার করুন", 'bot');
            return;
        }
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'bn-IN';
        recognition.start();
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.userInput.value = text;
            this.handleUserInput();
        };
    }
    
    addMessage(text, sender, isTyping = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
        
        if(sender === 'bot') {
            msgDiv.innerHTML = `<div class="avatar">🤵</div><div class="msg-content">${text.replace(/\n/g, '<br>')}</div>`;
        } else {
            msgDiv.innerHTML = `<div class="msg-content">${text}</div>`;
        }
        
        this.chatArea.appendChild(msgDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
        
        // হিস্ট্রিতে সেভ
        this.conversationHistory.push({ role: sender, text: text, time: Date.now() });
        if(this.conversationHistory.length > 40) this.conversationHistory.shift();
    }
    
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `<div class="avatar">🤵</div><div class="msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        this.chatArea.appendChild(typingDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }
    
    removeTyping() {
        const typing = document.getElementById('typingIndicator');
        if(typing) typing.remove();
    }
    
    async handleUserInput() {
        const userText = this.userInput.value.trim();
        if(!userText) return;
        
        this.addMessage(userText, 'user');
        this.userInput.value = '';
        this.showTyping();
        
        // বুদ্ধিমান রেসপন্স জেনারেট (কৃত্রিম বিলম্ব সহ)
        setTimeout(() => {
            this.removeTyping();
            const reply = this.intelligentReply(userText);
            this.addMessage(reply, 'bot');
            
            // প্রসঙ্গ আপডেট
            this.updateContext(userText);
        }, 600 + Math.random() * 400);
    }
    
    updateContext(userText) {
        const lower = userText.toLowerCase();
        if(lower.includes('টেনশন') || lower.includes('প্রেশার') || lower.includes('দুঃখ')) {
            this.userContext.mood = 'stressed';
        } else if(lower.includes('খুশি') || lower.includes('ভালো লাগছে') || lower.includes('উচ্ছ্বাস')) {
            this.userContext.mood = 'happy';
        } else if(lower.includes('রাগ') || lower.includes('বিরক্ত')) {
            this.userContext.mood = 'angry';
        }
        
        // শেষ টপিক মনে রাখা
        this.userContext.lastTopic = userText.slice(0, 100);
    }
    
    intelligentReply(msg) {
        const lower = msg.toLowerCase();
        
        // ========== কন্টেক্সট মেমোরি চেক (আগের কথা মনে করিয়ে দেওয়া) ==========
        if(lower.includes('আগে বলেছিলাম') || lower.includes('মনে আছে') || lower.includes('আমি আগে')) {
            if(this.conversationHistory.length > 2) {
                let lastUserMsg = [...this.conversationHistory].reverse().find(m => m.role === 'user');
                if(lastUserMsg) {
                    return `🧠 মনে আছে, আপনি বলেছিলেন: "${lastUserMsg.text.slice(0, 100)}..."। তারপর থেকে কী পরিবর্তন হয়েছে? আমি শুনতে চাই।`;
                }
            }
            return "আপনি আগে অনেক কিছু বলেছেন। কোন বিষয়টা বলছেন? একটু বলুন, তাহলে আমি সেটার প্রসঙ্গ ধরে কথা বলব।";
        }
        
        // ========== ইমোশন ডিটেক্ট (মুড বুঝে রেসপন্স) ==========
        if(lower.includes('টেনশন') || lower.includes('মাথা ব্যথা') || lower.includes('প্রেশার')) {
            return "😟 আপনি টেনশনে আছেন দেখছি। আমার অভিজ্ঞতা বলছে, টেনশন কমানোর সবচেয়ে ভালো উপায় হলো — একটা কাজ শেষ করা। আপনি এখন সবচেয়ে ছোট যে কাজটা পারেন, সেটা করুন। আর কথা বলতে চাইলে আমি আছি।";
        }
        
        if(lower.includes('খুশি') || lower.includes('ভালো লাগছে') || lower.includes('উদযাপন')) {
            return "🎉 খুব ভালো লাগছে শুনে! আপনার এই আনন্দের মুহূর্তে আমি গর্বিত। চাইলে বলুন কেন这么好 লাগছে? আমি সেটা নোট করে রাখতে পারি।";
        }
        
        if(lower.includes('রাগ') || lower.includes('বিরক্ত') || lower.includes('ক্ষেপে')) {
            return "😤 বুঝতে পারছি, রাগ হচ্ছে। রাগকে কাজে লাগান — ৫ মিনিট হাঁটুন, গভীর শ্বাস নিন। তারপর ফিরে আসুন, একসাথে সমাধান বের করব। রাগের সঠিক ব্যবহারই বড় শক্তি।";
        }
        
        // ========== সিদ্ধান্ত নিতে সাহায্য (প্রো কনস) ==========
        if(lower.includes('সিদ্ধান্ত') || lower.includes('কি করা উচিত') || lower.includes('কোনটা ভালো') || (lower.includes('নাকি') && lower.includes('?'))) {
            return this.decisionHelper(msg);
        }
        
        // ========== ক্যারিয়ার / পড়াশোনা / চাকরি ==========
        if(lower.includes('ক্যারিয়ার') || lower.includes('চাকরি') || lower.includes('পড়াশোনা') || lower.includes('ভবিষ্যৎ')) {
            return "🎓 ক্যারিয়ার নিয়ে ভাবা ভালো লক্ষণ। নিজেকে প্রশ্ন করুন: ১) আমি কী করতে ভালোবাসি? ২) বাজারে তার চাহিদা কেমন? ৩) শিখতে কত সময় লাগবে? আপনি যদি আরও বিস্তারিত বলেন, আমি আরও নির্দিষ্ট পরামর্শ দিতে পারব।";
        }
        
        // ========== ডেইলি রুটিন ==========
        if(lower.includes('রুটিন') || lower.includes('ডেইলি') || lower.includes('আজকে কি করব')) {
            return this.makeRoutine();
        }
        
        // ========== প্রোডাক্টিভিটি + উৎসাহ ==========
        if(lower.includes('অলস') || lower.includes('কাজ করতে ইচ্ছে করছে না')) {
            const tips = [
                "আপনি অলস লাগছে? সবচেয়ে কঠিন কাজটাকে ছোট ছোট ভাগে ভাগ করুন। শুধু ৫ মিনিটের কাজ শুরু করুন — বাকিটা নিজেই হবে।",
                "আমি জানি মাঝে মাঝে মন কাজ চায় না। কিন্তু আপনি আগেও অনেক কঠিন কাজ করেছেন। এই মুহূর্তে একটা ছোট পদক্ষেপ নিন। আমি আপনার সাফল্যে বিশ্বাস করি।"
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }
        
        // ========== নোট ও রিমাইন্ডার ==========
        if(lower.includes('মনে রাখ') || lower.includes('নোট') || lower.includes('রিমাইন্ডার')) {
            return this.saveUserNote(msg);
        }
        
        // ========== প্রশ্ন করবে (পিএ-র মতো) ==========
        if(lower.includes('কেমন আছ') || lower.includes('কী অবস্থা')) {
            return `আমি আপনার জন্যই আছি। আপনি কেমন আছেন সেটাই গুরুত্বপূর্ণ। আসলে বলুন তো, আজকে কী বিশেষ কিছু হয়েছে?`;
        }
        
        // ========== জেনেরিক কিন্তু ব্যক্তিগতকৃত ==========
        return this.genericThoughtfulReply(msg);
    }
    
    decisionHelper(msg) {
        return "🤔 সিদ্ধান্ত নেওয়ার আগে ২ দিক দেখুন: 👍 ভালো দিক আর 👎 খারাপ দিক।\n\nআপনি কি সিদ্ধান্ত নিতে চান? সেটা লিখুন। আমি আপনার জন্য pros & cons বানিয়ে দেব।\n\nউদাহরণ: 'চাকরি পরিবর্তন করা উচিত নাকি না?'";
    }
    
    makeRoutine() {
        const hour = new Date().getHours();
        let routine = `📋 ${this.userName} এর আজকের পরামর্শ:\n\n`;
        
        if(hour < 10) {
            routine += "🌅 সকাল: সবচেয়ে গুরুত্বপূর্ণ ১টি কাজ শেষ করুন। (২ ঘণ্টা)\n";
            routine += "🍚 দুপুর: হালকা কাজ ও পড়াশোনা।\n";
            routine += "🌙 রাত: আগামীকালের প্ল্যান করুন ১০ মিনিট।\n";
        } else if(hour < 15) {
            routine += "⏰ এখন দুপুর। এনার্জি কম থাকলে ১৫ মিনিট হাঁটুন।\n";
            routine += "📌 বিকেলের আগে ২টি ছোট কাজ শেষ করুন।\n";
            routine += "☕ চা/কফি ব্রেক নিয়ে আবার শুরু করুন।\n";
        } else {
            routine += "🌆 সন্ধ্যা/রাত: আজকে যা করেনি, তার জন্য নিজেকে দোষ দেবেন না।\n";
            routine += "📝 আগামীকালের জন্য ৩টি কাজ লিখে ফেলুন।\n";
            routine += "🛌 ভালো ঘুম সবচেয়ে বড় অ্যাসেট। রাত ১২টার আগে ঘুমানোর চেষ্টা করুন।\n";
        }
        
        routine += "\n👉 চাইলে বলুন 'আমার জন্য টাস্ক লিস্ট বানাও' — আমি দিয়ে দেব।";
        return routine;
    }
    
    saveUserNote(msg) {
        let noteText = msg.replace(/মনে রাখ|নোট|রিমাইন্ডার/gi, '').trim();
        if(noteText.length < 3) {
            return "আপনি যা মনে রাখতে চান, সেটা বলুন। যেমন: 'মনে রাখো কাল ১০টায় ডাক্তার দেখাব'";
        }
        
        let notes = JSON.parse(localStorage.getItem('agent_notes') || '[]');
        notes.push({ text: noteText, date: new Date().toLocaleString(), important: false });
        localStorage.setItem('agent_notes', JSON.stringify(notes));
        this.updateMemoryBadge();
        
        return `📝 "${noteText}" — আমি মনে রেখেছি। \nআপনি চাইলে "আমার নোটগুলো দেখাও" বলতে পারেন।`;
    }
    
    genericThoughtfulReply(msg) {
        const thoughtful = [
            `বুঝেছি ${this.userName}। আসলে প্রতিটা মানুষের জীবনে ভালো-মন্দ দিন আসে। আমি আপনার সাথে আছি। আপনি যা ভাবছেন, বিস্তারিত বলুন — তাহলে আমি আরও নির্দিষ্ট করে বলতে পারব।`,
            `আমি ${this.agentName} হিসেবে বলছি, আপনি যা চিন্তা করছেন তা গুরুত্বপূর্ণ। আপনি যদি চান, আমি সেটাকে বিশ্লেষণ করে দিতে পারি।`,
            `আপনার কথা শুনে মনে হচ্ছে আপনি মনোযোগ দিয়ে ভাবছেন। সঠিক সিদ্ধান্ত নিতে হলে ভয় পাবেন না — ভুল থেকে শেখাটাই আসল।`
        ];
        return thoughtful[Math.floor(Math.random() * thoughtful.length)];
    }
}

// অ্যাসিস্ট্যান্ট লোড করা
window.onload = () => {
    window.realAgent = new RealPersonalAgent();
};