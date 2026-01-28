// js/fetcher.js

async function initDataFetcher() {
    console.log("Starting OSINT Dashboard (Stable Proxy Fix)...");
    
    // הפעלה ראשונית
    await fetchPolymarket();
    await fetchOil();
    await fetchAir();
    await fetchPizza();
    await fetchNavy();
    await fetchGPS();

    // רענון אוטומטי כל דקה
    setInterval(() => {
        fetchPolymarket();
        fetchOil();
        fetchAir();
        fetchPizza();
        fetchNavy();
        fetchGPS();
    }, 60000);
}

// --- 1. POLYMARKET ---
async function fetchPolymarket() {
    try {
        const slug = "us-strikes-iran-by";
        const targetUrl = `https://gamma-api.polymarket.com/events?slug=${slug}`;
        const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl) + `&t=${Date.now()}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) return;
        const data = await response.json();
        const event = Array.isArray(data) ? data[0] : data;
        if (!event || !event.markets) return;

        const targetMarket = event.markets.find(market => {
            const q = market.question || "";
            const end = market.endDate || "";
            return q.includes("June 30") && (q.includes("2026") || end.includes("2026"));
        });

        if (targetMarket) {
            let outcomePrices = typeof targetMarket.outcomePrices === 'string' 
                ? JSON.parse(targetMarket.outcomePrices) 
                : targetMarket.outcomePrices;
            const probability = parseFloat(outcomePrices[0]) * 100;
            determinePolyStatus(probability);
        }
    } catch (e) { console.error("Poly Error", e); }
}

function determinePolyStatus(percentage) {
    let status = 'green';
    if (percentage >= 30 && percentage < 60) status = 'orange';
    else if (percentage >= 60 && percentage < 85) status = 'red';
    else if (percentage >= 85) status = 'critical';
    if (typeof updateStatus === 'function') {
        updateStatus('poly', status);
        addLabel('poly', `Chance: ${percentage.toFixed(1)}%`, status);
    }
}

// --- 2. OIL ---
async function fetchOil() {
    try {
        const symbol = "BZ=F"; 
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
        const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl) + `&t=${Date.now()}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        determineOilStatus(price);
    } catch (e) { console.error("Oil Error", e); }
}

function determineOilStatus(price) {
    let status = 'green';
    if (price < 82) status = 'green';
    else if (price >= 82 && price < 90) status = 'orange';
    else if (price >= 90 && price < 100) status = 'red';
    else status = 'critical';
    if (typeof updateStatus === 'function') {
        updateStatus('oil', status);
        addLabel('oil', `Brent: $${price.toFixed(2)}`, status);
    }
}

// --- 3. AIR TRAFFIC ---
async function fetchAir() {
    try {
        const lamin = 25.00, lomin = 45.00, lamax = 38.00, lomax = 55.00;
        const targetUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
        const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl);
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const count = data.states ? data.states.length : 0;
        
        let status = 'green';
        if (count > 120) status = 'green';
        else if (count >= 35 && count <= 120) status = 'orange';
        else status = 'red'; 
        
        if (typeof updateStatus === 'function') {
            updateStatus('air', status);
            addLabel('air', `${count} Flights`, status);
        }
    } catch (e) { console.error("Air Error", e); }
}

// --- 4. PIZZA INDEX ---
async function fetchPizza() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // הארכתי ל-5 שניות
    const targetUrl = "https://www.pizzint.watch/";
    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl);

    try {
        const response = await fetch(proxyUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("Pizza site blocked");
        const htmlText = await response.text();
        let foundLevel = null;
        
        // חיפוש גמיש יותר
        const levelMatch = htmlText.match(/Level\s*([1-5])/i);
        if (levelMatch && levelMatch[1]) foundLevel = parseInt(levelMatch[1]);
        if (!foundLevel) {
            if (htmlText.includes("High")) foundLevel = 4;
            else if (htmlText.includes("Critical")) foundLevel = 5;
        }
        
        if (foundLevel) determinePizzaLevel(foundLevel);
        else throw new Error("No level found");
    } catch (e) {
        await calculatePizzaInternal(); 
    } finally {
        clearTimeout(timeoutId);
    }
}

