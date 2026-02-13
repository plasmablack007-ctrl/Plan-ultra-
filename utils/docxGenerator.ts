import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer } from "docx";
import saveAs from "file-saver";
import { GeneratedLessonPlan } from "../types";

export const generateDocx = async (plan: GeneratedLessonPlan) => {
  const currentDate = new Date().toLocaleDateString('es-NI');

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Colegio Adventista Porteño",
                    bold: true,
                    size: 28, // 14pt
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Plan de Clase Integral - Modelo Adventista",
                    italics: true,
                    size: 20, // 10pt
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // SPACER
          new Paragraph({ text: "" }),

          // GENERAL DATA TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Grado:", bold: true })] }),
                  new TableCell({ children: [new Paragraph(plan.generalData.grade)] }),
                  new TableCell({ children: [new Paragraph({ text: "Asignatura:", bold: true })] }),
                  new TableCell({ children: [new Paragraph(plan.generalData.subject)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Fecha:", bold: true })] }),
                  new TableCell({ children: [new Paragraph(currentDate)] }),
                  new TableCell({ children: [new Paragraph({ text: "Unidad:", bold: true })] }),
                  new TableCell({ children: [new Paragraph(plan.generalData.unit)] }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "" }),

          // CONTENT & INDICATOR
          new Paragraph({
            text: "Contenido Conceptual:",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: plan.generalData.contentConceptual,
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Indicador de Logro:",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: plan.generalData.achievementIndicator,
            italics: true,
          }),

          new Paragraph({ text: "" }),

          // FAITH INTEGRATION
          new Paragraph({
            text: "Integración de la Fe:",
            heading: HeadingLevel.HEADING_2,
            border: { bottom: { color: "DBA858", space: 1, style: BorderStyle.SINGLE, size: 6 } }
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
                new TextRun({ text: "Concepto: ", bold: true }),
                new TextRun(plan.faithIntegration.spiritualConcept),
            ]
          }),
          new Paragraph({
            children: [
                new TextRun({ text: "Versículo: ", bold: true }),
                new TextRun({ text: `"${plan.faithIntegration.bibleVerse}"`, italics: true }),
            ]
          }),

          new Paragraph({ text: "" }),

          // SEQUENCE
          new Paragraph({
            text: "Secuencia Didáctica (ACES):",
            heading: HeadingLevel.HEADING_2,
            border: { bottom: { color: "004369", space: 1, style: BorderStyle.SINGLE, size: 6 } }
          }),
          new Paragraph({ text: "" }),

          ...plan.sequence.flatMap(step => [
            new Paragraph({
                children: [
                    new TextRun({ text: `${step.phase}: ${step.title}`, bold: true, color: "004369" }),
                    new TextRun({ text: ` (${step.time})`, size: 20, color: "666666" })
                ]
            }),
            ...step.activities.map(act => new Paragraph({
                text: `• ${act}`,
                indent: { left: 720 } // 0.5 inch
            })),
            new Paragraph({ text: "" })
          ]),

          // EVALUATION
          new Paragraph({
            text: "Evaluación:",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: "Cualitativa:", bold: true }),
          ...plan.evaluation.qualitative.map(item => new Paragraph({ text: `- ${item}`, indent: { left: 720 } })),
          
          new Paragraph({ text: "" }),
          
          new Paragraph({ text: "Cuantitativa:", bold: true }),
          ...plan.evaluation.quantitative.map(item => new Paragraph({ text: `- ${item}`, indent: { left: 720 } })),

          new Paragraph({ text: "" }),

          // TEACHER GUIDE
          ...(plan.teacherGuide ? [
            new Paragraph({
                text: "Guía Docente:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Vocabulario Clave:", bold: true }),
            new Paragraph({ text: plan.teacherGuide.keyVocabulary.join(", ") }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Estrategias de Diferenciación:", bold: true }),
            ...plan.teacherGuide.differentiation.map(d => new Paragraph({ text: `• ${d}`, indent: { left: 720 } }))
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Plan_${plan.generalData.subject.replace(/\s/g, '_')}_${currentDate}.docx`);
};