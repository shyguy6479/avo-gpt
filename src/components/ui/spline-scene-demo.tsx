'use client';

import { SplineScene } from "./splite";
import { Card } from "./card";
import { Spotlight } from "./spotlight";

export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-slate-950 dark:bg-black/[0.96] border border-slate-800 relative overflow-hidden shadow-2xl">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" size={350} />
      <div className="flex h-full flex-col md:flex-row">
        {/* Left content */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
            Interactive 3D
          </h2>
          <p className="mt-4 text-slate-300 dark:text-neutral-300 max-w-lg text-sm md:text-base leading-relaxed">
            Bring your AI workspace to life with fluid 3D interactive graphics. Real-time spatial intelligence designed for modern web applications.
          </p>
        </div>
        {/* Right content */}
        <div className="flex-1 relative min-h-[280px]">
          <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
        </div>
      </div>
    </Card>
  );
}
