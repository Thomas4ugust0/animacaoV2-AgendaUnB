import { BufferGeometry, Float32BufferAttribute } from 'three';
import { REFERENCE } from '../config';

// A stable screen-space lattice reproduces the reference's ordered sampling.
export function createDotGrid(spacing: number): BufferGeometry {
  const positions: number[] = [];
  for (let y = 3; y < REFERENCE.height; y += spacing) {
    for (let x = 3; x < REFERENCE.width; x += spacing) positions.push(x, y, 0);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}
