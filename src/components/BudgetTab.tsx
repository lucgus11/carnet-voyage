import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';
import type { Expense, ExpenseCategory } from '@/types';

const CATEGORIES: ExpenseCategory[] = ['Transport', 'Logement', 'Repas', 'Loisirs', 'Autre'];
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Transport: '#3B6E8F',
  Logement: '#C9A24B',
  Repas: '#6B8F71',
  Loisirs: '#8A5FA6',
  Autre: '#B5563F'
};

export default function BudgetTab() {
  const { trip, tripId } = useTrip();
  const [showForm, setShowForm] = useState(false);
  const expenses = useLiveQuery(
    () => db.expenses.where('tripId').equals(tripId).reverse().sortBy('date'),
    [tripId]
  );

  const totalSpent = useMemo(() => (expenses ?? []).reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const budgetTotal = trip?.budgetTotal ?? 0;
  const remaining = budgetTotal > 0 ? budgetTotal - totalSpent : null;
  const currency = trip?.currency ?? 'EUR';

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const cat of CATEGORIES) map.set(cat, 0);
    for (const e of expenses ?? []) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return CATEGORIES.map((cat) => ({ name: cat, value: map.get(cat) ?? 0 })).filter((d) => d.value > 0);
  }, [expenses]);

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', marginBottom: 20 }}>
        <StatCard label="Dépensé" value={formatMoney(totalSpent, currency)} accent="var(--color-rust)" />
        <StatCard
          label={budgetTotal > 0 ? 'Reste disponible' : 'Budget'}
          value={remaining !== null ? formatMoney(remaining, currency) : 'Illimité'}
          accent={remaining !== null && remaining < 0 ? 'var(--color-rust)' : 'var(--color-sage)'}
        />
        <StatCard label="Prévisionnel" value={budgetTotal > 0 ? formatMoney(budgetTotal, currency) : '—'} accent="var(--color-brass)" />
      </div>

      {byCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Répartition par catégorie</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: 220, height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={CATEGORY_COLORS[d.name as ExpenseCategory]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {byCategory.map((d) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-paper-line)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[d.name as ExpenseCategory] }} />
                    {d.name}
                  </span>
                  <span className="mono">{formatMoney(d.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {byCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Comparatif des catégories</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-line)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatMoney(v, currency)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {byCategory.map((d) => (
                    <Cell key={d.name} fill={CATEGORY_COLORS[d.name as ExpenseCategory]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="section-title">
        <h3 style={{ fontSize: '1.05rem' }}>Dépenses</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Ajouter une dépense</button>
      </div>

      {showForm && <ExpenseForm tripId={tripId} currency={currency} onClose={() => setShowForm(false)} />}

      {expenses === undefined || expenses.length === 0 ? (
        <div className="empty-state">Aucune dépense enregistrée.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card">
      <p className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
      <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: accent, margin: '4px 0 0' }}>{value}</p>
    </div>
  );
}

function ExpenseForm({ tripId, currency, onClose }: { tripId: string; currency: string; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Repas');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!label.trim() || !Number.isFinite(value) || value <= 0) return;
    const expense: Expense = {
      id: uuid(),
      tripId,
      label: label.trim(),
      amount: value,
      category,
      date,
      createdAt: new Date().toISOString()
    };
    await db.expenses.add(expense);
    onClose();
  }

  return (
    <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label htmlFor="exp-label">Libellé</label>
          <input id="exp-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Billet de train" autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="exp-amount">Montant ({currency})</label>
          <input id="exp-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="exp-cat">Catégorie</label>
          <select id="exp-cat" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="exp-date">Date</label>
          <input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </div>
    </form>
  );
}

function ExpenseRow({ expense, currency }: { expense: Expense; currency: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--color-paper-line)' }}>
      <span className="chip" style={{ background: `${CATEGORY_COLORS[expense.category]}22`, color: CATEGORY_COLORS[expense.category] }}>
        {expense.category}
      </span>
      <span style={{ flex: 1 }}>{expense.label}</span>
      <span className="muted mono" style={{ fontSize: '0.8rem' }}>{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
      <span className="mono" style={{ fontWeight: 700 }}>{formatMoney(expense.amount, currency)}</span>
      <button className="btn btn-ghost btn-sm" onClick={() => db.expenses.delete(expense.id)}>✕</button>
    </div>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
