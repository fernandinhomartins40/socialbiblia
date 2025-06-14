import { aiEngine } from "./aiEngine";
import { storage } from "./storage";
import { BiblicalVerse } from "@shared/schema";

// Training data based on biblical themes and emotions
const TRAINING_DATA = [
  // Comfort and consolation
  { text: "estou triste", emotion: "sadness", expectedThemes: ["comfort"], keywords: ["tristeza", "dor", "lamento"] },
  { text: "me sinto sozinho", emotion: "loneliness", expectedThemes: ["comfort", "love"], keywords: ["solidão", "abandono", "isolamento"] },
  { text: "estou com medo", emotion: "fear", expectedThemes: ["strength", "comfort"], keywords: ["medo", "temor", "ansiedade"] },
  
  // Joy and celebration
  { text: "estou muito feliz", emotion: "joy", expectedThemes: ["joy"], keywords: ["alegria", "felicidade", "celebração"] },
  { text: "sinto gratidão", emotion: "gratitude", expectedThemes: ["joy"], keywords: ["gratidão", "agradecimento", "louvor"] },
  
  // Guidance and wisdom
  { text: "não sei o que fazer", emotion: "doubt", expectedThemes: ["guidance"], keywords: ["dúvida", "confusão", "direção"] },
  { text: "preciso de sabedoria", emotion: "doubt", expectedThemes: ["guidance"], keywords: ["sabedoria", "conhecimento", "entendimento"] },
  
  // Forgiveness and guilt
  { text: "me sinto culpado", emotion: "guilt", expectedThemes: ["forgiveness"], keywords: ["culpa", "remorso", "arrependimento"] },
  { text: "preciso de perdão", emotion: "guilt", expectedThemes: ["forgiveness"], keywords: ["perdão", "misericórdia", "graça"] },
  
  // Hope and faith
  { text: "estou sem esperança", emotion: "sadness", expectedThemes: ["hope"], keywords: ["desespero", "desânimo", "esperança"] },
  { text: "quero fortalecer minha fé", emotion: "faith", expectedThemes: ["hope"], keywords: ["fé", "confiança", "crença"] },
  
  // Peace and anxiety
  { text: "estou ansioso", emotion: "fear", expectedThemes: ["peace"], keywords: ["ansiedade", "preocupação", "inquietação"] },
  { text: "preciso de paz", emotion: "fear", expectedThemes: ["peace"], keywords: ["paz", "tranquilidade", "serenidade"] },
];

// Verses with emotional associations for training
const VERSE_TRAINING_DATA = [
  // Comfort verses
  { book: "Salmos", chapter: 23, verse: 4, emotions: ["fear", "sadness"], themes: ["comfort", "strength"] },
  { book: "Mateus", chapter: 11, verse: 28, emotions: ["sadness", "loneliness"], themes: ["comfort"] },
  { book: "João", chapter: 14, verse: 27, emotions: ["fear", "anxiety"], themes: ["peace"] },
  
  // Joy verses
  { book: "Salmos", chapter: 30, verse: 5, emotions: ["sadness"], themes: ["joy", "hope"] },
  { book: "Neemias", chapter: 8, verse: 10, emotions: ["sadness"], themes: ["joy", "strength"] },
  
  // Guidance verses
  { book: "Provérbios", chapter: 3, verse: 5, emotions: ["doubt"], themes: ["guidance"] },
  { book: "Salmos", chapter: 119, verse: 105, emotions: ["doubt"], themes: ["guidance"] },
  
  // Forgiveness verses
  { book: "1 João", chapter: 1, verse: 9, emotions: ["guilt"], themes: ["forgiveness"] },
  { book: "Salmos", chapter: 51, verse: 10, emotions: ["guilt"], themes: ["forgiveness"] },
  
  // Hope verses
  { book: "Jeremias", chapter: 29, verse: 11, emotions: ["sadness", "doubt"], themes: ["hope"] },
  { book: "Romanos", chapter: 15, verse: 13, emotions: ["sadness"], themes: ["hope"] },
];

export class MLTrainingService {
  private isTraining = false;
  private trainingProgress = 0;

  constructor() {
    // Start silent training after initialization
    setTimeout(() => this.initiateSilentTraining(), 5000);
  }

