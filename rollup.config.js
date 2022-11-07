import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import json from '@rollup/plugin-json';

export default [
    {
        input: 'src/main.js',
        output: {
            file: 'dist/bundle.js',
            format: 'iife',
            plugins: [
                terser()
            ]
        },
        plugins: [
            json(),
            nodeResolve(),
            commonjs(),
        ]
    },
    {
        input: 'src/main-custom.js',
        output: {
            file: 'dist/custom-bundle.js',
            format: 'iife',
            plugins: [
                terser()
            ]
        },
        plugins: [
            json(),
            nodeResolve(),
            commonjs(),
        ]
    },
];
