/**
 * JARVIS Brain - Núcleo inteligente mejorado
 */

class JarvisBrain {
    constructor(config = {}) {
        this.isProcessing = false;
        this.conversationMode = true;
        this.emotionalState = 'neutral';
        this.maxHistoryLength = config.maxHistoryLength || 100;
        this.processingTimeout = config.processingTimeout || 45000;
        this.debug = config.debug || false;
        this.conversationHistory = [];
        this.responseCache = new Map();
        
        if (this.debug) {
            console.log('🧠 JARVIS Brain inicializado con inteligencia máxima');
        }
    }

    async process(userInput) {
        if (this.isProcessing) {
            return {
                response: 'Estoy procesando tu pregunta anterior. Dame un momento...',
                hasError: true,
                analysis: { confidence: 0, processingTime: 0, sources: [], sourceCount: 0 }
            };
        }

        this.isProcessing = true;
        const startTime = Date.now();

        try {
            if (!userInput || userInput.trim().length === 0) {
                return {
                    response: 'Hazme una pregunta o cuéntame qué necesitas.',
                    hasError: true,
                    analysis: { confidence: 0, processingTime: 0, sources: [], sourceCount: 0 }
                };
            }

            const cleanInput = userInput.trim();

            // Verificar cache para preguntas idénticas
            if (this.responseCache.has(cleanInput)) {
                return this.responseCache.get(cleanInput);
            }

            // Registrar en historial
            this.addToHistory('user', cleanInput);

            // Procesar con motor IA
            if (!window.aiEngine) {
                throw new Error('Motor IA no disponible');
            }

            const aiResponse = await Promise.race([
                window.aiEngine.processQuery(cleanInput),
                this.createTimeout(this.processingTimeout)
            ]);

            if (!aiResponse || typeof aiResponse !== 'object') {
                throw new Error('Respuesta inválida del motor IA');
            }

            const finalResponse = aiResponse.response || 'No se pudo procesar la solicitud';
            const sources = aiResponse.analysis?.sources || [];
            const confidence = aiResponse.analysis?.confidence || 0.5;
            const processingTime = Date.now() - startTime;

            const result = {
                response: finalResponse,
                analysis: {
                    confidence: confidence,
                    processingTime: processingTime,
                    sources: sources,
                    sourceCount: sources.length
                },
                intent: aiResponse.intent?.type || aiResponse.intent || 'general',
                timestamp: new Date().toISOString()
            };

            // Registrar respuesta
            this.addToHistory('assistant', finalResponse);

            // Cachear resultado
            this.responseCache.set(cleanInput, result);
            if (this.responseCache.size > 200) {
                const firstKey = this.responseCache.keys().next().value;
                this.responseCache.delete(firstKey);
            }

            if (this.debug) {
                console.log(`✅ Procesado en ${processingTime}ms | Confianza: ${confidence}%`);
            }

            return result;

        } catch (error) {
            console.error('❌ Error en Jarvis Brain:', error);
            const processingTime = Date.now() - startTime;

            return {
                response: `Error: ${error.message || 'Error desconocido'}. Intenta nuevamente.`,
                hasError: true,
                analysis: {
                    confidence: 0,
                    processingTime: processingTime,
                    sources: [],
                    sourceCount: 0
                },
                timestamp: new Date().toISOString()
            };
        } finally {
            this.isProcessing = false;
        }
    }

    addToHistory(role, message) {
        this.conversationHistory.push({
            role,
            message,
            timestamp: new Date().toISOString()
        });

        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory.shift();
        }
    }

    getConversationHistory() {
        return [...this.conversationHistory];
    }

    clearHistory() {
        this.conversationHistory = [];
        this.responseCache.clear();
        if (this.debug) console.log('🧹 Historial limpiado');
    }

    getEmotionalState() {
        return this.emotionalState;
    }

    updateEmotionalState(feedback) {
        const previousState = this.emotionalState;

        if (feedback.positive) {
            this.emotionalState = 'satisfied';
        } else if (feedback.negative) {
            this.emotionalState = 'concerned';
        } else {
            this.emotionalState = 'neutral';
        }

        if (this.debug) {
            console.log(`😊 Estado: ${previousState} → ${this.emotionalState}`);
        }
    }

    isCurrentlyProcessing() {
        return this.isProcessing;
    }

    getContext() {
        return {
            history: this.getConversationHistory(),
            emotionalState: this.emotionalState,
            processingStatus: this.isProcessing,
            cacheSize: this.responseCache.size,
            historyLength: this.conversationHistory.length
        };
    }

    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout después de ${ms}ms`)), ms);
        });
    }

    getStatistics() {
        return {
            totalMessages: this.conversationHistory.length,
            userMessages: this.conversationHistory.filter(m => m.role === 'user').length,
            assistantMessages: this.conversationHistory.filter(m => m.role === 'assistant').length,
            cacheSize: this.responseCache.size
        };
    }
}

const jarvisBrain = new JarvisBrain({ debug: false });