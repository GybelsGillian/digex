			const section = document.getElementById("sequenceSection");
const canvas = document.getElementById("sequenceCanvas");

const ctx = canvas.getContext("2d", {
alpha: true,
desynchronized: true
});

const frameStart = 1000;
const frameEnd = 1320;
const frameCount = frameEnd - frameStart + 1;

const folder = "/assets/sequence-webp-hq";
const fileBase = "three-realistic-flowers-growing-with-alpha-channel-2026-02-18-08-05-49-utc_";

const imageCache = new Map();
const loadingImages = new Set();

let currentFrame = 0;
let targetFrame = 0;
let lastDrawnIndex = -1;
let animationStarted = false;

let previousTargetFrameForVelocity = 0;
let previousVelocityTime = performance.now();

let scrollVelocity = 0;
let instantScrollVelocity = 0;

/*
          Meer cache = minder opnieuw laden.
          Lager = minder RAM.
          90-130 is meestal oké voor jouw case.
        */
const maxCachedImages = 110;

function clamp(value, min, max) {
return Math.min(Math.max(value, min), max);
}

function getFrameNumber(index) {
return frameStart + index;
}

function getFramePath(index) {
const frameNumber = getFrameNumber(index);
return `${folder}/${fileBase}${frameNumber}.webp`;
}

function resizeCanvas() {
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const { width, height } = canvas.getBoundingClientRect();

canvas.width = Math.floor(width * dpr);
canvas.height = Math.floor(height * dpr);

// canvas.style.width = window.innerWidth + "px";
// canvas.style.height = window.innerHeight + "px";

ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

drawFrame(Math.round(currentFrame));
}

function drawImageAtFullHeight(img) {
const { width: canvasWidth, height: canvasHeight } = canvas.getBoundingClientRect();
const drawHeight = canvasHeight;
const drawWidth = drawHeight * (img.naturalWidth / img.naturalHeight);
const x = (canvasWidth - drawWidth) / 2;

ctx.clearRect(0, 0, canvasWidth, canvasHeight);
ctx.drawImage(img, x, 0, drawWidth, drawHeight);
}

function findClosestLoadedIndex(index) {
const safeIndex = clamp(index, 0, frameCount - 1);

if (imageCache.has(safeIndex)) {
return safeIndex;
}

for (let offset = 1; offset <= 45; offset++) {
const before = safeIndex - offset;
const after = safeIndex + offset;

if (imageCache.has(before)) 
return before;



if (imageCache.has(after)) 
return after;



}

if (lastDrawnIndex !== -1 && imageCache.has(lastDrawnIndex)) {
return lastDrawnIndex;
}

return null;
}

function drawFrame(index) {
const safeIndex = clamp(index, 0, frameCount - 1);
const drawableIndex = findClosestLoadedIndex(safeIndex);

if (drawableIndex === null) 
return;



const img = imageCache.get(drawableIndex);

if (! img || ! img.complete || img.naturalWidth === 0) 
return;



drawImageAtFullHeight(img);
lastDrawnIndex = drawableIndex;
}

function loadImage(index) {
const safeIndex = clamp(index, 0, frameCount - 1);

if (imageCache.has(safeIndex)) 
return;



if (loadingImages.has(safeIndex)) 
return;



loadingImages.add(safeIndex);

const img = new Image();
img.decoding = "async";
img.src = getFramePath(safeIndex);

img.onload = () => {
loadingImages.delete(safeIndex);
imageCache.set(safeIndex, img);

trimCache(Math.round(currentFrame));

if (! animationStarted && safeIndex === 0) {
animationStarted = true;
resizeCanvas();
drawFrame(0);
animate();
}
};

img.onerror = () => {
loadingImages.delete(safeIndex);
console.warn("Kon frame niet laden:", img.src);
};
}

function getScrollProgress() {
const sectionTop = section.offsetTop;
const sectionHeight = section.offsetHeight;
const scrollY = window.scrollY;

const scrollStart = sectionTop;
const scrollEnd = sectionTop + sectionHeight - window.innerHeight;

return clamp((scrollY - scrollStart) / (scrollEnd - scrollStart), 0, 1);
}

function updateTargetFrame() {
const progress = getScrollProgress();
targetFrame = progress * (frameCount - 1);
}

