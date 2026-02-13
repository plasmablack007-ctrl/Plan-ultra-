import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLessonPlan, LessonPlanRequest, HomeReviewRequest, GeneratedHomeReview, AssessmentRequest, GeneratedAssessment, AdaptationRequest, GeneratedAdaptation, DynamicsRequest, GeneratedDynamics, WorksheetRequest, GeneratedWorksheet, WhiteboardRequest, GeneratedWhiteboard, SlidesRequest, GeneratedSlides, VocabularyRequest, GeneratedVocabulary } from "../types";

// Helper to ensure API key is present
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment");
    throw new Error("API Key missing");
  }
  return key;
};

// Helper to clean JSON string if model adds markdown
const cleanJson = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?|```/g, '').trim();
  // Sometimes models add a preamble, try to find the first {
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
  }
  // Remove trailing characters after the last }
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
  }
  return cleaned;
};

// SHARED FALLBACK LOGIC
// We try the requested model first. If it fails, we try the fallback models.
// Updated to use supported models per guidelines.
const FALLBACK_MODELS = ['gemini-3-flash-preview'];

const generateWithFallback = async (
  ai: GoogleGenAI, 
  primaryModel: string, 
  contents: any, 
  schema: any, 
  temperature: number
): Promise<any> => {
  // Deduplicate models to try
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: temperature, 
          // maxOutputTokens: 8192, // Ensure we have enough space for large JSONs
        },
      });

      const text = response.text;
      if (!text) throw new Error("No text in response");
      
      const cleanText = cleanJson(text);
      try {
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error(`JSON Parse error for model ${model}:`, parseError);
        // If it's a JSON error, we might want to retry with a different model or re-throw to trigger fallback
        throw new Error(`Invalid JSON returned by ${model}`);
      }

    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message || error);
      lastError = error;
      // Continue to next model in the list
    }
  }

  // If we get here, all models failed
  console.error("All models failed. Last error:", lastError);
  throw lastError;
};

export const generateLessonPlanAI = async (request: LessonPlanRequest): Promise<GeneratedLessonPlan> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Default to gemini-3-pro-preview for complex tasks like lesson planning
  const requestedModel = request.model || 'gemini-3-pro-preview';

  let textPrompt = `
    Act as an expert pedagogue for the Nicaraguan Primary Education system, specifically focusing on the Seventh-day Adventist (SDA) curriculum integration.
    
    Create a COMPREHENSIVE and DETAILED lesson plan ("Plan de Clase Ultra") for:
    - Subject: ${request.subject}
    - Grade: ${request.grade}
    - Topic: ${request.topic}
    ${request.biblicalFocus ? `- Focus Value/Verse: ${request.biblicalFocus}` : ''}
    - Duration: ${request.duration}
  `;

  if (request.sectionNumber) {
    textPrompt += `\n\nCRITICAL INSTRUCTION: Analyze the provided PDF document. Locate Section ${request.sectionNumber}. You MUST extract the educational content exclusively from this section.`;
  }

  if (request.contentType) {
    textPrompt += `\n\nCONTENT TYPE FOCUS: You must prioritize the '${request.contentType}' aspect of the lesson. 
    - If 'Conceptual', focus on definitions, theories, and facts found in the section.
    - If 'Procedural', focus on the steps, methods, exercises, and 'how-to' found in the section.
    - If 'Attitudinal', focus on values, behaviors, and emotional connections found in or related to the section.`;
  }

  textPrompt += `
    REQUIREMENTS:
    1. Align "Indicador de Logro" with MINED (Nicaragua Ministry of Education) standards.
    2. Deeply integrate the "Integración de la Fe" (Faith Integration).
    3. Use the "Valores Vitales con Jesús" or "ACES" methodology for the sequence (Ambientar, Motivar, Experimentar/Reflexionar, Aplicar).
    4. Include specific evaluation criteria.
    5. TEACHER'S COMPREHENSIVE GUIDE (MANDATORY):
       - "Prior Knowledge": What students need to know before this class.
       - "Key Vocabulary": Important terms to define during class.
       - "Differentiation Strategies": Specific ways to help struggling students and challenge advanced ones.
       - "Methodological Tips": Practical advice for the teacher to execute this specific lesson effectively.
    6. HOMEWORK: A specific assignment with clear evaluation criteria.
    7. FLASHCARDS: 3-5 Image Generation Prompts for visual aids.

    Return ONLY JSON matching the specific schema provided. Keep descriptions concise to avoid token limits.
  `;

  const contents: any = {
    parts: []
  };

  if (request.pdfData) {
    contents.parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: request.pdfData
      }
    });
  }

  contents.parts.push({ text: textPrompt });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      generalData: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          grade: { type: Type.STRING },
          unit: { type: Type.STRING },
          achievementIndicator: { type: Type.STRING },
          contentConceptual: { type: Type.STRING },
        },
      },
      faithIntegration: {
        type: Type.OBJECT,
        properties: {
          objective: { type: Type.STRING },
          bibleVerse: { type: Type.STRING },
          spiritualConcept: { type: Type.STRING },
        },
      },
      teacherGuide: {
        type: Type.OBJECT,
        properties: {
          priorKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
          differentiation: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodologicalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      },
      sequence: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: { type: Type.STRING },
            title: { type: Type.STRING },
            activities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            resources: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            time: { type: Type.STRING },
          },
        },
      },
      evaluation: {
        type: Type.OBJECT,
        properties: {
          qualitative: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          quantitative: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
      },
      homework: {
         type: Type.OBJECT,
         properties: {
            activity: { type: Type.STRING },
            evaluationCriteria: { type: Type.STRING }
         }
      },
      resources: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      flashcardPrompts: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
  };

  try {
    const parsedData = await generateWithFallback(ai, requestedModel, contents, responseSchema, 0.3);
    return {
      ...parsedData,
      id: crypto.randomUUID(),
    };
  } catch (error) {
    throw error;
  }
};

export const generateHomeReviewAI = async (request: HomeReviewRequest): Promise<GeneratedHomeReview> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const textPrompt = `
    Act as a friendly and professional teacher at an Adventist School in Nicaragua.
    
    Write a WhatsApp message to be sent to parents/students summarizing the class.
    
    Details:
    - Subject: ${request.subject}
    - Grade: ${request.grade}
    - Topic: ${request.topic}

    Structure of the WhatsApp message:
    1. 📢 **Greeting:** Warm greeting (e.g., "Bendiciones familia...", "Hola queridos estudiantes...").
    2. 🧠 **Today's Class:** A very brief, bulleted summary of what was learned today (2-3 points max). Simple language.
    3. 🏠 **Home Mission:** A fun, short practical activity or question for them to discuss or do at home to reinforce the learning. NOT a boring homework assignment, but a "mission" or "challenge".
    4. ✝️ **Faith Thought:** A very short spiritual connection or verse related to the topic.
    5. 👋 **Closing:** Encouraging closing.

    Format: Use emojis appropriate for WhatsApp. Keep it concise.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING },
    },
  };

  // Use gemini-3-flash-preview for basic text tasks
  return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.5);
};

