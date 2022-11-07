/**
 * 格狀布局
 * 
 * @class
 * @implements MappingInterface
 */
export default class GridMapping {
    constructor(options) {
        this.width = (options.width || 210) * 72 / 25.4;
        this.height = (options.height || 297) * 72 / 25.4;
        this.padding = (options.padding || 0) * 72 / 25.4;
        this.nCol = options.nCol || 1;
        this.nRow = options.nRow || 1;
        this.gap = (options.gap || 0) * 72 / 25.4;
        this.saddle = (options.saddle || 'none'); //"none", "left", "right"
        this.edge = (options.edge || 'long'); //印刷機翻轉方向
        this.direction = (options.direction || 'hlr'); // "hlr", "hrl", "vlr", "vrl"
        this.clip = (options.clip || 0) * 72 / 25.4;;
        this.gridInfo = this._getGridInfo();
    }

    /**
     * 依據來源各頁長寬，產生輸出各頁面的長寬
     * 
     * （這會在 getTransform 之前呼叫，有必要的話請把 sizeArray 儲存起來之後使用）
     * 
     * @param {{width: number, height: number, idx: number}[]} sizeArray 來源資料各頁長寬的陣列, 另外 idx 表示選擇的第幾頁(從0開始)
     * @returns {{width: number, height: number}[]} 輸出結果各頁長寬的陣列
     */
    getPagesSize(sizeArray) {
        this.sizeArray = sizeArray;
        this.sizeDict = sizeArray.reduce((o, e) => {
            o[e.idx] = e;
            return o;
        }, {});
        const n = this.nCol * this.nRow;
        const sz = { width: this.width - this.clip * 2, height: this.height - this.clip * 2 };
        let nPage = ((sizeArray.reduce((s, x) => Math.max(s, x.idx), 0) + n) / n | 0);
        if (this.saddle === 'left' || this.saddle === 'right') {
            nPage = nPage + 3 >>> 2 << 1;
        }
        const result = Array.from({ length: nPage }, x => sz);
        this.nPage = nPage;
        return result;
    }

    /**
     * 定義頁面的映射
     * @param {number} k 來源的第 k 頁（由 0 開始）
     * @returns {{
     *     bbx: PageBoundingBox,
     *     mtx: [number, number, number, number, number, number],
     *     idx: number
     * }} 由 bbx 裁切，經過 mtx 轉換，輸出到第 idx 頁
     */
    getTransform(k) {
        const { direction: d, nCol: nc, nRow: nr, gridInfo } = this;
        const n = nc * nr;
        const m = gridInfo.length;
        let pageIdx = (k / n | 0);
        let boxIdx = 0;
        if (this._isSaddle()) {
            boxIdx = (pageIdx + (this.saddle === 'left' ? 1 : 0) & 1);
            if (pageIdx >= this.nPage) {
                pageIdx = this.nPage * 2 - 1 - pageIdx;
            }
        }
        const remainder = k % n; //餘數
        const { r, c } = (() => {
            let r = (remainder / nc | 0);
            let c = remainder % nc;
            if (d === 'hlr') {
                return { r, c };
            } else if (d === 'hrl') {
                return { r, c: nc - 1 - c };
            }
            c = (remainder / nr | 0);
            r = remainder % nr;
            if (d === 'vlr') {
                return { r, c };
            } else if (d === 'vrl') {
                return { r, c: nc - 1 - c };
            }
            throw '方向設定錯誤';
        })();
        const grid = gridInfo[boxIdx * n + r * nc + c];
        const { width: srcW, height: srcH } = this.sizeDict[k];
        const bbx = {
            left: 0,
            right: srcW,
            top: srcH,
            bottom: 0
        };
        let mtx;
        if (grid[4]) { //有旋轉
            const scale = Math.min((grid[2] - grid[0]) / srcH, (grid[1] - grid[3]) / srcW);
            const [srcX, srcY, distX, distY] = [
                scale * srcH / 2,
                -scale * srcW / 2,
                (grid[2] + grid[0]) / 2,
                (grid[3] + grid[1]) / 2,
            ];
            mtx = [0, -scale, scale, 0, distX - srcX, distY - srcY];
        } else { //沒旋轉
            const scale = Math.min((grid[2] - grid[0]) / srcW, (grid[1] - grid[3]) / srcH);
            const [srcX, srcY, distX, distY] = [
                scale * srcW / 2,
                scale * srcH / 2,
                (grid[2] + grid[0]) / 2,
                (grid[3] + grid[1]) / 2,
            ];
            mtx = [scale, 0, 0, scale, distX - srcX, distY - srcY];
        }
        //判斷是否需要旋轉
        let rot180Flag = false;
        if (this._isSaddle() && this.edge === 'long') {
            rot180Flag = true;
        } else if (this.saddle === 'double') {
            if((this.edge === 'long' ? 1 : 0) ^ (this.width > this.height ? 0 : 1)) {
                rot180Flag = true;
            }
        }
        if (rot180Flag && !(pageIdx & 1)) {
            GridMapping.multipleBy(mtx, [-1, 0, 0, -1, this.width, this.height]);
        }
        //最終裁切
        const clip = this.clip;
        if (clip > 0) {
            GridMapping.multipleBy(mtx, [1, 0, 0, 1, -clip, -clip]);
        }
        return { bbx, mtx, idx: pageIdx };
    }

