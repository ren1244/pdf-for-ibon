import { mm2pt } from '../lib.js';

const pad = 4 * 210 / 297;

const layout = [
    {
        width: mm2pt(289),
        height: mm2pt(412),
        boxMap: [
            {
                src: {
                    left: mm2pt(pad),
                    bottom: mm2pt(pad),
                    right: mm2pt(210 - pad),
                    top: mm2pt(297 - pad),
                    scale: 297 / 210,
                    rot: 0
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(289),
                    top: mm2pt(412),
                }
            },
        ]
    },
    {
        width: mm2pt(289),
        height: mm2pt(412),
        boxMap: [
            {
                src: {
                    left: mm2pt(pad),
                    bottom: mm2pt(pad),
                    right: mm2pt(210 - pad),
                    top: mm2pt(297 - pad),
                    scale: 297 / 210,
                    rot: 180
                },
                dist: {
                    left: 0,
                    bottom: 0,
                    right: mm2pt(289),
                    top: mm2pt(412),
                }
            },
        ]
    },
];

export { layout };
