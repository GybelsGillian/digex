'use strict';

import '../scss/styles.scss';

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'


// js code


const init = function () {
  const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (!reduceMotion) {
  new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.1,
  })
}
};

document.addEventListener('DOMContentLoaded', init);
