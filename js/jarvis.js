class JARVIS {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSpeechRecognition();
        this.isListening = false;
        this.isSpeaking = false;
        this.initialMessageShown = false;
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.performancePanel = document.getElementById('performancePanel');
        this.confidencePanel = document.getElementById('confidencePanel');
        this.timePanel = document.getElementById('timePanel');
        this.hintTags = document.querySelectorAll('.hint-tag');
    }

    initializeEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.hintTags.forEach(tag => {
            tag.addEventListener('click', () => {
                this.userInput.value = this.getHintText(tag.dataset.hint);
                this.userInput.focus();
            });
        });
        window.addEventListener('load', () => this.showInitialMessage());
    }

    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.voiceBtn.disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceBtn.classList.add('listening');
            this.addSystemMessage('🎤 Escuchando...');
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript.trim()) {
                this.userInput.value = finalTranscript.trim();
                this.sendMessage();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            this.addSystemMessage('⚠️ Error en reconocimiento de voz.');
        };
    }

    toggleVoiceInput() {
        if (!this.recognition) return;
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.showProcessingIndicator();

        try {
            const result = await jarvisBrain.process(message);
            this.hideProcessingIndicator();
            this.addMessage(result.response, 'jarvis');
            this.updateAdvancedPanels(result);
            await this.speakResponse(result.response);
        } catch (error) {
            this.addSystemMessage('⚠️ Error en procesamiento.');
            this.hideProcessingIndicator();
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        this.chatMessages.appendChild(messageDiv);

        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<small>${text}</small>`;
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showProcessingIndicator() {
        this.performancePanel.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Analizando información...</span>`;
    }

    hideProcessingIndicator() {
        this.performancePanel.style.animation = 'none';
    }

    updateAdvancedPanels(result) {
        const status = result.responseTime < 500 ? '⚡ Óptimo' : 'Normal';
        this.performancePanel.innerHTML = `<i class="fas fa-brain"></i><span>${status}</span>`;
        this.confidencePanel.innerHTML = `<i class="fas fa-chart-pie"></i><span>Confianza: ${result.confidence}%</span>`;
        this.timePanel.innerHTML = `<i class="fas fa-hourglass-end"></i><span>Tiempo: ${result.responseTime}ms</span>`;
    }

    async speakResponse(text) {
        const synth = window.speechSynthesis;
        if (!synth) return;
        if (this.isSpeaking) synth.cancel();

        const cleanText = text.substring(0, 500);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;

        utterance.onstart = () => { this.isSpeaking = true; };
        utterance.onend = () => { this.isSpeaking = false; };

        synth.speak(utterance);
    }

    showInitialMessage() {
        if (!this.initialMessageShown) {
            const hour = new Date().getHours();
            let greeting = '☀️ Buenos días';
            if (hour >= 12 && hour < 18) greeting = '🌤️ Buenas tardes';
            if (hour >= 18) greeting = '🌙 Buenas noches';

            this.addMessage(`${greeting}, señor. Soy J.A.R.V.I.S. Sistemas completamente operacionales. ¿Cuál es su solicitud?`, 'jarvis');
            this.initialMessageShown = true;
        }
    }

    getHintText(hint) {
        const hints = {
            clima: '¿Qué tiempo hace en Madrid?',
            noticias: 'Investiga noticias de tecnología',
            matematicas: 'Calcula 125 * 8',
            investigacion: 'Investiga sobre inteligencia artificial'
        };
        return hints[hint] || '';
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
}

let jarvis;
document.addEventListener('DOMContentLoaded', () => {
    jarvis = new JARVIS();
    console.log('🤖 JARVIS iniciado correctamente');
});