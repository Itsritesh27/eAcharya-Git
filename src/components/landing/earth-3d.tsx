"use client";

import { useEffect, useRef, useState } from "react";
import { GlobeIllustration } from "./globe-illustration";

/**
 * Interactive 3D Earth (three.js). Auto-rotates, drag to spin.
 * Rendering is paused off-screen and in hidden tabs. Reduced-motion users get
 * a still globe that redraws only when they interact with it.
 */
export function Earth3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let disposers: Array<() => void> = [];
    const cleanupResources = () => {
      const pending = disposers;
      disposers = [];
      for (const dispose of pending.reverse()) {
        try {
          dispose();
        } catch {
          // Cleanup should continue if one WebGL resource is already disposed.
        }
      }
    };

    (async () => {
      try {
        // Phones, Data Saver and low-memory devices get the lightweight SVG globe: it skips the
        // ~600 KB three.js bundle, the 280 KB texture and continuous WebGL rendering.
        const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
        const lightweight =
          window.matchMedia("(max-width: 767px)").matches ||
          nav.connection?.saveData === true ||
          (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);
        if (lightweight) {
          if (!disposed) setFailed(true);
          return;
        }

        // Let the page become interactive first; the globe is decorative, so
        // its ~600 KB of three.js must not compete with content for the main thread.
        await new Promise<void>((resolve) => {
          const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
          if (w.requestIdleCallback) w.requestIdleCallback(() => resolve(), { timeout: 2500 });
          else setTimeout(resolve, 800);
        });
        if (disposed) return;
        const THREE = await import("three");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // Cap GPU work on high-DPI displays; the hero globe does not need a 2x buffer.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);
        const el = renderer.domElement;
        el.style.touchAction = "pan-y";
        el.style.cursor = "grab";
        disposers.push(() => renderer.dispose(), () => el.remove());

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.z = 5.2;

        const sun = new THREE.DirectionalLight(0xffffff, 2.6);
        sun.position.set(-3, 2, 4);
        scene.add(sun, new THREE.AmbientLight(0x6f8fb0, 0.9));

        // A 2K equirectangular texture is already higher-resolution than this
        // 460-520px display at the capped renderer DPR, on desktop and mobile.
        const tex = await new THREE.TextureLoader().loadAsync("/textures/earth-2k.webp");
        if (disposed) {
          tex.dispose();
          return;
        }
        disposers.push(() => tex.dispose());
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

        const earthGeometry = new THREE.SphereGeometry(1.5, 56, 56);
        const earthMaterial = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.85,
          metalness: 0,
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.rotation.z = THREE.MathUtils.degToRad(23.4); // axial tilt
        const spin = new THREE.Group();
        spin.add(earth);
        scene.add(spin);
        disposers.push(() => earthGeometry.dispose(), () => earthMaterial.dispose());

        // Soft atmosphere rim
        const atmosphereGeometry = new THREE.SphereGeometry(1.5 * 1.045, 48, 48);
        const atmosphereMaterial = new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.BackSide,
          blending: THREE.NormalBlending,
          depthWrite: false,
          vertexShader:
            "varying vec3 n; void main(){ n = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
          fragmentShader:
            "varying vec3 n; void main(){ float i = pow(0.72 - dot(n, vec3(0.,0.,1.)), 3.0); gl_FragColor = vec4(0.30,0.62,0.95, clamp(i,0.0,1.0)*0.75); }",
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
        disposers.push(() => atmosphereGeometry.dispose(), () => atmosphereMaterial.dispose());

        const resize = () => {
          const size = Math.max(1, mount.clientWidth);
          renderer.setSize(size, size);
          renderer.render(scene, camera);
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        disposers.push(() => resizeObserver.disconnect());

        let dragging = false;
        let lastX = 0;
        let velocity = 0;
        let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let inViewport = false;
        let pageVisible = document.visibilityState === "visible";
        let raf = 0;

        const stopAnimation = () => {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        };

        const tick = () => {
          raf = 0;
          if (disposed || !inViewport || !pageVisible) return;

          if (!dragging && !reducedMotion) {
            velocity *= 0.95;
            spin.rotation.y += velocity + 0.0018;
          }
          renderer.render(scene, camera);

          // Reduced-motion users only render in response to interaction/resize.
          if (!reducedMotion) raf = requestAnimationFrame(tick);
        };

        const requestRender = () => {
          if (disposed || !inViewport || !pageVisible || raf) return;
          raf = requestAnimationFrame(tick);
        };

        const restartForCurrentState = () => {
          stopAnimation();
          requestRender();
        };

        const down = (event: PointerEvent) => {
          dragging = true;
          lastX = event.clientX;
          el.setPointerCapture(event.pointerId);
          el.style.cursor = "grabbing";
        };
        const move = (event: PointerEvent) => {
          if (!dragging) return;
          velocity = (event.clientX - lastX) * 0.006;
          spin.rotation.y += velocity;
          lastX = event.clientX;
          requestRender();
        };
        const up = () => {
          dragging = false;
          el.style.cursor = "grab";
          requestRender();
        };
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        disposers.push(() => {
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
        });

        const intersectionObserver = new IntersectionObserver(([entry]) => {
          inViewport = entry?.isIntersecting ?? false;
          if (inViewport) restartForCurrentState();
          else stopAnimation();
        });
        intersectionObserver.observe(mount);
        disposers.push(() => intersectionObserver.disconnect());

        const onVisibilityChange = () => {
          pageVisible = document.visibilityState === "visible";
          if (pageVisible) restartForCurrentState();
          else stopAnimation();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        disposers.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onMotionChange = (event: MediaQueryListEvent) => {
          reducedMotion = event.matches;
          restartForCurrentState();
        };
        motionQuery.addEventListener("change", onMotionChange);
        disposers.push(() => motionQuery.removeEventListener("change", onMotionChange));

        setReady(true);
      } catch {
        cleanupResources();
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanupResources();
    };
  }, []);

  if (failed) return <GlobeIllustration className={className} />;

  return (
    <div className={className} role="img" aria-label="Interactive 3D Earth. Drag to rotate.">
      <div ref={mountRef} className="aspect-square w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <GlobeIllustration className="h-auto w-full max-w-[460px] opacity-60" />
        </div>
      )}
    </div>
  );
}
