/**
 * 負責轉換時區塊映射的 class
 * 
 * @interface MappingInterface
 */
export default class MappingInterface {
    /**
     * 依據來源各頁長寬，產生輸出各頁面的長寬
     * 
     * （這會在 getTransform 之前呼叫，有必要的話請把 sizeArray 儲存起來之後使用）
     * 
     * @param {{width: number, height: number}[]} sizeArray 來源資料各頁長寬的陣列
     * @returns {{width: number, height: number}[]} 輸出結果各頁長寬的陣列
     */
    getPagesSize(sizeArray) {

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

    }
}
