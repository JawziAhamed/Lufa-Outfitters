import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture } from '@react-three/drei';
import { easing } from 'maath';

const toSafeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ShirtModel = ({ shirtColor, logoDecal, fullDecal, showLogo, showFull, logoPlacement }) => {
  const { nodes, materials } = useGLTF('/shirt_baked.glb');
  const modelMaterial = materials.lambert1;

  const logoSource = logoDecal || '/threejs.png';
  const fullSource = fullDecal || '/threejs.png';
  const [logoTexture, fullTexture] = useTexture([logoSource, fullSource]);
  const decalConfig = useMemo(() => {
    const x = toSafeNumber(logoPlacement?.x, 0);
    const y = toSafeNumber(logoPlacement?.y, 0.04);
    const scale = toSafeNumber(logoPlacement?.scale, 0.15);
    const rotation = (toSafeNumber(logoPlacement?.rotation, 0) * Math.PI) / 180;

    return {
      position: [x, y, 0.15],
      scale,
      rotation: [0, 0, rotation],
    };
  }, [logoPlacement]);

  useEffect(() => {
    if (logoTexture) {
      logoTexture.needsUpdate = true;
    }
    if (fullTexture) {
      fullTexture.needsUpdate = true;
    }
  }, [logoTexture, fullTexture]);

  useEffect(() => {
    modelMaterial.map = showFull ? fullTexture : null;
    modelMaterial.needsUpdate = true;
  }, [showFull, fullTexture, modelMaterial]);

  useFrame((_, delta) => {
    easing.dampC(modelMaterial.color, showFull ? '#ffffff' : shirtColor, 0.25, delta);
  });

  return (
    <group key={`${logoSource}|${fullSource}|${showLogo}|${showFull}`}>
      <mesh
        castShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={modelMaterial}
        material-roughness={1}
        dispose={null}
      >
        {showLogo ? (
          <Decal
            position={decalConfig.position}
            rotation={decalConfig.rotation}
            scale={decalConfig.scale}
            map={logoTexture}
            depthTest={false}
            depthWrite
          />
        ) : null}
      </mesh>
    </group>
  );
};

export default ShirtModel;
