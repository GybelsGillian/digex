import * as THREE from 'three';

const DEV_MODE = false;

// #region ***  DOM references                           ***********

const section = document.querySelector('.js-section-motiondesign');
const stage = document.querySelector('#stage');

const cardItems = [];
const ribbonBorderItems = [];
let scrollAnimationFrameId = null;

// #endregion

// #region ***  Callback-Visualisation - show___         ***********

const showMotionDesign = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(showMotionDesign);
};

const showCardPositions = scrollProgress => {
    const progressOffset =
        (scrollProgress * 2 - 1) * cardScrollHalfDistance;

    cardItems.forEach(cardItem => {
        const { geometry, localPositions, baseProgress } = cardItem;
        const cardPosition = geometry.attributes.position;
        const centerProgress = baseProgress + progressOffset;

        for (let i = 0; i < cardPosition.count; i++) {
            const vertexIndex = i * 3;
            const localX = localPositions[vertexIndex];
            const localY = localPositions[vertexIndex + 1];
            const progress = centerProgress + localX / curveLength;
            const point = getPoint(progress, localY, 8);

            cardPosition.setXYZ(i, point.x, point.y, point.z);
        }

        cardPosition.needsUpdate = true;
    });
};

const showRibbonBorderPositions = scrollProgress => {
    const centerProgress =
        1 +
        ribbonBorderHalfProgress -
        scrollProgress * (1 + ribbonBorderHalfProgress * 2);

    ribbonBorderItems.forEach(borderItem => {
        const { geometry, localPositions, offsetY } = borderItem;
        const position = geometry.attributes.position;

        for (let i = 0; i < position.count; i++) {
            const vertexIndex = i * 3;
            const localX = localPositions[vertexIndex];
            const localY = localPositions[vertexIndex + 1];
            const progress = centerProgress + localX / curveLength;
            const point = getPoint(progress, localY + offsetY);

            position.setXYZ(i, point.x, point.y, point.z);
        }

        position.needsUpdate = true;
    });
};

// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********

const callbackResizeMotionDesign = () => {
    const { width, height } = getStageSize();

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    camera.position.z = getCameraDistance(camera.aspect);

    renderer.setSize(width, height);
    callbackScheduleMotionDesignUpdate();
};

const callbackUpdateMotionDesign = () => {
    const scrollProgress = getScrollProgress();

    showCardPositions(scrollProgress);
    showRibbonBorderPositions(scrollProgress);
};

const callbackScheduleMotionDesignUpdate = () => {
    if (scrollAnimationFrameId !== null) {
        return;
    }

    scrollAnimationFrameId = window.requestAnimationFrame(() => {
        scrollAnimationFrameId = null;
        callbackUpdateMotionDesign();
    });
};

const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const createCardTexture = text => {
    const canvas = document.createElement('canvas');
    const { textureWidth, textureHeight, textureScale } =
        motionDesignConfig.card;

    canvas.width = textureWidth * textureScale;
    canvas.height = textureHeight * textureScale;

    const ctx = canvas.getContext('2d');
    ctx.scale(textureScale, textureScale);
    ctx.clearRect(0, 0, textureWidth, textureHeight);

    ctx.fillStyle = '#f4f1ea';
    roundRect(ctx, 0, 0, textureWidth, textureHeight, 30);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.font = '800 92px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textureWidth / 2, textureHeight / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    return texture;
};

