import { terser } from 'rollup-plugin-terser'
import brotli from 'rollup-plugin-brotli'
import replaceHtmlVars from 'rollup-plugin-replace-html-vars'
import copy from 'rollup-plugin-copy'

export default {
  input: 'compiled/main.js',
  output: {
    file: 'dist/assets/bundle.min.js',
    format: 'es',
    plugins: [
      terser(),
      brotli(),
      replaceHtmlVars({
        files: 'index.html',
        from: '/compiled/main.js',
        to: '/assets/bundle.min.js.br',
      }),
      copy({
        targets: [{ src: 'index.html', dest: 'dist' }],
        hook: 'writeBundle',
      }),
    ],
  },
}
