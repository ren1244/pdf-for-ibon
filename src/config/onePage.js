import { mm2pt } from '../lib.js';

const indexMapCreator = function(n) {
    let idx = 0;
    return function() {
        if(idx>=n) {
            return null;
        }
        return idx++;
    }
}

const layout = [
    {
        width: mm2pt(202),
        height: mm2pt(289),
        boxMap: [
            {
                src: {
                    left: mm2pt(4),
                    bottom: mm2pt(4),
                    right: mm2pt(210 - 4),
                    top: mm2pt(297 - 4),
                    scale: 1,
                    rot: 0
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(202),
                    top: mm2pt(289),
                }
            }
        ]
    }
];

export {indexMapCreator, layout};
