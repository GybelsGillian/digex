// #region ***  Callback-Visualisation - show___         ***********

const showCurtainPanel = (panel, progress, effect, startPercentage, endPercentage, maskDirection, hiddenColor, visibleColor) => {
  const percentage = startPercentage + progress * (endPercentage - startPercentage);

  if (effect === 'clip') {
    panel.style.clipPath = `inset(${percentage}% 0 0 0)`;
    return;
  }

  const maskImage = `linear-gradient(${maskDirection}, ${hiddenColor} ${percentage}%, ${visibleColor} ${percentage}%)`;

  panel.style.maskImage = maskImage;
  panel.style.webkitMaskImage = maskImage;
};

const showCurtainTargetMask = (target, panelProgresses, maskDirection, maskAction, hiddenColor, visibleColor) => {
  const panelCount = panelProgresses.length;
  const maskStops = [];

  panelProgresses.forEach((progress, index) => {
    const panelStart = index / panelCount * 100;
    const panelEnd = (index + 1) / panelCount * 100;
    const breakpoint = panelStart + progress * (panelEnd - panelStart);

    if (maskAction === 'reveal') {
      maskStops.push(
        `${visibleColor} ${panelStart}%`,
        `${visibleColor} ${breakpoint}%`,
        `${hiddenColor} ${breakpoint}%`,
        `${hiddenColor} ${panelEnd}%`
      );

      return;
    }

    maskStops.push(
      `${hiddenColor} ${panelStart}%`,
      `${hiddenColor} ${breakpoint}%`,
      `${visibleColor} ${breakpoint}%`,
      `${visibleColor} ${panelEnd}%`
    );
  });

  const maskImage = `linear-gradient(${maskDirection}, ${maskStops.join(', ')})`;

  target.style.maskImage = maskImage;
  target.style.webkitMaskImage = maskImage;
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

const getCurtainPanels = (root, panelSelector, panelOrderAttribute) => {
  return [...root.querySelectorAll(panelSelector)].sort((panelA, panelB) => {
    return Number(panelA.dataset[panelOrderAttribute]) - Number(panelB.dataset[panelOrderAttribute]);
  });
};

const getCurtainPanelProgresses = (curtainProgress, panelCount, panelDuration, panelStagger, reverse, easing) => {
  const panelProgresses = new Array(panelCount).fill(0);

  for (let index = 0; index < panelCount; index += 1) {
    const panelStart = index * panelStagger;
    const panelEnd = panelStart + panelDuration;
    const panelProgress = getProgressBetween(curtainProgress, panelStart, panelEnd);
    const panelIndex = reverse ? panelCount - 1 - index : index;

    panelProgresses[panelIndex] = easing(panelProgress);
  }

  return panelProgresses;
};

// #endregion

// #region ***  Export                                   ***********

const createCurtainAnimation = ({
  type = 'panels',
  root = null,
  target = null,
  panelSelector = '.js-curtain-panel',
  panelOrderAttribute = 'panel',
  panelCount = 5,
  startProgress = 0,
  endProgress = 1,
  panelDuration = 0.5,
  panelStagger = 0.125,
  startPercentage = 100,
  endPercentage = 0,
  effect = 'mask',
  maskDirection = 'to bottom',
  maskAction = 'hide',
  hiddenColor = 'rgba(0, 0, 0, 0)',
  visibleColor = 'rgba(0, 0, 0, 1)',
  reverse = false,
  easing = (progress) => progress,
} = {}) => {
  const panels = type === 'panels' && root ? getCurtainPanels(root, panelSelector, panelOrderAttribute) : [];

  if (type === 'panels' && !panels.length) {
    return null;
  }

  if (type === 'target-mask' && !target) {
    return null;
  }

  const update = (progress) => {
    const curtainProgress = getProgressBetween(progress, startProgress, endProgress);

    if (type === 'target-mask') {
      const panelProgresses = getCurtainPanelProgresses(
        curtainProgress,
        panelCount,
        panelDuration,
        panelStagger,
        reverse,
        easing
      );

      showCurtainTargetMask(
        target,
        panelProgresses,
        maskDirection,
        maskAction,
        hiddenColor,
        visibleColor
      );

      return;
    }

    panels.forEach((panel, index) => {
      const panelStart = index * panelStagger;
      const panelEnd = panelStart + panelDuration;
      const panelProgress = getProgressBetween(curtainProgress, panelStart, panelEnd);

      showCurtainPanel(
        panel,
        easing(panelProgress),
        effect,
        startPercentage,
        endPercentage,
        maskDirection,
        hiddenColor,
        visibleColor
      );
    });
  };

  update(0);

  return {
    update,
    panels,
    target,
  };
};

export { createCurtainAnimation };

// #endregion