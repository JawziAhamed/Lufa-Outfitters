import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';

const CameraRig = ({ introMode, children }) => {
  const group = useRef();

  useFrame((state, delta) => {
    const isTablet = window.innerWidth <= 1024;
    const isMobile = window.innerWidth <= 640;

    let targetPosition = [-0.4, 0, 2];
    if (introMode) {
      if (isTablet) targetPosition = [0, 0, 2.2];
      if (isMobile) targetPosition = [0, 0.2, 2.6];
    } else if (isMobile) {
      targetPosition = [0, 0.02, 2.28];
    } else if (isTablet) {
      targetPosition = [0, 0.04, 2.02];
    } else {
      targetPosition = [0, 0.05, 1.84];
    }

    easing.damp3(state.camera.position, targetPosition, 0.25, delta);

    if (group.current) {
      easing.dampE(
        group.current.rotation,
        [state.pointer.y / 10, -state.pointer.x / 5, 0],
        0.25,
        delta
      );
    }
  });

  return <group ref={group}>{children}</group>;
};

export default CameraRig;
