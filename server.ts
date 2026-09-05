import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Helper to get GoogleGenAI client
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Convert raw API errors (like 503 UNAVAILABLE, 429 quota, etc.) into clear Spanish messages
function formatErrorMessage(err: any): string {
  const rawMsg = err?.message || String(err || "");

  if (
    rawMsg.includes("503") ||
    rawMsg.includes("high demand") ||
    rawMsg.includes("UNAVAILABLE") ||
    rawMsg.includes("overloaded")
  ) {
    return "Los servidores de IA están experimentando una alta demanda temporal en este momento. Hemos intentado reconectar automáticamente; por favor, espera unos segundos y vuelve a presionar el botón.";
  }

  if (
    rawMsg.includes("429") ||
    rawMsg.includes("RESOURCE_EXHAUSTED") ||
    rawMsg.includes("quota")
  ) {
    return "Se ha alcanzado temporalmente el límite de consultas por minuto. Por favor, aguarda unos instantes y vuelve a intentarlo.";
  }

  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
      return formatErrorMessage(parsed.error);
    }
  } catch {}

  return rawMsg || "Ocurrió un error inesperado al procesar la solicitud con IA.";
}

// Resilient wrapper with exponential backoff and automatic model fallback
async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Approved models to try in case one is temporarily saturated (503/high demand) or quota exhausted (429)
  const candidateModels = [
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Solicitando con modelo: ${model} (intento ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || "";
        console.warn(`[Gemini API Warning] Modelo ${model} (intento ${attempt}) arrojó:`, msg);

        const isQuota = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
        if (isQuota) {
          // Immediately jump to the next fallback model without retrying the same one
          break;
        }

        const isTemporary =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("fetch failed");

        if (isTemporary && attempt === 1) {
          // Wait 1s before 1 retry on the same model
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          // Try next fallback model in the list
          break;
        }
      }
    }
  }

  throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de IA disponible.");
}

