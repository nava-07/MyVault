import JSZip from 'jszip';

/**
 * Parses a .docx File or ArrayBuffer into structured HTML
 * Reads word/document.xml from the docx ZIP package and translates
 * paragraphs, headings, bold, italic, tables, and lists into HTML.
 */
export async function parseDocx(arrayBuffer) {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.file('word/document.xml');
    
    if (!docFile) {
      throw new Error('Invalid DOCX file: word/document.xml not found.');
    }

    const xmlString = await docFile.async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // Check for XML parse errors
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Error parsing DOCX internal XML.');
    }

    const body = xmlDoc.getElementsByTagName('w:body')[0];
    if (!body) {
      return '<p class="text-slate-400 italic">Empty document</p>';
    }

    let html = '';

    // Iterate over top-level elements inside w:body
    for (let i = 0; i < body.children.length; i++) {
      const node = body.children[i];
      const nodeName = node.nodeName;

      if (nodeName === 'w:p') {
        html += parseParagraph(node);
      } else if (nodeName === 'w:tbl') {
        html += parseTable(node);
      }
    }

    return html || '<p class="text-slate-400 italic">Document contains no readable text.</p>';
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw error;
  }
}

function parseParagraph(pNode) {
  // Check style (e.g. Heading1, Heading2, Title, List)
  let headingLevel = 0;
  let isList = false;

  const pPr = pNode.getElementsByTagName('w:pPr')[0];
  if (pPr) {
    const pStyle = pPr.getElementsByTagName('w:pStyle')[0];
    if (pStyle) {
      const val = pStyle.getAttribute('w:val') || '';
      if (/heading\s*1/i.test(val) || val === '1') headingLevel = 1;
      else if (/heading\s*2/i.test(val) || val === '2') headingLevel = 2;
      else if (/heading\s*3/i.test(val) || val === '3') headingLevel = 3;
      else if (/title/i.test(val)) headingLevel = 1;
    }

    const numPr = pPr.getElementsByTagName('w:numPr')[0];
    if (numPr) {
      isList = true;
    }
  }

  // Parse text runs
  let pContent = '';
  const runs = pNode.getElementsByTagName('w:r');

  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    const rPr = run.getElementsByTagName('w:rPr')[0];
    
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;

    if (rPr) {
      isBold = rPr.getElementsByTagName('w:b').length > 0;
      isItalic = rPr.getElementsByTagName('w:i').length > 0;
      isUnderline = rPr.getElementsByTagName('w:u').length > 0;
    }

    // Extract text elements
    const texts = run.getElementsByTagName('w:t');
    let runText = '';
    for (let t = 0; t < texts.length; t++) {
      runText += escapeHtml(texts[t].textContent || '');
    }

    if (!runText) continue;

    if (isBold) runText = `<strong>${runText}</strong>`;
    if (isItalic) runText = `<em>${runText}</em>`;
    if (isUnderline) runText = `<u>${runText}</u>`;

    pContent += runText;
  }

  // Handle empty paragraphs as line breaks
  if (!pContent.trim()) {
    return '<div class="h-4"></div>';
  }

  if (headingLevel === 1) {
    return `<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-3 border-b pb-1">${pContent}</h1>`;
  } else if (headingLevel === 2) {
    return `<h2 class="text-xl font-bold text-slate-800 mt-5 mb-2">${pContent}</h2>`;
  } else if (headingLevel === 3) {
    return `<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">${pContent}</h3>`;
  } else if (isList) {
    return `<li class="ml-6 list-disc text-slate-700 my-1 leading-relaxed">${pContent}</li>`;
  } else {
    return `<p class="text-slate-800 my-2 leading-relaxed text-base">${pContent}</p>`;
  }
}

function parseTable(tblNode) {
  let tableHtml = '<div class="my-6 overflow-x-auto"><table class="w-full border-collapse border border-slate-300 text-sm">';
  
  const rows = tblNode.getElementsByTagName('w:tr');
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    tableHtml += '<tr class="border-b border-slate-300 hover:bg-slate-50">';
    
    const cells = row.getElementsByTagName('w:tc');
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      
      let cellText = '';
      const paragraphs = cell.getElementsByTagName('w:p');
      for (let p = 0; p < paragraphs.length; p++) {
        cellText += parseParagraph(paragraphs[p]);
      }

      const tag = r === 0 ? 'th' : 'td';
      const cellClass = r === 0 
        ? 'border border-slate-300 p-2.5 bg-slate-100 font-bold text-slate-900 text-left' 
        : 'border border-slate-300 p-2.5 text-slate-700';

      tableHtml += `<${tag} class="${cellClass}">${cellText || '&nbsp;'}</${tag}>`;
    }
    tableHtml += '</tr>';
  }
  
  tableHtml += '</table></div>';
  return tableHtml;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
