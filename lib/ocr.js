// Free, local, browser-based OCR — no AI API, no key, no per-page cost.
// Tesseract.js does the text recognition; pdf.js renders PDF pages to
// images first since Tesseract only reads images.

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Light preprocessing (grayscale) — helps Tesseract on low-quality
// photos noticeably, costs nothing.
function preprocessImageDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function pdfPagesToImageDataUrls(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const urls = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    urls.push(canvas.toDataURL('image/png'));
  }
  return urls;
}

// files: array of File objects (images and/or PDFs)
// onProgress(info): info = { fileIndex, fileCount, pageLabel, pct }
export async function extractTextFromFiles(files, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (onProgress && m.status && typeof m.progress === 'number') {
        onProgress({ status: m.status, pct: Math.round(m.progress * 100) });
      }
    },
  });

  let combinedText = '';
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let imageUrls;
      if (file.type === 'application/pdf') {
        imageUrls = await pdfPagesToImageDataUrls(file);
      } else {
        imageUrls = [await fileToDataUrl(file)];
      }
      for (let p = 0; p < imageUrls.length; p++) {
        if (onProgress) {
          onProgress({ status: `Reading file ${i + 1} of ${files.length}${imageUrls.length > 1 ? `, page ${p + 1}/${imageUrls.length}` : ''}`, pct: 0 });
        }
        const processed = await preprocessImageDataUrl(imageUrls[p]);
        const { data } = await worker.recognize(processed);
        combinedText += '\n' + data.text;
      }
    }
  } finally {
    await worker.terminate();
  }
  return combinedText;
}