async function calculatePizzaInternal() {
    try {
        const dcTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York", hour: '2-digit', hour12: false});
        const hour = parseInt(dcTime);
        const isDeepNight = (hour >= 22 || hour <= 5);
        const isEvening = (hour >= 19 && hour < 22);

        const rssUrl = "https://news.google.com/rss/search?q=Pentagon+Iran&hl=en-US&gl=US&ceid=US:en";
        const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(rssUrl);
        const response = await fetch(proxyUrl);
        const str = await response.text();
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        const items = data.querySelectorAll("item");
        
        let newsCount = 0;
        const now = new Date();
        const timeLimit = new Date(now.getTime() - (4 * 60 * 60 * 1000));
        items.forEach(item => { if (new Date(item.querySelector("pubDate").textContent) > timeLimit) newsCount++; });

        let calculatedLevel = 1;
        if (isDeepNight) {
            calculatedLevel = 3; 
            if (newsCount > 0) calculatedLevel = 4; 
            if (newsCount > 3) calculatedLevel = 5; 
        } else if (isEvening) {
            calculatedLevel = 2;
            if (newsCount > 5) calculatedLevel = 4;
        } else {
            if (newsCount > 10) calculatedLevel = 4;
        }
        determinePizzaLevel(calculatedLevel);
    } catch (e) { determinePizzaLevel(1); }
}

function determinePizzaLevel(level) {
    let status = 'green';
    let text = `Level ${level}`;
    switch (level) {
        case 1: status = 'green'; text += " (Low)"; break;
        case 2: status = 'green'; text += " (Normal)"; break;
        case 3: status = 'green'; text += " (Elevated)"; break;
        case 4: status = 'orange'; text += " (High)"; break;
        case 5: status = 'red'; text += " (Critical)"; break;
    }
    if (typeof updateStatus === 'function') {
        updateStatus('pizza', status);
        addLabel('pizza', text, status);
    }
}

