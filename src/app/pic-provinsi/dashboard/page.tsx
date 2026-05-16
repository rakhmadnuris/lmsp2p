'use client';
import { useState, useEffect } from 'react';
import regionsData from '@/lib/regions.json';

const MATERIALS = ['Mat 1','Mat 2','Mat 3','Mat 4','Mat 5','Mat 6'];

type Participant = {
  id: string; username: string; regencyCity?: string | null; currentStage: number;
  stage3Unlocked: boolean; stage5Unlocked: boolean; stage6Unlocked: boolean;
  progress?: { stage3Score?: number|null; stage6Score?: number|null; stage1Done: boolean; stage2Done: boolean; stage3Done: boolean; stage4Done: boolean; stage5Done: boolean; stage6Done: boolean; stage1Notes?: string|null; stage2Notes?: string|null; stage5Plan?: string|null; } | null;
  certificate?: object | null;
};
type DiscussionSession = { id: string; province: string; regencyCity: string; date: string; mode: string; zoomLink?: string|null; location?: string|null; };
type PicKabkota = { id: string; username: string; regencyCity: string | null; createdAt: string; };
type RegencyStat = { total: number; completed: number; avgPre: number|null; avgPost: number|null; stage4Done: number; };

export default function PicProvinsiDashboard() {
  const [users, setUsers] = useState<Participant[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSession[]>([]);
  const [picKabkotas, setPicKabkotas] = useState<PicKabkota[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard'|'rekap'|'pic'>('dashboard');
  const [picProvince, setPicProvince] = useState('');

  // Jadwal form
  const [editingRegency, setEditingRegency] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMode, setEditMode] = useState('luring');
  const [editZoom, setEditZoom] = useState('');
  const [editLokasi, setEditLokasi] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  // Access control
  const [accessRC, setAccessRC] = useState('');
  const [togglingAccess, setTogglingAccess] = useState(false);

  // Tambah PIC Kabkota
  const [newPicUsername, setNewPicUsername] = useState('');
  const [newPicPassword, setNewPicPassword] = useState('');
  const [newPicRC, setNewPicRC] = useState('');
  const [addingPic, setAddingPic] = useState(false);

  // Rekap individual
  const [selectedUser, setSelectedUser] = useState<Participant|null>(null);
  const [sortField, setSortField] = useState<'stage3'|'stage6'>('stage3');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, pRes] = await Promise.all([
        fetch('/api/pic/users'), fetch('/api/pic/discussion'), fetch('/api/pic/pic-kabkota'),
      ]);
      const ud = await uRes.json(); const dd = await dRes.json(); const pd = await pRes.json();
      if (Array.isArray(ud)) setUsers(ud);
      if (Array.isArray(dd)) setDiscussions(dd);
      if (Array.isArray(pd)) setPicKabkotas(pd);
      // ambil provinsi dari session info (dari user pertama atau via endpoint)
      const meRes = await fetch('/api/pic/profile');
      const me = await meRes.json();
      if (me?.province) setPicProvince(me.province);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegency || !editDate) return alert('Pilih Kabupaten/Kota dan tanggal');
    setSavingDate(true);
    const res = await fetch('/api/pic/discussion', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ regencyCity: editingRegency, date: editDate, mode: editMode, zoomLink: editZoom||null, location: editLokasi||null }),
    });
    if (res.ok) { alert('Jadwal diskusi berhasil diperbarui!'); setEditingRegency(''); setEditDate(''); setEditZoom(''); setEditLokasi(''); fetchData(); }
    else alert('Gagal memperbarui jadwal');
    setSavingDate(false);
  };

  const handleToggleAccess = async (stage: number, value: boolean) => {
    setTogglingAccess(true);
    await fetch('/api/pic/regions', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ stage, value, regencyCity: accessRC || undefined }),
    });
    fetchData(); setTogglingAccess(false);
  };

  const handleAddPicKabkota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicUsername || !newPicPassword || !newPicRC) return alert('Isi semua field');
    setAddingPic(true);
    const res = await fetch('/api/pic/pic-kabkota', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username: newPicUsername, password: newPicPassword, regencyCity: newPicRC }),
    });
    const data = await res.json();
    if (res.ok) { alert('PIC Kabupaten/Kota berhasil ditambahkan!'); setNewPicUsername(''); setNewPicPassword(''); setNewPicRC(''); fetchData(); }
    else alert(data.error || 'Gagal menambahkan PIC');
    setAddingPic(false);
  };

  const handleDeletePic = async (id: string, username: string) => {
    if (!confirm(`Hapus akun PIC "${username}"?`)) return;
    const res = await fetch(`/api/pic/pic-kabkota?id=${id}`, { method: 'DELETE' });
    if (res.ok) { alert('PIC berhasil dihapus.'); fetchData(); }
    else alert('Gagal menghapus PIC.');
  };

  if (loading) return <div style={{color:'var(--text-muted)',padding:'2rem'}}>Memuat data...</div>;

  const regencyStats: Record<string,RegencyStat> = {};
  users.forEach(u => {
    const rc = u.regencyCity || 'Tidak Diketahui';
    if (!regencyStats[rc]) regencyStats[rc] = {total:0,completed:0,avgPre:null,avgPost:null,stage4Done:0};
    regencyStats[rc].total++;
    if (u.certificate) regencyStats[rc].completed++;
    if (u.progress?.stage4Done) regencyStats[rc].stage4Done++;
  });
  Object.keys(regencyStats).forEach(rc => {
    const g = users.filter(u=>(u.regencyCity||'Tidak Diketahui')===rc);
    const pre = g.filter(u=>u.progress?.stage3Score!=null).map(u=>u.progress!.stage3Score!);
    const post = g.filter(u=>u.progress?.stage6Score!=null).map(u=>u.progress!.stage6Score!);
    regencyStats[rc].avgPre = pre.length>0 ? +(pre.reduce((a,b)=>a+b,0)/pre.length).toFixed(1) : null;
    regencyStats[rc].avgPost = post.length>0 ? +(post.reduce((a,b)=>a+b,0)/post.length).toFixed(1) : null;
  });
  const regencyNames = Object.keys(regencyStats).sort();

  const availableCities: string[] = picProvince ? ((regionsData as any)[picProvince] || []) : [];

  const ranked = [...users].sort((a,b)=>{
    const as = sortField==='stage3'?(a.progress?.stage3Score??-1):(a.progress?.stage6Score??-1);
    const bs = sortField==='stage3'?(b.progress?.stage3Score??-1):(b.progress?.stage6Score??-1);
    return bs-as;
  });

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button onClick={()=>setActiveTab(tab)} style={{
      padding:'0.6rem 1.2rem', borderRadius:'0.5rem', fontWeight: activeTab===tab?600:400, cursor:'pointer', fontSize:'0.875rem',
      background: activeTab===tab?'var(--primary)':'rgba(255,255,255,0.04)',
      color: activeTab===tab?'white':'var(--text-muted)',
      border: activeTab===tab?'none':'1px solid rgba(255,255,255,0.08)',
    }}>{label}</button>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <h1 style={{fontSize:'1.5rem',color:'var(--text-main)'}}>Dashboard PIC Provinsi</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {tabBtn('dashboard','🌍 Dashboard')}
          {tabBtn('rekap','📊 Rekap Data')}
          {tabBtn('pic','👥 Kelola PIC Kab/Kota')}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        {[
          {label:'Kab/Kota Aktif',value:regencyNames.length,color:'var(--secondary)'},
          {label:'Total Peserta',value:users.length,color:'var(--gold-light)'},
          {label:'Sudah Selesai',value:users.filter(u=>u.certificate).length,color:'#4ade80'},
          {label:'PIC Kab/Kota',value:picKabkotas.length,color:'#06b6d4'},
        ].map(s=>(
          <div key={s.label} className="glass-panel" style={{textAlign:'center'}}>
            <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginBottom:'0.4rem'}}>{s.label}</p>
            <p style={{fontSize:'2rem',fontWeight:800,color:s.color}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TAB DASHBOARD ── */}
      {activeTab==='dashboard' && (
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          {/* Jadwal Diskusi */}
          <div className="glass-panel">
            <h3 style={{marginBottom:'1rem',color:'var(--secondary)'}}>📅 Atur Jadwal Diskusi Tahap 4</h3>
            <form onSubmit={handleUpdateDiscussion} style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <select value={editingRegency} onChange={e=>setEditingRegency(e.target.value)} className="input-field" style={{flex:1,minWidth:'180px'}}>
                <option value="">-- Pilih Kabupaten/Kota --</option>
                {regencyNames.map(rc=><option key={rc} value={rc}>{rc}</option>)}
              </select>
              <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="input-field" style={{flex:1,minWidth:'160px'}} />
              <select value={editMode} onChange={e=>setEditMode(e.target.value)} className="input-field" style={{minWidth:'140px'}}>
                <option value="luring">Luring</option>
                <option value="daring">Daring</option>
              </select>
              {editMode==='daring' && (
                <input type="url" value={editZoom} onChange={e=>setEditZoom(e.target.value)} className="input-field" placeholder="Link Zoom (opsional)" style={{flex:2,minWidth:'200px'}} />
              )}
              {editMode==='luring' && (
                <input type="text" value={editLokasi} onChange={e=>setEditLokasi(e.target.value)} className="input-field" placeholder="Lokasi pelaksanaan (opsional)" style={{flex:2,minWidth:'200px'}} />
              )}
              <button type="submit" disabled={savingDate} className="btn btn-primary">
                {savingDate?'Menyimpan...':'Simpan Jadwal'}
              </button>
            </form>
          </div>

          {/* Access Control */}
          <div className="glass-panel">
            <h3 style={{marginBottom:'1rem',color:'var(--secondary)'}}>🔐 Buka/Kunci Akses Tahap</h3>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'1rem'}}>
              <select value={accessRC} onChange={e=>setAccessRC(e.target.value)} className="input-field" style={{flex:1,minWidth:'200px'}}>
                <option value="">Semua Kab/Kota (se-Provinsi)</option>
                {regencyNames.map(rc=><option key={rc} value={rc}>{rc}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
              {[{stage:3,label:'Tahap 3 (Pre-Test)'},{stage:5,label:'Tahap 5 (RTL)'},{stage:6,label:'Tahap 6 (Post-Test)'}].map(({stage,label})=>(
                <div key={stage}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.5rem',fontWeight:600}}>{label}</div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button disabled={togglingAccess} onClick={()=>handleToggleAccess(stage,true)} className="btn" style={{flex:1,padding:'0.5rem',background:'rgba(34,197,94,0.1)',border:'1px solid var(--success)',color:'var(--success)',fontSize:'0.8rem'}}>Buka</button>
                    <button disabled={togglingAccess} onClick={()=>handleToggleAccess(stage,false)} className="btn" style={{flex:1,padding:'0.5rem',background:'rgba(255,43,43,0.1)',border:'1px solid var(--error)',color:'var(--error)',fontSize:'0.8rem'}}>Kunci</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel per Kabupaten/Kota */}
          <div className="glass-panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
              <h3 style={{color:'var(--text-main)'}}>Statistik per Kabupaten/Kota</h3>
              <button onClick={()=>window.location.href='/api/pic/recap'} className="btn btn-primary" style={{fontSize:'0.8rem'}}>📥 Unduh Rekap Provinsi (.xlsx)</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.05)',textAlign:'left',color:'var(--text-muted)'}}>
                    {['No','Kabupaten/Kota','Peserta','Selesai','% Selesai','Diskusi (T4)','Rata Pre','Rata Post','Jadwal Diskusi'].map(h=>(
                      <th key={h} style={{padding:'0.75rem 0.75rem',textAlign: h==='No'||h==='Kabupaten/Kota'?'left':'center'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regencyNames.map((rc,i)=>{
                    const stat=regencyStats[rc];
                    const disc=discussions.find(d=>d.regencyCity===rc);
                    const pct=stat.total>0?Math.round((stat.completed/stat.total)*100):0;
                    return (
                      <tr key={rc} style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                        <td style={{padding:'0.75rem 1rem',color:'var(--text-muted)'}}>{i+1}</td>
                        <td style={{padding:'0.75rem 1rem',color:'var(--text-main)',fontWeight:600}}>{rc}</td>
                        <td style={{padding:'0.75rem',textAlign:'center',color:'var(--gold-light)'}}>{stat.total}</td>
                        <td style={{padding:'0.75rem',textAlign:'center',color:stat.completed>0?'#4ade80':'var(--text-muted)'}}>{stat.completed}</td>
                        <td style={{padding:'0.75rem',textAlign:'center'}}>
                          <span style={{color:pct===100?'#4ade80':'var(--text-muted)',fontSize:'0.75rem'}}>{pct}%</span>
                        </td>
                        <td style={{padding:'0.75rem',textAlign:'center',color:'var(--text-muted)'}}>{stat.stage4Done}/{stat.total}</td>
                        <td style={{padding:'0.75rem',textAlign:'center',color:stat.avgPre!==null?'var(--gold-light)':'var(--text-muted)'}}>{stat.avgPre??'–'}</td>
                        <td style={{padding:'0.75rem',textAlign:'center',color:stat.avgPost!==null?'#4ade80':'var(--text-muted)'}}>{stat.avgPost??'–'}</td>
                        <td style={{padding:'0.75rem 1rem',textAlign:'center',fontSize:'0.75rem'}}>
                          {disc?(
                            <div>
                              <div style={{color:'var(--gold-light)'}}>{new Date(disc.date).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}</div>
                              <div style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>{disc.mode==='daring'?'🌐 Daring':'📍 Luring'}</div>
                              {disc.mode==='daring'&&disc.zoomLink&&<a href={disc.zoomLink} target="_blank" rel="noopener noreferrer" style={{color:'#06b6d4',fontSize:'0.7rem'}}>🔗 Zoom</a>}
                              {disc.mode==='luring'&&disc.location&&<div style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>📍 {disc.location}</div>}
                            </div>
                          ):<span style={{color:'var(--error)'}}>Belum Diatur</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {regencyNames.length===0&&<tr><td colSpan={9} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Belum ada kabupaten/kota aktif.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB REKAP ── */}
      {activeTab==='rekap' && (
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            <button onClick={()=>setSortField('stage3')} style={{padding:'0.5rem 1rem',background:sortField==='stage3'?'var(--primary)':'rgba(255,255,255,0.04)',border:'none',color:sortField==='stage3'?'white':'var(--text-muted)',borderRadius:'0.5rem',cursor:'pointer'}}>Pre-Test</button>
            <button onClick={()=>setSortField('stage6')} style={{padding:'0.5rem 1rem',background:sortField==='stage6'?'var(--primary)':'rgba(255,255,255,0.04)',border:'none',color:sortField==='stage6'?'white':'var(--text-muted)',borderRadius:'0.5rem',cursor:'pointer'}}>Post-Test</button>
          </div>
          <div style={{display:'flex',gap:'1.5rem',minHeight:'500px',flexWrap:'wrap'}}>
            <div className="glass-panel" style={{width:'220px',flexShrink:0,overflowY:'auto',padding:'1rem'}}>
              <h4 style={{color:'var(--secondary)',marginBottom:'0.75rem',fontSize:'0.9rem'}}>Peserta ({users.length})</h4>
              {ranked.map(u=>(
                <button key={u.id} onClick={()=>setSelectedUser(selectedUser?.id===u.id?null:u)} style={{
                  width:'100%',padding:'0.6rem',marginBottom:'0.3rem',textAlign:'left',cursor:'pointer',borderRadius:'0.5rem',
                  background:selectedUser?.id===u.id?'var(--primary)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${selectedUser?.id===u.id?'transparent':'rgba(255,255,255,0.06)'}`,
                  color:selectedUser?.id===u.id?'white':'var(--text-main)',
                }}>
                  <div style={{fontWeight:600,fontSize:'0.8rem'}}>{u.username}</div>
                  <div style={{fontSize:'0.7rem',color:selectedUser?.id===u.id?'rgba(255,255,255,0.7)':'var(--text-muted)'}}>{u.regencyCity}</div>
                  <div style={{fontSize:'0.7rem',marginTop:'0.2rem',color:selectedUser?.id===u.id?'rgba(255,255,255,0.8)':'var(--gold-light)'}}>
                    Pre:{u.progress?.stage3Score??'–'} / Post:{u.progress?.stage6Score??'–'}
                  </div>
                </button>
              ))}
            </div>
            <div className="glass-panel" style={{flex:1,overflowY:'auto',padding:'1.5rem',minWidth:'300px'}}>
              {selectedUser?(
                <div>
                  <h3 style={{color:'var(--secondary)',marginBottom:'0.5rem'}}>{selectedUser.username}</h3>
                  <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginBottom:'1.5rem'}}>{selectedUser.regencyCity}</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1rem'}}>
                    {[
                      {label:'Pre-Test (T3)',val:selectedUser.progress?.stage3Score!=null?`Nilai: ${selectedUser.progress.stage3Score}`:undefined,done:selectedUser.progress?.stage3Done},
                      {label:'Post-Test (T6)',val:selectedUser.progress?.stage6Score!=null?`Nilai: ${selectedUser.progress.stage6Score}`:undefined,done:selectedUser.progress?.stage6Done},
                      {label:'Diskusi (T4)',val:selectedUser.progress?.stage4Done?'Selesai mengikuti diskusi':undefined,done:selectedUser.progress?.stage4Done},
                      {label:'Sertifikat',val:selectedUser.certificate?'Diperoleh':undefined,done:!!selectedUser.certificate},
                    ].map((item,i)=>(
                      <div key={i} style={{padding:'0.75rem',background:'rgba(255,255,255,0.03)',borderRadius:'0.5rem',border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                          <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-main)'}}>{item.label}</span>
                          <span style={{fontSize:'0.7rem',padding:'0.1rem 0.5rem',borderRadius:'999px',background:item.done?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.06)',color:item.done?'#4ade80':'var(--text-muted)',border:`1px solid ${item.done?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.1)'}`}}>{item.done?'Selesai':'Belum'}</span>
                        </div>
                        {item.val&&<p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{item.val}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ):(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-muted)'}}>
                  Pilih peserta dari panel kiri untuk melihat detail rekap.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB PIC ── */}
      {activeTab==='pic' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem',flexWrap:'wrap'}}>
          <div className="glass-panel">
            <h3 style={{color:'var(--secondary)',marginBottom:'1.25rem'}}>➕ Tambah PIC Kabupaten/Kota</h3>
            <form onSubmit={handleAddPicKabkota} style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div>
                <label className="input-label">Kabupaten/Kota</label>
                <select className="input-field" value={newPicRC} onChange={e=>setNewPicRC(e.target.value)} style={{appearance:'auto'}} required>
                  <option value="">-- Pilih Kabupaten/Kota --</option>
                  {availableCities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Username PIC</label>
                <input type="text" className="input-field" value={newPicUsername} onChange={e=>setNewPicUsername(e.target.value)} placeholder="username baru" required />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input type="password" className="input-field" value={newPicPassword} onChange={e=>setNewPicPassword(e.target.value)} placeholder="min. 8 karakter" required />
              </div>
              <button type="submit" disabled={addingPic} className="btn btn-primary">{addingPic?'Menyimpan...':'Tambah PIC'}</button>
            </form>
          </div>
          <div className="glass-panel">
            <h3 style={{color:'var(--text-main)',marginBottom:'1.25rem'}}>Daftar PIC Kab/Kota ({picKabkotas.length})</h3>
            {picKabkotas.length===0?(
              <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>Belum ada PIC Kabupaten/Kota.</p>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {picKabkotas.map(pic=>(
                  <div key={pic.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 1rem',background:'rgba(255,255,255,0.03)',borderRadius:'0.5rem',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:'0.875rem',color:'var(--text-main)'}}>{pic.username}</div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{pic.regencyCity}</div>
                    </div>
                    <button onClick={()=>handleDeletePic(pic.id,pic.username)} style={{padding:'0.3rem 0.75rem',fontSize:'0.75rem',background:'rgba(255,43,43,0.1)',border:'1px solid var(--error)',color:'var(--error)',borderRadius:'0.5rem',cursor:'pointer'}}>Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
