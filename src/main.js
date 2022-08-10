import { PDFDocument } from '../node_modules/pdf-lib/dist/pdf-lib.esm.js';
import pageLayout from './page-layout.js';
import { convertLayout } from './lib.js';

function readFileAsArrayBuffer(file) {
    return new Promise((success, reject) => {
        let frd = new FileReader;
        frd.onload = function () {
            success(this.result);
        }
        frd.readAsArrayBuffer(file);
    })
}

async function updatePdf(srcPdfFile, cfg) {
    const srcPdfBytes = await readFileAsArrayBuffer(srcPdfFile);
    const pdfDoc = await PDFDocument.create(); //輸出的 pdf
    const srcDoc = await PDFDocument.load(srcPdfBytes); //輸入的的 pdf
    const boxies = convertLayout(cfg, srcDoc.getPageCount());
    console.log(boxies);
    const embedPages = await pdfDoc.embedPages(srcDoc.getPages(), boxies.bboxArr, boxies.mtxArr); //內嵌的同時，設定 bounding box
    const getNextIndex = cfg.indexMapCreator(srcDoc.getPageCount());
    const layout = cfg.layout;
    let pageIdx = 0, boxIdx = 0, curPage;
    for (let idx = getNextIndex(); idx !== null; idx = getNextIndex()) {
        const boxMap = layout[pageIdx].boxMap;
        if (boxIdx === 0) {
            curPage = pdfDoc.addPage([layout[pageIdx].width, layout[pageIdx].height]);
        }
        if (idx >= 0) {
            curPage.drawPage(embedPages[idx]);
        }
        //移動到下一組 (pageIdx, boxIdx)
        boxIdx = (boxIdx + 1) % boxMap.length;
        if (boxIdx === 0) {
            pageIdx = (pageIdx + 1) % layout.length;
        }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

const fileLoaderEle = document.querySelector('#file-loader');
const fileLoader = new MyComponent.FileUploader(fileLoaderEle);
fileLoaderEle.addEventListener('upload-files', (evt) => {
    const files = evt.detail.files;
    updatePdf(files[0], pageLayout['A4TwoPageLong7-11']).then(pdfBytes => {
        console.log(pdfBytes.byteLength);
        document.querySelector('iframe').src =
            URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    });
});