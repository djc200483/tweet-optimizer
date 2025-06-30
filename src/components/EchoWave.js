import React, { useEffect, useRef } from 'react';

export default function EchoWave() {
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

    // Ring class
    class Ring {
      constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 0;
        this.maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
        this.speed = 1.5;
        this.opacity = 0.8;
        this.fadeSpeed = 0.02;
        this.thickness = 2;
        this.color = 'rgba(0, 194, 255, 0.6)'; // Matches your app's blue theme
      }

      reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 0;
        this.maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
        this.opacity = 0.8;
      }

      update() {
        this.radius += this.speed;
        this.opacity -= this.fadeSpeed;
        
        // Reset ring when it fades out or gets too large
        if (this.opacity <= 0 || this.radius > this.maxRadius) {
          this.reset();
        }
      }

      draw() {
        if (this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        
        // Create gradient for the ring
        const gradient = ctx.createRadialGradient(
          this.x, this.y, this.radius - 5,
          this.x, this.y, this.radius + 5
        );
        gradient.addColorStop(0, 'rgba(0, 194, 255, 0)');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'rgba(0, 194, 255, 0)');
        
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // Create multiple rings for continuous effect
    const rings = [];
    const numRings = 3;
    const ringSpacing = 100; // Pixels between rings
    
    for (let i = 0; i < numRings; i++) {
      const ring = new Ring();
      ring.radius = i * ringSpacing; // Stagger the rings
      rings.push(ring);
    }

    // Animation loop
    const animate = () => {
      // Clear canvas with slight fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw rings
      rings.forEach(ring => {
        ring.update();
        ring.draw();
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
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
} 