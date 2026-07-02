import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importTripFromZip } from '@/utils/exportImport';

export default function ImportTripButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const newTripId = await importTripFromZip(file);
      navigate(`/trip/${newTripId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'import.");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
        {importing ? 'Import…' : '⬆ Importer un voyage'}
        <input ref={inputRef} type="file" accept=".zip" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
      {error && <p style={{ color: 'var(--color-rust)', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}
    </div>
  );
}
