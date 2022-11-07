import { PDFDocument, PDFPage } from '../node_modules/pdf-lib/dist/pdf-lib.esm.js';

export default class PageManager {
    /**
     * @param {PDFDocument[]} docs 
     */
    constructor(docs) {
        this.docs = docs;

        /**
         * @typedef {object} SelectPage
         * @property {number} docId
         * @property {number} pageId
         * @property {number} inputPageIndex
         */

        /**
         * @type SelectPage[]
         */
        this.selectPages = [];
    }

    /**
     * 從檔案建立 PageManager 物件
     * @param {File[]} fileList 輸入的檔案
     * @returns {Promise<PageManager>}
     */
    static async create(fileList) {
        const docs = [];
        for (let i = 0; i < fileList.length; ++i) {
            let doc = await new Promise(resolve => {
                let frd = new FileReader();
                frd.onload = function () {
                    resolve(this.result);
                }
                frd.readAsArrayBuffer(fileList[i]);
            }).then(PDFDocument.load);
            docs.push(doc);
        }
        return new PageManager(docs);
    }

    /**
     * 選擇頁面
     * @param {string|number} selection 選擇頁面，若為數字，代表前面插入 N 頁空白後全選
     * @returns {PageManager}
     */
    select(selectStr) {
        /**
         * 檢查範圍
         * @param {int} docId 
         * @param {int} pageId 
         * @param {int[]} docPageCounts 
         * @throws 不符合合理範圍
         */
        function validRange(docId, pageId, docPageCounts) {
            if (docId < 0 || docId >= docPageCounts.length) {
                throw new RangeError('超出文件個數範圍');
            }
            if (pageId < 0 || pageId >= docPageCounts[docId]) {
                throw new RangeError('超出頁數範圍');
            }
        }

        //預先處理輸入格式
        const docPageCounts = this.docs.map(o => o.getPageCount());
        if (selectStr === '') {
            selectStr = 0;
        }
        if (typeof selectStr === 'string') {
            selectStr = selectStr.toLowerCase().replaceAll(/\s/g, '');
        }
        if (typeof selectStr === 'number') {
            let n = selectStr;
            selectStr = '#,'.repeat(n) + docPageCounts.map((x, i) => {
                return `${String.fromCodePoint(97 + i)}1-${x}`;
            }).join(',');
        }

        //依據字串寫入 this.selectPages
        const arr = selectStr.split(',').map(x => x.split('-'));
        let docId = 0;
        let pages = [];
        let inputPageIndex = 0;
        for (let i = 0, n = arr.length; i < n; ++i) {
            const segment = arr[i];
            if (segment.length === 1) {
                const cmd = segment[0];
                if (cmd === '#') {
                    inputPageIndex++
                    continue;
                } else if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    validRange(docId, pageId, docPageCounts);
                    pages.push({ docId, pageId, inputPageIndex: inputPageIndex++ });
                } else if (cmd.search(/^[a-z]\d+$/) === 0) {
                    docId = cmd.codePointAt(0) - 97;
                    let pageId = parseInt(cmd.slice(1)) - 1;
                    validRange(docId, pageId, docPageCounts);
                    pages.push({ docId, pageId, inputPageIndex: inputPageIndex++ });
                } else {
                    throw '格式錯誤';
                }
            } else if (segment.length === 2) {
                let cmd = segment[0], startPage, endPage;
                if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    validRange(docId, pageId, docPageCounts);
                    startPage = pageId;
                } else if (cmd.search(/^[a-z]\d+$/) === 0) {
                    docId = cmd.codePointAt(0) - 97;
                    let pageId = parseInt(cmd.slice(1)) - 1;
                    validRange(docId, pageId, docPageCounts);
                    startPage = pageId;
                } else {
                    throw '格式錯誤';
                }
                cmd = segment[1];
                if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    validRange(docId, pageId, docPageCounts);
                    endPage = pageId;
                } else {
                    throw '格式錯誤';
                }
                //實際寫入
                if (startPage <= endPage) {
                    for (let i = startPage; i <= endPage; ++i) {
                        pages.push({ docId, pageId: i, inputPageIndex: inputPageIndex++ });
                    }
                } else {
                    for (let i = startPage; i >= endPage; --i) {
                        pages.push({ docId, pageId: i, inputPageIndex: inputPageIndex++ });
                    }
                }
            }
        }

        this.selectPages = pages;
        return this;
    }

    /**
     * 輸出
     * @param {Mapping} mapping 映射處理函數
     * @param {Promise<Uint8Array>}
     */
    async output(mapping) {
        const {docs, selectPages} = this;
        const selectPagesSize = selectPages.map(o => {
            let r = docs[o.docId].getPage(o.pageId).getSize();
            r.idx = o.inputPageIndex;
            return r;
        });
        //預先建立空白頁面
        const doc = await PDFDocument.create();
        mapping.getPagesSize(selectPagesSize).forEach(o => {
            doc.addPage([o.width, o.height]);
        });
        //把要輸出的頁面，更新到 embedDocs
        let embedDocs = [];
        let embedDocsIdxs = {};
        selectPages.forEach(o => {
            const { docId, pageId, inputPageIndex } = o;
            if (embedDocsIdxs[docId] === undefined) {
                embedDocsIdxs[docId] = embedDocs.length;
                embedDocs.push({
                    srcDoc: docs[docId],
                    pages: [],
                    bbx: [],
                    mtx: [],
                    idx: []
                });
            }
            const current = embedDocs[embedDocsIdxs[docId]];
            const page = current.srcDoc.getPage(pageId);
            const { bbx, mtx, idx } = mapping.getTransform(inputPageIndex);
            current.pages.push(page);
            current.bbx.push(bbx);
            current.mtx.push(mtx);
            current.idx.push(idx);
        });
        

        for (let i = 0; i < embedDocs.length; ++i) {
            const { pages, bbx, mtx, idx } = embedDocs[i];
            let embedPages = await doc.embedPages(pages, bbx, mtx); //內嵌的頁面
            for (let j = 0; j < embedPages.length; ++j) {
                let k = idx[j];
                const distPage = doc.getPage(k);
                distPage.drawPage(embedPages[j]);
            }
        }
        //輸出
        const bytes = await doc.save();
        return bytes;
    }

    /**
     * 取得各文件頁數
     * @returns {number[]} 各文件頁數
     */
    getPagesCount() {
        return this.docs.map(doc=>doc.getPageCount());
    }

    _getSelectPagesSize() {
        const {docs, selectPages} = this;
        return selectPages.map(o => docs[o.docId].getPage(o.pageId).getSize());
    }
}