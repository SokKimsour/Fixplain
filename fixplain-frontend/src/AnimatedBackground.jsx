import { useEffect, useRef } from 'react';

const CODE_LABELS = [
  'const','let','var','async','await','return','import','export',
  'function','class','if','else','for','while','try','catch',
  '=>','{}','[]','null','true','false','0xFF','0b101',
  '&&','||','!==','===','>>','<<','++','--',
  'fetch()','.map()','.filter()','Promise','useState','useEffect',
  'npm','git','API','JSON','HTTP','TCP','404','200',
];

export default function AnimatedBackground({ isDark }) {
  const canvasRef = useRef(null);
  const mouse     = useRef({ x: -9999, y: -9999 });
  const nodes     = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;

    const TEAL       = isDark ? '#2dd4bf' : '#0d9488';
    const TEAL_DIM   = isDark ? 'rgba(45,212,191,{a})' : 'rgba(13,148,136,{a})';
    const NODE_COLOR = isDark ? 'rgba(45,212,191,0.7)' : 'rgba(13,148,136,0.6)';
    const TEXT_COLOR = isDark ? 'rgba(45,212,191,0.5)' : 'rgba(13,148,136,0.4)';
    const LINE       = (a) => TEAL_DIM.replace('{a}', a);

    const CONNECT_DIST  = 160;  // max distance to draw node-node line
    const MOUSE_DIST    = 220;  // max distance mouse attracts nodes
    const MOUSE_ATTRACT = 0.012; // how strongly nodes pull toward mouse
    const REPEL_DIST    = 80;   // distance at which nodes repel mouse
    const COUNT         = 55;   // number of nodes

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const makeNode = () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   (Math.random() - 0.5) * 0.4,
      r:    2 + Math.random() * 2,
      label: CODE_LABELS[Math.floor(Math.random() * CODE_LABELS.length)],
      labelTimer: 0,      // counts up, shows label when >0
      pulse: Math.random() * Math.PI * 2, // phase offset for pulsing
    });

    resize();
    window.addEventListener('resize', resize);

    nodes.current = Array.from({ length: COUNT }, makeNode);

    const onMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const onMouseLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      frame++;

      // Update nodes
      nodes.current.forEach(n => {
        // Mouse interaction
        const dx   = mx - n.x;
        const dy   = my - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_DIST && dist > 0) {
          if (dist < REPEL_DIST) {
            // Repel close nodes
            n.vx -= (dx / dist) * 0.3;
            n.vy -= (dy / dist) * 0.3;
          } else {
            // Attract distant nodes gently
            n.vx += (dx / dist) * MOUSE_ATTRACT * (1 - dist / MOUSE_DIST);
            n.vy += (dy / dist) * MOUSE_ATTRACT * (1 - dist / MOUSE_DIST);
          }
          // Light up label when mouse is near
          if (dist < MOUSE_DIST * 0.6) n.labelTimer = 80;
        }

        // Drift
        n.x += n.vx;
        n.y += n.vy;

        // Dampen velocity
        n.vx *= 0.98;
        n.vy *= 0.98;

        // Add slight random drift
        n.vx += (Math.random() - 0.5) * 0.03;
        n.vy += (Math.random() - 0.5) * 0.03;

        // Clamp speed
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 2.5) { n.vx = (n.vx / speed) * 2.5; n.vy = (n.vy / speed) * 2.5; }

        // Bounce off walls softly
        if (n.x < 20)                  { n.vx += 0.1; }
        if (n.x > canvas.width  - 20)  { n.vx -= 0.1; }
        if (n.y < 20)                  { n.vy += 0.1; }
        if (n.y > canvas.height - 20)  { n.vy -= 0.1; }

        // Decrement label timer
        if (n.labelTimer > 0) n.labelTimer--;

        // Advance pulse
        n.pulse += 0.03;
      });

      // Draw node-node connections
      for (let i = 0; i < nodes.current.length; i++) {
        for (let j = i + 1; j < nodes.current.length; j++) {
          const a = nodes.current[i];
          const b = nodes.current[j];
          const dx   = b.x - a.x;
          const dy   = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = LINE(alpha.toFixed(3));
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw mouse-to-node connections
      if (mx > 0) {
        nodes.current.forEach(n => {
          const dx   = mx - n.x;
          const dy   = my - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_DIST) {
            const alpha = (1 - dist / MOUSE_DIST) * 0.5;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = LINE(alpha.toFixed(3));
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        });
      }

      // Draw nodes
      nodes.current.forEach(n => {
        const nearMouse = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2) < MOUSE_DIST;
        const pulse     = nearMouse ? 1 + Math.sin(n.pulse) * 0.4 : 1;
        const r         = n.r * pulse;

        // Outer glow ring
        if (nearMouse) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = LINE((0.15 * pulse).toFixed(3));
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        // Node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nearMouse ? TEAL : NODE_COLOR;
        ctx.fill();

        // Label — appears when mouse is close or on timer
        if (n.labelTimer > 0) {
          const labelAlpha = Math.min(1, n.labelTimer / 20);
          ctx.font        = `10px 'JetBrains Mono', monospace`;
          ctx.fillStyle   = isDark
            ? `rgba(45,212,191,${labelAlpha.toFixed(2)})`
            : `rgba(13,148,136,${labelAlpha.toFixed(2)})`;
          ctx.fillText(n.label, n.x + r + 5, n.y + 3);
        } else if (!nearMouse) {
          // Always show faint label
          ctx.font      = `9px 'JetBrains Mono', monospace`;
          ctx.fillStyle = TEXT_COLOR;
          ctx.fillText(n.label, n.x + r + 4, n.y + 3);
        }
      });

      // Draw mouse cursor node
      if (mx > 0 && mx < canvas.width) {
        // Outer ring
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.strokeStyle = LINE('0.15');
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.strokeStyle = TEAL;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = TEAL;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
