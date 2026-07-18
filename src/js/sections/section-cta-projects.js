// #region ***  DOM references                           ***********

let section;
let wrap;
let slide;
let slideItems = [];

// #endregion

// #region ***  Configuration                            ***********

const SLIDE_START_PROGRESS = 0;
const SLIDE_END_PROGRESS = 1;
const ITEM_START_TRANSLATE_Y = 100;
const ITEM_END_TRANSLATE_Y = 0;

// #endregion

// #region ***  State                                    ***********

let animationFrameId = null;
let viewportWidth = 0;
let maximumTranslateX = 0;
let slideItemMetrics = [];

// #endregion

// #region ***  Callback-Visualisation - show___         ***********

const showSlideItems = (translateX) => {
  slideItems.forEach((item, index) => {
    const itemMetric = slideItemMetrics[index];
    const itemLeft = itemMetric.left + translateX;
    const itemProgress = getClampedValue((viewportWidth - itemLeft) / itemMetric.width, 0, 1);
    const translateY = ITEM_START_TRANSLATE_Y + itemProgress * (ITEM_END_TRANSLATE_Y - ITEM_START_TRANSLATE_Y);

    item.style.transform = `translate3d(0, ${translateY}%, 0)`;
  });
};

const showSlidePosition = (scrollProgress) => {
  const slideProgress = getProgressBetween(scrollProgress, SLIDE_START_PROGRESS, SLIDE_END_PROGRESS);
  const translateX = -maximumTranslateX * slideProgress;

  slide.style.transform = `translate3d(${translateX}px, 0, 0)`;
  showSlideItems(translateX);
};

// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********

const callbackMeasureSectionCtaProjects = () => {
  const projectCount = section.querySelectorAll('.c-card-project-lg').length;
  const totalItemCount = projectCount + 2;

  section.style.setProperty('--projects', projectCount);
  section.style.setProperty('--section-height', `${totalItemCount * 100}vh`);

  viewportWidth = wrap.clientWidth;
  maximumTranslateX = slide.scrollWidth;

  slideItemMetrics = slideItems.map((item) => ({
    left: item.offsetLeft,
    width: item.offsetWidth,
  }));
};

const callbackUpdateSectionCtaProjects = () => {
  const scrollProgress = getScrollProgress();

  showSlidePosition(scrollProgress);
};

const callbackScheduleSectionUpdate = () => {
  if (animationFrameId !== null) {
    return;
  }

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = null;
    callbackUpdateSectionCtaProjects();
  });
};

const callbackHandleWindowResize = () => {
  callbackMeasureSectionCtaProjects();
  callbackScheduleSectionUpdate();
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
  window.addEventListener('resize', callbackHandleWindowResize);
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********

const initSectionCtaProjects = () => {
  section = document.querySelector('.js-section-cta-projects');

  if (!section) {
    return;
  }

  wrap = section.querySelector('.s-cta-projects__wrap');
  slide = section.querySelector('.js-section-cta-projects-slide');
  slideItems = [...section.querySelectorAll('.js-section-cta-projects-slideitem')];

  if (!wrap || !slide || !slideItems.length) {
    return;
  }

  callbackMeasureSectionCtaProjects();

  listenToWindowScroll();
  listenToWindowResize();

  callbackScheduleSectionUpdate();
};

document.addEventListener('DOMContentLoaded', initSectionCtaProjects);

// #endregion