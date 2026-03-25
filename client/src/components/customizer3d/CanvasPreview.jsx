import { Canvas } from '@react-three/fiber';
import { Center, Environment } from '@react-three/drei';

import Backdrop from './Backdrop';
import CameraRig from './CameraRig';
import ShirtModel from './ShirtModel';

const CanvasPreview = ({ customization, containerClassName }) => {
  return (
    <div className={containerClassName ?? 'h-[clamp(20rem,45vw,34rem)] w-full overflow-hidden rounded-[1.75rem] border border-white/40 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-inner ring-1 ring-black/5'}>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 0.05, 1.95], fov: 22 }}
        className="h-full w-full"
      >
        <ambientLight intensity={0.65} />
        <Environment preset="city" />

        <CameraRig introMode={false}>
          <Backdrop />
          <Center position={[0, -0.06, 0]} scale={1.08}>
            <ShirtModel
              shirtColor={customization.shirtColor}
              logoDecal={customization.logoDecal}
              fullDecal={customization.fullDecal}
              showLogo={customization.showLogo}
              showFull={customization.showFull}
              logoPlacement={customization.logoPlacement}
            />
          </Center>
        </CameraRig>
      </Canvas>
    </div>
  );
};

export default CanvasPreview;
