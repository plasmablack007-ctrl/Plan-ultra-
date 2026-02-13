export enum Subject {
  MATHEMATICS = 'Matemáticas',
  LANGUAGE = 'Lengua y Literatura',
  SCIENCE = 'Ciencias Naturales',
  SOCIAL_STUDIES = 'Estudios Sociales',
  VALUES = 'Creciendo en Valores',
  BIBLE = 'Biblia',
  ENGLISH = 'Inglés'
}

export enum GradeLevel {
  FIRST = '1er Grado',
  SECOND = '2do Grado',
  THIRD = '3er Grado',
  FOURTH = '4th Grado',
  FIFTH = '5to Grado',
  SIXTH = '6to Grado'
}

export enum ContentType {
  CONCEPTUAL = 'Conceptual (Saber)',
  PROCEDURAL = 'Procedimental (Saber Hacer)',
  ATTITUDINAL = 'Actitudinal (Saber Ser)'
}

export interface LessonPlanRequest {
  subject: Subject;
  grade: GradeLevel;
  topic: string; // Used if no PDF is present, or as context
  biblicalFocus?: string;
  duration: string;
  pdfData?: string; // Base64 encoded string of the PDF
  sectionNumber?: string; // e.g., "1.1", "2.3"
  contentType?: ContentType;
  model?: string;
}

export interface FaithIntegration {
  objective: string;
  bibleVerse: string;
  spiritualConcept: string;
}

export interface MethodologicalStrategy {
  phase: 'Ambientar' | 'Reflexionar' | 'Conceptualizar' | 'Aplicar' | 'Evaluar';
  title: string;
  activities: string[];
  resources: string[];
  time: string;
}

export interface Evaluation {
  qualitative: string[];
  quantitative: string[];
}

export interface TeacherGuide {
  priorKnowledge: string[];
  differentiation: string[];
  keyVocabulary: string[];
  methodologicalTips: string[];
}

export interface Homework {
  activity: string;
  evaluationCriteria: string;
}

export interface GeneratedLessonPlan {
  id: string;
  generalData: {
    subject: string;
    grade: string;
    unit: string;
    achievementIndicator: string; // Indicador de Logro (MINED)
    contentConceptual: string;
  };
  faithIntegration: FaithIntegration;
  sequence: MethodologicalStrategy[];
  evaluation: Evaluation;
  teacherGuide?: TeacherGuide;
  homework?: Homework;
  resources: string[];
  flashcardPrompts?: string[];
}

// New Types for Home Review
export interface HomeReviewRequest {
  subject: Subject;
  grade: GradeLevel;
  topic: string;
}

export interface GeneratedHomeReview {
  message: string;
}

// New Types for Assessment Generator
export interface AssessmentRequest {
  topic: string;
  grade: string;
  type: 'QUIZ' | 'RUBRIC';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface RubricCriteria {
  criteria: string;
  excellent: string;
  good: string;
  needsImprovement: string;
}

export interface GeneratedAssessment {
  quiz?: {
    questions: QuizQuestion[];
  };
  rubric?: {
    rows: RubricCriteria[];
  };
}

// New Types for Adaptation (Inclusion)
export interface AdaptationRequest {
  topic: string;
  grade: string;
  needType: 'General' | 'ADHD' | 'Dyslexia' | 'Gifted'; // TDAH, Dislexia, Altas Capacidades
}

export interface GeneratedAdaptation {
  strategies: string[];
  modifiedActivity: string;
  evaluationAdjustment: string;
}

// New Types for Dynamics (Gamification)
export interface DynamicsRequest {
  topic: string;
  grade: string;
}

export interface GameIdea {
  title: string;
  type: 'Activo' | 'Tranquilo' | 'Competitivo';
  instructions: string;
  materials: string;
}

export interface GeneratedDynamics {
  games: GameIdea[];
}

// New Types for Worksheet Generator
export interface WorksheetRequest {
  topic: string;
  grade: string;
  subject: string;
}

export interface WorksheetSection {
  title: string;
  type: 'text' | 'lines' | 'matching' | 'box';
  content: string[]; // List of questions or items
}

export interface GeneratedWorksheet {
  title: string;
  instructions: string;
  sections: WorksheetSection[];
}

// New Types for Whiteboard Designer
export interface WhiteboardRequest {
  topic: string;
  grade: string;
  bibleVerse: string;
}

export interface GeneratedWhiteboard {
  leftPanel: string[]; // Date, Value, Verse
  centerPanel: {
    title: string;
    keyPoints: string[];
    diagramType: string; // "Mind Map" | "List" | "Drawing"
  };
  rightPanel: string[]; // Homework, Vocab, Reminders
}

// New Types for Slides Generator
export interface SlidesRequest {
  topic: string;
  grade: string;
  bibleVerse: string;
  spiritualConcept: string;
}

export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  visualSuggestion: string; // Description of image/icon
}

export interface GeneratedSlides {
  slides: Slide[];
}

// New Types for Vocabulary Cards (Printables)
export interface VocabularyRequest {
  topic: string;
  grade: string;
}

export interface VocabularyCard {
  term: string;
  definition: string;
  icon: string; // Emoji
}

export interface GeneratedVocabulary {
  cards: VocabularyCard[];
}