export const SAMPLE_STUDY_MATERIALS = [
  {
    id: "sample_neuro",
    title: "Neurobiología: Potencial de Acción y Transmisión Sináptica",
    subject: "Fisiología y Neurociencias",
    fileName: "Apuntes_Fisiologia_Sinapsis.txt",
    topicHint: "Mecanismo del potencial de acción neuronal, canales iónicos y neurotransmisión química",
    content: `UNIVERSIDAD NACIONAL - FACULTAD DE MEDICINA Y CIENCIAS DE LA SALUD
CÁTEDRA DE FISIOLOGÍA HUMANA - UNIDAD 3: NEUROFISIOLOGÍA

TEMA: POTENCIAL DE ACCIÓN Y TRANSMISIÓN SINÁPTICA

1. INTRODUCCIÓN Y POTENCIAL DE MEMBRANA EN REPOSO (PMR)
El potencial de membrana en reposo de una neurona típica es de aproximadamente -70 mV. Esta diferencia de potencial se debe a:
- Distribución asimétrica de iones: alta concentración de K+ intracelular (~140 mM) y alta concentración de Na+ extracelular (~142 mM).
- Permeabilidad selectiva: la membrana es mucho más permeable al potasio a través de canales de fuga (leak channels).
- Bomba Sodio-Potasio ATPasa (Na+/K+ ATPasa): expulsa 3 Na+ al exterior e introduce 2 K+ al interior consumiendo ATP, manteniendo los gradientes químicos.

2. FASES DEL POTENCIAL DE ACCIÓN
Un potencial de acción es un cambio rápido y transitorio del potencial de membrana que sigue la ley del "todo o nada". El umbral de disparo suele rondar los -55 mV.
a) Despolarización rápida:
- Al alcanzar el umbral, se abren masivamente los canales de Na+ dependientes de voltaje.
- Entrada masiva de Na+ hacia el interior por gradiente electroquímico.
- El potencial sube hasta aproximadamente +30 mV (overshoot).
b) Repolarización:
- A los +30 mV, los canales de Na+ se inactivan (compuerta de inactivación o bola y cadena).
- Se abren los canales de K+ dependientes de voltaje (con apertura más lenta).
- Salida rápida de K+ hacia el líquido extracelular, haciendo el interior nuevamente negativo.
c) Hiperpolarización transitoria:
- Los canales de K+ tardan en cerrarse por completo, llevando el potencial hasta cerca de -80 o -90 mV.
- La bomba Na+/K+ y canales de fuga restablecen el PMR a -70 mV.
d) Periodos refractarios:
- Periodo refractario absoluto: ningún estímulo puede generar otro potencial (canales de Na+ inactivados).
- Periodo refractario relativo: se requiere un estímulo supraumbral muy intenso debido a la hiperpolarización.

3. CONDUCCIÓN DEL IMPULSO NERVIOSO
- Fibras amielínicas: conducción continua, lenta (0.5 a 2 m/s).
- Fibras mielínicas (células de Schwann en SNP, oligodendrocitos en SNC): conducción saltatoria en los Nodos de Ranvier, muy rápida (hasta 120 m/s) y eficiente energéticamente.

4. TRANSMISIÓN SINÁPTICA QUÍMICA
Pasos secuenciales en la sinapsis:
1. Llegada del potencial de acción al terminal axónico presináptico.
2. Apertura de canales de Ca2+ dependientes de voltaje e influjo de calcio.
3. El Ca2+ activa las proteínas SNARE (sinaptotagmina, sinaptobrevina, sintaxina, SNAP-25), facilitando la fusión de vesículas sinápticas con la membrana presináptica.
4. Liberación de neurotransmisores a la hendidura sináptica (exocitosis).
5. Unión a receptores postsinápticos:
   - Ionotrópicos (canales directos, respuesta ultrarrápida: ej. receptor nicotínico de acetilcolina).
   - Metabotrópicos (acoplados a proteína G, cascada de segundos mensajeros: ej. receptores muscarínicos, adrenérgicos).
6. Generación de Potencial Postsináptico Excitador (PPSE, ej. por apertura de canales Na+) o Inhibidor (PPSI, ej. apertura de canales Cl- o K+).
7. Inactivación del neurotransmisor: degradación enzimática (ej. acetilcolinesterasa), recaptación presináptica o difusión glial.`,
  },
  {
    id: "sample_derecho",
    title: "Principios Fundamentales del Derecho Constitucional y División de Poderes",
    subject: "Derecho Constitucional",
    fileName: "Resumen_Derecho_Constitucional.txt",
    topicHint: "Supremacía constitucional, control de constitucionalidad y separación de poderes",
    content: `FACULTAD DE CIENCIAS JURÍDICAS Y SOCIALES
CURSO: DERECHO CONSTITUCIONAL GENERAL Y COMPARADO

EJE TEMÁTICO: SUPREMACÍA CONSTITUCIONAL Y CONTROL JUDICIAL

1. CONCEPTO DE CONSTITUCIÓN Y SUPREMACÍA
La Constitución es la norma fundamental y fundante del ordenamiento jurídico (Kelsen - Pirámide Jurídica).
- Principio de Supremacía Constitucional: Toda ley, decreto, tratado subordinado o acto de la administración debe guardar conformidad con los preceptos constitucionales. Las normas contrarias adolecen de nulidad.
- Caso fundacional: Marbury vs. Madison (1803, Corte Suprema de EE.UU., Juez John Marshall). Establece que una ley contraria a la Constitución no es ley, y es deber del poder judicial decir lo que es el derecho.

2. SISTEMAS DE CONTROL DE CONSTITUCIONALIDAD
a) Sistema Difuso (o norteamericano):
- Cualquier juez de cualquier fuero o instancia tiene competencia para declarar la inconstitucionalidad de una norma en el marco de un caso concreto ("caso o controversia").
- Efectos de la sentencia: Inter partes (solo vincula a las partes del litigio), salvo doctrina del precedente vinculante (stare decisis).
b) Sistema Concentrado (o kelseniano/europeo):
- El control reside en un órgano especializado único: Tribunal o Corte Constitucional.
- Acción directa de inconstitucionalidad.
- Efectos: Erga omnes (anulación con efectos generales hacia toda la ciudadanía).

3. LA DOCTRINA DE LA DIVISIÓN DE PODERES (MONTESQUIEU)
- Poder Legislativo: formulación, debate y sanción de las leyes generales.
- Poder Ejecutivo: administración general del Estado y ejecución de las leyes.
- Poder Judicial: resolución de litigios con fuerza de cosa juzgada.
- Mecanismos de Frenos y Contrapesos (Checks and Balances):
  - Veto presidencial sobre leyes aprobadas por el parlamento.
  - Juicio político (impeachment) parlamentario a ministros y jueces.
  - Control de constitucionalidad judicial sobre actos del ejecutivo y leyes del legislativo.`,
  },
];

export const SAMPLE_STUDY_PLANS = [
  {
    subject: "Bioquímica y Biología Molecular",
    daysFromNow: 14,
    dailyHours: 2.5,
    intensity: "equilibrado" as const,
    studyMethod: "Técnica Pomodoro (25/5) y Active Recall",
    topics: [
      "Estructura y función de proteínas y enzimas",
      "Cinética enzimática de Michaelis-Menten e inhibidores",
      "Glucólisis, ciclo de Krebs y fosforilación oxidativa",
      "Metabolismo de lípidos y beta-oxidación",
      "Replicación del ADN y transcripción genética",
    ],
  },
  {
    subject: "Cálculo Diferencial e Integral",
    daysFromNow: 10,
    dailyHours: 3.0,
    intensity: "intensivo" as const,
    studyMethod: "Resolución progresiva de problemas y ejercicios guía",
    topics: [
      "Límites y continuidad de funciones de una variable",
      "Reglas de derivación, regla de la cadena y derivación implícita",
      "Aplicaciones de la derivada: optimización y trazado de curvas",
      "Integrales indefinidas y técnicas de integración por partes y sustitución",
      "Teorema fundamental del cálculo e integrales definidas",
    ],
  },
];
