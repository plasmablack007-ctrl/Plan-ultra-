import React, { useState, useRef, useEffect } from 'react';
import { Subject, GradeLevel, LessonPlanRequest, GeneratedLessonPlan, ContentType, GeneratedAssessment, GeneratedAdaptation, GeneratedDynamics, AdaptationRequest, GeneratedWorksheet, GeneratedWhiteboard, GeneratedSlides, GeneratedVocabulary } from '../types';
import { generateLessonPlanAI, generateAssessmentAI, generateAdaptationAI, generateDynamicsAI, generateWorksheetAI, generateWhiteboardAI, generateSlidesAI, generateVocabularyAI, chatWithLessonPlan } from '../services/geminiService';
import { generateDocx } from '../utils/docxGenerator';
import { SparklesIcon, ArrowPathIcon, PrinterIcon, DocumentArrowUpIcon, XMarkIcon, PhotoIcon, AcademicCapIcon, BookOpenIcon, LightBulbIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon, RectangleStackIcon, TableCellsIcon, HeartIcon, PuzzlePieceIcon, UserGroupIcon, DocumentTextIcon, PresentationChartBarIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, DocumentIcon, ComputerDesktopIcon, ScissorsIcon, CpuChipIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LessonGeneratorProps {
  onPlanGenerated: (plan: GeneratedLessonPlan) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const LOADING_MESSAGES = [
  "Conectando con el currículo...",
  "Analizando estándares MINED...",
  "Integrando valores bíblicos...",
  "Diseñando secuencia didáctica...",
  "Creando evaluación...",
  "Finalizando detalles..."
];

export const LessonGenerator: React.FC<LessonGeneratorProps> = ({ onPlanGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Assessment States
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<GeneratedAssessment | null>(null);

  // Adaptation & Dynamics States
  const [adaptationLoading, setAdaptationLoading] = useState(false);
  const [adaptationData, setAdaptationData] = useState<GeneratedAdaptation | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<AdaptationRequest['needType']>('General');

  const [dynamicsLoading, setDynamicsLoading] = useState(false);
  const [dynamicsData, setDynamicsData] = useState<GeneratedDynamics | null>(null);

  // Worksheet & Whiteboard States
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [worksheetData, setWorksheetData] = useState<GeneratedWorksheet | null>(null);

  const [whiteboardLoading, setWhiteboardLoading] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState<GeneratedWhiteboard | null>(null);

  // Slides State
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [slidesData, setSlidesData] = useState<GeneratedSlides | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Vocabulary Cards State
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabData, setVocabData] = useState<GeneratedVocabulary | null>(null);

  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);


  const [formData, setFormData] = useState<LessonPlanRequest>({
    subject: Subject.MATHEMATICS,
    grade: GradeLevel.FIFTH,
    topic: '',
    biblicalFocus: '',
    duration: '90 min',
    sectionNumber: '',
    contentType: ContentType.CONCEPTUAL,
    model: 'gemini-3-flash-preview' // Default set to FLASH for speed
  });

  // Cycle loading messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingText(LOADING_MESSAGES[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFileName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64String.split(',')[1];
        setFormData(prev => ({ ...prev, pdfData: base64Data }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setPdfFileName(null);
    setFormData(prev => ({ ...prev, pdfData: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText(LOADING_MESSAGES[0]);
    setGeneratedPlan(null);
    setAssessmentData(null); 
    setAdaptationData(null);
    setDynamicsData(null);
    setWorksheetData(null);
    setWhiteboardData(null);
    setSlidesData(null);
    setVocabData(null);
    setChatMessages([]); // Reset chat

    try {
      const plan = await generateLessonPlanAI(formData);
      setGeneratedPlan(plan);
      onPlanGenerated(plan);
    } catch (error) {
      alert("Error generating plan. The AI models may be busy or your API key permissions are restricted. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDownloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin:       0.3,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    // @ts-ignore - html2pdf is loaded via script tag in index.html
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert("La librería PDF no se cargó correctamente.");
    }
  };

  const handleDownloadWord = async () => {
    if (!generatedPlan) return;
    try {
      await generateDocx(generatedPlan);
    } catch (error) {
      console.error(error);
      alert("Error al generar el documento Word");
    }
  };

  const handleDownloadPrompts = () => {
    if (!generatedPlan?.flashcardPrompts) return;
    const text = generatedPlan.flashcardPrompts.join('\n\n-------------------\n\n');
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Prompts_Imagenes_${generatedPlan.generalData.subject}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateAssessment = async (type: 'QUIZ' | 'RUBRIC') => {
    if (!generatedPlan) return;
    setAssessmentLoading(true);
    try {
      const result = await generateAssessmentAI({
        topic: generatedPlan.generalData.contentConceptual,
        grade: generatedPlan.generalData.grade,
        type: type
      });
      setAssessmentData(result);
    } catch (error) {
      alert("Error generando evaluación.");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleGenerateAdaptation = async () => {
    if (!generatedPlan) return;
    setAdaptationLoading(true);
    try {
      const result = await generateAdaptationAI({
        topic: generatedPlan.generalData.contentConceptual,
        grade: generatedPlan.generalData.grade,
        needType: selectedNeed
      });
      setAdaptationData(result);
    } catch (error) {
      alert("Error generando adecuación.");
    } finally {
      setAdaptationLoading(false);
    }
  };

  const handleGenerateDynamics = async () => {
    if (!generatedPlan) return;
    setDynamicsLoading(true);
    try {
      const result = await generateDynamicsAI({
        topic: generatedPlan.generalData.contentConceptual,
        grade: generatedPlan.generalData.grade
      });
      setDynamicsData(result);
    } catch (error) {
      alert("Error generando dinámicas.");
    } finally {
      setDynamicsLoading(false);
    }
  };

  const handleGenerateWorksheet = async () => {
    if (!generatedPlan) return;
    setWorksheetLoading(true);
    try {
        const result = await generateWorksheetAI({
            topic: generatedPlan.generalData.contentConceptual,
            grade: generatedPlan.generalData.grade,
            subject: generatedPlan.generalData.subject
        });
        setWorksheetData(result);
    } catch (error) {
        alert("Error generando hoja de trabajo");
    } finally {
        setWorksheetLoading(false);
    }
  };

  const handleGenerateWhiteboard = async () => {
    if (!generatedPlan) return;
    setWhiteboardLoading(true);
    try {
        const result = await generateWhiteboardAI({
            topic: generatedPlan.generalData.contentConceptual,
            grade: generatedPlan.generalData.grade,
            bibleVerse: generatedPlan.faithIntegration.bibleVerse
        });
        setWhiteboardData(result);
    } catch (error) {
        alert("Error generando pizarra");
    } finally {
        setWhiteboardLoading(false);
    }
  };

  const handleGenerateSlides = async () => {
    if (!generatedPlan) return;
    setSlidesLoading(true);
    try {
        const result = await generateSlidesAI({
            topic: generatedPlan.generalData.contentConceptual,
            grade: generatedPlan.generalData.grade,
            bibleVerse: generatedPlan.faithIntegration.bibleVerse,
            spiritualConcept: generatedPlan.faithIntegration.spiritualConcept
        });
        setSlidesData(result);
        setActiveSlide(0);
    } catch (error) {
        alert("Error generando presentación");
    } finally {
        setSlidesLoading(false);
    }
  };

  const handleGenerateVocabulary = async () => {
    if (!generatedPlan) return;
    setVocabLoading(true);
    try {
        const result = await generateVocabularyAI({
            topic: generatedPlan.generalData.contentConceptual,
            grade: generatedPlan.generalData.grade
        });
        setVocabData(result);
    } catch (error) {
        alert("Error generando tarjetas de vocabulario");
    } finally {
        setVocabLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!currentChatInput.trim() || !generatedPlan) return;
    
    const userMsg = currentChatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setCurrentChatInput('');
    setChatLoading(true);

    try {
      const response = await chatWithLessonPlan(generatedPlan, chatMessages, userMsg);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  // Fecha actual formateada
  const currentDate = new Date().toLocaleDateString('es-NI', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-full relative">
      {/* Input Section */}
      <div className="xl:w-1/3 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-indigo-600" />
            Generador de Planes
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File Upload Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Libro de Texto / Guía (PDF)
              </label>
              {!pdfFileName ? (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                    <DocumentArrowUpIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs text-slate-500 mt-2 font-medium">Subir PDF de la Unidad</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                   <div className="flex items-center truncate">
                      <DocumentArrowUpIcon className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate max-w-[150px]">{pdfFileName}</span>
                   </div>
                   <button type="button" onClick={clearFile} className="text-slate-400 hover:text-red-500">
                     <XMarkIcon className="w-5 h-5" />
                   </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sección (ej. 1.1)</label>
                <input 
                  type="text" 
                  name="sectionNumber" 
                  value={formData.sectionNumber} 
                  onChange={handleChange}
                  placeholder="1.1"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enfoque de Contenido</label>
                  <select 
                    name="contentType" 
                    value={formData.contentType} 
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  >
                    {Object.values(ContentType).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>

            {/* Model Selector */}
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <label className="block text-xs font-bold text-indigo-800 uppercase mb-1 flex items-center">
                 <CpuChipIcon className="w-4 h-4 mr-1" />
                 Velocidad de Generación
              </label>
              <select 
                name="model" 
                value={formData.model} 
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
              >
                <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Súper Rápido - Recomendado)</option>
                <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Máximo Detalle - Más Lento)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
              <select 
                name="grade" 
                value={formData.grade} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {Object.values(GradeLevel).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignatura</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tema (Opcional si hay PDF)</label>
              <input 
                type="text" 
                name="topic" 
                value={formData.topic} 
                onChange={handleChange}
                placeholder="Tema específico..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enfoque Bíblico (Opcional)</label>
              <input 
                type="text" 
                name="biblicalFocus" 
                value={formData.biblicalFocus} 
                onChange={handleChange}
                placeholder="Ej. Salmos 23..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración</label>
              <input 
                type="text" 
                name="duration" 
                value={formData.duration} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-all transform active:scale-95 flex justify-center items-center ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
              }`}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Crear Plan Ultra
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Result Section */}
      <div className="xl:w-2/3 w-full pb-10">
        {generatedPlan ? (
          <>
            <div 
              id="printable-lesson-plan"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up mb-8"
            >
              
              {/* Nuevo Encabezado Personalizado */}
              <div className="p-8 bg-white border-b-2 border-slate-100" style={{ pageBreakInside: 'avoid' }}>
                  <div className="text-center border-b border-slate-200 pb-6 mb-6 relative">
                      <h1 className="text-2xl font-extrabold text-slate-900 uppercase tracking-wider">Colegio Adventista Porteño</h1>
                      <p className="text-slate-500 font-medium mt-1">Plan de Clase - {currentDate}</p>
                      
                      <div className="absolute right-0 top-0 flex gap-2">
                        <button 
                            onClick={handleDownloadWord}
                            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descargar Word"
                        >
                            <DocumentIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => handleDownloadPDF('printable-lesson-plan', 'Plan_Clase.pdf')}
                            data-html2canvas-ignore="true"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Descargar PDF"
                        >
                            <PrinterIcon className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  {/* Grid de Información Clave */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Grado</span>
                          <span className="font-semibold text-slate-900">{generatedPlan.generalData.grade}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiempo</span>
                          <span className="font-semibold text-slate-900">{formData.duration}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg col-span-2 border border-slate-100">
                          <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Asignatura</span>
                          <span className="font-semibold text-slate-900">{generatedPlan.generalData.subject}</span>
                      </div>
                  </div>

                  {/* Contenido e Indicadores */}
                  <div className="space-y-6">
                      <div>
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 block">Contenido</span>
                          <h2 className="text-xl font-bold text-slate-900 leading-tight">{generatedPlan.generalData.contentConceptual}</h2>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                              <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center">
                                  Indicador de Logro
                              </h3>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium">{generatedPlan.generalData.achievementIndicator}</p>
                          </div>
                          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                              <h3 className="text-xs font-bold text-emerald-800 uppercase mb-2">Criterio de Evaluación</h3>
                              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                                  {generatedPlan.evaluation.qualitative.slice(0, 3).map((crit, idx) => (
                                      <li key={idx} className="leading-snug">{crit}</li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Teacher Preparation Guide */}
              {generatedPlan.teacherGuide && (
                <div className="bg-slate-50 p-8 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <BookOpenIcon className="w-5 h-5 mr-2 text-indigo-500" />
                    Guía de Preparación Docente
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Conocimientos Previos</h4>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                            {generatedPlan.teacherGuide.priorKnowledge.map((pk, i) => (
                              <li key={i}>{pk}</li>
                            ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vocabulario Clave</h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedPlan.teacherGuide.keyVocabulary.map((word, i) => (
                              <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                                  {word}
                              </span>
                            ))}
                        </div>
                      </div>
                  </div>
                </div>
              )}

              {/* Faith Integration Section */}
              <div className="p-8 border-b border-slate-100 bg-amber-50/30">
                <h3 className="text-lg font-bold text-amber-700 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 text-lg">✝</span>
                  Integración de la Fe
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-xs text-amber-500 font-bold uppercase mb-1">Principio Espiritual</p>
                    <p className="text-slate-700 font-medium">{generatedPlan.faithIntegration.spiritualConcept}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-xs text-amber-500 font-bold uppercase mb-1">Texto Bíblico</p>
                    <p className="text-slate-700 italic">"{generatedPlan.faithIntegration.bibleVerse}"</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-600 bg-amber-100/20 p-4 rounded-lg">
                  <strong>Objetivo Integrado:</strong> {generatedPlan.faithIntegration.objective}
                </div>
              </div>

              {/* Methodology Sequence */}
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Secuencia Didáctica (ACES)</h3>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                  {generatedPlan.sequence.map((step, idx) => (
                    <div key={idx} className="relative pl-8" style={{ pageBreakInside: 'avoid' }}>
                      <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500"></span>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-bold text-slate-900">{step.phase}: {step.title}</h4>
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{step.time}</span>
                      </div>
                      
                      <ul className="space-y-2 mb-3">
                        {step.activities.map((act, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start">
                            <span className="mr-2 text-indigo-400">•</span>
                            {act}
                          </li>
                        ))}
                      </ul>

                      {step.resources.length > 0 && (
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-semibold">Recursos:</span>
                          {step.resources.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Strategy Section */}
              {generatedPlan.teacherGuide && (
                <div className="p-8 border-b border-slate-100 bg-blue-50/20">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                      Estrategias Docentes
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Atención a la Diversidad</h4>
                          <ul className="space-y-2">
                              {generatedPlan.teacherGuide.differentiation.map((tip, i) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start">
                                    <span className="text-blue-400 mr-2">→</span> {tip}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Consejos Metodológicos</h4>
                          <ul className="space-y-2">
                              {generatedPlan.teacherGuide.methodologicalTips.map((tip, i) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start">
                                    <span className="text-blue-400 mr-2">★</span> {tip}
                                </li>
                              ))}
                          </ul>
                        </div>
                    </div>
                </div>
              )}

              {/* Detailed Evaluation Section */}
              <div className="grid md:grid-cols-2 border-b border-slate-100">
                <div className="p-8 border-r border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Evaluación Cualitativa (Detalle)</h3>
                  <ul className="space-y-2">
                      {generatedPlan.evaluation.qualitative.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start">
                          <span className="text-green-500 mr-2">✓</span> {item}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="p-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Evaluación Cuantitativa</h3>
                  <ul className="space-y-2">
                      {generatedPlan.evaluation.quantitative.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start">
                          <span className="text-blue-500 mr-2">⚡</span> {item}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Homework Section */}
              {generatedPlan.homework && (
                <div className="p-8 bg-slate-50 rounded-b-2xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                      <AcademicCapIcon className="w-5 h-5 mr-2 text-indigo-500" />
                      Tarea Escolar
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-800 font-medium mb-2">{generatedPlan.homework.activity}</p>
                      <p className="text-xs text-slate-500"><strong>Criterio de Evaluación:</strong> {generatedPlan.homework.evaluationCriteria}</p>
                    </div>
                </div>
              )}

            </div>

            {/* CLASSROOM RESOURCES AREA */}
            <h2 className="text-xl font-bold text-slate-900 mb-6 pl-2 border-l-4 border-indigo-500">Recursos de Aula</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                
                {/* SLIDES GENERATOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <ComputerDesktopIcon className="w-6 h-6 text-fuchsia-600 mr-2" />
                            Presentación de Clase (Slides)
                        </h3>
                        <button 
                            onClick={handleGenerateSlides}
                            disabled={slidesLoading}
                            className="flex items-center space-x-2 text-sm bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-100 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {slidesLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PresentationChartBarIcon className="w-4 h-4" />}
                            <span>Generar Slides</span>
                        </button>
                    </div>

                    {slidesData && (
                      <div className="animate-fade-in bg-slate-900 p-8 rounded-xl shadow-2xl">
                        <div className="max-w-4xl mx-auto aspect-video bg-white rounded-lg shadow-lg overflow-hidden relative flex flex-col">
                            {/* Slide Visual */}
                            <div className="flex-1 p-12 flex flex-col justify-center items-center text-center bg-gradient-to-br from-indigo-50 to-white">
                                <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                                  {slidesData.slides[activeSlide].title}
                                </h2>
                                <ul className="text-left space-y-4 max-w-2xl text-xl text-slate-700">
                                  {slidesData.slides[activeSlide].bullets.map((bullet, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-indigo-500 mr-3">•</span>
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-12 text-sm text-slate-400 italic">
                                  Sug. Visual: {slidesData.slides[activeSlide].visualSuggestion}
                                </div>
                            </div>
                            
                            {/* Navigation */}
                            <div className="h-14 bg-slate-100 flex items-center justify-between px-6 border-t border-slate-200">
                                <button 
                                  onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                                  disabled={activeSlide === 0}
                                  className="text-slate-500 disabled:opacity-30 hover:text-indigo-600 font-bold"
                                >
                                  ← Anterior
                                </button>
                                <span className="text-sm font-medium text-slate-500">
                                  Diapositiva {activeSlide + 1} de {slidesData.slides.length}
                                </span>
                                <button 
                                  onClick={() => setActiveSlide(Math.min(slidesData.slides.length - 1, activeSlide + 1))}
                                  disabled={activeSlide === slidesData.slides.length - 1}
                                  className="text-slate-500 disabled:opacity-30 hover:text-indigo-600 font-bold"
                                >
                                  Siguiente →
                                </button>
                            </div>
                        </div>

                        {/* Speaker Notes */}
                        <div className="mt-6 bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Notas del Orador:</p>
                          <p className="text-slate-300 text-sm font-mono leading-relaxed">
                            {slidesData.slides[activeSlide].speakerNotes}
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {/* VOCABULARY CARDS (NEW FEATURE) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <ScissorsIcon className="w-6 h-6 text-rose-600 mr-2" />
                            Material Recortable (Tarjetas Léxicas)
                        </h3>
                        <button 
                            onClick={handleGenerateVocabulary}
                            disabled={vocabLoading}
                            className="flex items-center space-x-2 text-sm bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {vocabLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ScissorsIcon className="w-4 h-4" />}
                            <span>Crear Tarjetas</span>
                        </button>
                    </div>
                    
                    {vocabData && (
                        <div className="animate-fade-in relative">
                            <div id="printable-vocabulary" className="bg-white p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {vocabData.cards.map((card, i) => (
                                    <div key={i} className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center aspect-[3/4] hover:border-rose-300 transition-colors bg-white relative">
                                        <div className="text-4xl mb-3">{card.icon}</div>
                                        <h4 className="font-bold text-lg text-slate-900 mb-2 uppercase">{card.term}</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-tight">{card.definition}</p>
                                        
                                        <div className="absolute top-2 right-2 text-slate-200">
                                            <ScissorsIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={() => handleDownloadPDF('printable-vocabulary', 'Tarjetas_Vocabulario.pdf')}
                                    className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
                                >
                                    <PrinterIcon className="w-5 h-5" />
                                    <span>Imprimir Tarjetas PDF</span>
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* WORKSHEET GENERATOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <DocumentTextIcon className="w-6 h-6 text-cyan-600 mr-2" />
                            Hoja de Trabajo
                        </h3>
                        <button 
                            onClick={handleGenerateWorksheet}
                            disabled={worksheetLoading}
                            className="flex items-center space-x-2 text-sm bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {worksheetLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <DocumentTextIcon className="w-4 h-4" />}
                            <span>Generar Hoja</span>
                        </button>
                    </div>
                    
                    {worksheetData && (
                        <div className="animate-fade-in relative">
                            {/* Worksheet Preview (Looks like paper) */}
                            <div id="printable-worksheet" className="bg-white border border-slate-300 shadow-md p-8 mx-auto max-w-2xl min-h-[600px] text-slate-900 font-serif">
                                <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-xl font-bold uppercase tracking-widest">Hoja de Trabajo</h1>
                                        <p className="text-sm mt-1">{generatedPlan.generalData.subject} • {generatedPlan.generalData.grade}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        <p>Nombre: ________________________________</p>
                                        <p className="mt-2">Fecha: _________________________________</p>
                                    </div>
                                </div>

                                <div className="mb-6 text-center">
                                    <h2 className="text-lg font-bold border-b inline-block pb-1">{worksheetData.title}</h2>
                                    <p className="text-sm italic mt-2 text-slate-600">{worksheetData.instructions}</p>
                                </div>

                                <div className="space-y-8">
                                    {worksheetData.sections.map((section, idx) => (
                                        <div key={idx}>
                                            <h3 className="font-bold text-md mb-2">{idx + 1}. {section.title}</h3>
                                            <div className="pl-4">
                                                {section.content.map((item, i) => (
                                                    <div key={i} className="mb-3 text-sm">
                                                        {section.type === 'lines' ? (
                                                            <div className="flex flex-col">
                                                                <span>{item}</span>
                                                                <div className="border-b border-slate-300 h-6 w-full"></div>
                                                            </div>
                                                        ) : section.type === 'box' ? (
                                                            <div className="border border-slate-400 h-24 p-2 rounded relative">
                                                                <span className="absolute -top-3 left-2 bg-white px-1 text-xs text-slate-500">{item}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <span>{String.fromCharCode(97 + i)})</span>
                                                                <span>{item}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDownloadPDF('printable-worksheet', 'Hoja_Trabajo.pdf')}
                                className="absolute top-2 right-2 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 shadow-lg"
                                title="Descargar Hoja PDF"
                            >
                                <PrinterIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* WHITEBOARD DESIGNER */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <PresentationChartBarIcon className="w-6 h-6 text-emerald-600 mr-2" />
                            Diseño de Pizarra
                        </h3>
                        <button 
                            onClick={handleGenerateWhiteboard}
                            disabled={whiteboardLoading}
                            className="flex items-center space-x-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {whiteboardLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PresentationChartBarIcon className="w-4 h-4" />}
                            <span>Organizar Pizarra</span>
                        </button>
                    </div>

                    {whiteboardData && (
                        <div className="animate-fade-in mt-4">
                            {/* Blackboard Visualizer */}
                            <div className="bg-[#1e453e] border-8 border-[#5d4037] rounded-lg p-4 shadow-2xl relative min-h-[300px] text-white font-sans">
                                {/* Chalk tray */}
                                <div className="absolute -bottom-4 left-0 right-0 h-4 bg-[#5d4037] shadow-md flex justify-center items-center space-x-4">
                                    <div className="w-12 h-1 bg-white rounded-full opacity-50"></div>
                                    <div className="w-8 h-2 bg-yellow-200 rounded opacity-80"></div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 h-full divide-x divide-white/20">
                                    {/* Left Panel: Protocol */}
                                    <div className="col-span-3 p-2 space-y-4">
                                        <div className="text-xs text-emerald-100 opacity-80 mb-2">Protocolo</div>
                                        <ul className="space-y-3 text-sm font-handwriting">
                                            {whiteboardData.leftPanel.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Center Panel: Content */}
                                    <div className="col-span-6 p-2 flex flex-col items-center text-center">
                                        <h2 className="text-xl font-bold border-b-2 border-white/50 pb-2 mb-4 w-full">{whiteboardData.centerPanel.title}</h2>
                                        
                                        <div className="flex-1 w-full flex flex-col justify-center items-center border border-dashed border-white/30 rounded p-4 bg-white/5">
                                            <span className="text-xs text-emerald-200 mb-2 uppercase tracking-wide">Diagrama: {whiteboardData.centerPanel.diagramType}</span>
                                            <ul className="text-left space-y-2 w-full pl-4 list-disc">
                                                {whiteboardData.centerPanel.keyPoints.map((point, i) => (
                                                    <li key={i}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Right Panel: Activities */}
                                    <div className="col-span-3 p-2">
                                        <div className="text-xs text-emerald-100 opacity-80 mb-2">Actividades</div>
                                        <ul className="space-y-3 text-sm font-handwriting">
                                            {whiteboardData.rightPanel.map((item, i) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="mr-2 text-yellow-300">★</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-4">Esquema sugerido para organizar el contenido visualmente.</p>
                        </div>
                    )}
                </div>


                {/* ASSESSMENT GENERATOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2 md:col-span-1">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                      <ClipboardDocumentIcon className="w-6 h-6 text-indigo-600 mr-2" />
                      Evaluación Automática
                   </h3>
                   
                   <div className="flex space-x-4 mb-6">
                      <button 
                        onClick={() => handleGenerateAssessment('QUIZ')}
                        disabled={assessmentLoading}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                         <RectangleStackIcon className="w-5 h-5" />
                         <span>Quiz</span>
                      </button>
                      <button 
                         onClick={() => handleGenerateAssessment('RUBRIC')}
                         disabled={assessmentLoading}
                         className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                         <TableCellsIcon className="w-5 h-5" />
                         <span>Rúbrica</span>
                      </button>
                   </div>

                   {assessmentLoading && (
                      <div className="p-4 text-center text-slate-500">
                        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        <p className="text-xs">Diseñando...</p>
                      </div>
                   )}

                   {assessmentData && assessmentData.quiz && (
                     <div className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-sm">Quiz Rápido</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                          {assessmentData.quiz.questions.map((q, i) => (
                            <div key={i}>
                              <p className="font-medium text-slate-800 text-xs mb-1">{i + 1}. {q.question}</p>
                              <div className="grid grid-cols-2 gap-1">
                                {q.options.map((opt, idx) => (
                                  <div key={idx} className={`text-[10px] p-1.5 rounded border ${opt === q.correctAnswer ? 'bg-green-100 border-green-300 text-green-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}

                   {assessmentData && assessmentData.rubric && (
                      <div className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                         <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-sm">Rúbrica</h4>
                         <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-200 text-slate-700">
                                <th className="p-1 rounded-tl">Crit.</th>
                                <th className="p-1">Excel.</th>
                                <th className="p-1">Bueno</th>
                                <th className="p-1 rounded-tr">Mejora</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                               {assessmentData.rubric.rows.map((row, i) => (
                                 <tr key={i} className="bg-white">
                                   <td className="p-1 font-medium text-slate-800">{row.criteria}</td>
                                   <td className="p-1 text-slate-600 bg-green-50/30">{row.excellent}</td>
                                   <td className="p-1 text-slate-600">{row.good}</td>
                                   <td className="p-1 text-slate-600 bg-red-50/30">{row.needsImprovement}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>

                {/* ADAPTATIONS GENERATOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2 md:col-span-1">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                      <HeartIcon className="w-6 h-6 text-pink-600 mr-2" />
                      Inclusión y Adecuaciones
                   </h3>

                   <div className="flex space-x-2 mb-4">
                      <select 
                        className="flex-1 text-sm border-slate-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring focus:ring-pink-200"
                        value={selectedNeed}
                        onChange={(e) => setSelectedNeed(e.target.value as any)}
                      >
                         <option value="General">Dificultad de Aprendizaje</option>
                         <option value="ADHD">TDAH (Atención)</option>
                         <option value="Dyslexia">Dislexia (Lectura)</option>
                         <option value="Gifted">Altas Capacidades</option>
                      </select>
                      <button 
                        onClick={handleGenerateAdaptation}
                        disabled={adaptationLoading}
                        className="bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {adaptationLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : 'Generar'}
                      </button>
                   </div>

                   {adaptationData && (
                     <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 animate-fade-in text-sm">
                        <div className="mb-3">
                           <strong className="text-pink-800 block mb-1">Estrategias Clave:</strong>
                           <ul className="list-disc list-inside text-slate-700 space-y-1">
                              {adaptationData.strategies.map((s, i) => <li key={i}>{s}</li>)}
                           </ul>
                        </div>
                        <div className="mb-3">
                           <strong className="text-pink-800 block mb-1">Actividad Modificada:</strong>
                           <p className="text-slate-700">{adaptationData.modifiedActivity}</p>
                        </div>
                        <div>
                           <strong className="text-pink-800 block mb-1">Ajuste Evaluativo:</strong>
                           <p className="text-slate-700">{adaptationData.evaluationAdjustment}</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* GAMIFICATION / DYNAMICS GENERATOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <PuzzlePieceIcon className="w-6 h-6 text-orange-500 mr-2" />
                        Dinámicas y Gamificación
                      </h3>
                      <button 
                        onClick={handleGenerateDynamics}
                        disabled={dynamicsLoading}
                        className="flex items-center space-x-2 text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                         {dynamicsLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <UserGroupIcon className="w-4 h-4" />}
                         <span>Sugerir Juegos</span>
                      </button>
                   </div>

                   {dynamicsData && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                         {dynamicsData.games.map((game, i) => (
                           <div key={i} className="bg-orange-50/40 p-4 rounded-xl border border-orange-100 flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-800 text-sm">{game.title}</h4>
                                <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{game.type}</span>
                              </div>
                              <p className="text-xs text-slate-600 mb-3 flex-grow">{game.instructions}</p>
                              <div className="text-[10px] text-slate-500 pt-2 border-t border-orange-100 mt-auto">
                                <strong>Materiales:</strong> {game.materials}
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* FLASHCARD SECTION */}
                {generatedPlan.flashcardPrompts && generatedPlan.flashcardPrompts.length > 0 && (
                  <div className="bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-700 relative overflow-hidden col-span-2">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PhotoIcon className="w-6 h-6 text-indigo-400" />
                            Zona de Recursos Digitales
                          </h3>
                          <button 
                            onClick={handleDownloadPrompts}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Descargar .txt
                          </button>
                      </div>
                      
                      <p className="text-slate-400 text-sm mb-6">
                        Utiliza estos prompts en herramientas como Midjourney, DALL-E 3 o Adobe Firefly para generar material didáctico visual de alta calidad.
                      </p>

                      <div className="space-y-4">
                          {generatedPlan.flashcardPrompts.map((prompt, i) => (
                            <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 group hover:border-indigo-500/50 transition-colors">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1 block">Flashcard {i + 1}</span>
                                  <p className="text-sm text-slate-200 font-mono leading-relaxed">{prompt}</p>
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(prompt, i)}
                                  className="p-2 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                                  title="Copiar prompt"
                                >
                                  {copiedIndex === i ? (
                                    <CheckIcon className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <ClipboardDocumentIcon className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl min-h-[500px] p-8 text-center">
            {loading ? (
               <div className="max-w-md w-full">
                 <h3 className="text-lg font-semibold text-slate-600 mb-2">Creando Plan Integral...</h3>
                 <p className="text-sm text-slate-500 mb-6 flex items-center justify-center">
                   <ClockIcon className="w-4 h-4 mr-1 animate-pulse" />
                   {loadingText}
                 </p>
                 <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500 h-2 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                 </div>
                 <p className="text-xs text-slate-400 mt-4">
                    {formData.model?.includes('pro') ? 'Usando modelo PRO: Puede tardar hasta 45 seg.' : 'Usando modelo FLASH: Generación rápida.'}
                 </p>
               </div>
            ) : (
              <>
                <SparklesIcon className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-600">Listo para crear</h3>
                <p className="max-w-xs mt-2">Sube un PDF o ingresa los detalles para generar un plan de clase alineado y espiritual.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button for Chat */}
      {generatedPlan && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
           {isChatOpen && (
              <div className="mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in-up h-[500px]">
                  <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                     <div>
                       <h3 className="font-bold text-sm">Asistente Pedagógico</h3>
                       <p className="text-xs text-indigo-200">En línea</p>
                     </div>
                     <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-indigo-200">
                        <XMarkIcon className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                     {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm mt-10">
                           <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                           <p>¡Hola! Soy tu asistente. Puedo ayudarte a mejorar o entender mejor este plan. ¿Qué necesitas?</p>
                        </div>
                     ) : (
                        chatMessages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                 <div className="prose prose-sm max-w-none text-inherit">
                                   {msg.text}
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                     <div ref={chatEndRef} />
                  </div>

                  <div className="p-3 bg-white border-t border-slate-200">
                     <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={currentChatInput}
                          onChange={(e) => setCurrentChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                          placeholder="Escribe tu consulta..."
                          disabled={chatLoading}
                          className="flex-1 border-slate-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        <button 
                          onClick={handleSendChat}
                          disabled={chatLoading || !currentChatInput.trim()}
                          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                           {chatLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <PaperAirplaneIcon className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>
              </div>
           )}

           <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center"
           >
              {isChatOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
           </button>
        </div>
      )}

    </div>
  );
};