  /**
   * Runs silent training in the background
   */
  private async initiateSilentTraining() {
    if (this.isTraining) return;
    
    this.isTraining = true;
    console.log("🤖 Starting silent ML training...");
    
    try {
      // Phase 1: Train with biblical knowledge
      await this.trainWithBiblicalData();
      
      // Phase 2: Train with emotional patterns
      await this.trainEmotionalPatterns();
      
      // Phase 3: Optimize verse recommendations
      await this.optimizeVerseRecommendations();
      
      console.log("✅ Silent ML training completed successfully");
    } catch (error) {
      console.error("❌ Error during silent training:", error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Trains the AI with biblical data
   */
  private async trainWithBiblicalData() {
    console.log("📖 Training with biblical knowledge...");
    
    try {
      const verses = await storage.getBiblicalVerses();
      
      // Process verses in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize);
        
        batch.forEach(verse => {
          // Train verse associations
          const verseTraining = VERSE_TRAINING_DATA.find(v => 
            v.book === verse.book && v.chapter === verse.chapter && v.verse === verse.verse
          );
          
          if (verseTraining) {
            verseTraining.emotions.forEach(emotion => {
              verseTraining.themes.forEach(theme => {
                // Simulate positive feedback for known good associations
                aiEngine.updateModelFromFeedback(
                  verse.id, 
                  emotion, 
                  'helpful', 
                  `Training: ${theme} theme for ${emotion} emotion`
                );
              });
            });
          }
        });
        
        this.trainingProgress = Math.round((i / verses.length) * 30);
      }
    } catch (error) {
      console.error("Error training with biblical data:", error);
    }
  }

  /**
   * Trains emotional pattern recognition
   */
  private async trainEmotionalPatterns() {
    console.log("🧠 Training emotional patterns...");
    
    try {
      TRAINING_DATA.forEach((data, index) => {
        // Analyze the training text
        const analysis = aiEngine.analyzeEmotion(data.text);
        
        // Check if analysis matches expected patterns
        const emotionAccuracy = analysis.primaryEmotion === data.emotion ? 1 : 0.5;
        const themeAccuracy = data.expectedThemes.some(theme => 
          analysis.themes.includes(theme)
        ) ? 1 : 0.5;
        
        // Provide corrective feedback if needed
        if (emotionAccuracy < 1 || themeAccuracy < 1) {
          // Simulate user feedback to improve accuracy
          aiEngine.updateModelFromFeedback(
            `training_${index}`,
            data.emotion,
            'very_helpful',
            data.text
          );
        }
        
        this.trainingProgress = 30 + Math.round((index / TRAINING_DATA.length) * 40);
      });
    } catch (error) {
      console.error("Error training emotional patterns:", error);
    }
  }

  /**
   * Optimizes verse recommendations
   */
  private async optimizeVerseRecommendations() {
    console.log("🎯 Optimizing verse recommendations...");
    
    try {
      const verses = await storage.getBiblicalVerses();
      
      // Test recommendation quality for different emotional states
      const testEmotions = ['sadness', 'fear', 'joy', 'doubt', 'guilt', 'loneliness'];
      
      testEmotions.forEach((emotion, index) => {
        const analysis = aiEngine.analyzeEmotion(`Estou me sentindo ${emotion}`);
        const recommendations = aiEngine.recommendVerses(analysis, verses.slice(0, 50));
        
        // Evaluate recommendation quality and provide feedback
        recommendations.slice(0, 3).forEach(rec => {
          if (rec.relevanceScore > 0.7) {
            aiEngine.updateModelFromFeedback(
              rec.verse.id,
              emotion,
              'very_helpful',
              `Quality recommendation for ${emotion}`
            );
          } else if (rec.relevanceScore < 0.3) {
            aiEngine.updateModelFromFeedback(
              rec.verse.id,
              emotion,
              'not_helpful',
              `Low relevance for ${emotion}`
            );
          }
        });
        
        this.trainingProgress = 70 + Math.round((index / testEmotions.length) * 30);
      });
    } catch (error) {
      console.error("Error optimizing recommendations:", error);
    }
  }

  /**
   * Continues learning from user interactions
   */
  public async continuelearningFromInteractions() {
    try {
      // Get recent interactions for learning
      const recentInteractions = await storage.getAIInteractions("all", 100);
      
      recentInteractions.forEach(interaction => {
        if (interaction.feedback && interaction.emotion) {
          // Use real user feedback to improve the model
          aiEngine.updateModelFromFeedback(
            interaction.id,
            interaction.emotion,
            interaction.feedback === 'useful' ? 'helpful' : 'not_helpful',
            interaction.userMessage
          );
        }
      });
      
      console.log(`📚 Learned from ${recentInteractions.length} user interactions`);
    } catch (error) {
      console.error("Error learning from interactions:", error);
    }
  }

  /**
   * Performs periodic model improvements
   */
  public async performPeriodicTraining() {
    if (this.isTraining) return;
    
    console.log("🔄 Performing periodic ML improvement...");
    
    try {
      await this.continuelearningFromInteractions();
      await this.optimizeVerseRecommendations();
      
      console.log("✅ Periodic training completed");
    } catch (error) {
      console.error("❌ Error in periodic training:", error);
    }
  }

  public getTrainingStatus() {
    return {
      isTraining: this.isTraining,
      progress: this.trainingProgress
    };
  }
}

// Export singleton instance
export const mlTrainer = new MLTrainingService();

// Schedule periodic training every 30 minutes
setInterval(() => {
  mlTrainer.performPeriodicTraining();
}, 30 * 60 * 1000);