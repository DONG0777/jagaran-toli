// পার্সোনাল AI অ্যাসিস্ট্যান্ট - সম্পূর্ণ নিজস্ব সাজেশন ইঞ্জিন

class PersonalAgent {
    constructor() {
        this.chatArea = document.getElementById('chatArea');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        
        // আগের কথাগুলো মনে রাখার জন্য
        this.memory = [];
        this.userName = this.getUserName();
        
        this.init();
    }
    
    getUserName() {
        let name = localStorage.getItem('user_name');
        if(!name) {
            name = "আমার বন্ধু";
            localStorage.setItem('user_name', name);
        }
        return name;
    }
    
    init() {
        this.sendBtn.onclick = () => this.processUserMessage();
        this.userInput.onkeypress = (e) => { if(e.key === 'Enter') this.processUserMessage(); };
        
        // ভয়েস (যদি মাইক্রোফোন থাকে)
        if(this.voiceBtn) {
            this.voiceBtn.onclick = () => this.startVoiceInput();
        }
        
        // কুইক বাটন
        document.querySelectorAll('.quick').forEach(btn => {
            btn.onclick = () => {
                this.userInput.value = btn.getAttribute('data-msg');
                this.processUserMessage();
            };
        });
        
        // স্বাগতম সাজেশন
        this.giveMorningSuggestion();
    }
    
