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

    // EchoWave class (replaces Star)
    class EchoWave {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseRadius = Math.random() * 8 + 8; // starting radius
        this.maxRadius = Math.random() * 40 + 60; // how far the wave expands
        this.radius = this.baseRadius;
        this.speed = Math.random() * 0.4 + 0.2; // how fast the wave expands
        this.opacity = Math.random() * 0.2 + 0.25;
        this.color = 'rgba(120,180,255,1)';
        this.waveWidth = Math.random() * 2.5 + 1.5;
        this.delay = Math.random() * 2000; // ms delay before starting
        this.startTime = Date.now() + this.delay;
      }

      update() {
        const now = Date.now();
        if (now < this.startTime) return; // wait for delay
        this.radius += this.speed;
        if (this.radius > this.maxRadius) {
          this.reset();
        }
      }

      draw() {
        const now = Date.now();
        if (now < this.startTime) return;
        ctx.save();
        // Fade out as it grows
        const fade = Math.max(0, 1 - (this.radius - this.baseRadius) / (this.maxRadius - this.baseRadius));
        ctx.globalAlpha = this.opacity * fade;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.lineWidth = this.waveWidth;
        ctx.strokeStyle = 'rgba(120,180,255,0.7)';
        ctx.shadowColor = 'rgba(120,180,255,0.4)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Create echo waves (same logic as stars)
    const waves = [];
    const numWaves = Math.min(80, Math.floor((canvas.width * canvas.height) / 30000));
    for (let i = 0; i < numWaves; i++) {
      waves.push(new EchoWave());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waves.forEach(wave => {
        wave.update();
        wave.draw();
      });
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