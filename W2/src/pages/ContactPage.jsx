import { useState } from 'react';
import { INFO } from '../data';

export default function ContactPage({ onBack }) {
  const [form, setForm]       = useState({ name: '', email: '', msg: '' });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sending || !form.msg) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setForm({ name: '', email: '', msg: '' }); }, 900);
  };

  return (
    <>
      <header className="page-topbar">
        <div className="topbar-left" />
        <span className="page-title">CONTACT</span>
        <span className="site-wordmark">Hes<span className="wordmark-dot">.</span>dx</span>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 520 }}>

          <div className="panel" style={{ padding: '16px 20px', marginBottom: 12, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {INFO.email && (
              <div>
                <p style={{ fontFamily: 'var(--font)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 4 }}>Email</p>
                <a href={`mailto:${INFO.email}`} style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--mint)', textDecoration: 'none' }}>{INFO.email}</a>
              </div>
            )}
            {INFO.itch && (
              <div>
                <p style={{ fontFamily: 'var(--font)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 4 }}>Games</p>
                <a href={INFO.itch} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--mint)', textDecoration: 'none' }}>itch.io ↗</a>
              </div>
            )}
          </div>

          <div className="panel" style={{ padding: '20px 24px' }}>
            {sent ? (
              <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--mint)', lineHeight: 1.7 }}>
                ✓ message sent — i'll get back to you soon.
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field">
                  <label>Name</label>
                  <input type="text" placeholder="your name"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Message</label>
                  <textarea rows={5} placeholder="say something…"
                    value={form.msg} onChange={e => setForm(f => ({ ...f, msg: e.target.value }))} />
                </div>
                <button type="submit" className="btn" style={{ justifyContent: 'center' }} disabled={sending}>
                  {sending ? 'sending…' : 'send message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
