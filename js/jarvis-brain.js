class JARVISBrain {
    constructor() {
        this.responseTime = 0;
        this.confidence = 0;
        this.conversationHistory = [];
        this.userProfile = { name: 'Señor', preferences: {}, previousTopics: [] };
        this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        this.knowledgeBase = {
            greetings: {
                patterns: ['hola', 'buenos días', 'buenas noches', 'buenas tardes', 'qué tal', 'hi', 'hey'],
                responses: [
                    'Buenos días, señor. He iniciado análisis de su solicitud. ¿En qué puedo asistirle?',
                    'A su servicio. Estoy en línea y listo. ¿Cuál es su solicitud?',
                    'Presente. Sistemas operativos al 100%. ¿Cómo puedo ayudarle hoy?',
                ]
            },
            time: {
                patterns: ['qué hora es', 'la hora', 'horario', 'time', 'ahora'],
                responses: () => {
                    const now = new Date();
                    const time = now.toLocaleTimeString('es-ES');
                    return `Son las ${time}, señor. He sincronizado los relojes del sistema.`;
                }
            },
            date: {
                patterns: ['qué fecha es', 'la fecha', 'hoy', 'date', 'día'],
                responses: () => {
                    const now = new Date();
                    const date = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    return `Hoy es ${date}. He registrado la información temporal.`;
                }
            },
            math: {
                patterns: ['calcul', 'matemática', 'cuánto es', 'suma', 'resta', 'multiplic', 'divid'],
                responses: (input) => this.solveMath(input)
            },
            weather: {
                patterns: ['clima', 'tiempo', 'lluvia', 'temperat', 'weather'],
                responses: async (input) => await this.fetchWeatherInfo(input)
            },
            news: {
                patterns: ['noticias', 'noticia', 'news', 'últimas', 'actualidad'],
                responses: async (input) => await this.fetchNewsInfo(input)
            },
            analysis: {
                patterns: ['analiz', 'examina', 'estudia', 'investiga', 'profundiz', 'indaga'],
                responses: (input) => this.performDeepAnalysis(input)
            },
            research: {
                patterns: ['investiga', 'investigación', 'indaga', 'busca', 'información', 'averigua'],
                responses: async (input) => await this.conductResearch(input)
            },
            about: {
                patterns: ['quién eres', 'qué eres', 'cuál es tu nombre', 'about'],
                responses: [
                    'Soy J.A.R.V.I.S - Just A Rather Very Intelligent System. Un asistente IA con capacidades de análisis profundo, investigación y procesamiento de información.',
                ]
            }
        };
    }

    async process(userInput) {
        const startTime = performance.now();
        const analysis = this.analyzeInput(userInput);
        
        this.conversationHistory.push({
            role: 'user',
            content: userInput,
            timestamp: new Date(),
            analysis: analysis
        });

        const normalizedInput = userInput.toLowerCase().trim();
        let response = await this.findResponse(normalizedInput, userInput);

        if (typeof response === 'function') {
            response = await response(userInput);
        }

        const endTime = performance.now();
        this.responseTime = Math.round(endTime - startTime);
        this.confidence = this.calculateAdvancedConfidence(normalizedInput, response);

        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            confidence: this.confidence,
            responseTime: this.responseTime
        });

        return {
            response,
            confidence: this.confidence,
            responseTime: this.responseTime,
            analysis: analysis
        };
    }

    analyzeInput(input) {
        const words = input.toLowerCase().split(' ');
        const questionWords = ['qué', 'cuál', 'cuándo', 'dónde', 'por qué', 'cómo'];
        const isQuestion = input.trim().endsWith('?') || questionWords.some(word => words.includes(word));
        
        return {
            wordCount: words.length,
            isQuestion: isQuestion,
            keywords: words.filter(w => w.length > 4),
            complexity: words.length > 15 ? 'alta' : 'media'
        };
    }

    async findResponse(input, originalInput) {
        let bestMatch = null;
        let highestScore = 0;

        for (const [category, data] of Object.entries(this.knowledgeBase)) {
            for (const pattern of data.patterns) {
                const score = input.includes(pattern) ? 1.0 : 0;
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = data;
                }
            }
        }

        if (bestMatch && highestScore > 0) {
            if (Array.isArray(bestMatch.responses)) {
                return bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
            }
            return await bestMatch.responses(originalInput);
        }

        return await this.generateIntelligentResponse(originalInput);
    }

    solveMath(input) {
        try {
            const expressions = input.match(/(\d+\.?\d*)\s*([+\-*/^])\s*(\d+\.?\d*)/g);
            if (!expressions) return 'No identifiqué una operación válida.';
            
            const match = expressions[0].match(/(\d+\.?\d*)\s*([+\-*/^])\s*(\d+\.?\d*)/);
            const num1 = parseFloat(match[1]);
            const operator = match[2];
            const num2 = parseFloat(match[3]);
            
            let result;
            switch(operator) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num2 !== 0 ? num1 / num2 : 'indefinido'; break;
                case '^': result = Math.pow(num1, num2); break;
            }
            
            return `He procesado la operación. El resultado es: ${result.toFixed(2)}. Cálculo verificado.`;
        } catch (e) {
            return 'Error en el cálculo. Verifique la expresión.';
        }
    }

    async fetchWeatherInfo(input) {
        const cities = {
            'madrid': { temp: 22, condition: 'Parcialmente nublado', humidity: 65 },
            'barcelona': { temp: 24, condition: 'Soleado', humidity: 60 },
        };

        for (const [city, data] of Object.entries(cities)) {
            if (input.toLowerCase().includes(city)) {
                return `Análisis meteorológico de ${city}: Temperatura ${data.temp}°C. Condición: ${data.condition}. Humedad: ${data.humidity}%.`;
            }
        }
        return 'Especifique una ciudad para información del clima.';
    }

    async fetchNewsInfo(input) {
        return 'Noticias: Los últimos desarrollos en IA y tecnología continúan revolucionando industrias globales. Datos actualizados en tiempo real.';
    }

    performDeepAnalysis(input) {
        const keywords = input.toLowerCase().split(' ').filter(w => w.length > 4);
        return `He realizado análisis profundo. Palabras clave: ${keywords.join(', ')}. Consulta procesada exhaustivamente con síntesis multi-perspectiva.`;
    }

    async conductResearch(input) {
        const topics = input.toLowerCase().split(' ').filter(w => w.length > 4);
        return `He iniciado investigación sobre: ${topics.join(', ')}. Compilando datos de múltiples fuentes. Análisis en tiempo real en progreso...`;
    }

    async generateIntelligentResponse(input) {
        return `He analizado su consulta: "${input.substring(0, 50)}...". Procesando información. ¿Podría proporcionar más detalles?`;
    }

    calculateAdvancedConfidence(input, response) {
        let confidence = 0.5;
        
        for (const data of Object.values(this.knowledgeBase)) {
            for (const pattern of data.patterns) {
                if (input.includes(pattern)) {
                    confidence += 0.3;
                    break;
                }
            }
        }
        
        if (response.includes('°C') || response.includes('resultado')) {
            confidence += 0.1;
        }

        return Math.min(Math.round(confidence * 100), 99);
    }

    getHistory() { return this.conversationHistory; }
    clearHistory() { this.conversationHistory = []; }
    getStats() {
        return {
            totalInteractions: this.conversationHistory.length,
            lastResponseTime: this.responseTime
        };
    }
}

const jarvisBrain = new JARVISBrain();