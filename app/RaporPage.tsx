// app/RaporPage.tsx
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform
} from 'react-native';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

const tl = (n:any) => 'TL '+new Intl.NumberFormat('tr-TR').format(Math.round(Number(n)||0));
const pct = (g:number,s:number) => s ? Math.round(g/s*100*100)/100 : 0;

const printHTML = (html:string, title:string) => {
  const printWindow = window.open('','_blank','width=800,height=600');
  if(!printWindow) { Alert.alert('Hata','Popup engellendi, tarayici ayarlarindan izin verin'); return; }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(()=>{ printWindow.print(); }, 500);
};

const hakedisHTML = (hakedisData:any[], hakedisNo:string) => {
  const disiplinler = ['Insaat','Elektrik','Mekanik'];
  const rows = disiplinler.map(d=>{
    const dis = hakedisData.filter((k:any)=>k.disiplin===d);
    const soz = dis.reduce((s:number,k:any)=>s+(k.sozlesmeBedeli||0),0);
    const ger = dis.reduce((s:number,k:any)=>s+(k.gerceklesen||0),0);
    return {disiplin:d, sozlesme:soz, gerceklesen:ger, kalan:soz-ger, pursantaj:pct(ger,soz)};
  });
  const topSoz = rows.reduce((s,r)=>s+r.sozlesme,0);
  const topGer = rows.reduce((s,r)=>s+r.gerceklesen,0);
  const topKal = topSoz-topGer;
  const topPct = pct(topGer,topSoz);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Hakedis ${hakedisNo}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;font-size:12px;}
    .header{background:#1a3a5c;color:white;padding:20px;text-align:center;margin-bottom:20px;border-radius:8px;}
    .header h1{margin:0;font-size:18px;}
    .header p{margin:5px 0 0;font-size:12px;opacity:0.8;}
    .info-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    .info-table td{padding:8px 12px;border:1px solid #ddd;font-size:12px;}
    .info-table td:first-child{background:#f5f5f5;font-weight:bold;width:200px;}
    .section-title{background:#2c5282;color:white;padding:10px 15px;font-weight:bold;margin:20px 0 10px;border-radius:4px;}
    .data-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    .data-table th{background:#2c5282;color:white;padding:10px;text-align:center;font-size:12px;}
    .data-table td{padding:9px 10px;border:1px solid #ddd;text-align:center;font-size:12px;}
    .data-table tr:nth-child(even){background:#f9f9f9;}
    .data-table .total{background:#1a3a5c;color:white;font-weight:bold;}
    .pct-bar{background:#e2e8f0;border-radius:10px;height:12px;overflow:hidden;}
    .pct-fill{height:100%;background:#3b82f6;border-radius:10px;}
    .green{color:#22c55e;font-weight:bold;}
    .amber{color:#f59e0b;font-weight:bold;}
    .red{color:#ef4444;font-weight:bold;}
    .footer{margin-top:40px;padding-top:20px;border-top:2px solid #333;display:flex;justify-content:space-between;}
    .imza{text-align:center;width:200px;}
    .imza-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;}
    @media print{body{padding:10px;}.no-print{display:none;}}
  </style>
  </head><body>
  <div class="header">
    <h1>HAKEDiS RAPORU - No: ${hakedisNo}</h1>
    <p>Konya 906 Konut Projesi - 1. Etap</p>
  </div>
  <table class="info-table">
    <tr><td>Is Adi</td><td>Konya Ili Selcuklu Ilcesi Ardicli Mahallesi 1. Etap 906 Adet Konut</td></tr>
    <tr><td>Muteahhit</td><td>KARMA GLOBAL INSAAT & ARTER TAAHHUT IS ORTAKLIGI</td></tr>
    <tr><td>Musavir</td><td>UCER MUSAVIR MUHENDISLIK A.S.</td></tr>
    <tr><td>Ihale Bedeli</td><td><strong>${tl(2149000000)}</strong></td></tr>
    <tr><td>Is Suresi</td><td>600 Gun</td></tr>
    <tr><td>Hakedis No</td><td><strong>${hakedisNo}</strong></td></tr>
    <tr><td>Hakedis Tarihi</td><td>${new Date().toLocaleDateString('tr-TR')}</td></tr>
    <tr><td>Genel Pursantaj</td><td><strong class="${topPct>=50?'green':topPct>=20?'amber':'red'}">${topPct}%</strong></td></tr>
  </table>
  <div class="section-title">DISiPLiN BAZLI OZET</div>
  <table class="data-table">
    <tr>
      <th>Disiplin</th>
      <th>Sozlesme Bedeli (TL)</th>
      <th>Gerceklesen (TL)</th>
      <th>Kalan (TL)</th>
      <th>Pursantaj (%)</th>
      <th>Ilerleme</th>
    </tr>
    ${rows.map(r=>`
    <tr>
      <td><strong>${r.disiplin}</strong></td>
      <td>${tl(r.sozlesme)}</td>
      <td class="green">${tl(r.gerceklesen)}</td>
      <td class="amber">${tl(r.kalan)}</td>
      <td><strong>${r.pursantaj}%</strong></td>
      <td><div class="pct-bar"><div class="pct-fill" style="width:${Math.min(r.pursantaj,100)}%"></div></div></td>
    </tr>`).join('')}
    <tr class="total">
      <td>TOPLAM</td>
      <td>${tl(topSoz)}</td>
      <td>${tl(topGer)}</td>
      <td>${tl(topKal)}</td>
      <td>${topPct}%</td>
      <td><div class="pct-bar"><div class="pct-fill" style="width:${Math.min(topPct,100)}%;background:#22c55e"></div></div></td>
    </tr>
  </table>
  ${hakedisData.length>0?`
  <div class="section-title">BLOK BAZLI DETAY</div>
  <table class="data-table">
    <tr><th>Blok</th><th>Disiplin</th><th>Sozlesme</th><th>Gerceklesen</th><th>Pursantaj</th><th>Tarih</th></tr>
    ${hakedisData.map((k:any)=>`
    <tr>
      <td>${k.blok}</td><td>${k.disiplin}</td>
      <td>${tl(k.sozlesmeBedeli)}</td>
      <td class="green">${tl(k.gerceklesen)}</td>
      <td><strong>${k.pursantaj}%</strong></td>
      <td>${k.tarih}</td>
    </tr>`).join('')}
  </table>`:''}
  <div class="footer">
    <div class="imza"><div class="imza-line">Hazirlayan<br>Santiye Sefi</div></div>
    <div class="imza"><div class="imza-line">Kontrol Eden<br>Musavir</div></div>
    <div class="imza"><div class="imza-line">Onaylayan<br>Idare</div></div>
  </div>
  </body></html>`;
};

const gunlukRaporHTML = (blocks:any[], workers:any[], safety:any[], purchases:any[]) => {
  const tarih = new Date().toLocaleDateString('tr-TR');
  const aktif = workers.filter((w:any)=>w.status==='aktif').length;
  const acikISG = safety.filter((s:any)=>s.st==='acik').length;
  const bekleyen = purchases.filter((p:any)=>p.st==='bekliyor').length;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Gunluk Rapor ${tarih}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;font-size:12px;}
    .header{background:#1a3a5c;color:white;padding:20px;text-align:center;margin-bottom:20px;border-radius:8px;}
    .header h1{margin:0;font-size:18px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
    .kpi{background:#f0f4f8;border-radius:8px;padding:15px;text-align:center;border-top:4px solid #3b82f6;}
    .kpi .val{font-size:24px;font-weight:bold;color:#1a3a5c;}
    .kpi .lbl{font-size:11px;color:#666;margin-top:4px;}
    .section-title{background:#2c5282;color:white;padding:10px 15px;font-weight:bold;margin:20px 0 10px;border-radius:4px;}
    table{width:100%;border-collapse:collapse;margin-bottom:15px;}
    th{background:#2c5282;color:white;padding:8px;text-align:left;font-size:11px;}
    td{padding:7px 8px;border:1px solid #ddd;font-size:11px;}
    tr:nth-child(even){background:#f9f9f9;}
    .green{color:#22c55e;font-weight:bold;}
    .red{color:#ef4444;font-weight:bold;}
    .amber{color:#f59e0b;font-weight:bold;}
    .footer{margin-top:30px;padding-top:15px;border-top:1px solid #ccc;font-size:11px;color:#666;text-align:center;}
  </style>
  </head><body>
  <div class="header">
    <h1>GUNLUK SANTIYE RAPORU</h1>
    <p>${tarih} - Konya 906 Konut Projesi</p>
  </div>
  <div class="kpi-grid">
    <div class="kpi"><div class="val">${aktif}</div><div class="lbl">Aktif Personel</div></div>
    <div class="kpi"><div class="val" style="color:${acikISG>0?'#ef4444':'#22c55e'}">${acikISG}</div><div class="lbl">Acik ISG Olayi</div></div>
    <div class="kpi"><div class="val">${bekleyen}</div><div class="lbl">Bekleyen Talep</div></div>
    <div class="kpi"><div class="val">${blocks.length}</div><div class="lbl">Aktif Blok</div></div>
  </div>
  <div class="section-title">BLOK ILERLEME DURUMU</div>
  <table>
    <tr><th>Blok</th><th>Imalat</th><th>Tamamlanan Kat</th><th>Devam Eden Kat</th><th>Toplam Kat</th><th>Ilerleme</th><th>Sorumlu</th></tr>
    ${blocks.map((b:any)=>{
      const p = b.floors ? Math.round(Number(b.done)/Number(b.floors)*100) : 0;
      return `<tr>
        <td><strong>${b.name}</strong></td>
        <td>${b.imalat}</td>
        <td class="green">${b.done}</td>
        <td class="amber">${b.prog}</td>
        <td>${b.floors}</td>
        <td><strong>${p}%</strong></td>
        <td>${b.eng}</td>
      </tr>`;
    }).join('')}
  </table>
  ${acikISG>0?`
  <div class="section-title">ACIK ISG OLAYLARI</div>
  <table>
    <tr><th>ID</th><th>Aciklama</th><th>Tip</th><th>Onem</th><th>Tarih</th></tr>
    ${safety.filter((s:any)=>s.st==='acik').map((s:any)=>`
    <tr>
      <td>${s.id}</td><td>${s.desc}</td><td>${s.tip}</td>
      <td class="${s.sev==='yuksek'?'red':s.sev==='orta'?'amber':'green'}">${s.sev}</td>
      <td>${s.tarih}</td>
    </tr>`).join('')}
  </table>`:''}
  ${bekleyen>0?`
  <div class="section-title">ONAY BEKLEYEN SATIN ALMA TALEPLERi</div>
  <table>
    <tr><th>ID</th><th>Malzeme</th><th>Tedarikci</th><th>Tutar</th><th>Tarih</th></tr>
    ${purchases.filter((p:any)=>p.st==='bekliyor').map((p:any)=>`
    <tr>
      <td>${p.id}</td><td>${p.item}</td><td>${p.sup}</td>
      <td class="amber">${tl(p.amt)}</td><td>${p.tarih}</td>
    </tr>`).join('')}
  </table>`:''}
  <div class="footer">
    Bu rapor Santiye Planlama ERP sistemi tarafindan otomatik olusturulmustur. - ${tarih}
  </div>
  </body></html>`;
};

export default function RaporPage() {
  const [blocks, setBlocks]       = useState<any[]>([]);
  const [workers, setWorkers]     = useState<any[]>([]);
  const [safety, setSafety]       = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [hakedis, setHakedis]     = useState<any[]>([]);
  const [hakedisNo, setHakedisNo] = useState('3');

  useEffect(()=>{
    onValue(ref(db,'blocks'),(snap)=>{ const d=snap.val(); if(d) setBlocks(Object.values(d)); });
    onValue(ref(db,'workers'),(snap)=>{ const d=snap.val(); if(d) setWorkers(Object.values(d)); });
    onValue(ref(db,'safety'),(snap)=>{ const d=snap.val(); if(d) setSafety(Object.values(d)); });
    onValue(ref(db,'purchases'),(snap)=>{ const d=snap.val(); if(d) setPurchases(Object.values(d)); });
    onValue(ref(db,'hakedis'),(snap)=>{ const d=snap.val(); if(d) setHakedis(Object.values(d)); });
  },[]);

  const raporlar = [
    {
      id:'hakedis',
      baslik:'Hakedis Raporu',
      aciklama:'Blok ve disiplin bazli pursantaj raporu, imza bölümü ile',
      renk:C.blue,
      icon:'₺',
      onPress:()=>printHTML(hakedisHTML(hakedis,hakedisNo),'Hakedis Raporu'),
    },
    {
      id:'gunluk',
      baslik:'Gunluk Santiye Raporu',
      aciklama:'Blok ilerleme, ISG olaylari, satın alma durumu',
      renk:C.green,
      icon:'📋',
      onPress:()=>printHTML(gunlukRaporHTML(blocks,workers,safety,purchases),'Gunluk Rapor'),
    },
    {
      id:'personel',
      baslik:'Personel Listesi',
      aciklama:'Tum personel, roller, departmanlar ve ucretler',
      renk:C.purple,
      icon:'👥',
      onPress:()=>{
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Personel Listesi</title>
        <style>
          body{font-family:Arial;padding:20px;font-size:12px;}
          .header{background:#1a3a5c;color:white;padding:20px;text-align:center;margin-bottom:20px;border-radius:8px;}
          table{width:100%;border-collapse:collapse;}
          th{background:#2c5282;color:white;padding:10px;text-align:left;}
          td{padding:8px;border:1px solid #ddd;}
          tr:nth-child(even){background:#f9f9f9;}
        </style></head><body>
        <div class="header"><h2>PERSONEL LiSTESi</h2><p>${new Date().toLocaleDateString('tr-TR')}</p></div>
        <table>
          <tr><th>#</th><th>Ad Soyad</th><th>Rol</th><th>Departman</th><th>Durum</th><th>Ucret</th></tr>
          ${workers.map((w:any,i:number)=>`
          <tr>
            <td>${i+1}</td><td><strong>${w.name}</strong></td>
            <td>${w.role}</td><td>${w.dept}</td>
            <td style="color:${w.status==='aktif'?'#22c55e':'#f59e0b'}">${w.status}</td>
            <td>${tl(w.wage)}</td>
          </tr>`).join('')}
        </table>
        </body></html>`;
        printHTML(html,'Personel Listesi');
      },
    },
    {
      id:'isg',
      baslik:'ISG Raporu',
      aciklama:'Tum guvenlik olaylari, durumlar ve onlem bilgileri',
      renk:C.red,
      icon:'⚠',
      onPress:()=>{
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>ISG Raporu</title>
        <style>
          body{font-family:Arial;padding:20px;font-size:12px;}
          .header{background:#7f1d1d;color:white;padding:20px;text-align:center;margin-bottom:20px;border-radius:8px;}
          table{width:100%;border-collapse:collapse;}
          th{background:#991b1b;color:white;padding:10px;text-align:left;}
          td{padding:8px;border:1px solid #ddd;}
          tr:nth-child(even){background:#fef2f2;}
          .acik{color:#ef4444;font-weight:bold;}
          .giderildi{color:#22c55e;font-weight:bold;}
        </style></head><body>
        <div class="header"><h2>iSG RAPORU</h2><p>${new Date().toLocaleDateString('tr-TR')}</p></div>
        <p>Toplam: ${safety.length} olay | Acik: ${safety.filter((s:any)=>s.st==='acik').length} | Giderildi: ${safety.filter((s:any)=>s.st==='giderildi').length}</p>
        <table>
          <tr><th>ID</th><th>Aciklama</th><th>Tip</th><th>Onem</th><th>Durum</th><th>Tarih</th></tr>
          ${safety.map((s:any)=>`
          <tr>
            <td>${s.id}</td><td>${s.desc}</td><td>${s.tip}</td>
            <td>${s.sev}</td>
            <td class="${s.st}">${s.st}</td>
            <td>${s.tarih}</td>
          </tr>`).join('')}
        </table>
        </body></html>`;
        printHTML(html,'ISG Raporu');
      },
    },
    {
      id:'satinalma',
      baslik:'Satin Alma Raporu',
      aciklama:'Tum talepler, onay durumlari ve tutarlar',
      renk:C.amber,
      icon:'🛒',
      onPress:()=>{
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Satin Alma Raporu</title>
        <style>
          body{font-family:Arial;padding:20px;font-size:12px;}
          .header{background:#78350f;color:white;padding:20px;text-align:center;margin-bottom:20px;border-radius:8px;}
          table{width:100%;border-collapse:collapse;}
          th{background:#92400e;color:white;padding:10px;text-align:left;}
          td{padding:8px;border:1px solid #ddd;}
          tr:nth-child(even){background:#fffbeb;}
        </style></head><body>
        <div class="header"><h2>SATIN ALMA RAPORU</h2><p>${new Date().toLocaleDateString('tr-TR')}</p></div>
        <p>Toplam: ${purchases.length} talep | Bekleyen: ${purchases.filter((p:any)=>p.st==='bekliyor').length} | Toplam: ${tl(purchases.reduce((s:number,p:any)=>s+(p.amt||0),0))}</p>
        <table>
          <tr><th>ID</th><th>Malzeme</th><th>Tedarikci</th><th>Tutar</th><th>Durum</th><th>Tarih</th></tr>
          ${purchases.map((p:any)=>`
          <tr>
            <td>${p.id}</td><td>${p.item}</td><td>${p.sup}</td>
            <td><strong>${tl(p.amt)}</strong></td>
            <td>${p.st}</td><td>${p.tarih}</td>
          </tr>`).join('')}
        </table>
        </body></html>`;
        printHTML(html,'Satin Alma Raporu');
      },
    },
  ];

  return (
    <View>
      <View style={s.sec}>
        <Text style={s.secT}>Rapor Merkezi</Text>
        <Text style={{color:C.t3,fontSize:12,marginBottom:4}}>
          Raporlar yeni sekmede acilir — tarayicinizdan yazdirabir veya PDF olarak kaydedebilirsiniz.
        </Text>
      </View>

      {raporlar.map((r,i)=>(
        <TouchableOpacity key={i} onPress={r.onPress}
          style={[s.raporKart,{borderLeftColor:r.renk}]}>
          <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
            <View style={{width:48,height:48,borderRadius:12,alignItems:'center',justifyContent:'center',
              backgroundColor:r.renk+'22'}}>
              <Text style={{fontSize:22}}>{r.icon}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:C.t1,fontWeight:'700',fontSize:14}}>{r.baslik}</Text>
              <Text style={{color:C.t3,fontSize:12,marginTop:2}}>{r.aciklama}</Text>
            </View>
            <View style={{backgroundColor:r.renk,borderRadius:8,paddingHorizontal:14,paddingVertical:8}}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:12}}>PDF</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={[s.sec,{marginTop:8}]}>
        <Text style={{color:C.t2,fontSize:12,fontWeight:'600',marginBottom:10}}>Hakedis Raporu Ayarlari</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <Text style={{color:C.t3,fontSize:12}}>Hakedis No:</Text>
          <View style={{backgroundColor:C.bg3,borderWidth:1,borderColor:C.border,borderRadius:8,
            paddingHorizontal:14,paddingVertical:8,minWidth:60,alignItems:'center'}}>
            <Text style={{color:C.t1,fontSize:16,fontWeight:'700'}}>{hakedisNo}</Text>
          </View>
          <TouchableOpacity onPress={()=>setHakedisNo(String(Math.max(1,parseInt(hakedisNo)-1)))}
            style={{backgroundColor:C.bg3,borderRadius:8,padding:10,borderWidth:1,borderColor:C.border}}>
            <Text style={{color:C.t1,fontSize:16}}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setHakedisNo(String(parseInt(hakedisNo)+1))}
            style={{backgroundColor:C.blue,borderRadius:8,padding:10}}>
            <Text style={{color:'#fff',fontSize:16}}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sec:      {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  secT:     {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:8},
  raporKart:{backgroundColor:'#1a2236',borderRadius:10,padding:16,marginBottom:10,
             borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderLeftWidth:4},
});
