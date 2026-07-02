import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OnlineStatusPill() {
  const online = useOnlineStatus();
  return (
    <span className={`offline-pill ${online ? '' : 'is-offline'}`}>
      <span className="dot" />
      {online ? 'En ligne' : 'Hors-ligne'}
    </span>
  );
}