const createCurvedCard = (centerProgress, text) => {
    const { length, height, widthSegments, heightSegments } =
        motionDesignConfig.card;
    const cardGeometry = new THREE.PlaneGeometry(
        length,
        height,
        widthSegments,
        heightSegments,
    );
    const cardPosition = cardGeometry.attributes.position;
    const localPositions = cardPosition.array.slice();

    for (let i = 0; i < cardPosition.count; i++) {
        const localX = cardPosition.getX(i);
        const localY = cardPosition.getY(i);
        const progress = centerProgress + localX / curveLength;
        const point = getPoint(progress, localY, 8);

        cardPosition.setXYZ(i, point.x, point.y, point.z);
    }

    cardGeometry.computeVertexNormals();

    const cardMaterial = new THREE.MeshBasicMaterial({
        map: createCardTexture(text),
        transparent: true,
        alphaTest: 0.01,
        depthTest: true,
        depthWrite: true,
        side: THREE.DoubleSide,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.frustumCulled = false;
    card.renderOrder = 1;
    group.add(card);

    cardItems.push({
        geometry: cardGeometry,
        localPositions,
        baseProgress: centerProgress,
    });
};

// #endregion

// #region ***  Data Access - get___                     ***********

const motionDesignConfig = {
    camera: {
        fieldOfView: 50.4,
        desktopDistance: 1450,
        referenceAspect: 16 / 9,
    },
    ribbon: {
        borderWidth: 1,
        borderLength: 2744,
        cardBorderGap: 32,
        borderColor: 0xe60012,
        radius: 760,
        turns: 2.65,
        verticalSpread: 2157.42,
        widthSegments: 220,
        heightSegments: 24,
    },
    card: {
        length: 260,
        height: 240,
        widthSegments: 50,
        heightSegments: 12,
        textureWidth: 640,
        textureHeight: 420,
        textureScale: 2,
    },
};

const { radius, turns, verticalSpread } = motionDesignConfig.ribbon;
const centerProgress = 0.5;
const startAngle = -centerProgress * Math.PI * 2 * turns;
const curveLength = Math.hypot(Math.PI * 2 * turns * radius, verticalSpread);
const ribbonBorderOffset =
    motionDesignConfig.card.height / 2 +
    motionDesignConfig.ribbon.cardBorderGap +
    motionDesignConfig.ribbon.borderWidth / 2;
const ribbonWidth = ribbonBorderOffset * 2;

const CARD_GAP = 16;
const CARD_LABELS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
const cardProgressStep =
    (motionDesignConfig.card.length + CARD_GAP) / curveLength;
const cardCenterIndex = (CARD_LABELS.length - 1) / 2;
const CARD_DATA = CARD_LABELS.map((text, index) => ({
    progress:
        centerProgress + (index - cardCenterIndex) * cardProgressStep,
    text,
}));
const ribbonBorderLength = motionDesignConfig.ribbon.borderLength;
const ribbonBorderHalfProgress = ribbonBorderLength / 2 / curveLength;

const CARD_PATH_OVERSCAN =
    motionDesignConfig.card.length / 2 / curveLength;
const firstCardProgress = CARD_DATA[0].progress;
const lastCardProgress = CARD_DATA[CARD_DATA.length - 1].progress;
const cardScrollHalfDistance = Math.max(
    lastCardProgress + CARD_PATH_OVERSCAN,
    1 + CARD_PATH_OVERSCAN - firstCardProgress,
);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    motionDesignConfig.camera.fieldOfView,
    1,
    1,
    5000,
);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const group = new THREE.Group();

const getStageSize = () => ({
    width: Math.max(stage.clientWidth, 1),
    height: Math.max(stage.clientHeight, 1),
});

const getCameraDistance = aspect => {
    const { desktopDistance, referenceAspect } = motionDesignConfig.camera;

    return aspect < referenceAspect
        ? desktopDistance * (referenceAspect / aspect)
        : desktopDistance;
};

const getPoint = (progress, offsetY = 0, offsetZ = 0) => {
    const angle = startAngle + progress * Math.PI * 2 * turns;
    const x = Math.sin(angle) * (radius + offsetZ);
    const z = Math.cos(angle) * (radius + offsetZ);
    const y = (progress - 0.5) * verticalSpread + offsetY;

    return { x, y, z, angle };
};

const getClampedValue = (value, minimum, maximum) => {
    return Math.min(Math.max(value, minimum), maximum);
};

const getScrollProgress = () => {
    const sectionTop =
        section.getBoundingClientRect().top + window.scrollY;
    const scrollStart = sectionTop;
    const scrollEnd =
        sectionTop + section.offsetHeight - window.innerHeight;
    const scrollDistance = Math.max(scrollEnd - scrollStart, 1);

    return getClampedValue(
        (window.scrollY - scrollStart) / scrollDistance,
        0,
        1,
    );
};


const createRibbonStripGeometry = (
    width,
    offsetY = 0,
    heightSegments = 1,
) => {
    const geometry = new THREE.PlaneGeometry(
        curveLength,
        width,
        motionDesignConfig.ribbon.widthSegments,
        heightSegments,
    );
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
        const localX = position.getX(i);
        const localY = position.getY(i);
        const progress = localX / curveLength + 0.5;
        const point = getPoint(progress, localY + offsetY);

        position.setXYZ(i, point.x, point.y, point.z);
    }

    geometry.computeVertexNormals();

    return geometry;
};

const ribbonGeometry = createRibbonStripGeometry(
    ribbonWidth,
    0,
    motionDesignConfig.ribbon.heightSegments,
);

const ribbonMaterial = new THREE.MeshBasicMaterial({
    color: 0xe60012,
    depthWrite: false,
    side: THREE.DoubleSide,
});
const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
ribbon.visible = DEV_MODE;

const ribbonBorderMaterial = new THREE.MeshBasicMaterial({
    color: motionDesignConfig.ribbon.borderColor,
    side: THREE.DoubleSide,
});

const createMovingRibbonBorder = offsetY => {
    const borderSegments = Math.max(
        Math.ceil(
            motionDesignConfig.ribbon.widthSegments *
            (ribbonBorderLength / curveLength),
        ),
        1,
    );
    const geometry = new THREE.PlaneGeometry(
        ribbonBorderLength,
        motionDesignConfig.ribbon.borderWidth,
        borderSegments,
        1,
    );
    const localPositions = geometry.attributes.position.array.slice();
    const border = new THREE.Mesh(geometry, ribbonBorderMaterial);

    border.frustumCulled = false;
    ribbonBorderItems.push({ geometry, localPositions, offsetY });

    return border;
};

const ribbonBorderTop = createMovingRibbonBorder(ribbonBorderOffset);
const ribbonBorderBottom = createMovingRibbonBorder(-ribbonBorderOffset);

// #endregion

// #region ***  Event Listeners - listenTo___            ***********

const listenToResizeMotionDesign = () => {
    window.addEventListener('resize', callbackResizeMotionDesign);
};

const listenToScrollMotionDesign = () => {
    window.addEventListener('scroll', callbackScheduleMotionDesignUpdate, {
        passive: true,
    });
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********

const initMotionDesign = () => {
    if (!section || !stage) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);

    callbackResizeMotionDesign();

    scene.add(group);
    group.add(ribbon);
    group.add(ribbonBorderTop, ribbonBorderBottom);

    CARD_DATA.forEach(({ progress, text }) => {
        createCurvedCard(progress, text);
    });

    group.rotation.set(0, 0, 0);
    group.position.x = 20;

    listenToResizeMotionDesign();
    listenToScrollMotionDesign();
    callbackScheduleMotionDesignUpdate();
    showMotionDesign();
};

document.addEventListener('DOMContentLoaded', initMotionDesign);

// #endregion