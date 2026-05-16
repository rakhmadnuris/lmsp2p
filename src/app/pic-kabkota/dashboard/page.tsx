'use client';
import { useState, useEffect } from 'react';

type Participant = {
  id: string; username: string; currentStage: number;
  stage3Unlocked: boolean; stage5Unlocked: boolean; stage6Unlocked: boolean;
  progress?: { stage1Notes?: string|null; stage1Done: boolean; stage2Notes?: string|null; stage2Done: boolean; stage3Score?: number|null; stage3Done: boolean; stage4Done: boolean; stage5Plan?: string|null; stage5Done: boolean; stage6Score?: number|null; stage6Done: boolean; } | null;
  certificate?: { fullName: string } | null;
};

export default function PicKabkotaDashboard() {
  const [users, setUsers] = useState<Participant[]>([]);
  const [discussionDate, setDiscussionDate] = useState('');
  const [discussionMode, setDiscussionMode] = useState('luring');
  const [discussionZoom, setDiscussionZoom] = useState('');
  const [discussionLokasi, setDiscussionLokasi] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Participant|null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard'|'rekap'>('dashboard');
  const [sortField, setSortField] = useState<'stage3'|'stage6'>('stage3');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([fetch('/api/pic/users'), fetch('/api/pic/discussion')]);
      const ud = await uRes.json(); const dd = await dRes.json();
      if (Array.isArray(ud)) setUsers(ud);
      if (Array.isArray(dd) && dd.length > 0) {
        setDiscussionDate(dd[0].date || '');
        setDiscussionMode(dd[0].mode || 'luring');
        setDiscussionZoom(dd[0].zoomLink || '');
        setDiscussionLokasi(dd[0].location || '');
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateDiscussion = async () => {
    if (!discussionDate) return alert('Pilih tanggal terlebih dahulu');
    const res = await fetch('/api/pic/discussion', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ date: discussionDate, mode: discussionMode, zoomLink: discussionZoom||null, location: discussionLokasi||null }),
    });
    if (res.ok) alert('Jadwal diskusi berhasil diperbarui!');
    else alert('Gagal memperbarui jadwal');
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert('Isi username dan password');
    setAdding(true);
    const res = await fetch('/api/pic/users', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) { alert('Peserta berhasil ditambahkan'); setUsername(''); setPassword(''); fetchData(); }
    else alert(data.error || 'Gagal menambahkan peserta');
    setAdding(false);
  };

  const handleToggleAccess = async (stage: number, value: boolean) => {
    setTogglingAccess(true);
    await fetch('/api/pic/regions', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ stage, value }),
    });
    fetchData(); setTogglingAccess(false);
  };

  if (loading) return <div style={{color:'var(--text-muted)',padding:'2rem'}}>Memuat data...</div>;

  const totalSelesai = users.filter(u=>u.certificate).length;
  const ranked = [...users].sort((a,b)=>{
    const as = sortField==='stage3'?(a.progress?.stage3Score??-1):(a.progress?.stage6Score??-1);
    const bs = sortField==='stage3'?(b.progress?.stage3Score??-1):(b.progress?.stage6Score??-1);
    return bs-as;
  });

  const pill = (done: boolean, label: string) => (
    <span style={{display:'inline-block',padding:'0.15rem 0.5rem',borderRadius:'999px',fontSize:'0.7rem',fontWeight:600,background:done?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.06)',color:done?'#4ade80':'var(--text-muted)',border:`1px solid ${done?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.1)'}`}}>{label}</span>
  );

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button onClick={()=>setActiveTab(tab)} style={{padding:'0.6rem 1.2rem',borderRadius:'0.5rem',fontWeight:activeTab===tab?600:400,cursor:'pointer',fontSize:'0.875rem',background:activeTab===tab?'var(--primary)':'rgba(255,255,255,0.04)',color:activeTab===tab?'white':'var(--text-muted)',border:activeTab===tab?'none':'1px solid rgba(255,255,255,0.08)'}}>{label}</button>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <h1 style={{fontSize:'1.5rem',color:'var(--text-main)'}}>Dashboard PIC Kabupaten/Kota</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {tabBtn('dashboard','📊 Dashboard')}
          {tabBtn('rekap','📋 Rekap Data')}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        {[
          {label:'Total Peserta',value:users.length,sub:`dari maks. 40`,color:'var(--gold-light)'},
          {label:'Sudah Selesai',value:totalSelesai,sub:'peserta bersertifikat',color:'#4ade80'},
          {label:'Dalam Proses',value:users.length-totalSelesai,sub:'belum selesai',color:'var(--secondary)'},
        ].map(s=>(
          <div key={s.label} className="glass-panel" style={{textAlign:'center'}}>
            <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginBottom:'0.4rem'}}>{s.label}</p>
            <p style={{fontSize:'2rem',fontWeight:800,color:s.color}}>{s.value}</p>
            <p style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TAB DASHBOARD ── */}
      {activeTab==='dashboard' && (
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.5rem'}}>
            {/* Jadwal Diskusi */}
            <div className="glass-panel">
              <h3 style={{marginBottom:'1rem',color:'var(--secondary)'}}>📅 Jadwal Diskusi Tahap 4</h3>
              <input type="date" value={discussionDate} onChange={e=>setDiscussionDate(e.target.value)} className="input-field" style={{marginBottom:'0.5rem'}} />
              <select value={discussionMode} onChange={e=>setDiscussionMode(e.target.value)} className="input-field" style={{marginBottom:'0.5rem',appearance:'auto'}}>
                <option value="luring">Luring</option>
                <option value="daring">Daring</option>
              </select>
              {discussionMode==='daring' && (
                <input type="url" value={discussionZoom} onChange={e=>setDiscussionZoom(e.target.value)} className="input-field" placeholder="Link Zoom (opsional)" style={{marginBottom:'0.5rem'}} />
              )}
              {discussionMode==='luring' && (
                <input type="text" value={discussionLokasi} onChange={e=>setDiscussionLokasi(e.target.value)} className="input-field" placeholder="Lokasi pelaksanaan (opsional)" style={{marginBottom:'0.5rem'}} />
              )}
              <button onClick={handleUpdateDiscussion} className="btn btn-primary" style={{width:'100%'}}>Simpan Jadwal</button>
            </div>

            {/* Tambah Peserta */}
            <div className="glass-panel">
              <h3 style={{marginBottom:'1rem',color:'var(--secondary)'}}>➕ Tambah Peserta ({users.length}/40)</h3>
              <form onSubmit={handleAddParticipant}>
                <input type="text" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} className="input-field" style={{marginBottom:'0.5rem'}} />
                <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field" style={{marginBottom:'0.75rem'}} />
                <button type="submit" disabled={adding||users.length>=40} className="btn" style={{width:'100%',background:'rgba(16,185,129,0.2)',color:'#4ade80',border:'1px solid rgba(16,185,129,0.4)'}}>
                  {adding?'Menambahkan...':users.length>=40?'Kuota Penuh (40/40)':'Tambah Peserta'}
                </button>
              </form>
            </div>
          </div>

          {/* Access Control */}
          <div className="glass-panel">
            <h3 style={{marginBottom:'1rem',color:'var(--secondary)'}}>🔐 Buka/Kunci Akses Tahap</h3>
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

          {/* Tabel peserta */}
          <div className="glass-panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
              <h3 style={{color:'var(--text-main)'}}>Daftar Peserta & Progres</h3>
              <button onClick={()=>window.location.href='/api/pic/recap'} className="btn btn-primary">📥 Unduh Rekap (.xlsx)</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.05)',color:'var(--text-muted)'}}>
                    <th style={{padding:'0.75rem 1rem',textAlign:'left'}}>No</th>
                    <th style={{padding:'0.75rem 1rem',textAlign:'left'}}>Username</th>
                    <th style={{padding:'0.75rem',textAlign:'center'}}>Tahap</th>
                    {['T1','T2','T3','T4','T5','T6','Sert'].map(h=><th key={h} style={{padding:'0.75rem 0.5rem',textAlign:'center',minWidth:'44px'}}>{h}</th>)}
                    <th style={{padding:'0.75rem',textAlign:'center'}}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u,i)=>{
                    const pr = u.progress;
                    const stages=[pr?.stage1Done,pr?.stage2Done,pr?.stage3Done,pr?.stage4Done,pr?.stage5Done,pr?.stage6Done,!!u.certificate];
                    return (
                      <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                        <td style={{padding:'0.75rem 1rem',color:'var(--text-muted)'}}>{i+1}</td>
                        <td style={{padding:'0.75rem 1rem',color:'var(--text-main)',fontWeight:600}}>{u.username}</td>
                        <td style={{padding:'0.75rem 0.5rem',textAlign:'center',color:'var(--gold-light)'}}>T{u.currentStage}</td>
                        {stages.map((done,j)=>(
                          <td key={j} style={{padding:'0.5rem',textAlign:'center'}}>
                            <span style={{display:'inline-block',width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px',fontSize:'0.7rem',fontWeight:700,textAlign:'center',background:done?'rgba(74,222,128,0.2)':'rgba(255,255,255,0.05)',color:done?'#4ade80':'var(--text-muted)',border:`1px solid ${done?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.1)'}`}}>{done?'✓':'–'}</span>
                          </td>
                        ))}
                        <td style={{padding:'0.75rem 0.5rem',textAlign:'center'}}>
                          <button onClick={()=>setSelectedUser(selectedUser?.id===u.id?null:u)} style={{padding:'0.3rem 0.7rem',fontSize:'0.75rem',background:'transparent',border:'1px solid var(--secondary)',color:'var(--secondary)',borderRadius:'0.5rem',cursor:'pointer'}}>
                            {selectedUser?.id===u.id?'Tutup':'Lihat'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length===0&&<tr><td colSpan={11} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Belum ada peserta.</td></tr>}
                </tbody>
              </table>
            </div>
            {selectedUser&&(
              <div style={{marginTop:'1.5rem',padding:'1.5rem',background:'rgba(255,255,255,0.03)',borderRadius:'0.75rem',border:'1px solid rgba(255,255,255,0.08)'}}>
                <h4 style={{color:'var(--secondary)',marginBottom:'1rem'}}>Detail: {selectedUser.username}</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
                  {[
                    {label:'📖 Tahap 1 — Catatan',done:selectedUser.progress?.stage1Done,val:undefined},
                    {label:'📝 Tahap 2 — Refleksi',done:selectedUser.progress?.stage2Done,val:undefined},
                    {label:'🧪 Pre-Test (T3)',done:selectedUser.progress?.stage3Done,val:selectedUser.progress?.stage3Score!=null?`Nilai: ${selectedUser.progress.stage3Score}`:undefined},
                    {label:'💬 Diskusi (T4)',done:selectedUser.progress?.stage4Done,val:selectedUser.progress?.stage4Done?'Selesai':undefined},
                    {label:'📋 RTL (T5)',done:selectedUser.progress?.stage5Done,val:undefined},
                    {label:'🏆 Post-Test (T6)',done:selectedUser.progress?.stage6Done,val:selectedUser.progress?.stage6Score!=null?`Nilai: ${selectedUser.progress.stage6Score}`:undefined},
                  ].map((item,idx)=>(
                    <div key={idx} style={{padding:'0.75rem',background:'rgba(255,255,255,0.02)',borderRadius:'0.5rem',border:'1px solid rgba(255,255,255,0.06)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                        <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-main)'}}>{item.label}</span>
                        {pill(!!item.done, item.done?'Selesai':'Belum')}
                      </div>
                      {item.val&&<p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.25rem'}}>{item.val}</p>}
                    </div>
                  ))}
                </div>
                <div style={{marginTop:'1rem',padding:'0.75rem',background:selectedUser.certificate?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.02)',borderRadius:'0.5rem',border:`1px solid ${selectedUser.certificate?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.06)'}`}}>
                  <span style={{fontWeight:700,color:selectedUser.certificate?'#4ade80':'var(--text-muted)'}}>{selectedUser.certificate?'🎓 Sertifikat: Selesai':'⏳ Sertifikat: Belum diperoleh'}</span>
                </div>
              </div>
            )}
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
                <button key={u.id} onClick={()=>setSelectedUser(selectedUser?.id===u.id?null:u)} style={{width:'100%',padding:'0.6rem',marginBottom:'0.3rem',textAlign:'left',cursor:'pointer',borderRadius:'0.5rem',background:selectedUser?.id===u.id?'var(--primary)':'rgba(255,255,255,0.04)',border:`1px solid ${selectedUser?.id===u.id?'transparent':'rgba(255,255,255,0.06)'}`,color:selectedUser?.id===u.id?'white':'var(--text-main)'}}>
                  <div style={{fontWeight:600,fontSize:'0.8rem'}}>{u.username}</div>
                  <div style={{fontSize:'0.7rem',marginTop:'0.2rem',color:selectedUser?.id===u.id?'rgba(255,255,255,0.8)':'var(--gold-light)'}}>Pre:{u.progress?.stage3Score??'–'} / Post:{u.progress?.stage6Score??'–'}</div>
                </button>
              ))}
            </div>
            <div className="glass-panel" style={{flex:1,overflowY:'auto',padding:'1.5rem',minWidth:'300px'}}>
              {selectedUser?(
                <div>
                  <h3 style={{color:'var(--secondary)',marginBottom:'1.5rem'}}>{selectedUser.username}</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1rem'}}>
                    {[
                      {label:'Pre-Test (T3)',val:selectedUser.progress?.stage3Score!=null?`Nilai: ${selectedUser.progress.stage3Score}`:undefined,done:selectedUser.progress?.stage3Done},
                      {label:'Post-Test (T6)',val:selectedUser.progress?.stage6Score!=null?`Nilai: ${selectedUser.progress.stage6Score}`:undefined,done:selectedUser.progress?.stage6Done},
                      {label:'Diskusi (T4)',val:selectedUser.progress?.stage4Done?'Selesai':undefined,done:selectedUser.progress?.stage4Done},
                      {label:'Sertifikat',val:selectedUser.certificate?'Diperoleh':undefined,done:!!selectedUser.certificate},
                    ].map((item,i)=>(
                      <div key={i} style={{padding:'0.75rem',background:'rgba(255,255,255,0.03)',borderRadius:'0.5rem',border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                          <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-main)'}}>{item.label}</span>
                          {pill(!!item.done,item.done?'Selesai':'Belum')}
                        </div>
                        {item.val&&<p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{item.val}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ):(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-muted)'}}>Pilih peserta dari panel kiri.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
