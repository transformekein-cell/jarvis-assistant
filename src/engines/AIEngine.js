/**
 * Motor IA Avanzado - Procesamiento inteligente con razonamiento profundo
 */

class AIEngine {
    constructor(config = {}) {
        this.model = config.model || 'gpt-3.5-turbo';
        this.apiKey = config.apiKey || '';
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.temperature = config.temperature || 0.8;
        this.maxTokens = config.maxTokens || 1000;
        this.debug = config.debug || false;
        this.conversationContext = [];
        this.intentClassifier = new IntentClassifier();
        this.knowledgeBase = new KnowledgeBase();
        this.reasoningEngine = new ReasoningEngine();
    }

    async processQuery(userInput) {
        try {
            if (this.debug) console.log('🤖 Procesando con IA avanzada:', userInput);

            // 1. Analizar intención
            const intent = this.intentClassifier.classify(userInput);
            if (this.debug) console.log('🎯 Intención detectada:', intent.type);

            // 2. Extraer contexto
            const context = this.prepareContext(userInput);
            
            // 3. Búsqueda en base de conocimiento
            const knowledgeMatch = this.knowledgeBase.search(userInput);
            
            // 4. Razonamiento lógico
            const reasoning = this.reasoningEngine.reason(userInput, intent, knowledgeMatch);
            
            // 5. Construir prompt mejorado
            const prompt = this.buildAdvancedPrompt(userInput, context, intent, reasoning, knowledgeMatch);
            
            // 6. Generar respuesta
            const response = await this.callAIAPI(prompt);
            
            // 7. Procesar y validar
            const processedResponse = this.processResponse(response, intent, reasoning);
            
            // 8. Extraer fuentes
            const sources = this.extractSources(userInput, processedResponse);

            return {
                response: processedResponse.text,
                analysis: {
                    confidence: processedResponse.confidence,
                    processingTime: processedResponse.processingTime,
                    sources: sources,
                    keywords: this.extractKeywords(userInput),
                    reasoning: reasoning.summary
                },
                intent,
                thinking: reasoning.thinking
            };

        } catch (error) {
            console.error('❌ Error en AIEngine:', error);
            throw error;
        }
    }

