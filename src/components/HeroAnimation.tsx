import React from 'react';
import { SplineScene } from './ui/splite';

const SPLINE_AI_CORE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export const HeroAnimation: React.FC<{ isDarkMode?: boolean }> = React.memo(() => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-white dark:bg-[#050505] select-none transition-colors duration-200">
      {/* 3D Spline AI Core Robot Scene */}
      <SplineScene
        scene={SPLINE_AI_CORE_URL}
        className="w-full h-full"
      />
    </div>
  );
});

export default HeroAnimation;



