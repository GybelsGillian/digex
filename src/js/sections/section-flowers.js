// #region ***  DOM references                           ***********

let section;
let video;
let curtainPanels = [];

// #endregion

// #region ***  Configuration                            ***********

const VIDEO_FRAME_RATE = 60;

const MINIMUM_SEEK_DIFFERENCE =
  0.5 / VIDEO_FRAME_RATE;

const VIDEO_START_PROGRESS = 0;
const VIDEO_END_PROGRESS = 1;

const CURTAIN_START_PROGRESS =
  .7;

const CURTAIN_END_PROGRESS = 1;

const CURTAIN_PANEL_DURATION = 0.5;
const CURTAIN_PANEL_STAGGER = 0.125;

// #endregion

// #region ***  State                                    ***********

let isVideoReady = false;
let targetVideoTime = 0;
let animationFrameId = null;
let shouldSeekAgain = false;

// #endregion

// #region ***  Callback-Visualisation - show___         ***********

const showVideoFrame = (
  scrollProgress
) => {
  if (!isVideoReady) {
    return;
  }

  const videoProgress =
    getProgressBetween(
      scrollProgress,
      VIDEO_START_PROGRESS,
      VIDEO_END_PROGRESS
    );

  targetVideoTime =
    videoProgress * getMaximumVideoTime();

  if (video.seeking) {
    shouldSeekAgain = true;
    return;
  }

  const timeDifference = Math.abs(
    targetVideoTime - video.currentTime
  );

  if (
    timeDifference <
    MINIMUM_SEEK_DIFFERENCE
  ) {
    shouldSeekAgain = false;
    return;
  }

  shouldSeekAgain = false;
  video.currentTime = targetVideoTime;
};

const showCurtainPanels = (
  scrollProgress
) => {
  const curtainProgress =
    getProgressBetween(
      scrollProgress,
      CURTAIN_START_PROGRESS,
      CURTAIN_END_PROGRESS
    );

  curtainPanels.forEach(
    (panel, index) => {
      const panelStart =
        index * CURTAIN_PANEL_STAGGER;

      const panelEnd =
        panelStart +
        CURTAIN_PANEL_DURATION;

      const panelProgress =
        getProgressBetween(
          curtainProgress,
          panelStart,
          panelEnd
        );

      const insetPercentage =
        100 - panelProgress * 100;

        panel.style.maskImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0) ${insetPercentage}%, rgba(0, 0, 0, 1) ${insetPercentage}%)`;

      // panel.style.clipPath =
      //   `inset(${insetPercentage}% 0 0 0)`;
    }
  );
};

// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********

const callbackUpdateSectionFlowers = () => {
  const scrollProgress =
    getScrollProgress();

  showVideoFrame(scrollProgress);
  showCurtainPanels(scrollProgress);
};

const callbackScheduleVideoUpdate = () => {
  if (animationFrameId !== null) {
    return;
  }

  animationFrameId =
    window.requestAnimationFrame(() => {
      animationFrameId = null;

      callbackUpdateSectionFlowers();
    });
};

const callbackHandleVideoLoaded = () => {
  if (isVideoReady) {
    return;
  }

  isVideoReady = true;

  video.pause();

  const scrollProgress =
    getScrollProgress();

  const videoProgress =
    getProgressBetween(
      scrollProgress,
      VIDEO_START_PROGRESS,
      VIDEO_END_PROGRESS
    );

  targetVideoTime =
    videoProgress * getMaximumVideoTime();

  video.currentTime = targetVideoTime;

  showCurtainPanels(scrollProgress);
};

const callbackHandleVideoSeeked = () => {
  const timeDifference = Math.abs(
    targetVideoTime - video.currentTime
  );

  if (
    shouldSeekAgain ||
    timeDifference >=
      MINIMUM_SEEK_DIFFERENCE
  ) {
    callbackScheduleVideoUpdate();
  }
};

const callbackHandleVisibilityChange = () => {
  if (!video) {
    return;
  }

  if (document.hidden) {
    video.pause();
  }
};

// #endregion

// #region ***  Data Access - get___                     ***********

const getClampedValue = (
  value,
  minimum,
  maximum
) => {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
};

const getProgressBetween = (
  progress,
  startProgress,
  endProgress
) => {
  const progressDistance = Math.max(
    endProgress - startProgress,
    Number.EPSILON
  );

  return getClampedValue(
    (
      progress -
      startProgress
    ) /
      progressDistance,
    0,
    1
  );
};

const getMaximumVideoTime = () => {
  if (
    !video ||
    !Number.isFinite(video.duration)
  ) {
    return 0;
  }

  return Math.max(
    video.duration -
      1 / VIDEO_FRAME_RATE,
    0
  );
};

const getScrollProgress = () => {
  const sectionTop =
    section.getBoundingClientRect().top +
    window.scrollY;

  const scrollStart = sectionTop;

  const scrollEnd =
    sectionTop +
    section.offsetHeight -
    window.innerHeight;

  const scrollDistance = Math.max(
    scrollEnd - scrollStart,
    1
  );

  return getClampedValue(
    (
      window.scrollY -
      scrollStart
    ) /
      scrollDistance,
    0,
    1
  );
};

// #endregion

// #region ***  Event Listeners - listenTo___            ***********

const listenToWindowScroll = () => {
  window.addEventListener(
    'scroll',
    callbackScheduleVideoUpdate,
    {
      passive: true,
    }
  );
};

const listenToWindowResize = () => {
  window.addEventListener(
    'resize',
    callbackScheduleVideoUpdate
  );
};

const listenToVideoEvents = () => {
  video.addEventListener(
    'loadeddata',
    callbackHandleVideoLoaded,
    {
      once: true,
    }
  );

  video.addEventListener(
    'seeked',
    callbackHandleVideoSeeked
  );
};

const listenToVisibilityChange = () => {
  document.addEventListener(
    'visibilitychange',
    callbackHandleVisibilityChange
  );
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********

const initSectionFlowers = () => {
  section = document.querySelector(
    '.js-section-flowers'
  );

  if (!section) {
    return;
  }

  video = section.querySelector(
    '.js-section-flowers-video'
  );

  curtainPanels = [
    ...section.querySelectorAll(
      '.js-curtain-panel'
    ),
  ].sort(
    (panelA, panelB) =>
      Number(panelA.dataset.panel) -
      Number(panelB.dataset.panel)
  );

  if (!video || !curtainPanels.length) {
    return;
  }

  video.pause();
  video.muted = true;

  listenToWindowScroll();
  listenToWindowResize();
  listenToVideoEvents();
  listenToVisibilityChange();

  callbackScheduleVideoUpdate();

  if (video.readyState >= 2) {
    callbackHandleVideoLoaded();
  } else {
    video.load();
  }
};

document.addEventListener(
  'DOMContentLoaded',
  initSectionFlowers
);

// #endregion