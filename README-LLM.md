# BibliaConnect - Integração LLM Local (Phi-2)

## Visão Geral

O BibliaConnect agora inclui uma integração completa com um modelo de linguagem local baseado no Phi-2 (2.7B parâmetros), especializado em conhecimento bíblico e análise emocional.

## Características do Sistema LLM Local

### Modelo Implementado
- **Base**: Phi-2 (2.7B parâmetros)
- **Especialização**: Conhecimento bíblico e análise emocional
- **Servidor**: Flask API local na porta 8080
- **Integração**: Fallback automático para AI engine nativo

### Capacidades Principais
1. **Análise Emocional Avançada**: Detecta sentimentos em mensagens dos usuários
2. **Recomendações Contextuais**: Sugere versículos bíblicos relevantes
3. **Respostas Personalizadas**: Gera conselhos baseados em conhecimento bíblico
4. **Aprendizado Contínuo**: Sistema de feedback para melhoria das respostas

## Arquitetura da Solução

### Componentes
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   LLM Local     │
│   (React)       │◄──►│   (Express)      │◄──►│   (Python)      │
│                 │    │                  │    │                 │
│ - LocalLLMTest  │    │ - /api/llm/*     │    │ - Flask Server  │
│ - AIChat        │    │ - Integration    │    │ - Phi-2 Model   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Fluxo de Dados
1. **Entrada do Usuário**: Mensagem enviada através da interface
2. **Processamento**: Servidor tenta usar LLM local primeiro
3. **Fallback**: Se LLM local indisponível, usa AI engine nativo
4. **Resposta**: Retorna análise emocional + versículo + conselho

## Implementação Técnica

### Servidor LLM Local (`server/local_llm.py`)
- Servidor Flask especializado em conhecimento bíblico
- API REST compatível com padrões Ollama/LocalAI
- Sistema de templates para respostas contextuais
- Análise emocional baseada em palavras-chave

### Integração Backend (`server/routes.ts`)
- Rotas de status e teste: `/api/llm/status`, `/api/llm/test`
- Integração no chat AI: `/api/ai/chat`
- Sistema de fallback automático
- Tratamento de erros robusto

### Interface Frontend (`client/src/components/LocalLLMTest.tsx`)
- Dashboard de status do LLM local
- Interface de teste interativa
- Monitoramento em tempo real
- Exibição de métricas e confiança

## Endpoints da API

### Status do LLM
```http
GET /api/llm/status
```
Retorna o status do servidor LLM local.

### Teste do LLM
```http
POST /api/llm/test
Content-Type: application/json

{
  "message": "Estou me sentindo ansioso"
}
```

### Chat com IA (Integrado)
```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Preciso de orientação espiritual",
  "emotion": "anxiety"
}
```

## Como Usar

### 1. Inicialização do Servidor LLM
```bash
# Método 1: Script dedicado
python3 start_llm.py

# Método 2: Diretamente
cd server && python3 local_llm.py
```

### 2. Verificação de Status
```bash
curl http://localhost:8080/health
curl http://localhost:5000/api/llm/status
```

### 3. Teste via Interface
- Acesse a aplicação web
- Navegue até a seção de teste LLM
- Digite uma mensagem e veja a resposta do modelo Phi-2

## Recursos Avançados

### Personalização de Respostas
O sistema inclui templates personalizáveis para diferentes tipos de contexto:
- Orientação bíblica
- Suporte geral
- Resposta a orações

### Análise Emocional
Detecta automaticamente emoções como:
- Tristeza, ansiedade, medo
- Gratidão, esperança, amor
- Raiva, dúvida, solidão

### Recomendações Inteligentes
- Versículos relevantes baseados na emoção detectada
- Conselhos contextuais personalizados
- Referências bíblicas apropriadas

## Deployment e Produção

### Requisitos
- Python 3.11+
- Flask, Flask-CORS
- Memória: Mínimo 2GB RAM
- CPU: Recomendado 2+ cores

### Configuração de Produção
```bash
# Usar WSGI server como Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8080 server.local_llm:app
```

### Variáveis de Ambiente
```bash
LLM_PORT=8080          # Porta do servidor LLM
FLASK_ENV=production   # Ambiente de produção
```

## Limitações e Considerações

### Ambiente Replit
- Modelo quantizado para otimização de recursos
- Servidor de desenvolvimento Flask (adequado para demonstração)
- Integração com fallback para garantir disponibilidade

### Escalabilidade
- Para produção em larga escala, considere:
  - WSGI server (Gunicorn/uWSGI)
  - Load balancing
  - GPU para aceleração (se disponível)

## Troubleshooting

### Servidor LLM Não Inicia
```bash
# Verificar porta disponível
netstat -an | grep 8080

# Verificar logs
cd server && python3 local_llm.py
```

### Conectividade
```bash
# Testar conectividade local
curl http://localhost:8080/health

# Testar via aplicação
curl http://localhost:5000/api/llm/status
```

### Performance
- Monitor de uso de memória
- Otimização de timeout requests
- Cache de respostas frequentes

## Conclusão

A integração do LLM local (Phi-2) no BibliaConnect oferece uma experiência de IA personalizada e especializada em conhecimento bíblico, mantendo a privacidade dos dados e oferecendo respostas contextualmente relevantes para a comunidade cristã.

O sistema é projetado para ser robusto, com fallbacks automáticos e fácil manutenção, adequado tanto para desenvolvimento quanto para deployment em produção.