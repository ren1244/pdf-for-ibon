import { mm2pt } from '../lib.js';

const pad = 4 * 297 / 210;
const trimRight = {
    left: mm2pt(0),
    bottom: mm2pt(pad),
    right: mm2pt(210 - pad),
    top: mm2pt(297 - pad),
    scale: 210 / 297,
    rot: 90
};
const trimLeft = {
    left: mm2pt(pad),
    bottom: mm2pt(pad),
    right: mm2pt(210),
    top: mm2pt(297 - pad),
    scale: 210 / 297,
    rot: 90
};
const upBox = {
    left: 0,
    bottom: mm2pt(289 / 2),
    right: mm2pt(202),
    top: mm2pt(289),
};
const downBox = {
    left: 0,
    bottom: 0,
    right: mm2pt(202),
    top: mm2pt(289/2),
};
const layout = [
    {
        width: mm2pt(202),
        height: mm2pt(289),
        boxMap: [
            {
                src: trimRight,
                dist: upBox
            },
            {
                src: trimLeft,
                dist: downBox
            }
        ]
    },
];

export { layout };
