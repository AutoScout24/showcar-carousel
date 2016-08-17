import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

export default {
    entry: 'src/showcar-carousel.ts',
    plugins: [
        typescript(),
        babel()
    ],
    dest: 'docs/showcar-carousel.js',
};
