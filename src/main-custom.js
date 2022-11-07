import { FileUploader } from './file-uploader.esm.js';
import PageManager from './page-manager.js';
import GridMapping from './mapping/grid-mapping.js';

const fileLoaderEle = document.querySelector('#file-loader');
new FileUploader(fileLoaderEle);
fileLoaderEle.addEventListener('upload-files', async (evt) => {
    const params = getParams();
    let pm = await PageManager.create(Array.from(evt.detail.files));
    let selectStr = '';
    if (params.space > 0) {
        const pageCountArr = pm.getPagesCount();
        selectStr = '#,'.repeat(params.space)
        selectStr += pageCountArr.map((n, i) => `${String.fromCodePoint(97 + i)}1-${n}`).join(',');
    }
    let bytes = await pm.select(selectStr).output(new GridMapping({
        width: params.paperWidth,
        height: params.paperHeight,
        padding: params.paperPadding,
        nCol: params.gridCol,
        nRow: params.gridRow,
        gap: params.gridGap,
        saddle: params.flip,
        edge: params.edge,
        direction: params.direction,
        clip: params.clip
    }));
    document.querySelector('iframe').src = URL.createObjectURL(
        new Blob([bytes], { type: 'application/pdf' })
    );
});

function getParams() {
    //抓使用者輸入的資料
    const params = {
        paperWidth: 'paper-width',
        paperHeight: 'paper-height',
        paperPadding: 'paper-padding',
        gridRow: 'grid-row',
        gridCol: 'grid-col',
        gridGap: 'grid-gap',
        space: 'space',
        flip: '',
        edge: '',
        direction: '',
        clip: 'clip'
    };
    const notPt = ['gridRow', 'gridCol', 'space'];
    for (let k in params) {
        if (params[k] === '') {
            continue;
        }
        if (notPt.indexOf(k) < 0) {
            let val = parseFloat(document.querySelector('#' + params[k]).value);
            params[k] = val;
        } else {
            let val = parseInt(document.querySelector('#' + params[k]).value);
            params[k] = val;
        }
    }
    ['flip', 'edge', 'direction'].forEach(k => {
        params[k] = document.querySelector('#' + k).value;
    });
    //檢查資料正確性
    validInputs(params);
    return params;
}

function validInputs(params) {
    ['paperWidth', 'paperHeight'].forEach(k => {
        let v = params[k];
        if (typeof v !== 'number') {
            throw `${k} 應該要是數字`;
        }
        if (v < 1 || v > 10000) {
            throw `${k} 不在合理的範圍`;
        }
    });
    ['paperPadding'].forEach(k => {
        let v = params[k];
        if (typeof v !== 'number') {
            throw `${k} 應該要是數字`;
        }
        if (v < 0 || v > 10000) {
            throw `${k} 不在合理的範圍`;
        }
    });
    const w = params.paperWidth - params.paperPadding * 2;
    const h = params.paperHeight - params.paperPadding * 2;
    if (w < 0 || h < 0) {
        throw `paperPadding 太大`;
    }
    ['gridRow', 'gridCol'].forEach(k => {
        let v = params[k];
        if (typeof v !== 'number') {
            throw `${k} 應該要是數字`;
        }
        if (v < 1 || v > 100) {
            throw `${k} 不在合理的範圍`;
        }
    });
    ['gridGap'].forEach(k => {
        let v = params[k];
        if (typeof v !== 'number') {
            throw `${k} 應該要是數字`;
        }
        if (v < 0 || v > 10000) {
            throw `${k} 不在合理的範圍`;
        }
    });
    ['space'].forEach(k => {
        let v = params[k];
        if (typeof v !== 'number') {
            throw `${k} 應該要是數字`;
        }
        if (v < 0 || v > 3 * params.gridCol * params.gridRow) {
            throw `${k} 不在合理的範圍`;
        }
    });
    const gw = w - params.gridGap * (params.gridCol - 1) / params.gridCol;
    const gh = h - params.gridGap * (params.gridRow - 1) / params.gridRow;
    if (gw < 0 || gh < 0) {
        throw `gridCol 太大或分割過細，導致無剩餘空間`;
    }
}
