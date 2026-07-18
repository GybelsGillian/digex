// #region ***  Callback-Visualisation - show___         ***********

const showCurtainPanel = (
  panel,
  progress,
  effect,
  startPercentage,
  endPercentage,
  maskDirection,
  hiddenColor,
  visibleColor
) => {
  const percentage =
    startPercentage +
    progress *
      (
        endPercentage -
        startPercentage
      );

  if (effect === 'clip') {
    panel.style.clipPath =
      `inset(${percentage}% 0 0 0)`;

    return;
  }

  const maskImage =
    `linear-gradient(${maskDirection}, ${hiddenColor} ${percentage}%, ${visibleColor} ${percentage}%)`;

  panel.style.maskImage = maskImage;
  panel.style.webkitMaskImage = maskImage;
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

const getCurtainPanels = (
  root,
  panelSelector,
  panelOrderAttribute
) => {
  return [
    ...root.querySelectorAll(
      panelSelector
    ),
  ].sort(
    (panelA, panelB) => {
      const orderA = Number(
        panelA.dataset[
          panelOrderAttribute
        ]
      );

      const orderB = Number(
        panelB.dataset[
          panelOrderAttribute
        ]
      );

      return orderA - orderB;
    }
  );
};

// #endregion

// #region ***  Export                                   ***********

const createCurtainAnimation = ({
  root,
  panelSelector =
    '.js-curtain-panel',
  panelOrderAttribute = 'panel',
  startProgress = 0,
  endProgress = 1,
  panelDuration = 0.5,
  panelStagger = 0.125,
  startPercentage = 100,
  endPercentage = 0,
  effect = 'mask',
  maskDirection = 'to bottom',
  hiddenColor =
    'rgba(0, 0, 0, 0)',
  visibleColor =
    'rgba(0, 0, 0, 1)',
  easing = (progress) => progress,
} = {}) => {
  if (!root) {
    return null;
  }

  const panels = getCurtainPanels(
    root,
    panelSelector,
    panelOrderAttribute
  );

  if (!panels.length) {
    return null;
  }

  panels.forEach((panel) => {
    if (effect === 'mask') {
      panel.style.clipPath = 'none';
    } else {
      panel.style.maskImage = 'none';
      panel.style.webkitMaskImage =
        'none';
    }
  });

  const update = (progress) => {
    const curtainProgress =
      getProgressBetween(
        progress,
        startProgress,
        endProgress
      );

    panels.forEach(
      (panel, index) => {
        const panelStart =
          index * panelStagger;

        const panelEnd =
          panelStart +
          panelDuration;

        const panelProgress =
          getProgressBetween(
            curtainProgress,
            panelStart,
            panelEnd
          );

        const easedProgress =
          easing(panelProgress);

        showCurtainPanel(
          panel,
          easedProgress,
          effect,
          startPercentage,
          endPercentage,
          maskDirection,
          hiddenColor,
          visibleColor
        );
      }
    );
  };

  return {
    update,
    panels,
  };
};

export {
  createCurtainAnimation,
};

// #endregion