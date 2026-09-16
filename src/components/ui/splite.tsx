'use client';

import React, { Component, ReactNode, useEffect, useRef, useState, memo } from 'react';
import { Application } from '@splinetool/runtime';

// Error Boundary to catch any runtime WebGL or Spline errors gracefully
class SplineErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[SplineErrorBoundary] Caught WebGL/runtime error gracefully:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Clean ambient backdrop (lightweight, zero GPU load)
export function Fallback3DCanvas({ className }: { className?: string }) {
  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none ${className || ''}`}>
      <div className="absolute w-72 h-72 bg-zinc-300/20 dark:bg-zinc-700/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

interface SplineSceneProps {
  scene: string;
  className?: string;
}

// Module-level tracker to guarantee only one active Spline Application instance exists at a time
let globalActiveSplineApp: Application | null = null;

export const SplineScene = memo(function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const isInViewRef = useRef<boolean>(false);
  const isLoadedRef = useRef<boolean>(false);
  const resizeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !scene) return;

    let isDisposed = false;

    // Check if WebGL is supported by the user's browser/hardware
    const checkWebGL = (): boolean => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setHasError(true);
      return;
    }

    // Safely handle WebGL context loss to prevent infinite error loops
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[SplineScene] WebGL context lost. Gracefully falling back.');
      try {
        appRef.current?.stop();
      } catch {}
      if (!isDisposed) setHasError(true);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);

    // Function to safely initialize the Spline Application only when container has positive dimensions
    const initApplication = (width: number, height: number) => {
      if (isDisposed || appRef.current || !canvasRef.current) return;

      // CRITICAL GUARD: Never initialize with zero or negative dimensions!
      // This eliminates GL_INVALID_VALUE (glTexStorage2D: dimensions not positive)
      // and GL_INVALID_FRAMEBUFFER_OPERATION (Framebuffer is incomplete: Attachment has zero size).
      if (width <= 0 || height <= 0) {
        return;
      }

      // Pre-set canvas pixel dimensions with capped DPR to prevent retina GPU overload
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));

      try {
        // Dispose any existing active global instance to prevent duplicate animation loops
        if (globalActiveSplineApp) {
          try {
            globalActiveSplineApp.stop();
            globalActiveSplineApp.dispose();
          } catch {}
          globalActiveSplineApp = null;
        }

        // Initialize Spline Application with 'auto' render mode to render only when necessary
        const app = new Application(canvas, {
          renderMode: 'auto',
        });

        appRef.current = app;
        globalActiveSplineApp = app;

        app
          .load(scene)
          .then(() => {
            if (isDisposed) {
              try {
                app.stop();
                app.dispose();
              } catch {}
              return;
            }

            isLoadedRef.current = true;
            setIsLoaded(true);

            // If user scrolled away or tab is hidden while loading, immediately stop render loop
            if (!isInViewRef.current || (typeof document !== 'undefined' && document.hidden)) {
              try {
                app.stop();
              } catch {}
            }
          })
          .catch((err) => {
            console.warn('[SplineScene] Scene load error:', err);
            if (!isDisposed) setHasError(true);
          });
      } catch (err) {
        console.warn('[SplineScene] Initialization failed:', err);
        if (!isDisposed) setHasError(true);
      }
    };

    // ResizeObserver: Handles initial measurement and dimension updates without recreating scene
    const resizeObserver = new ResizeObserver((entries) => {
      if (isDisposed) return;
      const entry = entries[0];
      if (!entry) return;

      const width = Math.round(
        entry.borderBoxSize?.[0]?.inlineSize ??
        entry.contentRect.width ??
        container.clientWidth
      );
      const height = Math.round(
        entry.borderBoxSize?.[0]?.blockSize ??
        entry.contentRect.height ??
        container.clientHeight
      );

      // Do nothing if dimensions are zero or negative
      if (width <= 0 || height <= 0) return;

      if (!appRef.current) {
        // First time container achieves positive dimensions and is in view: initialize!
        if (isInViewRef.current) {
          initApplication(width, height);
        }
      } else if (isLoadedRef.current) {
        // Already initialized: debounced resize without recreating the scene
        if (resizeDebounceTimerRef.current) {
          clearTimeout(resizeDebounceTimerRef.current);
        }
        resizeDebounceTimerRef.current = setTimeout(() => {
          if (!isDisposed && appRef.current && width > 0 && height > 0) {
            try {
              appRef.current.setSize(width, height);
            } catch {}
          }
        }, 150);
      }
    });

    resizeObserver.observe(container);

    // IntersectionObserver: Pause rendering when offscreen, resume when visible
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (isDisposed) return;
        const visible = entry.isIntersecting;
        isInViewRef.current = visible;

        if (!appRef.current) {
          if (visible) {
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w > 0 && h > 0) {
              initApplication(w, h);
            }
          }
        } else {
          // Pause/resume animation loop based on viewport visibility
          try {
            if (visible && !document.hidden) {
              appRef.current.play();
            } else {
              appRef.current.stop();
            }
          } catch {}
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    intersectionObserver.observe(container);

    // Page Visibility API: Stop rendering when tab is hidden, resume when active
    const handleVisibilityChange = () => {
      if (isDisposed || !appRef.current) return;
      try {
        if (document.hidden) {
          appRef.current.stop();
        } else if (isInViewRef.current) {
          appRef.current.play();
        }
      } catch {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup when component unmounts
    return () => {
      isDisposed = true;
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      if (appRef.current) {
        try {
          appRef.current.stop();
          appRef.current.dispose();
        } catch {}
        if (globalActiveSplineApp === appRef.current) {
          globalActiveSplineApp = null;
        }
        appRef.current = null;
      }
    };
  }, [scene]);

  if (hasError) {
    return <Fallback3DCanvas className={className} />;
  }

  return (
    <SplineErrorBoundary fallback={<Fallback3DCanvas className={className} />}>
      <div ref={containerRef} className={`relative ${className || 'w-full h-full'}`}>
        {!isLoaded && <Fallback3DCanvas className="absolute inset-0" />}
        <canvas
          ref={canvasRef}
          className={`w-full h-full relative z-10 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </SplineErrorBoundary>
  );
});
