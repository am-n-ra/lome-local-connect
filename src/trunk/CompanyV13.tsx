import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue } from './api';

type CompanyV13Props = { onClose: () => void };

export function CompanyV13({ onClose }: CompanyV13Props) {
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getSellerCatalogue({ token });
      if (result.ok && result.data) setFacilities(result.data.facilities);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="company" role="region" aria-label="Compagnies">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Compagnies</div><h1>Mes compagnies</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><ArrowLeft size={15} /></button>
      </div>
      {loading && <p className="sub">Chargement…</p>}
      {!loading && facilities.length === 0 && <p className="sub">Aucune compagnie enregistrée.</p>}
      {facilities.map((facility) => (
        <div className="cardbox" key={facility.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{facility.name}</b><br /><span className="tiny muted">{facility.id ? '1 facilité' : ''}</span></div>
            <span className="status ok">Vérifiée</span>
          </div>
        </div>
      ))}
      <button className="btn" style={{ marginTop: 10 }} type="button" disabled><Plus size={14} /> Créer une compagnie</button>
    </section>
  );
}