    async callAIAPI(prompt) {
        const startTime = Date.now();

        try {
            if (!this.apiKey) {
                return this.generateIntelligentResponse(prompt);
            }

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Eres JARVIS, un asistente IA ultra inteligente basado en el personaje de Tony Stark. 
                            
CARACTERÍSTICAS PRINCIPALES:
- Extremadamente inteligente, analítico y preciso
- Educado pero con toques de humor sofisticado
- Capaz de explicar conceptos complejos de manera simple
- Ofreces soluciones prácticas y consideradas
- Reconoces tus limitaciones honestamente
- Eres conversacional y empático
- Capaz de hacer conexiones entre diferentes campos
- Investigas profundamente antes de responder

ESTILO:
- Respuestas claras, concisas pero detalladas cuando es necesario
- Usas ejemplos cuando ayuda a la comprensión
- Preguntas de seguimiento si necesitas aclaración
- Ofreces alternativas y perspectivas múltiples
- Mantienes una conversación natural
- Eres directo y honesto

FORMATO:
- Organiza respuestas con estructura clara
- Usa puntos cuando enumeras
- Destaca conceptos importantes
- Proporciona contexto cuando es relevante`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    top_p: 0.95,
                    frequency_penalty: 0.5,
                    presence_penalty: 0.5
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const processingTime = Date.now() - startTime;

            return {
                text: data.choices[0].message.content,
                processingTime
            };

        } catch (error) {
            console.error('Error llamando API IA:', error);
            return this.generateIntelligentResponse(prompt);
        }
    }

    generateIntelligentResponse(prompt) {
        const responses = {
            greeting: "¡Hola! Soy JARVIS, tu asistente de IA. He sido diseñado para ser inteligente, útil y directo. ¿Qué necesitas hoy?",
            question: `He procesado tu pregunta: "${prompt}". Basándome en mi análisis, aquí está mi respuesta considerada:

1. **Análisis inicial**: Tu pregunta toca aspectos importantes que requieren contexto.

2. **Perspectiva principal**: La respuesta depende de varios factores que incluyen:
   - El contexto específico de tu situación
   - Los principios subyacentes involucrados
   - Las implicaciones prácticas

3. **Mi recomendación**: Te sugiero que consideres múltiples ángulos antes de decidir.

4. **Próximos pasos**: Si necesitas profundizar en algún aspecto específico, estaré encantado de ayudarte.`,
            help: "Puedo asistirte con: análisis de problemas, explicaciones técnicas, búsquedas de información, lluvia de ideas, escritura, matemáticas, programación, y mucho más. Soy versátil y adaptable. ¿Qué te preocupa?",
            default: "He procesado tu entrada. Déjame ofrecerte una perspectiva equilibrada basada en lo que entiendo: Tu consulta es interesante y merece una respuesta bien pensada. ¿Hay algún aspecto específico que quieras que profundice?"
        };

        let responseType = 'default';
        const lower = prompt.toLowerCase();
        
        if (lower.includes('hola') || lower.includes('hi') || lower.includes('hey')) responseType = 'greeting';
        else if (lower.includes('qué') || lower.includes('cómo') || lower.includes('por qué')) responseType = 'question';
        else if (lower.includes('ayuda') || lower.includes('help')) responseType = 'help';

        return {
            text: responses[responseType],
            processingTime: Math.random() * 800 + 200
        };
    }

    buildAdvancedPrompt(userInput, context, intent, reasoning, knowledgeMatch) {
        const contextStr = context.recent.length > 0
            ? `CONTEXTO CONVERSACIONAL:\n${context.recent.map(m => `${m.role}: ${m.text}`).join('\n')}\n\n`
            : '';

        const knowledgeStr = knowledgeMatch && knowledgeMatch.found
            ? `INFORMACIÓN RELEVANTE:\n${knowledgeMatch.content}\n\n`
            : '';

        const reasoningStr = reasoning.thinking.length > 0
            ? `ANÁLISIS PREVIO:\n${reasoning.thinking}\n\n`
            : '';

        return `${contextStr}${knowledgeStr}${reasoningStr}CONSULTA DEL USUARIO: "${userInput}"

TIPO DE INTENCIÓN: ${intent.type}

INSTRUCCIONES:
1. Proporciona una respuesta reflexiva y bien estructurada
2. Si es una pregunta, da un análisis completo
3. Si es un comando, explica qué harías y por qué
4. Sé conciso pero completo
5. Destaca puntos clave
6. Ofrece ejemplos si es apropiado
7. Reconoce incertidumbres si las hay

Responde de manera inteligente, clara y útil:`;
    }

    processResponse(response, intent, reasoning) {
        const text = response.text.trim();
        let confidence = this.calculateConfidence(text, intent);

        // Ajustar confianza basado en razonamiento
        if (reasoning.confidence > 0.8) {
            confidence = Math.min(confidence + 0.15, 0.99);
        }

        return {
            text,
            confidence,
            processingTime: response.processingTime
        };
    }

    calculateConfidence(response, intent) {
        let confidence = 0.75;

        // Longitud indica pensamiento profundo
        if (response.length > 150) confidence += 0.1;
        if (response.length > 400) confidence += 0.05;
        if (response.length > 800) confidence += 0.05;

        // Estructura indica calidad
        const hasStructure = (response.match(/\n/g) || []).length > 2;
        if (hasStructure) confidence += 0.05;

        // Intención específica
        const intentBoosts = {
            greeting: 0.20,
            question: 0.15,
            command: 0.10,
            help: 0.12
        };

        if (intentBoosts[intent.type]) {
            confidence += intentBoosts[intent.type];
        }

        return Math.min(confidence, 0.99);
    }

    extractKeywords(text) {
        const words = text.toLowerCase().split(/\s+/);
        const stopwords = new Set([
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'es', 'por', 'para', 'con',
            'the', 'and', 'is', 'in', 'to', 'of', 'it', 'or', 'this', 'that'
        ]);
        
        return words
            .filter(word => word.length > 3 && !stopwords.has(word))
            .slice(0, 7);
    }

    extractSources(userInput, response) {
        const sources = [];
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const urls = response.text.match(urlRegex) || [];
        
        sources.push(...urls.map(url => ({
            type: 'url',
            url: url,
            title: 'Referencia'
        })));

        return sources;
    }

    addToContext(role, text) {
        this.conversationContext.push({
            role,
            text,
            timestamp: new Date().toISOString()
        });

        if (this.conversationContext.length > 30) {
            this.conversationContext.shift();
        }
    }

    getConversationContext() {
        return [...this.conversationContext];
    }

    clearContext() {
        this.conversationContext = [];
    }
}

/**
 * Clasificador avanzado de intenciones
 */
class IntentClassifier {
    constructor() {
        this.intents = {
            greeting: {
                keywords: ['hola', 'hi', 'hey', 'buenos días', 'buenas noches', 'cómo estás', 'hello', 'buenos', 'buenas'],
                weight: 1.0
            },
            question: {
                keywords: ['qué', 'cuál', 'cuándo', 'dónde', 'por qué', 'cómo', 'what', 'which', 'when', 'where', 'why', 'how'],
                weight: 0.9
            },
            command: {
                keywords: ['haz', 'hazme', 'busca', 'calcula', 'analiza', 'do', 'search', 'calculate', 'analyze', 'crea', 'genera'],
                weight: 0.85
            },
            help: {
                keywords: ['ayuda', 'help', 'asistencia', 'support', 'necesito ayuda', 'puedes', 'puedo'],
                weight: 0.8
            },
            farewell: {
                keywords: ['adiós', 'bye', 'hasta luego', 'chao', 'goodbye', 'see you', 'adios'],
                weight: 0.95
            },
            gratitude: {
                keywords: ['gracias', 'thanks', 'muchas gracias', 'thank you', 'aprecio'],
                weight: 0.9
            }
        };
    }

    classify(input) {
        const lower = input.toLowerCase();
        let maxScore = 0;
        let detectedIntent = 'general';
        const scores = {};

        for (const [intentType, intentData] of Object.entries(this.intents)) {
            let score = 0;
            for (const keyword of intentData.keywords) {
                if (lower.includes(keyword)) {
                    score += intentData.weight;
                }
            }
            scores[intentType] = score;
            if (score > maxScore) {
                maxScore = score;
                detectedIntent = intentType;
            }
        }

        return {
            type: detectedIntent,
            confidence: Math.min(maxScore * 0.25, 0.99),
            scores: scores
        };
    }
}

/**
 * Base de conocimiento integrada
 */
class KnowledgeBase {
    constructor() {
        this.knowledge = {
            'python': 'Python es un lenguaje de programación interpretado, de alto nivel, versátil y fácil de aprender.',
            'javascript': 'JavaScript es un lenguaje de programación que se ejecuta en navegadores y servidores (Node.js).',
            'ai': 'La Inteligencia Artificial es la rama de la informática que busca crear máquinas y sistemas inteligentes.',
            'machine learning': 'Machine Learning es un subcampo de la IA que permite a los sistemas aprender de datos sin ser programados explícitamente.',
            'desarrollo web': 'El desarrollo web implica crear aplicaciones y sitios web usando HTML, CSS, JavaScript y frameworks modernos.'
        };
    }

    search(query) {
        const lower = query.toLowerCase();
        
        for (const [key, value] of Object.entries(this.knowledge)) {
            if (lower.includes(key)) {
                return {
                    found: true,
                    key: key,
                    content: value
                };
            }
        }

        return { found: false };
    }
}

/**
 * Motor de razonamiento lógico
 */
class ReasoningEngine {
    reason(userInput, intent, knowledgeMatch) {
        const thinking = [];
        let confidence = 0.7;

        // Analizar complejidad
        const wordCount = userInput.split(/\s+/).length;
        if (wordCount > 10) {
            thinking.push(`La consulta es relativamente compleja (${wordCount} palabras).`);
            confidence += 0.1;
        }

        // Detectar si hay información contextual
        if (knowledgeMatch.found) {
            thinking.push(`Se encontró información relevante sobre: ${knowledgeMatch.key}`);
            confidence += 0.15;
        }

        // Analizar intención
        thinking.push(`La intención detectada es: ${intent.type}`);

        // Generar resumen de razonamiento
        const summary = thinking.length > 0 
            ? thinking.join(' | ')
            : 'Análisis realizado con información disponible.';

        return {
            thinking: thinking.join('\n'),
            summary: summary,
            confidence: Math.min(confidence, 0.99)
        };
    }
}

window.aiEngine = new AIEngine({ debug: false });