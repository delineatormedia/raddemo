import nodeResolve from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import strip from '@rollup/plugin-strip';

export default [
    {
        input: 'src/js/index.js',
        output: [
            {
                file: 'dist/raddemo.js',
                format: 'iife',
                name: 'radDemo',
            },
            {
                file: 'dist/raddemo.min.js',
                format: 'iife',
                compact: true,
                name: 'radDemo',
                plugins: [
                    terser()
                ]
            }
        ],
        plugins: [
            nodeResolve(),
            scss({
                output: 'dist/raddemo.min.css',
                outputStyle: "compressed",
            }),
            strip()
        ]
    },
    {
        input: 'src/js/components/raddemo.js',
        output: [
            {
                file: 'dist/raddemo.module.js'
            },
            {
                file: 'dist/raddemo.module.min.js',
                compact: true,
                plugins: [
                    terser(),
                ]
            }
        ],
        plugins: [
            nodeResolve(),
            strip()
        ]
    },
    {
        input: 'src/js/index.js',
        output: [
            {
                file: 'dist/debug/raddemo.library.dev.js',
                format: 'iife',
                name: 'radDemo',
            }
        ],
        plugins: [
            nodeResolve(),
            scss({
                output: 'dist/raddemo.css'
            })
        ]
    },
    {
        input: 'src/js/components/raddemo.js',
        output: [
            {
                file: 'dist/debug/raddemo.module.dev.js',
            }
        ],
        plugins: [
            nodeResolve(),
            scss({
                output: false
            })
        ]
    },
]