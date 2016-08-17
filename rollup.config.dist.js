import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

export default {
    format: 'umd',
    entry: 'src/showcar-carousel.ts',
    plugins: [ typescript(), babel() ],
    dest: 'dist/showcar-carousel.js',
};
