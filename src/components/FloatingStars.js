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

    // Star class
    class Star {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 0.85 + 0.25;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.18 + 0.5;
        this.twinkleSpeed = Math.random() * 0.002 + 0.001;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        // Very subtle twinkle effect
        this.opacity = 0.5 + 0.12 * Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset);
        // Wrap around edges
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        // Create gradient for star glow - balanced
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 1.9
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.9, 0, Math.PI * 2);
        ctx.fill();
        // Bright center - balanced
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Create stars
    const stars = [];
    const numStars = Math.min(80, Math.floor((canvas.width * canvas.height) / 30000));
    for (let i = 0; i < numStars; i++) {
      stars.push(new Star());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.update();
        star.draw();
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