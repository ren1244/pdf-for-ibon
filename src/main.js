import { PDFDocument } from 'pdf-lib';
import pageLayout from './page-layout.js';
import { convertLayout } from './lib.js';
import { FileUploader } from './file-uploader.esm.js';
import PageInput from './page-input.js';

function readFileAsArrayBuffer(file) {
    return new Promise((success, reject) => {
        let frd = new FileReader;
        frd.onload = function () {
            success(this.result);
        }
        frd.readAsArrayBuffer(file);
    })
}

async function updatePdf(pageManger, cfg) {
    const pdfDoc = await PDFDocument.create(); //輸出的 pdf
    const layout = cfg.layout;
    const totalPage = pageManger.getPageCount();
    let pageIdx = 0, boxIdx = 0, targetPage = -1;
    for (let i = 0; i < totalPage; ++i) {
        const boxMap = layout[pageIdx].boxMap;
        if (boxIdx === 0) {
            pdfDoc.addPage([layout[pageIdx].width, layout[pageIdx].height]);
            ++targetPage;
        }
        if (pageManger.getPage(i) !== null) { //此頁非空頁
            //計算 mtx 與 bbox 給此 page
            const srcBox = boxMap[boxIdx].src;
            const bbox = {
                left: srcBox.left,
                bottom: srcBox.bottom,
                right: srcBox.right,
                top: srcBox.top
            };
            const theta = srcBox.rot * Math.PI / 180;
            const scaleSin = srcBox.scale * Math.sin(theta);
            const scaleCos = srcBox.scale * Math.cos(theta);
            const srcCenterX = (srcBox.right + srcBox.left) / 2;
            const srcCenterY = (srcBox.top + srcBox.bottom) / 2;
            const newSrcCenterX = srcCenterX * scaleCos - srcCenterY * scaleSin;
            const newSrcCenterY = srcCenterX * scaleSin + srcCenterY * scaleCos;
            const distBox = boxMap[boxIdx].dist;
            const mtx = [
                scaleCos, scaleSin,
                -scaleSin, scaleCos,
                (distBox.left + distBox.right) / 2 - newSrcCenterX,
                (distBox.top + distBox.bottom) / 2 - newSrcCenterY
            ];
            pageManger.setPage(i, bbox, mtx, targetPage);
        }
        //移動到下一組 (pageIdx, boxIdx)
        boxIdx = (boxIdx + 1) % boxMap.length;
        if (boxIdx === 0) {
            pageIdx = (pageIdx + 1) % layout.length;
        }
    }
    const srcDocInfo = pageManger.getDocAndPages();
    for (let i = 0; i < srcDocInfo.length; ++i) {
        const docInfo = srcDocInfo[i];
        let embedPages = await pdfDoc.embedPages(
            docInfo.pagesArr,
            docInfo.bboxArr,
            docInfo.mtxArr
        );
        for (let j = 0; j < docInfo.targetPageArr.length; ++j) {
            pdfDoc.getPage(docInfo.targetPageArr[j]).drawPage(embedPages[j]);
        }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}


const fileList = [];
const fileLoaderEle = document.querySelector('#file-loader');
const fileListEle = document.querySelector('#file-list');
const fileLoader = new FileUploader(fileLoaderEle);
fileLoaderEle.addEventListener('upload-files', (evt) => {
    const files = evt.detail.files;
    for (let i = 0; i < files.length; ++i) {
        const file = files[i];
        fileList.push(file);
    }
    const liHtml = fileList.map(f => `<li>${f.name}</li>`).join('\n');
    fileListEle.innerHTML = `<hr><ol style="list-style-type: lower-alpha;">${liHtml}</ol>`;
});

document.querySelector('#output-btn').addEventListener('click', () => {
    (async function () {
        const pageManger = new PageInput();
        const selectStr = document.querySelector('#input-page').value;
        try {
            await pageManger.embedPages(fileList, selectStr);
        } catch (e) {
            alert(e);
            return;
        }
        const flipDirection = document.querySelector('#flip').value;
        const edgeBinding = document.querySelector('#edge').value;
        const paper = document.querySelector('#paper').value;
        pageManger.convetForSaddle(flipDirection, edgeBinding);
        const bytes = await updatePdf(pageManger, pageLayout[`${paper}-two-${edgeBinding}`]);
        document.querySelector('iframe').src = URL.createObjectURL(
            new Blob([bytes], { type: 'application/pdf' })
        );
    })();
});