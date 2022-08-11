import { mm2pt } from '../lib.js';

const pad = 4;

const layout = [
    {
        width: mm2pt(202),
        height: mm2pt(289),
        boxMap: [
            {
                src: {
                    left: mm2pt(pad),
                    bottom: mm2pt(pad),
                    right: mm2pt(210 - pad),
                    top: mm2pt(297 - pad),
                    scale: 1,
                    rot: 0
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(202),
                    top: mm2pt(289),
                }
            },
        ]
    },
];

export { layout };
