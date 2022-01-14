import { terser } from 'rollup-plugin-terser'
import brotli from 'rollup-plugin-brotli'
import replaceHtmlVars from 'rollup-plugin-replace-html-vars'

export default {
  input: 'compiled/main.js',
  output: {
    file: 'dist/bundle.min.js',
    format: 'es',
    plugins: [
      terser(),
      brotli(),
      replaceHtmlVars({
        files: 'index.html',
        from: '/compiled/main.js',
        to: '/dist/bundle.min.js.br',
      }),
    ],
  },
}
