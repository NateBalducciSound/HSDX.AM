import { useState, useEffect, useRef } from 'react'; // useState/useEffect used by LazyIframe

// ─── Visual page ──────────────────────────────────────────────────────────────
// DESKTOP layout: absolute-positioned collage inside a tall container.
// MOBILE layout: simple vertical stack.
//
// To add items, add to COLLAGE_ITEMS:
//   type: 'image' | 'p5'
//   src, title
//   aspect: (p5 only) height ratio — 1=square, 0.667=landscape
//   d: { left, top, width, zIndex }   ← desktop position (% / px)
//   m: { width }                      ← mobile width (% string, e.g. '80%')
// ──────────────────────────────────────────────────────────────────────────────

const COLLAGE_ITEMS = [
  // zig-zag: left → right → left → right...
  // most consecutive pairs overlap vertically, one gap (5→6) is the rare non-overlap
  {
    type: 'image',
    src: '/BlankPanel.png',
    title: '',
    d: { left: '2%',  top: 0,    width: '33%', zIndex: 1 },
    m: { width: '70%' },
  },
  {
    type: 'p5',
    src: '/sketches/lines/index.html',
    title: 'Lines / CA',
    aspect: 0.667,
    d: { left: '57%', top: 160,  width: '40%', zIndex: 2 },
    m: { width: '90%' },
  },
  {
    type: 'image',
    src: '/CarPanel.png',
    title: '',
    d: { left: '1%',  top: 360,  width: '44%', zIndex: 3 },
    m: { width: '85%' },
  },
  {
    type: 'image',
    src: '/DuoPanel.png',
    title: '',
    d: { left: '56%', top: 540,  width: '36%', zIndex: 4 },
    m: { width: '75%', marginLeft: 'auto' },
  },
  {
    type: 'image',
    src: '/RoadSignPanel.png',
    title: '',
    d: { left: '3%',  top: 740,  width: '28%', zIndex: 5 },
    m: { width: '62%' },
  },
  {
    // rare non-overlap — big vertical gap before this one
    type: 'p5',
    src: '/sketches/ca/index.html',
    title: 'CA Masks',
    aspect: 1,
    d: { left: '60%', top: 1060, width: '30%', zIndex: 4 },
    m: { width: '78%', marginLeft: 'auto' },
  },
  {
    type: 'image',
    src: '/BlankPanel.png',
    title: '',
    d: { left: '18%', top: 1240, width: '38%', zIndex: 5 },
    m: { width: '72%' },
  },
];

function LazyIframe({ src, aspect, title }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoaded(true); observer.disconnect(); } },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', aspectRatio: `1 / ${aspect}`, background: '#111' }}>
      {loaded && (
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={title}
          scrolling="no"
        />
      )}
    </div>
  );
}

export default function VisualPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url(/RoadPhoto.JPG)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', overflowY: 'auto', fontFamily: "'Space Mono', monospace" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <img src="/HesDx.png" alt="Hes.dx" style={{ height: 40, imageRendering: 'auto' }} />
        </div>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', color: '#888', textTransform: 'uppercase', marginBottom: 24 }}>
          Visual
        </div>

        {/* Collage — % left positions compress naturally as viewport narrows */}
        <div style={{ position: 'relative', height: 1600 }}>
          {COLLAGE_ITEMS.map((item, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: item.d.left,
              top: item.d.top,
              width: item.d.width,
              minWidth: 240,
              zIndex: item.d.zIndex,
            }}>
                {item.type === 'p5' ? (
                  <LazyIframe src={item.src} aspect={item.aspect} title={item.title} />
                ) : (
                  <img src={item.src} alt={item.title} style={{ width: '100%', display: 'block', imageRendering: 'auto' }} />
                )}
              </div>
            ))}
          </div>

      </div>
    </div>
  );
}
