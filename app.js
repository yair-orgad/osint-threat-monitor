console.log("App.js נטען בהצלחה");

let state = {
    gps: 'green', air: 'green', pizza: 'green',
    poly: 'green', oil: 'green', navy: 'green'
};

function updateStatus(key, status) {
    console.log(`עדכון סטטוס: ${key} -> ${status}`);
    state[key] = status;
    updateCardUI(key, status);
    refreshGauge();
}

function updateCardUI(key, status) {
    const card = document.querySelector(`.card[data-key="${key}"]`);
    if (!card) return;

    card.classList.remove('border-emerald-500', 'border-orange-400', 'border-red-500', 'blink', 'border-slate-700');

    if (status === 'green') card.classList.add('border-emerald-500');
    else if (status === 'orange') card.classList.add('border-orange-400');
    else if (status === 'red') card.classList.add('border-red-500');
    else if (status === 'critical') card.classList.add('border-red-500', 'blink');

    const media = CONFIG.mediaMap[key];
    if (media.type === 'video') {
        const vid = card.querySelector('video');
        const source = vid.querySelector('source');
        if (source) {
            source.src = `${media.prefix}_${status}.mp4`;
            vid.load();
            vid.play().catch(() => {});
        }
    } else if (media.type === 'image') {
        const img = card.querySelector('img');
        if (img) img.src = `${media.prefix}_${status}.png`;
    }
}

function refreshGauge() {
    let total = 0;
    for (const key in state) {
        total += CONFIG.weights[key] * CONFIG.statusScore[state[key]];
    }
    const score = Math.round(total);
    document.getElementById('scoreText').textContent = score + '%';
    const needle = document.getElementById('needle');
    if (needle) {
        const deg = -90 + (score * 180 / 100);
        needle.style.transform = `rotate(${deg - 90}deg)`;
    }
}

function setAll(status) {
    Object.keys(state).forEach(key => {
        const select = document.querySelector(`.card[data-key="${key}"] select`);
        if (select) select.value = status;
        updateStatus(key, status);
    });
}
// --- ADVERTISEMENT SLIDESHOW ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. רשימת התמונות שלך (שנה את השמות לפי מה ששמרת בתיקיית media)
    const adImages = [
        "ad1.png",
        "ad2.png",
        "ad3.png",
        "ad4.png",
        "ad5.png",
        "ad6.png",
        "ad7.png",
        "ad8.png"

        
    ];

    const imgElement = document.getElementById('adImage');
    let currentIndex = 0;

    // וודא שהאלמנט קיים לפני שמריצים את הקוד
    if (imgElement && adImages.length > 1) {
        
        setInterval(() => {
            // שלב א: הפחתת שקיפות (Fade Out)
            imgElement.style.opacity = 0;

            // שלב ב: החלפת התמונה בזמן שהיא "בלתי נראית" (אחרי חצי שניה)
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % adImages.length; // קידום האינדקס בלופ
                imgElement.src = adImages[currentIndex];
                
                // שלב ג: החזרת השקיפות (Fade In)
                imgElement.style.opacity = 1;
            }, 500); // מחכים 500 מילישניות (זמן האנימציה ב-CSS)

        }, 4000); // כל 2.5 שניות (2500 מילישניות)
    }
});
// --- HUMOROUS AD FUNCTONALITY ---
document.addEventListener('DOMContentLoaded', () => {
    const buyBtn = document.getElementById('buyBtn');
    const contactInfo = document.getElementById('contactInfo');

    if (buyBtn && contactInfo) {
        buyBtn.addEventListener('click', function() {
            // Toggle visibility
            contactInfo.classList.toggle('hidden');
            
            // Change button appearance after click
            if (!contactInfo.classList.contains('hidden')) {
                this.innerHTML = "👇 See Info Below 👇";
                this.classList.remove('from-yellow-600', 'to-yellow-500', 'text-slate-950', 'shadow-[0_0_15px_rgba(234,179,8,0.3)]');
                this.classList.add('bg-slate-800', 'text-slate-400', 'cursor-default');
                // Optional: Disable further clicks
                // this.disabled = true;
            }
        });
    }
});