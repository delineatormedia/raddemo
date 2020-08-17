import nodeResolve from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'

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
                    terser(),
                    scss({
                        output: 'dist/raddemo.min.css',
                        outputStyle: "compressed",
                    })
                ]
            }
        ],
        plugins: [
            nodeResolve(),
            scss({
                outputStyle: "compressed",
            })
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
                    terser()
                ]
            }
        ],
        plugins: [
            nodeResolve(),
            scss({
                outputStyle: "compressed",
            })
        ]
    }
]