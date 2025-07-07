import React, { useEffect, useRef } from 'react';

export default function FloatingStars() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Wave config
    const amplitude = 48; // Height of the wave
    const frequency = 0.012; // Number of waves across the width
    const speed = 0.018; // Animation speed
    const centerY = () => canvas.height / 2;
    const color = 'rgba(120,180,255,0.7)';
    const glowColor = 'rgba(120,180,255,0.25)';
    const lineWidth = 3.5;

    // Animation loop
    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glow
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = centerY() + Math.sin((x * frequency) + t) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = lineWidth * 3.5;
      ctx.stroke();
      ctx.restore();

      // Draw main wave
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = centerY() + Math.sin((x * frequency) + t) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      t += speed;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
} 