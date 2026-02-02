"use client";

import { useEffect, useRef } from "react";

const DESKTOP_BREAKPOINT = 1000;

const TrailContainer = () => {
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef<number | null>(null);
  const trailRef = useRef<any[]>([]);
  const currentImageIndexRef = useRef(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const interpolatedMousePosRef = useRef({ x: 0, y: 0 });
  const isDesktopRef = useRef(false);

  useEffect(() => {
    const config = {
      imageLifespan: 1000,
      mouseThreshold: 150,
      inDuration: 750,
      outDuration: 1000,
      staggerIn: 100,
      staggerOut: 25,
      slideDuration: 1000,
      slideEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      easing: "cubic-bezier(0.87, 0, 0.13, 1)",
    };

    const trailImageCount = 6;
    const images = [
      "/Trail/Baruti.png",
      "/Trail/Bepolar.png",
      "/Trail/Headspace.png",
      "/Trail/Hedonik.png",
      "/Trail/Kinetic.png",
      "/Trail/Meo.png",
    ];

    const trailContainer = trailContainerRef.current;
    if (!trailContainer) return;

    isDesktopRef.current = window.innerWidth > DESKTOP_BREAKPOINT;

    const MathUtils = {
      lerp: (a: number, b: number, n: number) => (1 - n) * a + n * b,
      distance: (x1: number, y1: number, x2: number, y2: number) =>
        Math.hypot(x2 - x1, y2 - y1),
    };

    const getMouseDistance = () =>
      MathUtils.distance(
        mousePosRef.current.x,
        mousePosRef.current.y,
        lastMousePosRef.current.x,
        lastMousePosRef.current.y
      );

    const isInTrailContainer = (x: number, y: number) => {
      const rect = trailContainer.getBoundingClientRect();
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    };

    const createTrailImage = () => {
      const imgContainer = document.createElement("div");
      imgContainer.classList.add("intro-trail-img");

      const imgSrc = images[currentImageIndexRef.current];
      currentImageIndexRef.current =
        (currentImageIndexRef.current + 1) % trailImageCount;

      const rect = trailContainer.getBoundingClientRect();
      const startX = interpolatedMousePosRef.current.x - rect.left - 87.5;
      const startY = interpolatedMousePosRef.current.y - rect.top - 87.5;
      const targetX = mousePosRef.current.x - rect.left - 87.5;
      const targetY = mousePosRef.current.y - rect.top - 87.5;

      imgContainer.style.left = `${startX}px`;
      imgContainer.style.top = `${startY}px`;
      imgContainer.style.transition = `left ${config.slideDuration}ms ${config.slideEasing}, top ${config.slideDuration}ms ${config.slideEasing}`;

      const maskLayers: HTMLDivElement[] = [];
      const imageLayers: HTMLDivElement[] = [];
      for (let i = 0; i < 10; i++) {
        const layer = document.createElement("div");
        layer.classList.add("intro-trail-mask-layer");

        const imageLayer = document.createElement("div");
        imageLayer.classList.add("intro-trail-image-layer");
        imageLayer.style.backgroundImage = `url(${imgSrc})`;

        const startY = i * 10;
        const endY = (i + 1) * 10;

        layer.style.clipPath = `polygon(50% ${startY}%, 50% ${startY}%, 50% ${endY}%, 50% ${endY}%)`;
        layer.style.transition = `clip-path ${config.inDuration}ms ${config.easing}`;
        layer.style.transform = "translateZ(0)";
        layer.style.backfaceVisibility = "hidden";

        layer.appendChild(imageLayer);
        imgContainer.appendChild(layer);
        maskLayers.push(layer);
        imageLayers.push(imageLayer);
      }

      trailContainer.appendChild(imgContainer);

      requestAnimationFrame(() => {
        imgContainer.style.left = `${targetX}px`;
        imgContainer.style.top = `${targetY}px`;

        maskLayers.forEach((layer, i) => {
          const startY = i * 10;
          const endY = (i + 1) * 10;
          const distanceFromMiddle = Math.abs(i - 4.5);
          const delay = distanceFromMiddle * config.staggerIn;

          setTimeout(() => {
            layer.style.clipPath = `polygon(0% ${startY}%, 100% ${startY}%, 100% ${endY}%, 0% ${endY}%)`;
          }, delay);
        });
      });

      trailRef.current.push({
        element: imgContainer,
        maskLayers: maskLayers,
        imageLayers: imageLayers,
        removeTime: Date.now() + config.imageLifespan,
      });
    };

    const removeOldImages = () => {
      const now = Date.now();
      if (trailRef.current.length === 0) return;

      const oldestImage = trailRef.current[0];
      if (now >= oldestImage.removeTime) {
        const imgToRemove = trailRef.current.shift();
        if (!imgToRemove) return;

        imgToRemove.maskLayers.forEach((layer: HTMLDivElement, i: number) => {
          const startY = i * 10;
          const endY = (i + 1) * 10;
          const distanceFromEdge = 4.5 - Math.abs(i - 4.5);
          const delay = distanceFromEdge * config.staggerOut;

          layer.style.transition = `clip-path ${config.outDuration}ms ${config.easing}`;

          setTimeout(() => {
            layer.style.clipPath = `polygon(50% ${startY}%, 50% ${startY}%, 50% ${endY}%, 50% ${endY}%)`;
          }, delay);
        });

        imgToRemove.imageLayers.forEach((imageLayer: HTMLDivElement) => {
          imageLayer.style.transition = `opacity ${config.outDuration}ms ${config.easing}`;
          imageLayer.style.opacity = "0.25";
        });

        setTimeout(() => {
          if (imgToRemove.element.parentNode) {
            imgToRemove.element.parentNode.removeChild(imgToRemove.element);
          }
        }, config.outDuration + 112);
      }
    };

    const render = () => {
      if (isDesktopRef.current) {
        const distance = getMouseDistance();
        interpolatedMousePosRef.current.x = MathUtils.lerp(
          interpolatedMousePosRef.current.x || mousePosRef.current.x,
          mousePosRef.current.x,
          0.1
        );
        interpolatedMousePosRef.current.y = MathUtils.lerp(
          interpolatedMousePosRef.current.y || mousePosRef.current.y,
          mousePosRef.current.y,
          0.1
        );
        if (
          distance > config.mouseThreshold &&
          isInTrailContainer(mousePosRef.current.x, mousePosRef.current.y)
        ) {
          createTrailImage();
          lastMousePosRef.current = { ...mousePosRef.current };
        }
      }
      removeOldImages();
      animationStateRef.current = requestAnimationFrame(render);
    };

    const createTrailImageAtPosition = (clientX: number, clientY: number) => {
      if (!isInTrailContainer(clientX, clientY)) return;
      mousePosRef.current = { x: clientX, y: clientY };
      interpolatedMousePosRef.current = { x: clientX, y: clientY };
      lastMousePosRef.current = { x: clientX, y: clientY };
      createTrailImage();
    };

    const startAnimation = () => {
      if (!isDesktopRef.current) return;
      const handleMouseMove = (e: MouseEvent) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      };
      document.addEventListener("mousemove", handleMouseMove);
      animationStateRef.current = requestAnimationFrame(render);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
      };
    };

    let removeTouchListeners: (() => void) | null = null;
    const startMobileTap = () => {
      if (isDesktopRef.current) return;
      const handleTap = (e: MouseEvent | TouchEvent) => {
        let x: number, y: number;
        if ("changedTouches" in e && e.changedTouches?.length) {
          x = e.changedTouches[0].clientX;
          y = e.changedTouches[0].clientY;
        } else if ("clientX" in e) {
          x = e.clientX;
          y = e.clientY;
        } else return;
        createTrailImageAtPosition(x, y);
      };
      const isTouch = "ontouchstart" in window;
      if (isTouch) {
        trailContainer.addEventListener("touchend", handleTap, { passive: true });
        removeTouchListeners = () => trailContainer.removeEventListener("touchend", handleTap);
      } else {
        trailContainer.addEventListener("click", handleTap);
        removeTouchListeners = () => trailContainer.removeEventListener("click", handleTap);
      }
      animationStateRef.current = requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      if (animationStateRef.current) {
        cancelAnimationFrame(animationStateRef.current);
        animationStateRef.current = null;
      }

      trailRef.current.forEach((item) => {
        if (item.element.parentNode) {
          item.element.parentNode.removeChild(item.element);
        }
      });
      trailRef.current.length = 0;
    };

    const handleResize = () => {
      const wasDesktop = isDesktopRef.current;
      isDesktopRef.current = window.innerWidth > DESKTOP_BREAKPOINT;

      if (isDesktopRef.current && !wasDesktop) {
        if (removeTouchListeners) {
          removeTouchListeners();
          removeTouchListeners = null;
        }
        cleanUpMouseListener = startAnimation();
      } else if (!isDesktopRef.current && wasDesktop) {
        stopAnimation();
        if (cleanUpMouseListener) {
          cleanUpMouseListener();
          cleanUpMouseListener = null;
        }
        startMobileTap();
      }
    };

    let cleanUpMouseListener: (() => void) | null | undefined = null;

    window.addEventListener("resize", handleResize);

    if (isDesktopRef.current) {
      cleanUpMouseListener = startAnimation();
    } else {
      startMobileTap();
    }

    return () => {
      stopAnimation();
      if (cleanUpMouseListener) cleanUpMouseListener();
      if (removeTouchListeners) removeTouchListeners();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div ref={trailContainerRef} className="intro-trail-container"></div>;
};

export default TrailContainer;
