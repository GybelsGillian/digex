import { createCurtainAnimation } from '../animations/animation-curtain.js';

// #region ***  DOM references                           ***********

let section;
let rock;
let curtainAnimation;

// #endregion

// #region ***  Configuration                            ***********

const ROCK_START_PROGRESS = 0.15;
const ROCK_END_PROGRESS = 0.3;
const ROCK_START_TRANSLATE_Y = 100;
const ROCK_END_TRANSLATE_Y = 0;

const CURTAIN_START_PROGRESS = 0.7;
const CURTAIN_END_PROGRESS = 1;
const CURTAIN_PANEL_DURATION = 0.5;
const CURTAIN_PANEL_STAGGER = 0.125;
const CURTAIN_START_PERCENTAGE = 100;
const CURTAIN_END_PERCENTAGE = 0;
const CURTAIN_EFFECT = 'mask';
const CURTAIN_MASK_DIRECTION = 'to bottom';

// #endregion

// #region ***  State                                    ***********

let animationFrameId = null;

// #endregion

// #region ***  Callback-Visualisation - show___         ***********

const showRockPosition = (scrollProgress) => {
  const rockProgress = getProgressBetween(scrollProgress, ROCK_START_PROGRESS, ROCK_END_PROGRESS);
  const translateY = ROCK_START_TRANSLATE_Y + rockProgress * (ROCK_END_TRANSLATE_Y - ROCK_START_TRANSLATE_Y);

  rock.style.transform = `translateX(-50%) translateY(${translateY}%)`;
};

// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********

const callbackUpdateSectionDevelopment = () => {
  const scrollProgress = getScrollProgress();

  showRockPosition(scrollProgress);
  curtainAnimation.update(scrollProgress);
};

const callbackScheduleSectionUpdate = () => {
  if (animationFrameId !== null) {
    return;
  }

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = null;
    callbackUpdateSectionDevelopment();
  });
};

// #endregion

// #region ***  Data Access - get___                     ***********

const getClampedValue = (value, minimum, maximum) => {
  return Math.min(Math.max(value, minimum), maximum);
};

const getProgressBetween = (progress, startProgress, endProgress) => {
  const progressDistance = Math.max(endProgress - startProgress, Number.EPSILON);

  return getClampedValue((progress - startProgress) / progressDistance, 0, 1);
};

const getScrollProgress = () => {
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  const scrollStart = sectionTop;
  const scrollEnd = sectionTop + section.offsetHeight - window.innerHeight;
  const scrollDistance = Math.max(scrollEnd - scrollStart, 1);

  return getClampedValue((window.scrollY - scrollStart) / scrollDistance, 0, 1);
};

// #endregion

// #region ***  Event Listeners - listenTo___            ***********

const listenToWindowScroll = () => {
  window.addEventListener('scroll', callbackScheduleSectionUpdate, {
    passive: true,
  });
};

const listenToWindowResize = () => {
  window.addEventListener('resize', callbackScheduleSectionUpdate);
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********

const initSectionDevelopment = () => {
  section = document.querySelector('.js-section-development');
 console.log('initSectionDevelopment', section);
  if (!section) {
    return;
  }

  rock = section.querySelector('.js-section-development-rock');
  const curtain = section.querySelector('.js-curtain');

  if (!rock || !curtain) {
    return;
  }

  curtainAnimation = createCurtainAnimation({
    root: curtain,
    panelSelector: '.js-curtain-panel',
    panelOrderAttribute: 'panel',
    startProgress: CURTAIN_START_PROGRESS,
    endProgress: CURTAIN_END_PROGRESS,
    panelDuration: CURTAIN_PANEL_DURATION,
    panelStagger: CURTAIN_PANEL_STAGGER,
    startPercentage: CURTAIN_START_PERCENTAGE,
    endPercentage: CURTAIN_END_PERCENTAGE,
    effect: CURTAIN_EFFECT,
    maskDirection: CURTAIN_MASK_DIRECTION,
  });

  if (!curtainAnimation) {
    return;
  }

  listenToWindowScroll();
  listenToWindowResize();

  callbackScheduleSectionUpdate();
};

document.addEventListener('DOMContentLoaded', initSectionDevelopment);

// #endregion