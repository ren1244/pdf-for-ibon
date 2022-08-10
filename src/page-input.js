import { PDFDocument } from '../node_modules/pdf-lib/dist/pdf-lib.esm.js';

class PageInput {
    constructor() {
    }

    embedPages(files, selectStr) {
        return Promise.all(files.map(f => readAsPdfDoc(f))).then(docArr => {
            const docPageCounts = docArr.map(doc => doc.getPageCount());
            const pages = this._loadPageSelect(selectStr, docPageCounts);
            this.docs = docArr;
            this.pages = pages;
        });
        function readAsPdfDoc(file) {
            return new Promise((success, reject) => {
                let frd = new FileReader;
                frd.onload = function () {
                    success(this.result);
                }
                frd.readAsArrayBuffer(file);
            }).then((buf) => {
                return PDFDocument.load(buf);
            });
        }
    }

    /**
     * 重新排頁面為騎馬釘順序
     * 
     * @param {string} flipDirection 翻面方向: "left", "right"
     * @param {string} edgeBinding 裝訂邊: "long", "short"
     */
    convetForSaddle(flipDirection, edgeBinding) {
        const reverseBitConfig = {
            long: {
                left: 0,
                right: 3,
            },
            short: {
                left: 2,
                right: 1
            }
        };
        const revBits = reverseBitConfig[edgeBinding][flipDirection];
        const pages = this.pages;
        const totalPage = (pages.length + 3 >>> 2) * 4;
        const [sumVal, half] = [totalPage - 1, totalPage / 2];
        const newPages = [];
        for (let i = 0; i < half; ++i) {
            if (revBits & 1 << (i & 1)) {
                newPages.push(sumVal - i < pages.length ? pages[sumVal - i] : null);
                newPages.push(pages[i]);
            } else {
                newPages.push(pages[i]);
                newPages.push(sumVal - i < pages.length ? pages[sumVal - i] : null);
            }
        }
        this.pages = newPages;
    }

    /**
     * 
     * @returns {int} 總頁數
     */
    getPageCount() {
        return this.pages.length;
    }

    getPage(k) {
        return this.pages[k];
    }

    setPage(k, bbox, mtx, targetPage) {
        this.pages[k].bbox = bbox;
        this.pages[k].mtx = mtx;
        this.pages[k].targetPage = targetPage;
    }

    getDocAndPages() {
        let result = [];
        for (let i = 0; i < this.docs.length; ++i) {
            result.push({ doc: this.docs[i], pagesArr:[], bboxArr: [], mtxArr: [], targetPageArr: [] });
        }
        for (let i = 0; i < this.pages.length; ++i) {
            let page = this.pages[i];
            if (page === null) {
                continue;
            }
            let docId = page.docId;
            // result[docId].pagesArr[page.pageId]=result[docId].doc.getPage(page.pageId);
            // result[docId].bboxArr[page.pageId]=page.bbox;
            // result[docId].mtxArr[page.pageId]=page.mtx;
            // result[docId].targetPageArr[page.pageId]=page.targetPage;

            result[docId].pagesArr.push(result[docId].doc.getPage(page.pageId));
            result[docId].bboxArr.push(page.bbox);
            result[docId].mtxArr.push(page.mtx);
            result[docId].targetPageArr.push(page.targetPage);
        }
        return result;
    }

    /**
     * 
     * @param {string} selectStr 頁面選擇
     * @param {int[]} docPageCounts 代表每個 doc 個別的總頁數
     * @returns {PageDiscript[]} 代表要被輸出的頁面
     */
    _loadPageSelect(selectStr, docPageCounts) {
        selectStr = selectStr.toLowerCase().replaceAll(/\s/g, '');
        const arr = selectStr.split(',').map(x => x.split('-'));
        let docId = 0;
        let pages = [];
        for (let i = 0, n = arr.length; i < n; ++i) {
            const segment = arr[i];
            if (segment.length === 1) {
                const cmd = segment[0];
                if (cmd === '#') {
                    pages.push(null); //空白頁
                } else if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    checkAndSave(pages, docId, pageId, docPageCounts);
                } else if (cmd.search(/^[a-z]\d+$/) === 0) {
                    docId = cmd.codePointAt(0) - 97;
                    let pageId = parseInt(cmd.slice(1)) - 1;
                    checkAndSave(pages, docId, pageId, docPageCounts);
                } else {
                    throw '格式錯誤';
                }
            } else if (segment.length === 2) {
                let cmd = segment[0], startPage, endPage;
                if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    startPage = checkAndSave(pages, docId, pageId, docPageCounts, true);
                } else if (cmd.search(/^[a-z]\d+$/) === 0) {
                    docId = cmd.codePointAt(0) - 97;
                    let pageId = parseInt(cmd.slice(1)) - 1;
                    startPage = checkAndSave(pages, docId, pageId, docPageCounts, true);
                } else {
                    throw '格式錯誤';
                }
                cmd = segment[1];
                if (cmd.search(/^\d+$/) === 0) {
                    let pageId = parseInt(cmd) - 1;
                    endPage = checkAndSave(pages, docId, pageId, docPageCounts, true);
                } else {
                    throw '格式錯誤';
                }
                //實際寫入
                if (startPage.pageId <= endPage.pageId) {
                    for (let i = startPage.pageId; i <= endPage.pageId; ++i) {
                        pages.push({ docId, pageId: i });
                    }
                } else {
                    for (let i = startPage.pageId; i >= endPage.pageId; --i) {
                        pages.push({ docId, pageId: i });
                    }
                }
            }
        }
        return pages;

        /**
         * 檢查後寫入
         * 
         * @param {PageDiscript[]} pages 要被寫入的陣列
         * @param {int} docId 
         * @param {int} pageId 
         * @param {int[]} docPageCounts 
         * @param {bool?} noWrite 不寫入，只確認後回傳
         * @returns {PageDiscript} 被寫入的這一頁
         * @throws 不符合合理範圍
         */
        function checkAndSave(pages, docId, pageId, docPageCounts, noWrite) {
            if (docId < 0 || docId >= docPageCounts.length) {
                throw '超出文件個數範圍';
            }
            if (pageId < 0 || pageId >= docPageCounts[docId]) {
                throw '超出頁數範圍';
            }
            let cur = { docId, pageId };
            if (!noWrite) {
                pages.push(cur);
            }
            return cur;
        }
    }

}

export default PageInput;
