function mm2pt(x) {
    return x * 72 / 25.4;
}

function convertLayout(layoutConfig, nSrcPages) {
    const getNextIndex = layoutConfig.indexMapCreator(nSrcPages);
    const layout = layoutConfig.layout;
    let loopLimit = 1000;
    let bboxArr = [], mtxArr = [];
    let pageIdx = 0, boxIdx = 0;
    for (let idx = getNextIndex(); idx !== null; idx = getNextIndex()) {
        if (--loopLimit < 0) { //避免 layoutConfig.indexMapCreator 定義錯誤造成無窮迴圈
            throw '映射函數已經超過限制次數';
        }
        let boxMap;
        try {
            boxMap = layout[pageIdx].boxMap;
        } catch (e) {
            console.log()
        }
        if (idx >= 0) {
            const srcBox = boxMap[boxIdx].src;
            bboxArr[idx] = {
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
            mtxArr[idx] = [
                scaleCos, scaleSin,
                -scaleSin, scaleCos,
                (distBox.left + distBox.right) / 2 - newSrcCenterX,
                (distBox.top + distBox.bottom) / 2 - newSrcCenterY
            ];
        }
        //移動到下一組 (pageIdx, boxIdx)
        boxIdx = (boxIdx + 1) % boxMap.length;
        if (boxIdx === 0) {
            pageIdx = (pageIdx + 1) % layout.length;
        }
    }
    return { bboxArr, mtxArr };
}

export { mm2pt, convertLayout };