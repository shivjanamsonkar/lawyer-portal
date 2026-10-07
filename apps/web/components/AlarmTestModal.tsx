"use client";

import { useState } from "react";
import { Bell, CircleCheck, Volume2, X } from "lucide-react";

function playAlarmPreview(): void {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const startAt = context.currentTime;
  [0, 0.38, 0.76].forEach((offset) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, startAt + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt + offset);
    oscillator.stop(startAt + offset + 0.25);
  });
  window.setTimeout(() => void context.close(), 1500);
}

export function AlarmTestModal() {
  const [open, setOpen] = useState(false);
  const [played, setPlayed] = useState(false);

  function testAlarm(): void {
    playAlarmPreview();
    setPlayed(true);
  }

  return <>
    <button className="primary-button" onClick={() => { setOpen(true); setPlayed(false); }}><Bell size={16} /> Test chamber alarm</button>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="alarm-modal" role="dialog" aria-modal="true" aria-labelledby="alarm-modal-title">
        <button className="modal-close" aria-label="Close alarm test" onClick={() => setOpen(false)}><X size={17} /></button>
        <span className="modal-icon"><Volume2 size={20} /></span><h2 id="alarm-modal-title">Test morning alarm</h2>
        <p>Play a short sound on this device to confirm your browser audio is working.</p>
        {played && <div className="alarm-confirmation"><CircleCheck size={16} /> Alarm preview played</div>}
        <div className="modal-actions"><button className="secondary-button" onClick={() => setOpen(false)}>Close</button><button className="primary-button" onClick={testAlarm}><Volume2 size={15} /> Play sound</button></div>
      </section>
    </div>}
  </>;
}