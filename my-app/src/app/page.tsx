"use client";
// If you're using Next.js 13+ and want client-side rendering, keep this. Otherwise, you can remove it.

import React from "react";
import Sketch from "react-p5";
import type p5Types from "p5";

// Adjust these to change grid size, etc.
const baseCellSize = 20; // Base size of each cell in the grid
const speed = 0.9; // Speed factor for animation (not used in this snippet)

// Scale factors for sampling noise
// The larger this is, the more "stretched" the color bands will be.
let noiseScaleX = 0.05;
let noiseScaleY = 0.05;

const MosaicTrianglesPerlin: React.FC = () => {
  // Calculate the number of columns and rows based on the window size
  const calculateGridSize = (p5: p5Types) => {
    const dynamicCellSize = Math.max(baseCellSize, p5.windowWidth / 50);
    const cols = Math.floor(p5.windowWidth / dynamicCellSize);
    const rows = Math.floor(p5.windowHeight / dynamicCellSize);
    return { cols, rows, dynamicCellSize };
  };

  /**
   * Called once at the start by react-p5.
   * We initialize our canvas + color mode here.
   */
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    // Calculate grid size
    const { cols, rows, dynamicCellSize } = calculateGridSize(p5);

    // Create a canvas with the window size
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);

    // Use HSB mode so we can easily manipulate hue, saturation, brightness
    p5.colorMode(p5.HSB, 360, 100, 100, 100);

    // Adjust noise scale based on dynamic cell size
    noiseScaleX = 0.1 / dynamicCellSize;
    noiseScaleY = 0.1 / dynamicCellSize;
  };

  /**
   * Called every frame (60x/sec by default).
   * We'll draw the entire grid each time to see transitions,
   * or you can noLoop() in setup if you only need a static image.
   */
  const draw = (p5: p5Types) => {
    console.log("Draw function is running");
    // Clear background each frame: (hue=0,sat=0,bri=100 => white in HSB)
    p5.background(0, 0, 100);

    // Calculate grid size
    const { cols, rows, dynamicCellSize } = calculateGridSize(p5);

    // Loop over grid cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Top-left corner of cell in pixel coordinates
        const px = x * dynamicCellSize;
        const py = y * dynamicCellSize;

        // Draw 4 triangles subdividing this cell
        drawColoredTriangles(p5, px, py, dynamicCellSize);
      }
    }
  };

  /**
   * Draws a square subdivided by an 'X' -> 4 triangles
   * We'll fill each triangle with a Perlin-noise based color.
   */
  const drawColoredTriangles = (
    p5: p5Types,
    px: number,
    py: number,
    s: number
  ) => {
    // Time-based factor for oscillation
    const timeFactor = p5.sin(p5.frameCount * 0.05);

    // Coordinates for corners of the cell
    const topLeft = { x: px, y: py };
    const topRight = { x: px + s, y: py };
    const bottomLeft = { x: px, y: py + s };
    const bottomRight = { x: px + s, y: py + s };

    // Center point with oscillation
    const center = {
      x: px + s / 2 + timeFactor * s * 0.1,
      y: py + s / 2 + timeFactor * s * 0.1,
    };

    // Midpoints for each side of the triangles
    const midTop = {
      x: (topLeft.x + topRight.x) / 0.5,
      y: (topLeft.y + topRight.y) / 0.5,
    };
    const midLeft = {
      x: (topLeft.x + bottomLeft.x) / 0.5,
      y: (topLeft.y + bottomLeft.y) / 0.5,
    };
    const midRight = {
      x: (topRight.x + bottomRight.x) / 0.5,
      y: (topRight.y + bottomRight.y) / 0.5,
    };
    const midBottom = {
      x: (bottomLeft.x + bottomRight.x) / 0.5,
      y: (bottomLeft.y + bottomRight.y) / 0.5,
    };

    // Draw smaller triangles within each original triangle
    // Triangle #1: top-left -> midTop -> center
    fillPerlinColor(p5, topLeft.x, topLeft.y);
    p5.triangle(topLeft.x, topLeft.y, midTop.x, midTop.y, center.x, center.y);

    // Triangle #2: midTop -> top-right -> center
    fillPerlinColor(p5, midTop.x, midTop.y);
    p5.triangle(midTop.x, midTop.y, topRight.x, topRight.y, center.x, center.y);

    // Triangle #3: top-left -> center -> midLeft
    fillPerlinColor(p5, topLeft.x, midLeft.y);
    p5.triangle(topLeft.x, topLeft.y, center.x, center.y, midLeft.x, midLeft.y);

    // Triangle #4: midLeft -> center -> bottom-left
    fillPerlinColor(p5, midBottom.x, midLeft.y);
    p5.triangle(
      midLeft.x,
      midLeft.y,
      center.x,
      center.y,
      bottomLeft.x,
      bottomLeft.y
    );

    // Triangle #5: top-right -> midRight -> center
    fillPerlinColor(p5, bottomRight.x, midRight.y);
    p5.triangle(
      topRight.x,
      topRight.y,
      midRight.x,
      midRight.y,
      center.x,
      center.y
    );

    // Triangle #6: midRight -> bottom-right -> center
    fillPerlinColor(p5, bottomRight.x, midRight.y);
    p5.triangle(
      midRight.x,
      midRight.y,
      bottomRight.x,
      bottomRight.y,
      center.x,
      center.y
    );

    // Triangle #7: bottom-left -> center -> midBottom
    fillPerlinColor(p5, bottomLeft.x, midBottom.y);
    p5.triangle(
      bottomLeft.x,
      bottomLeft.y,
      center.x,
      center.y,
      midBottom.x,
      midBottom.y
    );

    // Triangle #8: midBottom -> bottom-right -> center
    fillPerlinColor(p5, topRight.x, topRight.y);
    p5.triangle(
      midBottom.x,
      midBottom.y,
      bottomRight.x,
      bottomRight.y,
      center.x,
      center.y
    );
  };

  /**
   * fillPerlinColor:
   *   - Samples Perlin noise at (x * noiseScaleX, y * noiseScaleY),
   *   - Scales that 0..1 range to 0..360 for the hue,
   *   - Optionally randomizes or sets saturation/brightness/alpha.
   */
  const fillPerlinColor = (p5: p5Types, x: number, y: number) => {
    // Sample the noise field to get a float [0..1]
    const n = p5.noise(
      (x + p5.frameCount * 10) * noiseScaleX,
      (y + p5.frameCount * 10) * noiseScaleY
    );

    // Use noise for saturation and brightness for more dynamic colors
    const satVal = p5.noise(x * 0.1, y * 0.1) * 140;
    const briVal =
      p5.noise(x * 0.1 + p5.frameCount * 0.01, y * 0.1 + 100) * 100;
    const alphaVal = 90; // set alpha to be semi-opaque

    // Map 'n' to a hue in the range for oranges and blues
    const hueVal = n < 0.3 ? n * 80 : 180 + (n - 0.6) * Math.random() * 0.01;

    p5.fill(hueVal, satVal, briVal, alphaVal);
    p5.noStroke();
  };

  // Return our Sketch with the above setup + draw
  return <Sketch setup={setup} draw={draw} />;
};

export default MosaicTrianglesPerlin;
