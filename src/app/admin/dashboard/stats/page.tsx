'use client';
import { useState, useEffect } from 'react';

type KabKotaStat = {
  regencyCity: string;
  totalPeserta: number;
  selesai: number;
  avgPre: number | null;
  avgPost: number | null;
  hasPicKabkota: boolean;
  discussionDate: string | null;
};

type ProvinceStat = {
  province: string;
  hasPicProvinsi: boolean;
  totalPeserta: number;
  selesai: number;
  avgPre: number | null;
  avgPost: number | null;
  kabkotas: KabKotaStat[];
};

type Summary = {
  totalProvinsi: number;
  totalKabkota: number;
  totalPeserta: number;
  totalSelesai: number;
  totalPicProvinsi: number;
  totalPicKabkota: number;
};

export default function AdminStatsPage() {
  const [data, setData] = useState<{ summary: Summary; provinces: ProvinceStat[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Memuat statistik...</div>;
  if (!data) return <div style={{ color: 'var(--error)', padding: '2rem' }}>Gagal memuat data.</div>;

  const { summary, provinces } = data;

  const filteredProvinces = provinces.filter(p =>
    p.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kabkotas.some(k => k.regencyCity.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '2rem' }}>
        📈 Statistik & Monitoring Nasional
      </h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Provinsi', value: summary.totalProvinsi, color: 'var(--primary)' },
          { label: 'Total Kab/Kota', value: summary.totalKabkota, color: 'var(--secondary)' },
          { label: 'Total Peserta', value: summary.totalPeserta, color: 'var(--gold-light)' },
          { label: 'Selesai Program', value: summary.totalSelesai, color: '#4ade80' },
          { label: 'PIC Provinsi', value: summary.totalPicProvinsi, color: '#06b6d4' },
          { label: 'PIC Kab/Kota', value: summary.totalPicKabkota, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Total */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Progress Nasional</span>
          <span style={{ fontWeight: 700, color: '#4ade80' }}>{pct(summary.totalSelesai, summary.totalPeserta)}% Selesai</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct(summary.totalSelesai, summary.totalPeserta)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #4ade80)', borderRadius: '4px', transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Cari provinsi atau kabupaten/kota..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Province List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredProvinces.map(prov => {
          const isExpanded = expandedProvince === prov.province;
          const completePct = pct(prov.selesai, prov.totalPeserta);

          return (
            <div key={prov.province} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Province Header — clickable */}
              <div
                onClick={() => setExpandedProvince(isExpanded ? null : prov.province)}
                style={{
                  padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                  transition: 'background 0.2s',
                  background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent',
                }}
              >
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s', display: 'inline-block' }}>▶</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{prov.province}</span>
                    {prov.hasPicProvinsi
                      ? <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '999px' }}>✓ PIC</span>
                      : <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', background: 'rgba(255,43,43,0.1)', color: 'var(--error)', border: '1px solid rgba(255,43,43,0.2)', borderRadius: '999px' }}>Belum ada PIC</span>
                    }
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov.kabkotas.length} Kabupaten/Kota</div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)' }}>{prov.totalPeserta}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Peserta</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>{prov.selesai}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Selesai</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: prov.avgPre !== null ? 'var(--secondary)' : 'var(--text-muted)' }}>
                      {prov.avgPre !== null ? prov.avgPre : '–'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Rata Pre</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: prov.avgPost !== null ? '#4ade80' : 'var(--text-muted)' }}>
                      {prov.avgPost !== null ? prov.avgPost : '–'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Rata Post</div>
                  </div>
                  <div style={{ minWidth: '100px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ color: completePct === 100 ? '#4ade80' : 'var(--text-muted)', fontWeight: 600 }}>{completePct}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${completePct}%`, height: '100%', background: completePct === 100 ? '#4ade80' : 'var(--secondary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kabkota Breakdown */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left' }}>Kabupaten/Kota</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>PIC</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Peserta</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Selesai</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>% Selesai</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pre-Test</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Post-Test</th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>Jadwal Diskusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prov.kabkotas.map((kk, i) => {
                          const kkPct = pct(kk.selesai, kk.totalPeserta);
                          return (
                            <tr key={kk.regencyCity} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                              <td style={{ padding: '0.75rem 1.5rem', color: 'var(--text-main)', fontWeight: 500 }}>{kk.regencyCity}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                {kk.hasPicKabkota
                                  ? <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>✓ Ada</span>
                                  : <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>Belum</span>}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--gold-light)', fontWeight: 600 }}>{kk.totalPeserta}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', color: kk.selesai > 0 ? '#4ade80' : 'var(--text-muted)' }}>{kk.selesai}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                                  <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${kkPct}%`, height: '100%', background: kkPct === 100 ? '#4ade80' : 'var(--secondary)', borderRadius: '3px' }} />
                                  </div>
                                  <span style={{ color: kkPct === 100 ? '#4ade80' : 'var(--text-muted)', fontSize: '0.7rem' }}>{kkPct}%</span>
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', color: kk.avgPre !== null ? 'var(--secondary)' : 'var(--text-muted)' }}>
                                {kk.avgPre !== null ? kk.avgPre : '–'}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', color: kk.avgPost !== null ? '#4ade80' : 'var(--text-muted)' }}>
                                {kk.avgPost !== null ? kk.avgPost : '–'}
                              </td>
                              <td style={{ padding: '0.75rem 1.5rem', textAlign: 'center', color: kk.discussionDate ? 'var(--gold-light)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {kk.discussionDate
                                  ? new Date(kk.discussionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : 'Belum diatur'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredProvinces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