// --- 5. NAVY (Maximum Sensitivity Mode) ---
async function fetchNavy() {
    // מיפוי שמות
    const carriersMap = {
        "Lincoln": ["lincoln", "abraham lincoln", "cvn 72", "cvn-72"],
        "Truman": ["truman", "harry s. truman", "cvn 75", "cvn-75"],
        "Eisenhower": ["eisenhower", "ike", "cvn 69", "cvn-69"],
        "Ford": ["ford", "gerald r. ford", "cvn 78", "cvn-78"],
        "Roosevelt": ["roosevelt", "theodore roosevelt", "cvn 71", "cvn-71"],
        "Reagan": ["reagan", "ronald reagan", "cvn 76", "cvn-76"],
        "Bush": ["bush", "george h.w. bush", "cvn 77", "cvn-77"],
        "Vinson": ["vinson", "carl vinson", "cvn 70", "cvn-70"],
        "Nimitz": ["nimitz", "chester nimitz", "cvn 68", "cvn-68"],
        "Washington": ["washington", "george washington", "cvn 73", "cvn-73"]
    };

    const supportKeywords = ["Strike Group", "Destroyers", "Cruisers", "Escorts", "Armada", "CSG"];
    
    // רשימת אזורים "חמים"
    const regionKeywords = ["mediterranean", "red sea", "persian gulf", "arabian sea", "middle east", "centcom", "indian ocean", "5th fleet", "suez"];

    // שאילתה רחבה
    const regionsQuery = "(Mediterranean OR Red Sea OR Persian Gulf OR Arabian Sea OR Middle East OR CENTCOM OR \"Indian Ocean\" OR \"5th Fleet\")";
    const rssUrl = `https://news.google.com/rss/search?q=("USS" OR "Aircraft Carrier" OR "CVN" OR "Strike Group")+${regionsQuery}+when:3d&hl=en-US&gl=US&ceid=US:en`;
    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(rssUrl) + `&t=${Date.now()}`;

    try {
        const response = await fetch(proxyUrl);
        const str = await response.text();
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        const items = data.querySelectorAll("item");

        let detectedCarriers = new Set();
        let massiveSupport = false;
        let generalAlert = false;

        console.log(`Navy Scan: Checking ${items.length} items (Aggressive Mode)...`);

        items.forEach(item => {
            const title = item.querySelector("title").textContent;
            const desc = item.querySelector("description") ? item.querySelector("description").textContent : "";
            const text = (title + " " + desc).toLowerCase();

            // 1. בדיקה האם יש שם של ספינה + שם של אזור באותו טקסט
            // ביטלנו את הצורך במילת פועל (deploy/arrive) - המיקום מספיק!
            for (const [mainName, aliases] of Object.entries(carriersMap)) {
                // בדיקת שם ספינה
                const foundAlias = aliases.some(alias => text.includes(alias));
                
                if (foundAlias) {
                    // בדיקת אזור
                    const foundRegion = regionKeywords.some(region => text.includes(region));
                    
                    if (foundRegion) {
                        detectedCarriers.add(mainName);
                        console.log(`>>> DETECTED: USS ${mainName} in region context!`);
                    }
                }
            }

            // 2. מלכודת כללית: CENTCOM + Carrier/Strike Group
            if (text.includes("centcom") && (text.includes("carrier") || text.includes("strike group"))) {
                generalAlert = true;
                console.log(">>> General CENTCOM Alert Detected");
            }

            // 3. כוח עזר
            if (text.includes("strike group") || text.includes("csg") || text.includes("armada")) {
                massiveSupport = true;
            }
        });

        const count = detectedCarriers.size;
        console.log(`Navy Final: ${count} Carriers. Support: ${massiveSupport}, GenAlert: ${generalAlert}`);

        let status = 'green';
        let textLabel = "No Carriers";

        if (count >= 2) {
            status = 'critical';
            textLabel = `${count} CVNs (War Ready)`;
        } else if (count === 1) {
            // אם זיהינו ספינה אחת - זה כמעט תמיד אדום במצב הנוכחי כי הן באות להילחם
            // אבל נשאיר לוגיקה: עם כוח עזר = אדום, בלי = כתום
            status = massiveSupport ? 'red' : 'orange';
            textLabel = massiveSupport ? "1 CVN + Strike Grp" : "1 CVN Detected";
        } else if (count === 0 && generalAlert) {
            // שינוי קריטי: אם יש התרעת סנטקום כללית על נושאת מטוסים - זה אדום! לא כתום.
            status = 'red'; 
            textLabel = "CENTCOM: Carrier Active";
        } else {
            status = 'green';
            textLabel = "No CVNs";
        }

        if (typeof updateStatus === 'function') {
            updateStatus('navy', status);
            addLabel('navy', textLabel, status);
        }

    } catch (e) { console.error("Navy Error", e); }
}
// --- 6. GPS JAMMING - FIXED PROXY ---
async function fetchGPS() {
    const query = '(GPS jamming OR GPS spoofing OR "GNSS interference") AND (Israel OR "Tel Aviv" OR Lebanon OR Beirut OR Iran OR "Middle East")';
    const rssUrl = `https://news.google.com/rss/search?q=${query}+when:1d&hl=en-US&gl=US&ceid=US:en`;
    // שינוי לפרוקסי corsproxy.io
    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(rssUrl) + `&t=${Date.now()}`;

    try {
        const response = await fetch(proxyUrl);
        // קריאה כטקסט (XML)
        const str = await response.text();
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        const items = data.querySelectorAll("item");
        
        let reportCount = items.length;
        let severeReports = 0;
        items.forEach(item => {
            const text = item.querySelector("title").textContent.toLowerCase();
            if (text.includes("widespread") || text.includes("airport") || text.includes("grounded") || text.includes("massive") || text.includes("halt")) {
                severeReports++;
            }
        });

        let status = 'green';
        let textLabel = "Normal Signal";

        if (reportCount === 0) {
            status = 'green'; textLabel = "No Reports";
        } else if (reportCount < 3 && severeReports === 0) {
            status = 'orange'; textLabel = "Local Interference";
        } else if (reportCount >= 3 || severeReports > 0) {
            status = 'red'; textLabel = "Jamming Reported";
        }

        if (typeof updateStatus === 'function') {
            updateStatus('gps', status);
            addLabel('gps', textLabel, status);
        }

    } catch (e) {
        console.error("GPS Fetch Error", e);
    }
}

// --- Helper ---
// --- Helper (Disabled Label) ---
function addLabel(key, text, status) {
    // השורה הזו גורמת לפונקציה לצאת מיד ולא להדפיס כלום
    return; 
    
    /* הקוד הישן מבוטל:
    const card = document.querySelector(`.card[data-key="${key}"]`);
    if (!card) return;
    const oldLabel = card.querySelector('.dynamic-label');
    if (oldLabel) oldLabel.remove();
    const label = document.createElement('div');
    label.className = 'dynamic-label text-sm font-bold mt-1 bg-slate-800 rounded px-2 py-1 text-center border border-slate-700';
    label.innerText = text;
    // ... צבעים ...
    const textContainer = card.querySelector('div > div'); 
    if(textContainer) textContainer.appendChild(label);
    */
}
document.addEventListener('DOMContentLoaded', initDataFetcher);