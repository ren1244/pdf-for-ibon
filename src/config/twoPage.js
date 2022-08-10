import { mm2pt } from '../lib.js';

const indexMapCreator = function (n) {
    let m = (n + 3 >>> 2) * 4;
    let rec = [0, m - 1];
    let idx = 0;
    return function () {
        if (rec[0] > rec[1]) {
            return null;
        }
        let r;
        if(idx & 1) {
            r = rec[1]--;
        } else {
            r = rec[0]++;
        }
        ++idx;
        return r < n ? r : -1;
    }
}

const pad = 4 * 297 / 210;

const layout = [
    {
        width: mm2pt(202),
        height: mm2pt(289),
        boxMap: [
            {
                src: {
                    left: mm2pt(0),
                    bottom: mm2pt(pad),
                    right: mm2pt(210-pad),
                    top: mm2pt(297 - pad),
                    scale: 210/297,
                    rot: 90
                },
                dist: {
                    left: 0,
                    bottom: mm2pt(289/2),
                    right: mm2pt(202),
                    top: mm2pt(289),
                }
            },
            {
                src: {
                    left: mm2pt(pad),
                    bottom: mm2pt(pad),
                    right: mm2pt(210),
                    top: mm2pt(297 - pad),
                    scale: 210/297,
                    rot: 90
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(202),
                    top: mm2pt(289/2),
                }
            }
        ]
    },
    {
        width: mm2pt(202),
        height: mm2pt(289),
        boxMap: [
            {
                src: {
                    left: mm2pt(pad),
                    bottom: mm2pt(pad),
                    right: mm2pt(210),
                    top: mm2pt(297 - pad),
                    scale: 210/297,
                    rot: -90
                },
                dist: {
                    left: 0,
                    bottom: mm2pt(289/2),
                    right: mm2pt(202),
                    top: mm2pt(289),
                }
            },
            {
                src: {
                    left: mm2pt(0),
                    bottom: mm2pt(pad),
                    right: mm2pt(210-pad),
                    top: mm2pt(297 - pad),
                    scale: 210/297,
                    rot: -90
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(202),
                    top: mm2pt(289/2),
                }
            }
        ]
    }
];

export { indexMapCreator, layout };
