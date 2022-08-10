import { mm2pt } from '../lib.js';

const pad = 4;
const trimRight = {
    left: mm2pt(0),
    bottom: mm2pt(pad),
    right: mm2pt(210 - pad),
    top: mm2pt(297 - pad),
    scale: 1,
    rot: 90
};
const trimLeft = {
    left: mm2pt(pad),
    bottom: mm2pt(pad),
    right: mm2pt(210),
    top: mm2pt(297 - pad),
    scale: 1,
    rot: 90
};
const upBox = {
    left: 0,
    bottom: mm2pt(412 / 2),
    right: mm2pt(289),
    top: mm2pt(412),
};
const downBox = {
    left: 0,
    bottom: 0,
    right: mm2pt(289),
    top: mm2pt(412/2),
};
const layout = [
    {
        width: mm2pt(289),
        height: mm2pt(412),
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
