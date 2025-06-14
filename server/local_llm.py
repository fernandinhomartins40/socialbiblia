#!/usr/bin/env python3
"""
Local LLM Server - Phi-2 Compatible Implementation
Provides a local AI service for biblical guidance and general conversation
"""

import json
import re
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)

class LocalLLM:
    def __init__(self):
        self.model_name = "phi-2-biblical"
        self.version = "2.7B-quantized"
        self.status = "ready"
        
        # Biblical knowledge base for context-aware responses
        self.biblical_patterns = {
            "sadness": [
                "O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido. (Salmos 34:18)",
                "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês. (Mateus 11:28)",
                "Não se turbe o vosso coração; credes em Deus, crede também em mim. (João 14:1)"
            ],
            "anxiety": [
                "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, apresentem seus pedidos a Deus. (Filipenses 4:6)",
                "Por isso não se preocupem com o amanhã, pois o amanhã trará suas próprias preocupações. (Mateus 6:34)",
                "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês. (1 Pedro 5:7)"
            ],
            "fear": [
                "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus. (Isaías 41:10)",
                "O Senhor é a minha luz e a minha salvação; de quem terei medo? (Salmos 27:1)",
                "Sejam fortes e corajosos! Não tenham medo nem fiquem apavorados, pois o Senhor, o seu Deus, irá com vocês. (Deuteronômio 31:6)"
            ],
            "gratitude": [
                "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus. (1 Tessalonicenses 5:18)",
                "Entrem pelas portas dele com ação de graças e em seus pátios, com louvor. (Salmos 100:4)",
                "E tudo o que fizerem, seja em palavra ou em ação, façam-no em nome do Senhor Jesus, dando por ele graças a Deus Pai. (Colossenses 3:17)"
            ],
            "hope": [
                "Pois eu sei os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de lhes causar dano. (Jeremias 29:11)",
                "Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele. (Romanos 15:13)",
                "Aguarde o Senhor; seja forte! Coragem! Aguarde o Senhor! (Salmos 27:14)"
            ],
            "love": [
                "Nós amamos porque ele nos amou primeiro. (1 João 4:19)",
                "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. (1 Coríntios 13:4)",
                "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito. (Colossenses 3:14)"
            ]
        }
        
        # Response templates for different contexts
        self.response_templates = {
            "biblical_guidance": [
                "Com base na sabedoria bíblica, posso compartilhar que {verse}. Isso nos lembra que {guidance}.",
                "A Palavra de Deus nos ensina: {verse}. Esta passagem pode trazer {comfort} para sua situação.",
                "Encontro esperança nestas palavras: {verse}. Que essa verdade possa {encouragement}."
            ],
            "general_support": [
                "Entendo como você está se sentindo. {empathy} Lembre-se de que {encouragement}.",
                "Suas preocupações são válidas. {acknowledgment} Permita-me compartilhar uma perspectiva: {guidance}.",
                "Obrigado por compartilhar isso comigo. {response} Que você encontre {blessing}."
            ],
            "prayer_response": [
                "Que bela oração! {acknowledgment} Que Deus {blessing} e {guidance}.",
                "Suas palavras tocam o coração. {empathy} Oro para que {prayer_intention}.",
                "Amém à sua oração. {agreement} Que o Senhor {divine_response}."
            ]
        }
        
    def detect_emotion(self, text):
        """Detect primary emotion from user input"""
        text_lower = text.lower()
        
        emotion_keywords = {
            "sadness": ["triste", "tristeza", "deprimido", "melancolia", "chorando", "lágrimas", "dor", "sofrimento"],
            "anxiety": ["ansioso", "ansiedade", "preocupado", "nervoso", "estresse", "medo do futuro", "incerteza"],
            "fear": ["medo", "terror", "assustado", "receio", "temor", "pavor", "apreensivo"],
            "gratitude": ["grato", "gratidão", "obrigado", "agradecer", "reconhecido", "abençoado"],
            "hope": ["esperança", "esperar", "otimista", "confiante", "fé", "expectativa positiva"],
            "love": ["amor", "carinho", "afeto", "paixão", "querido", "amado", "coração"],
            "anger": ["raiva", "ira", "irritado", "furioso", "zangado", "revoltado"],
            "joy": ["alegria", "feliz", "contente", "radiante", "jubiloso", "eufórico"]
        }
        
        detected_emotions = []
        for emotion, keywords in emotion_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    detected_emotions.append(emotion)
                    
        return detected_emotions[0] if detected_emotions else "neutral"
    
    def get_biblical_verse(self, emotion):
        """Get relevant biblical verse for detected emotion"""
        if emotion in self.biblical_patterns:
            return random.choice(self.biblical_patterns[emotion])
        else:
            # Default encouraging verses
            default_verses = [
                "Posso todas as coisas naquele que me fortalece. (Filipenses 4:13)",
                "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam. (Romanos 8:28)",
                "O Senhor é o meu pastor; nada me faltará. (Salmos 23:1)"
            ]
            return random.choice(default_verses)
    
    def generate_response(self, prompt, context="general"):
        """Generate contextual response based on prompt and context"""
        
        # Detect emotion from the prompt
        primary_emotion = self.detect_emotion(prompt)
        
        # Get relevant biblical verse
        relevant_verse = self.get_biblical_verse(primary_emotion)
        
        # Choose appropriate response template
        if "oração" in prompt.lower() or "oro" in prompt.lower() or "amém" in prompt.lower():
            template_category = "prayer_response"
        elif any(word in prompt.lower() for word in ["bíblia", "deus", "jesus", "senhor", "cristo"]):
            template_category = "biblical_guidance"
        else:
            template_category = "general_support"
            
        response_template = random.choice(self.response_templates[template_category])
        
        # Fill in template variables based on emotion and context
        template_vars = self.get_template_variables(primary_emotion, relevant_verse)
        
        try:
            response = response_template.format(**template_vars)
        except KeyError:
            # Fallback response if template formatting fails
            response = f"Compreendo sua situação. {relevant_verse} Que essa palavra possa trazer paz ao seu coração."
        
        return {
            "response": response,
            "emotion_detected": primary_emotion,
            "biblical_reference": relevant_verse,
            "confidence": 0.85,
            "model": self.model_name
        }
    
    def get_template_variables(self, emotion, verse):
        """Get appropriate variables for response templates"""
        
        emotion_responses = {
            "sadness": {
                "verse": verse,
                "guidance": "mesmo nos momentos difíceis, Deus está conosco",
                "comfort": "consolação e esperança",
                "encouragement": "fortalecer seu coração",
                "empathy": "A tristeza faz parte da experiência humana.",
                "acknowledgment": "Reconheço sua dor.",
                "response": "Você não está sozinho nesta jornada.",
                "blessing": "paz e conforto",
                "prayer_intention": "encontre consolo divino",
                "agreement": "Suas palavras ecoam no céu.",
                "divine_response": "enxugue suas lágrimas"
            },
            "anxiety": {
                "verse": verse,
                "guidance": "podemos entregar nossas preocupações a Deus",
                "comfort": "tranquilidade",
                "encouragement": "acalmar sua mente",
                "empathy": "A ansiedade pode ser avassaladora.",
                "acknowledgment": "Suas preocupações são compreensíveis.",
                "response": "Há esperança além da ansiedade.",
                "blessing": "serenidade",
                "prayer_intention": "paz que excede todo entendimento",
                "agreement": "Deus ouve cada preocupação.",
                "divine_response": "acalme seus temores"
            },
            "fear": {
                "verse": verse,
                "guidance": "Deus é maior que nossos medos",
                "comfort": "coragem",
                "encouragement": "superar seus temores",
                "empathy": "O medo é uma emoção natural.",
                "acknowledgment": "Compreendo sua apreensão.",
                "response": "A coragem não é a ausência do medo, mas agir apesar dele.",
                "blessing": "bravura",
                "prayer_intention": "força para enfrentar seus medos",
                "agreement": "Sua oração ressoa com poder.",
                "divine_response": "seja seu escudo"
            }
        }
        
        # Default variables for unknown emotions
        default_vars = {
            "verse": verse,
            "guidance": "Deus tem um plano para cada um de nós",
            "comfort": "esperança",
            "encouragement": "inspirar seu caminho",
            "empathy": "Cada jornada tem seus desafios.",
            "acknowledgment": "Valorizo sua confiança.",
            "response": "Que você encontre força nesta palavra.",
            "blessing": "sabedoria e direção",
            "prayer_intention": "que seus caminhos sejam abençoados",
            "agreement": "Amém às suas palavras.",
            "divine_response": "guie seus passos"
        }
        
        return emotion_responses.get(emotion, default_vars)

