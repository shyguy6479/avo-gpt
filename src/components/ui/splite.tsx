'use client';

import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
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
    console.warn('Spline rendering error caught gracefully:', error);
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

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Viewport intersection observer to avoid loading or running when offscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { rootMargin: '100px', threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !canvasRef.current || !scene) return;

    let app: Application | null = null;
    let isMounted = true;

    // Check if WebGL is supported by the user's browser/hardware
    const checkWebGL = () => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) {
      setHasError(true);
      return;
    }

    try {
      app = new Application(canvasRef.current);
      app
        .load(scene)
        .then(() => {
          if (isMounted) {
            setIsLoaded(true);
          }
        })
        .catch((err) => {
          console.warn('Spline runtime scene load error:', err);
          if (isMounted) setHasError(true);
        });
    } catch (err) {
      console.warn('Spline runtime initialization failed:', err);
      if (isMounted) setHasError(true);
    }

    return () => {
      isMounted = false;
      if (app) {
        try {
          app.dispose();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [isInView, scene]);

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
}
