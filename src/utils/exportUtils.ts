/**
 * Export and Clipboard Utilities
 * Safe for restricted iframes, pop-up blockers, and mobile devices
 */

// Robust copy to clipboard with fallback for iframes
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed, trying fallback textarea:', err);
  }

  // Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('Fallback execCommand failed:', fallbackErr);
    return false;
  }
}

// Download file utility
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Safe Print / PDF Generator for iframes
export function printOrDownloadDocument({
  title,
  subtitle,
  bodyHtml,
  filename = 'documento_estudio',
}: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  filename?: string;
}) {
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 40px;
      line-height: 1.6;
      font-size: 14px;
    }

    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .badge {
      display: inline-block;
      background: #eef2ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 24px;
      color: #0f172a;
      margin-bottom: 6px;
      font-weight: 800;
    }

    .subtitle {
      font-size: 13px;
      color: #64748b;
    }

    .meta-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 25px;
    }

    .meta-item strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }

    .meta-item span {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .section-title {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      border-left: 4px solid #4f46e5;
      padding-left: 10px;
      margin-top: 25px;
      margin-bottom: 15px;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }

    .card-done {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 6px;
      margin-bottom: 4px;
    }

    ul, ol {
      padding-left: 20px;
      margin-bottom: 15px;
    }

    li {
      margin-bottom: 6px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body {
        padding: 15px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #4f46e5; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>Vista de Impresión / Documento PDF</strong>
      <p style="font-size: 12px; opacity: 0.9;">Presiona el botón para imprimir o guardar como PDF en tu navegador.</p>
    </div>
    <button onclick="window.print()" style="background: white; color: #4f46e5; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      Imprimir / Guardar como PDF
    </button>
  </div>

  <div class="header">
    <span class="badge">Planifica & Estudia • Universitario</span>
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  </div>

  ${bodyHtml}

  <div class="footer">
    Generado con Planifica & Estudia • Preparación Estratégica para Exámenes Universitarios
  </div>
</body>
</html>`;

  // Create a Blob
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);

  // Try opening new tab/window for print
  const printWindow = window.open(blobUrl, '_blank');

  if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
    // Popup was blocked by browser or iframe policy: directly download the HTML file
    // which the user can double-click to view and print cleanly!
    downloadFile(`${filename}.html`, fullHtml, 'text/html');
  } else {
    // If opened, it will show the clean page with auto-print button
    try {
      printWindow.focus();
    } catch {}
  }
}

// Generate an .ics calendar file for the study plan sessions
export function exportStudyPlanToICS(plan: {
  subject: string;
  schedule: Array<{
    dayNumber: number;
    date: string;
    topic: string;
    hours: number;
    learningObjective: string;
  }>;
}) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planifica & Estudia//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Plan de Estudio - ' + plan.subject,
  ];

  plan.schedule.forEach((session, index) => {
    // parse date YYYY-MM-DD
    let startDateStr = '';
    let endDateStr = '';

    const dateParts = session.date.split('-');
    if (dateParts.length === 3) {
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];
      // Default session from 09:00 to 09 + hours:00
      const startHour = 9;
      const endHour = startHour + Math.max(1, Math.round(session.hours));
      startDateStr = `${year}${month}${day}T${pad(startHour)}0000`;
      endDateStr = `${year}${month}${day}T${pad(endHour)}0000`;
    } else {
      // If date wasn't exact YYYY-MM-DD, offset from today
      const d = new Date();
      d.setDate(d.getDate() + index);
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      startDateStr = `${year}${month}${day}T090000`;
      endDateStr = `${year}${month}${day}T${pad(9 + Math.max(1, Math.round(session.hours)))}0000`;
    }

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:plan-${Date.now()}-${index}@planificaestudia.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `SUMMARY:Estudio: ${session.topic} (${plan.subject})`,
      `DESCRIPTION:Objetivo de la sesión: ${session.learningObjective.replace(/\n/g, ' ')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const finalString = icsContent.join('\r\n');
  downloadFile(`Calendario_${plan.subject.replace(/[^a-zA-Z0-9]/g, '_')}.ics`, finalString, 'text/calendar');
}

/**
 * Creates a direct Google Calendar Web URL so the user can open Google Calendar
 * in a new tab with the event pre-filled (title, dates, study objective, subtopics, checklist).
 */
export function getGoogleCalendarEventUrl({
  subject,
  topic,
  date,
  hours = 2,
  learningObjective,
  suggestedMethod,
  subtopics = [],
  reviewChecklist = [],
}: {
  subject: string;
  topic: string;
  date: string;
  hours?: number;
  learningObjective?: string;
  suggestedMethod?: string;
  subtopics?: string[];
  reviewChecklist?: string[];
}): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Determine year, month, day
  let year = '';
  let month = '';
  let day = '';

  const dateParts = date.split('-');
  if (dateParts.length === 3) {
    year = dateParts[0];
    month = dateParts[1];
    day = dateParts[2];
  } else {
    const d = new Date();
    year = String(d.getFullYear());
    month = pad(d.getMonth() + 1);
    day = pad(d.getDate());
  }

  // Default start time at 09:00, duration based on hours
  const startHour = 9;
  const safeHours = Math.max(1, Math.min(8, Math.round(hours || 2)));
  const endHour = startHour + safeHours;

  const startStr = `${year}${month}${day}T${pad(startHour)}0000`;
  const endStr = `${year}${month}${day}T${pad(endHour)}0000`;

  const eventTitle = `📚 Estudio: ${topic} (${subject})`;

  const detailsLines: string[] = [
    `🎓 Materia: ${subject}`,
    `🎯 Objetivo de Aprendizaje: ${learningObjective || topic}`,
    suggestedMethod ? `💡 Método Recomendado: ${suggestedMethod}` : '',
    subtopics.length > 0 ? `📑 Subtemas a cubrir:\n${subtopics.map((st) => `• ${st}`).join('\n')}` : '',
    reviewChecklist.length > 0
      ? `✅ Lista de Verificación:\n${reviewChecklist.map((c) => `[ ] ${c}`).join('\n')}`
      : '',
    `\n---\nGenerado con Planifica & Estudia - Asistente Universitario`,
  ].filter(Boolean);

  const eventDetails = detailsLines.join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${startStr}/${endStr}`,
    details: eventDetails,
    location: 'Campus / Escritorio de Estudio',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

