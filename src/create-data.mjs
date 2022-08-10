import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mm2pt(x) {
    return x * 72 / 25.4;
}

/**
 * 建立4頁有尺標的 pdf
 */
async function createPdf(nPages) {
    const pdfDoc = await PDFDocument.create();
    const [pageW, pageH] = [mm2pt(210), mm2pt(297)];

    for (let k = 0; k < nPages; ++k) {
        const page = pdfDoc.addPage([pageW, pageH]);
        const pageColor = (k & 1) ? rgb(1, 0, 0) : rgb(0, 0, 1);
        //水平尺
        const cy = mm2pt((297 + ((k & 1) ? 5 : -5)) / 2);
        let svgPath = [`M 0,${cy} L ${pageW},${cy}`];
        for (let i = 0; i <= 210; ++i) {
            let x = mm2pt(i);
            let len = mm2pt(i % 10 === 0 ? 5 : (i % 5 === 0 ? 3.5 : 2));
            svgPath.push(`M ${x} ${cy} v -${len}`);
            if (i % 10 === 0) {
                page.drawText((i / 10).toString(), {
                    size: 12,
                    x: x,
                    y: cy,
                    color: pageColor
                });
            }
        }
        page.moveTo(0, pageH);
        page.drawSvgPath(svgPath.join(' '), { borderColor: pageColor, borderWidth: 0.25 });

        //垂直尺
        const cx = mm2pt((210 + (k & 1 ? 5 : -5)) / 2);
        svgPath = [`M ${cx},0 L ${cx},${-pageH}`];
        for (let i = 0; i <= 297; ++i) {
            let y = -mm2pt(i);
            let len = mm2pt(i % 10 === 0 ? 5 : (i % 5 === 0 ? 3.5 : 2));
            svgPath.push(`M ${cx} ${y} h ${len}`);
            if (i % 10 === 0) {
                page.drawText((i / 10).toString(), {
                    size: 12,
                    x: cx - 16,
                    y: -y,
                    color: pageColor
                });
            }
        }
        page.moveTo(0, 0);
        page.drawSvgPath(svgPath.join(' '), { borderColor: pageColor, borderWidth: 0.25 });
    }
    const pdfBytes = await pdfDoc.save();
    
    fs.writeFileSync(
        path.resolve(__dirname, `../data/ruler-${nPages}.pdf`),
        pdfBytes,
        {
            encoding: 'binary',
            flag: 'w'
        }
    );
}

createPdf(4);
createPdf(5);
createPdf(6);
createPdf(7);
createPdf(8);
createPdf(9);