export const generateAssessmentAI = async (request: AssessmentRequest): Promise<GeneratedAssessment> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  let prompt = "";
  // Initialize responseSchema explicitly to avoid type issues or sending empty objects
  let responseSchema: any = null;

  if (request.type === 'QUIZ') {
    prompt = `Create a 5-question Multiple Choice Quiz for ${request.grade} students about "${request.topic}". 
    Include 4 options per question and mark the correct answer. The language must be Spanish.`;
    
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        quiz: {
          type: Type.OBJECT,
          properties: {
             questions: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   question: { type: Type.STRING },
                   options: { type: Type.ARRAY, items: { type: Type.STRING } },
                   correctAnswer: { type: Type.STRING }
                 }
               }
             }
          }
        }
      }
    };
  } else {
    prompt = `Create a Grading Rubric (Rúbrica de Evaluación) for a project or activity about "${request.topic}" for ${request.grade} students.
    Include 3-4 criteria rows. Columns should be: Criteria, Excellent, Good, Needs Improvement. Language: Spanish.`;

    responseSchema = {
      type: Type.OBJECT,
      properties: {
        rubric: {
          type: Type.OBJECT,
          properties: {
             rows: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   criteria: { type: Type.STRING },
                   excellent: { type: Type.STRING },
                   good: { type: Type.STRING },
                   needsImprovement: { type: Type.STRING }
                 }
               }
             }
          }
        }
      }
    };
  }

  return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: prompt }] }, responseSchema, 0.4);
};

export const generateAdaptationAI = async (request: AdaptationRequest): Promise<GeneratedAdaptation> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const textPrompt = `
    Act as a Special Education Specialist. Provide specific curricular adaptations for a lesson about "${request.topic}" for a ${request.grade} student with ${request.needType} (e.g. ADHD, Dyslexia, etc).
    
    Provide:
    1. 3 Specific Strategies to implement in class.
    2. A Modified Activity description (easier or different format).
    3. How to adjust the evaluation for this student.

    Language: Spanish.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
      modifiedActivity: { type: Type.STRING },
      evaluationAdjustment: { type: Type.STRING },
    },
  };

  return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.4);
};

export const generateDynamicsAI = async (request: DynamicsRequest): Promise<GeneratedDynamics> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const textPrompt = `
    Suggest 3 educational games or gamification dynamics for a class about "${request.topic}" (Grade: ${request.grade}).
    
    Games should be diverse: 
    1. One Active/Physical game.
    2. One Quiet/Concentration game.
    3. One Competitive/Group game.

    Language: Spanish.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      games: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            instructions: { type: Type.STRING },
            materials: { type: Type.STRING },
          }
        }
      }
    },
  };

  return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.7);
};

