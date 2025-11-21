const dropZone = document.getElementById('drop-zone');
const inputField = document.getElementById('text-input');
let zIndexCounter = 1;

const charCounter = document.querySelector('.char-counter');

inputField.addEventListener("input", () => {
    const max = inputField.maxLength;
    const len = inputField.value.length;
    charCounter.innerText = `${len}/${max}`;
});

// Simple beep sound generator
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    function chirp(startFreq, endFreq, duration) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            endFreq,
            audioCtx.currentTime + duration
        );

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // Motorola double-chirp
    chirp(1500, 1100, 0.08);  // first beep
    setTimeout(() => chirp(1500, 900, 0.10), 80); // second deeper beep
}

function createCard() {
    const text = inputField.value.toUpperCase();
    if (!text.trim()) return;

    const card = document.createElement('div');
    card.classList.add('card');

    // Text container
    const textSpan = document.createElement('span');
    card.appendChild(textSpan);

    // Blinking cursor
    const cursor = document.createElement('div');
    cursor.classList.add('cursor');
    card.appendChild(cursor);

    dropZone.appendChild(card);

    // POSITION: initially just above machine
    const machineRect = document.querySelector('.machine').getBoundingClientRect();
    let lineHeight = 50; // px per line
    let currentLines = 1;

    card.style.left = `${machineRect.left + machineRect.width / 2 - 90}px`;
    card.style.top = `${machineRect.top - lineHeight}px`;
    card.style.zIndex = ++zIndexCounter;

    inputField.value = '';

    // TYPEWRITER effect with sliding
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            textSpan.innerText += text.charAt(i);
            playBeep();
            i++;

            const charsPerLine = 16;
            let newLines = Math.ceil(textSpan.innerText.length / charsPerLine);
            if (newLines > currentLines) {
                card.style.top = `${parseInt(card.style.top) - 20}px`;
                currentLines = newLines;
            }

            setTimeout(typeWriter, 100);
        } else {
            cursor.remove();

            // --- TIMESTAMP ---
            const timestamp = document.createElement("div");
            timestamp.classList.add("card-timestamp");

            function formatTime() {
                const now = new Date();

                const months = ["JAN","FEB","MAR","APR","MAY","JUN",
                                "JUL","AUG","SEP","OCT","NOV","DEC"];

                const month = months[now.getMonth()];
                const day = now.getDate().toString().padStart(2, "0");
                const year = now.getFullYear();

                let hours = now.getHours();
                const minutes = now.getMinutes().toString().padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;

                return `${day}-${month}-${year}  ${hours}:${minutes}${ampm}`;
            }

            timestamp.innerText = formatTime();
            card.appendChild(timestamp);

            // Move card to center
            const dropZoneRect = dropZone.getBoundingClientRect();
            card.style.transition = 'all 0.5s ease';
            card.style.left = `${dropZoneRect.width / 2 - card.offsetWidth / 2}px`;
            card.style.top = `${dropZoneRect.height / 2 - card.offsetHeight / 2}px`;

            card.addEventListener('transitionend', () => {
                card.style.transition = 'none';
            }, { once: true });
        }
    }


    typeWriter();
    makeDraggable(card);

    // Delete button
    const delBtn = document.createElement('div');
    delBtn.classList.add('delete-btn');
    delBtn.innerText = 'x';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        card.remove();
    };
    card.appendChild(delBtn);
}

function makeDraggable(element) {
    let offsetX = 0, offsetY = 0;
    let dragging = false;

    element.style.position = 'absolute';
    element.addEventListener('pointerdown', dragStart);

    function dragStart(e) {
        // Prevent dragging if the delete button was clicked
        if (e.target.classList.contains('delete-btn')) return;

        e.preventDefault();
        dragging = true;
        element.style.zIndex = ++zIndexCounter;

        // Convert transform-centered position into absolute pixels
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        element.style.left = `${rect.left - parentRect.left}px`;
        element.style.top = `${rect.top - parentRect.top}px`;
        element.style.transform = 'none';

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        element.setPointerCapture(e.pointerId);
        element.addEventListener('pointermove', dragMove);
        element.addEventListener('pointerup', dragEnd);
        element.addEventListener('pointercancel', dragEnd);
    }

    function dragMove(e) {
        if (!dragging) return;

        requestAnimationFrame(() => {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        });
    }

    function dragEnd(e) {
        dragging = false;
        element.releasePointerCapture(e.pointerId);

        element.removeEventListener('pointermove', dragMove);
        element.removeEventListener('pointerup', dragEnd);
        element.removeEventListener('pointercancel', dragEnd);
    }
}

// Press Enter to create card
inputField.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        createCard();
    }
});

function clearText() {
    const input = document.getElementById("text-input");
    input.value = "";
    updateCharCounter();
    input.focus();
}
