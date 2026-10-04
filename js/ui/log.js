// Message Logging and Encounter Visual Animations
import { gameState } from "../core/state.js";

export function safeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;(\/?)span( class="[\w\s\-\[\]\/.:#]*")?( style="[\w\s\-\[\]\/.:;#]*")?( data-dlg="\w+")?&gt;/g, '<$1span$2$3$4>')
        .replace(/&lt;br&gt;/g, '<br>');
}

export function logMessage(msg, type = "normal") {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;
    
    const div = document.createElement('div');
    div.innerHTML = safeHtml(msg);
    if (type === "system") div.className = "text-yellow-400";
    if (type === "combat") div.className = "text-red-400";
    if (type === "success") div.className = "text-green-400 font-bold";
    if (type === "npc") div.className = "text-blue-400";
    if (type === "chat") div.className = "text-cyan-300";
    if (type === "shout") div.className = "text-yellow-300 font-bold";
    
    logContainer.appendChild(div);
    if (logContainer.children.length > 150) logContainer.removeChild(logContainer.firstChild);
    logContainer.scrollTop = logContainer.scrollHeight;
}

export function playEncounterAnimation(type, text, callback) {
    if (gameState.isAnimating) return;
    gameState.isAnimating = true;

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        gameState.isAnimating = false;
        callback();
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = "absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-colors duration-75";
    overlay.style.backgroundColor = "transparent";
    mapContainer.appendChild(overlay);

    let isRed = (type === 'ambush' || type === 'world_boss');
    let flashColor = isRed ? "rgba(255, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
    let flashes = 0;
    
    let flashInt = setInterval(() => {
        overlay.style.backgroundColor = (flashes % 2 === 0) ? flashColor : "transparent";
        flashes++;
        if (flashes > 5) {
            clearInterval(flashInt);
            overlay.className = "absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 bg-black";
            overlay.style.backgroundColor = "black";
            
            const textEl = document.createElement('div');
            textEl.className = `text-4xl md:text-5xl font-bold blink ${isRed ? 'text-red-500' : 'text-cyan-400'}`;
            textEl.style.textShadow = `0 0 20px ${isRed ? 'red' : 'cyan'}`;
            textEl.style.textAlign = 'center';
            textEl.innerText = text;
            overlay.appendChild(textEl);

            setTimeout(() => {
                callback();
                setTimeout(() => {
                    overlay.style.opacity = "0";
                    setTimeout(() => {
                        if (overlay.parentNode) overlay.remove();
                        gameState.isAnimating = false;
                    }, 500); 
                }, 1000); 
            }, 100);
        }
    }, 100); 
}
