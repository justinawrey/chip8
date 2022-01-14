import { terser } from 'rollup-plugin-terser'
import replaceHtmlVars from 'rollup-plugin-replace-html-vars'
import copy from 'rollup-plugin-copy'

export default {
  input: 'compiled/main.js',
  output: {
    file: 'dist/assets/bundle.min.js',
    format: 'es',
    plugins: [
      terser(),
      replaceHtmlVars({
        files: 'index.html',
        from: '/compiled/main.js',
        to: '/assets/bundle.min.js',
      }),
      copy({
        targets: [{ src: 'index.html', dest: 'dist' }],
        hook: 'writeBundle',
      }),
    ],
  },
}