function updateScrollVelocity() {
const now = performance.now();

/*
              Delta time in seconden.
            */
const deltaTime = Math.max((now - previousVelocityTime) / 1000, 1 / 60);

/*
              Hoeveel frames ben je opgeschoven sinds vorige tick?
            */
const frameDelta = Math.abs(targetFrame - previousTargetFrameForVelocity);

/*
              Velocity in frames per seconde.
              Dit is beter dan pixels per millisecond,
              want jouw animatie bestaat uit frames.
            */
instantScrollVelocity = frameDelta / deltaTime;

/*
              Sneller omhoog wanneer je versnelt.
              Nog sneller omlaag wanneer je vertraagt.
              Zo blijft step 4/8 niet hangen.
            */
if (instantScrollVelocity > scrollVelocity) {
scrollVelocity = scrollVelocity * 0.35 + instantScrollVelocity * 0.65;
} else {
scrollVelocity = scrollVelocity * 0.18 + instantScrollVelocity * 0.82;
} previousTargetFrameForVelocity = targetFrame;
previousVelocityTime = now;
}

function getAdaptivePreloadStep() { /*
              Belangrijk:
              Bij traag/normaal scrollen ALTIJD step 1.
              Dus elk frame blijft mogelijk.
            */

if (instantScrollVelocity < 45) {
return 1;
}

/*
              Alleen bij echt hard scrollen grover preloaden.
            */
if (scrollVelocity > 200) {
return 8;
}

if (scrollVelocity > 90) {
return 4;
}

return 1;
}

function getPreloadRadius(step) { /*
              Bij step 1 laden we veel fijne frames dichtbij.
              Bij step 4/8 laden we verder vooruit/achteruit,
              maar met grotere sprongen.
            */
if (step === 1) 
return 34;



if (step === 4) 
return 64;



if (step === 8) 
return 96;



return 34;
}

function preloadAround(index, step) {
const center = clamp(index, 0, frameCount - 1);
const radius = getPreloadRadius(step);

const start = clamp(center - radius, 0, frameCount - 1);
const end = clamp(center + radius, 0, frameCount - 1);

/*
              Bij snel scrollen laden we grover:
              step 4 = 1000, 1004, 1008...
              step 8 = 1000, 1008, 1016...
            */
let first = Math.ceil(start / step) * step;

for (let i = first; i <= end; i += step) {
loadImage(i);
}

/*
              Super belangrijk:
              de exacte huidige frame altijd proberen laden.
              Dus ook als step 8 is.
            */
loadImage(center);

/*
              Bij normale/tragere scroll direct fijne frames rond de positie laden.
            */
if (step === 1) {
for (let i = center - 12; i <= center + 12; i++) {
if (i >= 0 && i < frameCount) {
loadImage(i);
}
}
}
}

function trimCache(centerIndex) {
if (imageCache.size<= maxCachedImages) return;

            const keys = Array.from(imageCache.keys());

            keys.sort((a, b) => {
return Math.abs(b - centerIndex) - Math.abs(a - centerIndex);
}) 


while (imageCache.size > maxCachedImages && keys.length) {
const farthestKey = keys.shift();

if (farthestKey !== lastDrawnIndex) {
imageCache.delete(farthestKey);
}
}



}

function animate() {
updateTargetFrame();
updateScrollVelocity();

const adaptiveStep = getAdaptivePreloadStep();

/*
              Bij snel scrollen mag hij directer volgen.
              Bij traag scrollen blijft het smooth.
            */
let smoothness;

if (adaptiveStep === 8) {
smoothness = 0.42;
} else if (adaptiveStep === 4) {
smoothness = 0.32;
} else {
smoothness = 0.18;
} currentFrame += (targetFrame - currentFrame) * smoothness;

const roundedFrame = Math.round(currentFrame);

preloadAround(roundedFrame, adaptiveStep);

/*
              We tekenen altijd de echte huidige frame.
              Niet quantizen naar step 4 of step 8.
              Step is alleen voor preload.
            */
drawFrame(roundedFrame);

trimCache(roundedFrame);

requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);

/*
          Eerste frame laden en starten.
        */
loadImage(0);
preloadAround(0, 1);