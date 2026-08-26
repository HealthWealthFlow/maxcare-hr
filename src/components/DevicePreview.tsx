import React, { useState } from 'react';

type Device = 'mobile' | 'tablet' | 'desktop';

const DEVICES: Record<Device, { width: number; label: string; icon: string }> = {
  mobile: { width: 390, label: 'Mobile', icon: 'phone_iphone' },
  tablet: { width: 768, label: 'Tablet', icon: 'tablet_mac' },
  desktop: { width: 0, label: 'Desktop', icon: 'desktop_windows' }, // 0 = full width
};

/** Floating "switch view" toolbar so you can preview mobile vs desktop on localhost. */
export const DevicePreview: React.FC<{ embedded: boolean }> = ({ embedded }) => {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);

  // Hide the toolbar inside the embedded (device-frame) app to avoid recursion.
  if (embedded) return null;

  const frameSrc = `${window.location.origin}${window.location.pathname}?preview=embedded`;

  return (
    <>
      {/* Floating toggle */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          title="Switch view (mobile / desktop)"
          className="bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">devices</span>
        </button>
        {open && (
          <div className="bg-white rounded-2xl border border-[#e1e2ed] shadow-xl p-2 flex flex-col gap-1">
            {(Object.keys(DEVICES) as Device[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDevice(d);
                  setOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  device === d ? 'bg-[#dbe1ff] text-[#004ac6]' : 'text-[#434655] hover:bg-[#ededf9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{DEVICES[d].icon}</span>
                {DEVICES[d].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Device frame overlay */}
      {device && (
        <div className="fixed inset-0 z-[70] bg-[#191b23]/60 flex items-center justify-center p-4">
          <div className="relative flex flex-col w-full" style={{ maxWidth: device === 'desktop' ? 1280 : DEVICES[device].width }}>
            <div className="bg-white rounded-t-2xl border border-b-0 border-[#e1e2ed] px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#191b23] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#004ac6]">{DEVICES[device].icon}</span>
                {DEVICES[device].label} view
              </span>
              <button onClick={() => setDevice(null)} className="text-[#434655] hover:text-[#ba1a1a]" title="Close preview">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <iframe title="Device preview" src={frameSrc} className="w-full bg-white rounded-b-2xl" style={{ height: '86vh', border: 'none' }} />
          </div>
        </div>
      )}
    </>
  );
};