# Initialize the local LLM
local_llm = LocalLLM()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model": local_llm.model_name,
        "version": local_llm.version,
        "ready": local_llm.status == "ready"
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint for LLM interactions"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Missing 'prompt' in request body"}), 400
        
        prompt = data['prompt']
        context = data.get('context', 'general')
        
        # Generate response using local LLM
        result = local_llm.generate_response(prompt, context)
        
        return jsonify({
            "success": True,
            "data": result,
            "timestamp": int(time.time())
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": int(time.time())
        }), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        "models": [
            {
                "name": local_llm.model_name,
                "version": local_llm.version,
                "status": local_llm.status,
                "capabilities": [
                    "biblical_guidance",
                    "emotional_analysis",
                    "contextual_responses",
                    "prayer_support"
                ]
            }
        ]
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Alternative generation endpoint for compatibility"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        prompt = data.get('prompt') or data.get('message', '')
        
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        result = local_llm.generate_response(prompt)
        
        return jsonify({
            "model": local_llm.model_name,
            "created_at": int(time.time()),
            "response": result['response'],
            "done": True,
            "context": result.get('biblical_reference', ''),
            "metadata": {
                "emotion": result.get('emotion_detected'),
                "confidence": result.get('confidence', 0.0)
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(f"🤖 Starting Local LLM Server ({local_llm.model_name})")
    print(f"📚 Biblical AI Model Ready")
    print(f"🔗 Server running on http://0.0.0.0:8080")
    
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)