    async startVoiceInput() {
        if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.addMessage("🎤 আপনার ব্রাউজার ভয়েস সাপোর্ট করে না। Chrome ব্যবহার করুন।", "bot");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-IN';
        recognition.start();
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.userInput.value = text;
            this.processUserMessage();
        };
        recognition.onerror = () => {
            this.addMessage("ভয়েস শুনতে সমস্যা হয়েছে, আবার চেষ্টা করুন।", "bot");
        };
    }
    
    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user' ? 'message user-message' : 'message bot-message';
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        this.chatArea.appendChild(msgDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
        
        // মেমরিতে সেভ
        this.memory.push({ role: sender, text: text, time: new Date().toLocaleTimeString() });
        if(this.memory.length > 50) this.memory.shift();
    }
    
    processUserMessage() {
        const userText = this.userInput.value.trim();
        if(!userText) return;
        
        this.addMessage(userText, 'user');
        this.userInput.value = '';
        
        // একটু দেরিতে উত্তর দেবে (প্রাকৃতিক লাগবে)
        setTimeout(() => {
            const reply = this.getSmartReply(userText);
            this.addMessage(reply, 'bot');
        }, 400);
    }
    
    // এটাই মূল AI সাজেশন ইঞ্জিন (আপনার পার্সোনাল চিন্তাচেতনা অনুযায়ী কাজ করবে)
    getSmartReply(msg) {
        const lowerMsg = msg.toLowerCase();
        
        // ========== ডেইলি প্ল্যানিং ==========
        if(lowerMsg.includes('প্ল্যান') || lowerMsg.includes('ডেইলি') || lowerMsg.includes('আজকে কি করব') || lowerMsg.includes('শিডিউল')) {
            return this.makeDailyPlan(lowerMsg);
        }
        
        // ========== প্রোডাক্টিভিটি ==========
        if(lowerMsg.includes('প্রোডাক্টিভ') || lowerMsg.includes('অলস') || lowerMsg.includes('কাজ করছি না') || lowerMsg.includes('এনার্জি কম')) {
            return this.productivityAdvice();
        }
        
        // ========== নোট ও রিমাইন্ডার (স্মৃতি) ==========
        if(lowerMsg.includes('মনে রাখ') || lowerMsg.includes('নোট কর') || lowerMsg.includes('রিমাইন্ডার')) {
            return this.saveReminder(msg);
        }
        
        // ========== সাজেশন (PA স্টাইল) ==========
        if(lowerMsg.includes('সাজেশন') || lowerMsg.includes('কী করা উচিত') || lowerMsg.includes('উপায়')) {
            return this.professionalSuggestion(msg);
        }
        
        // ========== কেমন আছো, ইত্যাদি ==========
        if(lowerMsg.includes('তোমার নাম') || lowerMsg.includes('কে তুমি')) {
            return "আমি আপনার ব্যক্তিগত AI সহায়ক। আমার কোন নাম নেই, কারণ আপনি আমাকে নিজের মতো করে ডাকতে পারেন। চাইলে আজ থেকেই আমাকে 'পাপিয়া' বা আপনার পছন্দের নাম দিন।";
        }
        
        if(lowerMsg.includes('হ্যালো') || lowerMsg.includes('নমস্কার') || lowerMsg.includes('নমস্তে')) {
            return `নমস্কার ${this.userName}! আজ আপনি কীভাবে দিন কাটাতে চান? আমি আপনার সাথে আছি।`;
        }
        
        if(lowerMsg.includes('ধন্যবাদ')) {
            return "আপনাকে অসংখ্য ধন্যবাদ। আমি সবসময় আপনার পাশে আছি।";
        }
        
        // ========== জেনেরিক বুদ্ধিমান উত্তর ==========
        return this.thoughtfulResponse(msg);
    }
    
    makeDailyPlan(userMessage) {
        const now = new Date();
        const hours = now.getHours();
        let timeOfDay = hours < 12 ? "সকাল" : (hours < 17 ? "দুপুর" : "সন্ধ্যা");
        
        let plan = `📋 **আজকের (${
            now.toLocaleDateString('bn-BD')
        }) ডেইলি প্ল্যান** (আপনার কথার ভিত্তিতে):\n\n`;
        
        if(userMessage.includes('মিটিং') || userMessage.includes('কল') || userMessage.includes('অ্যাপয়েন্টমেন্ট')) {
            plan += "✅ আপনার বলা মিটিংগুলো আছে। সাজেশন: আগে গুরুত্বপূর্ণ কাজগুলো করুন।\n";
        } else {
            plan += "✅ সাজেশন: সকাল ১ ঘণ্টা গভীর কাজে দিন। তারপর ব্রেক নেবেন।\n";
        }
        
        plan += `✅ ${timeOfDay} পর্যন্ত: গুরুত্বপূর্ণ কাজ শেষ করুন।\n`;
        plan += "✅ দুপুরের পর: হালকা কাজ ও শেখার জন্য সময় রাখুন।\n";
        plan += "✅ রাতে: আগামীকালের পরিকল্পনা করুন ১০ মিনিট।\n\n";
        plan += "👉 চাইলে আমাকে বলে দিতে পারেন 'এক্সেল শিখতে চাই' বা 'বিকেলে দোকান যাব' - আমি সাজেশন দিয়ে দেব।";
        
        return plan;
    }
    
    productivityAdvice() {
        const advices = [
            "🎯 আপনি যদি আজ অলস লাগেন, তবে সবচেয়ে ছোট কাজটা দিয়ে শুরু করুন। ২ মিনিটের কাজ শুরু করলেই মন বসে যায়।",
            "🧠 আপনার মস্তিষ্ককে রিফ্রেশ করতে ৫ মিনিট হাঁটুন বা জানালা খুলে দাঁড়ান। এরপর ফিরে কাজ করুন, ফল ভালো পাবেন।",
            "📌 আজকের ৩টি সবচেয়ে গুরুত্বপূর্ণ কাজ লিখে ফেলুন। প্রথমটি শেষ না করে দ্বিতীয়টিতে যাবেন না। আমি আপনার অগ্রগতি দেখতে চাই।",
            "💡 আপনি যা করতে চান, তাকে খুব ছোট ছোট ভাগে ভাগ করে ফেলুন। তারপর একটা করে সারুন। বিশ্বাস করুন, এটাই সবচেয়ে বুদ্ধিমানের কাজ।"
        ];
        return advices[Math.floor(Math.random() * advices.length)];
    }
    
    saveReminder(msg) {
        const reminderText = msg.replace(/মনে রাখ|নোট কর|রিমাইন্ডার/gi, '').trim();
        if(reminderText.length > 2) {
            let reminders = JSON.parse(localStorage.getItem('my_reminders') || '[]');
            reminders.push({ text: reminderText, date: new Date().toISOString() });
            localStorage.setItem('my_reminders', JSON.stringify(reminders));
            return `📝 আমি মনে রেখেছি: "${reminderText}"। \nআপনি চাইলে বলতে পারেন "আমার নোটগুলো দেখাও"।`;
        } else {
            return "আপনি কী মনে রাখতে চান, তা বলেন। যেমন: 'আজ বিকাল ৫টায় ফোন করব মনে রেখো'।";
        }
    }
    
    professionalSuggestion(msg) {
        let suggestion = "";
        if(msg.includes("মিটিং")) {
            suggestion = "💼 মিটিং সাজেশন: আগে এজেন্ডা পড়ে নিন। নিজের ২টি কথা নির্ধারণ করে রাখুন। শেষে ১টি স্পষ্ট করণীয় ঠিক করুন।";
        } else if(msg.includes("প্রেজেন্টেশন") || msg.includes("উপস্থাপনা")) {
            suggestion = "🎤 দুর্দান্ত প্রেজেন্টেশনের জন্য: গল্প দিয়ে শুরু করুন, কম টেক্সট বেশি ভিজুয়াল দিন, শেষে একটি শক্তিশালী বার্তা রাখুন।";
        } else if(msg.includes("লিডার") || msg.includes("বস") || msg.includes("ম্যানেজার")) {
            suggestion = "👔 ভালো নেতৃত্বের গোপন কথা: বেশি বলবেন না, বেশি শুনবেন। প্রতিটি টিম মেম্বারকে মূল্যবান অনুভব করান।";
        } else {
            suggestion = "🧭 সাজেশন: আগে লক্ষ্য স্থির করুন। 'কেন করছি' সেটা পরিষ্কার থাকলে 'কী করব' নিজেই আসে। আমি আপনার সাথে প্রতিদিন কাজ করতে চাই।";
        }
        return suggestion;
    }
    
    thoughtfulResponse(msg) {
        const thoughtful = [
            `বেশ চিন্তা করছেন। আসলে ${this.userName}, প্রতিটি সিদ্ধান্তের আগে একটু থামা ভালো। আমি আপনার সাথে আছি। বিস্তারিত জানালে ভালো সাজেশন দিতে পারব।`,
            "আপনার চিন্তাটি গুরুত্বপূর্ণ। আপনি যদি চান, আমি পরিস্থিতিটিকে ভেঙে ভেঙে বিশ্লেষণ করে দিতে পারি। 'আমার একটা সমস্যা আছে' লিখে বিস্তারিত বলুন।",
            "একজন ভালো সহায়ক যেমন করে, আমি বলব: বড় চিন্তাগুলোকে ছোট ছোট প্রশ্নে ভাগ করুন। তারপর উত্তরগুলো লিখুন। আপনি নিজেই সমাধান পেয়ে যাবেন।"
        ];
        return thoughtful[Math.floor(Math.random() * thoughtful.length)];
    }
    
    giveMorningSuggestion() {
        const hour = new Date().getHours();
        if(hour < 12) {
            setTimeout(() => {
                this.addMessage("🌅 শুভ সকাল! আজকের দিনটা দুর্দান্ত করতে চাইলে একটি কাজ করবেন: 'আজকের ৩টি লক্ষ্য' নির্ধারণ করুন। আমি আপনার সাথে আছি।", "bot");
            }, 1000);
        }
    }
}

// অ্যাসিস্ট্যান্ট চালু করুন
window.onload = () => {
    window.agent = new PersonalAgent();
};