export const generateWorksheetAI = async (request: WorksheetRequest): Promise<GeneratedWorksheet> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
  
    const textPrompt = `
      Create a Student Worksheet (Hoja de Trabajo) for printing.
      Topic: ${request.topic}
      Grade: ${request.grade}
      Subject: ${request.subject}
  
      Include 3 distinct sections (e.g., "Complete the sentences", "Match terms", "Solve/Answer").
      Language: Spanish.
    `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        instructions: { type: Type.STRING },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, description: "One of: text, lines, matching, box" },
              content: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      },
    };
  
    return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.5);
  };
  
  export const generateWhiteboardAI = async (request: WhiteboardRequest): Promise<GeneratedWhiteboard> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
  
    const textPrompt = `
      Create a Classroom Whiteboard Layout Plan.
      Topic: ${request.topic}
      Grade: ${request.grade}
      
      Structure the board into 3 panels:
      1. Left Panel: Date, Subject, Bible Verse (${request.bibleVerse}).
      2. Center Panel: Main topic title, Key concept points or diagram ideas.
      3. Right Panel: Homework, Vocabulary, Reminders.
  
      Language: Spanish.
    `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        leftPanel: { type: Type.ARRAY, items: { type: Type.STRING } },
        centerPanel: {
          type: Type.OBJECT,
          properties: {
              title: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              diagramType: { type: Type.STRING }
          }
        },
        rightPanel: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    };
  
    return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.4);
  };

  export const generateSlidesAI = async (request: SlidesRequest): Promise<GeneratedSlides> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
  
    const textPrompt = `
      Create a Presentation Structure (5-7 slides) for a class.
      Topic: ${request.topic}
      Grade: ${request.grade}
      
      CRITICAL REQUIREMENT: One slide MUST be explicitly dedicated to the "Faith Integration" (Integración de la Fe) or "Reflexión Espiritual", connecting the topic to the Bible Verse: "${request.bibleVerse}" or the value: "${request.spiritualConcept}".
      
      For each slide, provide:
      1. Title.
      2. Bullet points (short content).
      3. Speaker Notes (what the teacher should say).
      4. Visual Suggestion (description of an image).
      
      Language: Spanish.
    `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slideNumber: { type: Type.INTEGER },
              title: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              speakerNotes: { type: Type.STRING },
              visualSuggestion: { type: Type.STRING }
            }
          }
        }
      },
    };
  
    return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.5);
  };

  export const generateVocabularyAI = async (request: VocabularyRequest): Promise<GeneratedVocabulary> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
  
    const textPrompt = `
      Create a list of 8 Vocabulary Flashcards for printing based on the topic: ${request.topic} (Grade: ${request.grade}).
      
      For each card provide:
      1. The Term (Main word).
      2. A student-friendly definition (1 sentence).
      3. An appropriate Emoji/Icon that represents the term.
      
      Language: Spanish.
    `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
              icon: { type: Type.STRING }
            }
          }
        }
      },
    };
  
    return generateWithFallback(ai, 'gemini-3-flash-preview', { parts: [{ text: textPrompt }] }, responseSchema, 0.5);
  };

  export const chatWithLessonPlan = async (
    plan: GeneratedLessonPlan, 
    history: { role: 'user' | 'model'; text: string }[], 
    newMessage: string
  ): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
  
    // Serialize plan to provide context
    const context = JSON.stringify(plan, null, 2);
    
    const systemInstruction = `
      You are an expert educational consultant and pedagogical coach.
      You are discussing a specific lesson plan generated for a teacher.
      
      CONTEXT (THE LESSON PLAN):
      ${context}
      
      YOUR ROLE:
      1. Answer specific questions about the plan.
      2. Suggest improvements if asked.
      3. Explain pedagogical concepts used in the plan.
      4. Provide examples of activities if requested.
      
      Keep answers concise, practical, and encouraging. Use formatting (bolding, lists) to make it readable.
    `;
  
    // Construct history with correct role mapping for Gemini
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
  
    try {
      const createChatAndSend = async (model: string) => {
          const chat = ai.chats.create({
            model: model,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7
            },
            history: chatHistory
          });
          const result = await chat.sendMessage({ message: newMessage });
          return result.text;
      };

      try {
         // Try preferred model for chat
         return await createChatAndSend('gemini-3-flash-preview');
      } catch (e) {
         console.warn("Chat failed on gemini-3-flash-preview, retrying...");
         // If fails, maybe try pro or just throw
         return await createChatAndSend('gemini-3-pro-preview');
      }

    } catch (error) {
      console.error("Chat Error:", error);
      throw error;
    }
  };