    /**
     * 計算格子
     * @returns {[number, number, number, number, number][]} [left, top, right, bottom, rotation]
     */
    _getGridInfo() {
        const { width: w, height: h, padding: pad, nRow: nr, nCol: nc, gap, saddle: s } = this;
        const result = [];
        if (this._isSaddle()) {
            if (w < h) { //切成上下
                const gridW = (w - pad * 2 - gap * (nr - 1)) / nr;
                const gridH = (h / 2 - pad * 2 - gap * (nc - 1)) / nc;
                for (let i = 0; i < 2; ++i) {
                    let x = w - pad - gridW;
                    for (let r = 0; r < nr; ++r) {
                        let y = h - h / 2 * i - pad;
                        for (let c = 0; c < nc; ++c) {
                            result.push([x, y, x + gridW, y - gridH, true]);
                            y -= gap + gridH;
                        }
                        x -= gap + gridW;
                    }
                }
            } else { //切成左右
                const gridW = (w / 2 - pad * 2 - gap * (nc - 1)) / nc;
                const gridH = (h - pad * 2 - gap * (nr - 1)) / nr;
                for (let i = 0; i < 2; ++i) {
                    let y = h - pad;
                    for (let r = 0; r < nr; ++r) {
                        let x = w / 2 * i + pad;
                        for (let c = 0; c < nc; ++c) {
                            result.push([x, y, x + gridW, y - gridH, false]);
                            x += gap + gridW;
                        }
                        y -= gap + gridH;
                    }
                }
            }
        } else { //不切
            const gridW = (w - pad * 2 - gap * (nc - 1)) / nc;
            const gridH = (h - pad * 2 - gap * (nr - 1)) / nr;
            let y = h - pad;
            for (let r = 0; r < nr; ++r) {
                let x = pad;
                for (let c = 0; c < nc; ++c) {
                    result.push([x, y, x + gridW, y - gridH, false]);
                    x += gap + gridW;
                }
                y -= gap + gridH;
            }
        }
        return result;
    }

    _isSaddle() {
        return ['left', 'right'].indexOf(this.saddle) > -1;
    }

    //矩陣乘法，a = b * a
    static multipleBy(a, b) {
        let a0 = b[0] * a[0] + b[2] * a[1];
        let a1 = b[1] * a[0] + b[3] * a[1];
        let a2 = b[0] * a[2] + b[2] * a[3];
        let a3 = b[1] * a[2] + b[3] * a[3];
        let a4 = b[0] * a[4] + b[2] * a[5] + b[4];
        let a5 = b[1] * a[4] + b[3] * a[5] + b[5];
        a[0] = a0;
        a[1] = a1;
        a[2] = a2;
        a[3] = a3;
        a[4] = a4;
        a[5] = a5;
    }
}
