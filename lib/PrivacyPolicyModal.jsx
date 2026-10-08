'use client';
import { useState } from 'react';
import { PRIVACY_POLICY_TEXT } from './privacyPolicyText';

export default function PrivacyPolicyModal({ visible, onConfirm, readOnly }) {
  const [agreed, setAgreed] = useState(false);
  const [expanded, setExpanded] = useState(!!readOnly);
  const [showError, setShowError] = useState(false);
  if (!visible) return null;

  const handleConfirm = () => {
    if (!readOnly && !agreed) { setShowError(true); return; }
    setShowError(false);
    onConfirm();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 24, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 0 }}>Privacy Policy</h2>
        {!readOnly && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setShowError(false); }} style={{ width: 20, height: 20, marginTop: 2 }} />
            <span onClick={() => setExpanded(!expanded)} style={{ fontSize: 14, cursor: 'pointer' }}>I agree to the Privacy Policy</span>
          </div>
        )}
        {(expanded || readOnly) && (
          <pre style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 10, marginTop: 8, fontSize: 12, lineHeight: 1.5, color: '#333', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{PRIVACY_POLICY_TEXT}</pre>
        )}
        {showError && <p className="error-text">We can't provide service because you didn't agree — check the box above to continue.</p>}
        <button className="btn-primary" onClick={handleConfirm} style={{ width: '100%', marginTop: 16 }}>{readOnly ? 'Close' : 'Confirm'}</button>
      </div>
    </div>
  );
}
