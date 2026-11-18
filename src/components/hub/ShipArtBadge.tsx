import React from 'react';
import { DroneId } from '../../game/config/DroneConfig';
import { ShipId, SHIPS } from '../../game/config/ShipConfig';

export const ShipArtBadge: React.FC<{ shipId: ShipId; size?: number }> = ({
  shipId,
  size = 44,
}) => {
  const ship = SHIPS[shipId] ?? SHIPS.falcon_x;
  const c = ship.primaryColorHex;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0 drop-shadow-[0_0_8px_rgba(56,189,248,0.28)]"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="28" fill="#060c1c" stroke={c} strokeOpacity="0.35" strokeWidth="1.5" />
      {shipId === 'destroyer' && (
        <>
          <polygon points="32,10 52,44 42,50 32,44 22,50 12,44" fill={c} fillOpacity="0.88" />
          <rect x="26" y="18" width="12" height="24" rx="3" fill="#fef08a" fillOpacity="0.8" />
        </>
      )}
      {shipId === 'phantom' && (
        <>
          <polygon points="32,8 50,52 32,42 14,52" fill={c} fillOpacity="0.9" />
          <polygon points="32,16 39,40 32,36 25,40" fill="#ecfeff" fillOpacity="0.9" />
        </>
      )}
      {shipId === 'aegis' && (
        <>
          <polygon points="32,11 51,28 46,50 18,50 13,28" fill={c} fillOpacity="0.88" />
          <path d="M16 24 Q32 10 48 24" fill="none" stroke="#a7f3d0" strokeWidth="2.5" />
        </>
      )}
      {shipId === 'thunderbolt' && (
        <>
          <polygon points="32,9 54,40 44,48 32,38 20,48 10,40" fill={c} fillOpacity="0.9" />
          <polygon points="32,18 38,34 26,34" fill="#38bdf8" />
        </>
      )}
      {shipId === 'celestial' && (
        <>
          <polygon points="32,7 55,38 43,52 32,42 21,52 9,38" fill={c} fillOpacity="0.92" />
          <polygon points="32,14 40,36 32,32 24,36" fill="#fef08a" />
          <circle cx="32" cy="28" r="4" fill="#38bdf8" />
        </>
      )}
      {(shipId === 'falcon_x' || shipId === 'nova_prime' || shipId === 'specter') && (
        <>
          <polygon points="32,9 51,46 39,48 32,40 25,48 13,46" fill={c} fillOpacity="0.9" />
          <polygon points="32,16 37,35 27,35" fill="#f8fafc" fillOpacity="0.9" />
        </>
      )}
    </svg>
  );
};

export const DroneArtBadge: React.FC<{ droneId: DroneId; colorHex: string; size?: number }> = ({
  droneId,
  colorHex,
  size = 40,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0" aria-hidden="true">
    <circle cx="24" cy="24" r="21" fill="#060c1c" stroke={colorHex} strokeOpacity="0.45" strokeWidth="1.5" />
    {droneId === 'assault' && (
      <polygon points="24,8 38,32 24,26 10,32" fill={colorHex} />
    )}
    {droneId === 'shield' && (
      <polygon points="24,9 37,18 33,35 15,35 11,18" fill={colorHex} fillOpacity="0.85" />
    )}
    {droneId === 'repair' && (
      <path d="M20 11 H28 V20 H37 V28 H28 V37 H20 V28 H11 V20 H20 Z" fill={colorHex} />
    )}
    {droneId === 'collector' && (
      <circle cx="24" cy="24" r="10" fill="none" stroke={colorHex} strokeWidth="4" />
    )}
  </svg>
);