// 1. Endpoint: Procesar archivo/apuntes y generar Resumen Académico + Quizzes + Flashcards
app.post("/api/study/summarize-and-quiz", async (req, res) => {
  try {
    const { fileBase64, mimeType, textContent, fileName, topicHint, numQuestions = 6, difficulty = "Intermedio" } = req.body;

    if (!fileBase64 && !textContent) {
      return res.status(400).json({
        error: "Se requiere un archivo adjunto (PDF, imagen) o texto con los apuntes de estudio.",
      });
    }

    const ai = getGenAI();

    // Prepare contents
    const contents: any[] = [];

    if (fileBase64 && mimeType) {
      // Clean data uri prefix if present
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
Eres un tutor universitario de élite y pedagogo experto.
Se adjuntan apuntes, lecturas o material de estudio universitario ${fileName ? `(archivo: "${fileName}")` : ""}.
${topicHint ? `Tema / Contexto indicado: "${topicHint}".` : ""}
${textContent ? `Contenido de texto del material:\n"""\n${textContent}\n"""\n` : ""}

Tu misión es crear un paquete de estudio comprensivo en ESPAÑOL para una estudiante universitaria:
1. Extrae el Título formal de la materia/área y el Tema específico.
2. Genera un RESUMEN ACADÉMICO estructurado, claro, pedagógico y riguroso:
   - Una visión general clara y concisa (overview).
   - Entre 4 y 7 Puntos Clave explicados a fondo con nivel de importancia ("Esencial", "Alto", "Medio").
   - Un Glosario con 4 a 8 conceptos o términos técnicos cruciales y sus definiciones exactas.
   - 3 a 5 Preguntas de reflexión abierta para repasar activamente.
3. Genera entre 4 y 6 Flashcards (tarjetas de memoria: front = concepto o pregunta desafiante, back = respuesta concisa y clara).
4. Genera exactamente ${numQuestions} preguntas de QUIZ interactivo (opción múltiple con 4 opciones) con nivel de dificultad "${difficulty}".
   - Cada pregunta debe tener una explicación pedagógica completa de por qué la respuesta correcta es esa y por qué las otras opciones son incorrectas o engañosas.
   - correctIndex debe ser un número entero entre 0 y 3.

Responde estrictamente en formato JSON válido coincidiendo con el siguiente esquema.
`;

    contents.push({ text: promptText });

    const response = await generateContentWithResilience(ai, {
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "Tema específico del material" },
            subject: { type: Type.STRING, description: "Materia o disciplina universitaria" },
            summary: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                overview: { type: Type.STRING },
                keyPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      importance: { type: Type.STRING, enum: ["Esencial", "Alto", "Medio"] },
                    },
                    required: ["title", "description", "importance"],
                  },
                },
                glossary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                    required: ["term", "definition"],
                  },
                },
                reviewQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["title", "overview", "keyPoints", "glossary", "reviewQuestions"],
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ["id", "front", "back"],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ["id", "question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["topic", "subject", "summary", "flashcards", "quiz"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No se recibió respuesta del modelo.");
    }

    const data = JSON.parse(text);
    return res.json({
      success: true,
      data: {
        id: "mat_" + Date.now(),
        createdAt: new Date().toISOString(),
        fileName: fileName || "Apuntes Universitarios",
        ...data,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/study/summarize-and-quiz:", err);
    return res.status(500).json({
      error: formatErrorMessage(err),
    });
  }
});

// 2. Endpoint: Generar Plan de Estudio según Fecha de Examen y Horas Disponibles
app.post("/api/study/generate-plan", async (req, res) => {
  try {
    const {
      subject,
      examDate,
      dailyHours,
      topics,
      intensity = "equilibrado",
      studyMethod = "Pomodoro y Práctica Activa",
    } = req.body;

    if (!subject || !examDate || !dailyHours) {
      return res.status(400).json({
        error: "Faltan datos obligatorios: Asignatura/Materia, Fecha del Examen y Horas disponibles por día.",
      });
    }

    const today = new Date();
    const targetDate = new Date(examDate);
    const diffTime = targetDate.getTime() - today.getTime();
    const daysUntilExam = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalPossibleHours = Math.round(daysUntilExam * Number(dailyHours) * 10) / 10;

    const ai = getGenAI();

    const promptText = `
Eres un asesor académico universitario de alto rendimiento y planificador estratégico de estudio.
Una estudiante universitaria necesita un plan de estudio estructurado y realista para su examen.

Datos del examen:
- Materia / Asignatura: "${subject}"
- Fecha del Examen: ${examDate} (${daysUntilExam} días restantes desde hoy)
- Horas de estudio disponibles por día: ${dailyHours} horas (Total estimado: ${totalPossibleHours} horas)
- Temario / Temas a cubrir: ${Array.isArray(topics) ? topics.join(", ") : (topics || "Todo el programa estándar de la materia")}
- Nivel de intensidad deseado: ${intensity}
- Metodología preferida: ${studyMethod}

Misión pedagógica:
1. Genera un plan de estudio detallado con fases pedagógicas (ej. Fase 1: Comprensión y Mapeo Conceptual, Fase 2: Aplicación y Práctica Profunda, Fase 3: Simulacros y Repaso Activo Final).
2. Genera una agenda por días (schedule) hasta la fecha del examen (máximo 20 sesiones estructuradas si el plazo es largo, agrupando días si supera 3 semanas, o día a día si es menor a 21 días).
   - Para cada sesión:
     - dayNumber (1, 2, ...)
     - date (fecha aproximada en formato YYYY-MM-DD o 'Día X')
     - dayOfWeek (Lunes, Martes, etc.)
     - hours (asignadas a la sesión, acordes a las horas disponibles)
     - topic (tema concreto a abordar)
     - subtopics (2 a 4 subtemas o conceptos específicos)
     - learningObjective (objetivo medible al terminar la sesión)
     - suggestedMethod (técnica concreta: ej. Bloques Pomodoro de 45m, Active Recall, Técnica Feynman, etc.)
     - reviewChecklist (2 o 3 tareas concretas para verificar avance)
     - completed: false
3. Evaluación de viabilidad pedagógica (feasibilityAssessment): análisis honesto y motivador sobre si las horas son suficientes, recomendaciones de ajuste y semáforo de viabilidad.
4. 3 a 5 consejos estratégicos probados para rendir con excelencia en este examen universitario (tips).

Genera todo en ESPAÑOL y responde estrictamente en JSON válido con el esquema indicado.
`;

    const response = await generateContentWithResilience(ai, {
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            examDate: { type: Type.STRING },
            daysUntilExam: { type: Type.INTEGER },
            totalStudyHours: { type: Type.NUMBER },
            dailyHours: { type: Type.NUMBER },
            feasibilityAssessment: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  focus: { type: Type.STRING },
                },
                required: ["name", "duration", "focus"],
              },
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  date: { type: Type.STRING },
                  dayOfWeek: { type: Type.STRING },
                  hours: { type: Type.NUMBER },
                  topic: { type: Type.STRING },
                  subtopics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  learningObjective: { type: Type.STRING },
                  suggestedMethod: { type: Type.STRING },
                  reviewChecklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  completed: { type: Type.BOOLEAN },
                },
                required: [
                  "dayNumber",
                  "date",
                  "dayOfWeek",
                  "hours",
                  "topic",
                  "subtopics",
                  "learningObjective",
                  "suggestedMethod",
                  "reviewChecklist",
                  "completed",
                ],
              },
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "subject",
            "examDate",
            "daysUntilExam",
            "totalStudyHours",
            "dailyHours",
            "feasibilityAssessment",
            "phases",
            "schedule",
            "tips",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No se recibió respuesta del modelo.");
    }

    const data = JSON.parse(text);
    const planId = "plan_" + Date.now();
    const scheduleWithIds = Array.isArray(data.schedule)
      ? data.schedule.map((sess: any, idx: number) => ({
          ...sess,
          id: `sess_${planId}_${sess.dayNumber || idx + 1}_${idx}`,
        }))
      : [];

    return res.json({
      success: true,
      data: {
        id: planId,
        createdAt: new Date().toISOString(),
        intensity,
        studyMethod,
        ...data,
        schedule: scheduleWithIds,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/study/generate-plan:", err);
    return res.status(500).json({
      error: formatErrorMessage(err),
    });
  }
});

// 3. Endpoint: Tutor Feynman ("Explícamelo como a un principiante")
app.post("/api/study/feynman-explain", async (req, res) => {
  try {
    const { concept, subject = "Materia Universitaria", career = "Universidad" } = req.body;

    if (!concept || typeof concept !== "string" || !concept.trim()) {
      return res.status(400).json({ error: "Debes especificar el concepto o tema a explicar." });
    }

    const ai = getGenAI();

    const promptText = `
Eres un distinguido catedrático universitario y un maestro de la Técnica Feynman.
Tu misión es tomar un concepto difícil, abstracto o confuso y transformarlo en una explicación tan vívida, intuitiva y rigurosa que el estudiante lo comprenda al 100% y pueda defenderlo en un examen final.

DATOS:
- Concepto a dominar: "${concept.trim()}"
- Materia/Área: "${subject}"
- Nivel: Universitario (${career})

INSTRUCCIONES:
1. "oneSentenceHook": Una frase directa y memorable que resume la esencia del concepto.
2. "everydayAnalogy":
   - "story": Una metáfora o analogía de la vida cotidiana (ej: tráfico, cocina, dinero, deportes, redes sociales) que haga tangible el concepto.
   - "mapping": Array de 2 a 4 correspondencias exactas entre el elemento cotidiano y el concepto académico real.
3. "academicDeepDive": La explicación técnica formal, con vocabulario académico preciso pero claro, redactada para que el estudiante sepa qué responder en una mesa de examen oral o escrito.
4. "commonMisconceptions": 2 o 3 confusiones o errores típicos que cometen los alumnos con este tema (y cómo evitarlos).
5. "examKeyPhrases": 3 o 4 frases o palabras clave indispensables que los profesores buscan en la respuesta.
6. "comprehensionChallenge": 2 preguntas de razonamiento (no de mera memoria) para que el estudiante compruebe si realmente lo entendió, con su pista y su respuesta modelo explicada.

Genera la respuesta estrictamente en ESPAÑOL y en formato JSON con el siguiente esquema:
{
  "concept": "${concept.trim()}",
  "subject": "${subject}",
  "oneSentenceHook": "string",
  "everydayAnalogy": {
    "story": "string",
    "mapping": [
      { "realWorld": "string", "academicConcept": "string" }
    ]
  },
  "academicDeepDive": "string",
  "commonMisconceptions": ["string"],
  "examKeyPhrases": ["string"],
  "comprehensionChallenge": [
    {
      "question": "string",
      "hint": "string",
      "modelAnswer": "string"
    }
  ]
}
`;

    const response = await generateContentWithResilience(ai, {
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response?.text?.trim() || "";
    if (!text) {
      return res.status(500).json({ error: "La IA no devolvió contenido." });
    }

    const data = JSON.parse(text);
    return res.json({
      success: true,
      data: {
        id: "feynman_" + Date.now(),
        createdAt: new Date().toISOString(),
        ...data,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/study/feynman-explain:", err);
    return res.status(500).json({
      error: formatErrorMessage(err),
    });
  }
});

// 4. Endpoint: Ficha de Emergencia / Cheat Sheet de 1 Página
app.post("/api/study/cheat-sheet", async (req, res) => {
  try {
    const { subject, topic, customNotes = "" } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: "Se requiere la materia y el tema para armar la Ficha de Emergencia." });
    }

    const ai = getGenAI();

    const promptText = `
Eres un estratega de preparación de exámenes universitarios.
Diseña una FICHA DE EMERGENCIA DE 1 PÁGINA (Cheat Sheet de Repaso de Última Hora) de alto impacto cognitivo.
El estudiante va a rendir en pocas horas y necesita una síntesis ultra-condensada, libre de paja, enfocada exclusivamente en lo que define si aprueba o desaprueba.

DATOS:
- Materia: "${subject}"
- Tema Central: "${topic}"
${customNotes ? `- Apuntes / Enfoque del docente:\n${customNotes}\n` : ""}

ESTRUCTURA OBLIGATORIA (estrictamente JSON):
1. "title": Título conciso del documento de emergencia.
2. "emergencyHighlights": 3 bullets de impacto directo con lo más importante del tema.
3. "mustKnowDefinitions": Array de 4 a 6 conceptos/términos indispensables que todo profesor espera que se definan sin dudar:
   - "term": Nombre del concepto/teorema/ley.
   - "essentialFormulaOrLaw": Definición técnica ultra-precisa o fórmula matemática/jurídica/científica.
   - "whyItMatters": Por qué te desaprueban si lo ignoras o confundes.
4. "trapQuestions": 3 preguntas trampa o confusiones clásicas que suelen poner en los parciales, con la aclaración exacta.
5. "twoMinutePreExamChecklist": 4 a 5 puntos que el alumno debe recitarse mentalmente 2 minutos antes de que repartan las hojas del parcial.
6. "highYieldFormulasOrRules": Array de 3 a 5 reglas mnemotécnicas, fórmulas o principios clave aplicables.

Esquema JSON:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "title": "string",
  "emergencyHighlights": ["string"],
  "mustKnowDefinitions": [
    {
      "term": "string",
      "essentialFormulaOrLaw": "string",
      "whyItMatters": "string"
    }
  ],
  "trapQuestions": [
    {
      "trap": "string",
      "correctClarification": "string"
    }
  ],
  "twoMinutePreExamChecklist": ["string"],
  "highYieldFormulasOrRules": ["string"]
}
`;

    const response = await generateContentWithResilience(ai, {
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response?.text?.trim() || "";
    const data = JSON.parse(text);
    return res.json({
      success: true,
      data: {
        id: "cheat_" + Date.now(),
        createdAt: new Date().toISOString(),
        ...data,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/study/cheat-sheet:", err);
    return res.status(500).json({
      error: formatErrorMessage(err),
    });
  }
});

// 5. Endpoint: Generador de Simulador de Parciales Universitario
app.post("/api/study/exam-simulator", async (req, res) => {
  try {
    const { subject, topic, questionCount = 5, durationMinutes = 30, difficulty = "Universitario Exigente" } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: "Se requiere la materia y el tema para el simulacro de parcial." });
    }

    const ai = getGenAI();

    const promptText = `
Eres un profesor titular universitario diseñando un SIMULACRO DE PARCIAL OFICIAL.
Tu objetivo es evaluar con autenticidad universitaria el nivel de preparación del alumno.

DATOS:
- Materia: "${subject}"
- Tema evaluado: "${topic}"
- Cantidad de preguntas: ${Math.max(3, Math.min(8, Number(questionCount)))}
- Tiempo estimado: ${durationMinutes} minutos
- Nivel: ${difficulty}

REGLAS DE CONSTRUCCIÓN:
1. Crea preguntas que evalúen comprensión profunda, aplicación práctica y capacidad analítica (evita preguntas triviales de diccionario).
2. Cada pregunta debe tener 4 opciones bien elaboradas con distractores verosímiles que reflejen errores conceptuales comunes.
3. Incluye una justificación pedagógica detallada de por qué la correcta es correcta y por qué los distractores fallan.
4. Asigna un puntaje a cada pregunta de modo que la suma total sea exactamente 10 puntos (escala universitaria de 1 a 10).
5. Define la nota mínima de aprobación (4/10) y la de promoción directa (7/10).

Esquema JSON estricto:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "examTitle": "string",
  "durationMinutes": ${durationMinutes},
  "passingScore": 4,
  "honorsScore": 7,
  "instructions": "string",
  "questions": [
    {
      "id": 1,
      "questionText": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0,
      "points": 2,
      "topicTag": "string",
      "detailedExplanation": "string"
    }
  ]
}
`;

    const response = await generateContentWithResilience(ai, {
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response?.text?.trim() || "";
    const data = JSON.parse(text);
    return res.json({
      success: true,
      data: {
        id: "sim_" + Date.now(),
        createdAt: new Date().toISOString(),
        ...data,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/study/exam-simulator:", err);
    return res.status(500).json({
      error: formatErrorMessage(err),
    });
  }
});

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de Planifica & Estudia ejecutándose en http://localhost:${PORT}`);
  });
}

startServer();
