// app/StokPage.tsx
import { db } from '../firebaseConfig';
import { ref, set, onValue, push } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert
} from 'react-native';
import * as XLSX from 'xlsx';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

const KATEGORILER = ['Yapi Malzeme','Elektrik','Mekanik','Celik-Demir','Ahsap','Kimyasal','Alet-Ekipman','Diger'];

const DEMO_STOK = [
  {id:'STK-001', ad:'C30 Hazir Beton', kategori:'Yapi Malzeme', birim:'m3', miktar:450, minMiktar:50, birimFiyat:3200, tedarikci:'Hazir Beton AS'},
  {id:'STK-002', ad:'Nervurlu Celik S420', kategori:'Celik-Demir', birim:'ton', miktar:28, minMiktar:10, birimFiyat:24500, tedarikci:'Demir Celik Ltd'},
  {id:'STK-003', ad:'Briks Tugla 19x19x39', kategori:'Yapi Malzeme', birim:'adet', miktar:12500, minMiktar:2000, birimFiyat:8, tedarikci:'Tugla Fabrika'},
  {id:'STK-004', ad:'Cimento CEM I 42.5R', kategori:'Yapi Malzeme', birim:'canta', miktar:380, minMiktar:100, birimFiyat:185, tedarikci:'Cimento AS'},
  {id:'STK-005', ad:'Kum (Iri)', kategori:'Yapi Malzeme', birim:'m3', miktar:220, minMiktar:30, birimFiyat:180, tedarikci:'Tas Ocagi'},
  {id:'STK-006', ad:'Mıcir', kategori:'Yapi Malzeme', birim:'m3', miktar:180, minMiktar:30, birimFiyat:220, tedarikci:'Tas Ocagi'},
  {id:'STK-007', ad:'Kalip Tahtas', kategori:'Ahsap', birim:'m2', miktar:850, minMiktar:100, birimFiyat:320, tedarikci:'Orman Urunleri'},
  {id:'STK-008', ad:'NYY Kablo 4x16mm2', kategori:'Elektrik', birim:'m', miktar:2400, minMiktar:200, birimFiyat:85, tedarikci:'Elektrik Malzeme'},
  {id:'STK-009', ad:'Sigorta Kutusu 3F', kategori:'Elektrik', birim:'adet', miktar:45, minMiktar:10, birimFiyat:1250, tedarikci:'Elektrik Malzeme'},
  {id:'STK-010', ad:'PPR Boru 25mm', kategori:'Mekanik', birim:'m', miktar:1200, minMiktar:100, birimFiyat:42, tedarikci:'Tesisat Malzeme'},
  {id:'STK-011', ad:'Su Yalitim Membrani', kategori:'Kimyasal', birim:'m2', miktar:600, minMiktar:100, birimFiyat:85, tedarikci:'Yalitim AS'},
  {id:'STK-012', ad:'Dis Cephe Boyasi', kategori:'Kimyasal', birim:'kg', miktar:280, minMiktar:50, birimFiyat:95, tedarikci:'Boya Fabrika'},
];

const tl = (n:any) => 'TL '+new Intl.NumberFormat('tr-TR').format(Math.round(Number(n)||0));

const exportExcel = (data:any[], dosyaAdi:string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok');
    const out = XLSX.write(wb, {type:'base64', bookType:'xlsx'});
    const binary = atob(out);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = dosyaAdi+'.xlsx'; a.click();
    URL.revokeObjectURL(url);
  } catch(e) { Alert.alert('Hata','Excel olusturulamadi'); }
};

export default function StokPage() {
  const [stok, setStok]               = useState(DEMO_STOK as any[]);
  const [hareketler, setHareketler]   = useState<any[]>([]);
  const [tab, setTab]                 = useState<'stok'|'hareket'|'rapor'>('stok');
  const [addStokModal, setAddStok]    = useState(false);
  const [hareketModal, setHareketModal] = useState(false);
  const [selStok, setSelStok]         = useState<any>(null);
  const [filtre, setFiltre]           = useState('');
  const [selKategori, setSelKategori] = useState('Tumu');

  // Yeni stok form
  const [newAd, setNewAd]             = useState('');
  const [newKategori, setNewKategori] = useState('Yapi Malzeme');
  const [newBirim, setNewBirim]       = useState('adet');
  const [newMiktar, setNewMiktar]     = useState('');
  const [newMin, setNewMin]           = useState('');
  const [newFiyat, setNewFiyat]       = useState('');
  const [newTedarikci, setNewTedarikci] = useState('');

  // Hareket form
  const [harTip, setHarTip]           = useState<'giris'|'cikis'>('giris');
  const [harMiktar, setHarMiktar]     = useState('');
  const [harNot, setHarNot]           = useState('');
  const [harBlok, setHarBlok]         = useState('');

  useEffect(()=>{
    onValue(ref(db,'stok'),(snap)=>{
      const d=snap.val();
      if(d) setStok(Object.values(d));
      else DEMO_STOK.forEach((s:any)=>set(ref(db,'stok/'+s.id),s));
    });
    onValue(ref(db,'stokHareketler'),(snap)=>{
      const d=snap.val();
      if(d) setHareketler(Object.values(d));
    });
  },[]);

  const stokEkle = () => {
    if(!newAd.trim()) return;
    const id='STK-'+Date.now();
    const kayit={id, ad:newAd.trim(), kategori:newKategori, birim:newBirim,
      miktar:parseFloat(newMiktar)||0, minMiktar:parseFloat(newMin)||0,
      birimFiyat:parseFloat(newFiyat)||0, tedarikci:newTedarikci.trim()};
    set(ref(db,'stok/'+id),kayit);
    setNewAd('');setNewMiktar('');setNewMin('');setNewFiyat('');setNewTedarikci('');
    setAddStok(false);
  };

 const stokSil = (id:string) => {
  if(window.confirm('Bu malzeme silinsin mi?')) {
    fetch(`https://santiyem-erp-default-rtdb.firebaseio.com/stok/${id}.json`,{method:'DELETE'})
      .then(()=>console.log('Silindi:',id));
  }
};
  const hareketKaydet = () => {
    if(!selStok||!harMiktar) return;
    const miktarVal = parseFloat(harMiktar)||0;
    const yeniMiktar = harTip==='giris'
      ? (selStok.miktar||0) + miktarVal
      : Math.max(0,(selStok.miktar||0) - miktarVal);

    // Stok güncelle
    set(ref(db,'stok/'+selStok.id+'/miktar'), yeniMiktar);

    // Hareket kaydet
    const hid='HRK-'+Date.now();
    set(ref(db,'stokHareketler/'+hid),{
      id:hid, stokId:selStok.id, stokAd:selStok.ad,
      tip:harTip, miktar:miktarVal, birim:selStok.birim,
      blok:harBlok, not:harNot,
      tarih:new Date().toLocaleDateString('tr-TR'),
      saat:new Date().toLocaleTimeString('tr-TR'),
    });

    setHarMiktar('');setHarNot('');setHarBlok('');
    setHareketModal(false);
    Alert.alert('Kaydedildi', selStok.ad+' - '+harTip+' islemi kaydedildi');
  };

  // Filtrele
  const filtreliStok = stok.filter((s:any)=>{
    const adMatch = (s.ad||'').toLowerCase().includes(filtre.toLowerCase());
    const katMatch = selKategori==='Tumu' || s.kategori===selKategori;
    return adMatch && katMatch;
  });

  // KPI hesapla
  const kritikStok = stok.filter((s:any)=>(s.miktar||0)<=(s.minMiktar||0));
  const toplamDeger = stok.reduce((t:number,s:any)=>t+(s.miktar||0)*(s.birimFiyat||0),0);

  return (
    <View>
      {/* KPI */}
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.blue}]}/>
          <Text style={s.kpiLbl}>Toplam Kalem</Text>
          <Text style={s.kpiVal}>{stok.length}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.red}]}/>
          <Text style={s.kpiLbl}>Kritik Stok</Text>
          <Text style={[s.kpiVal,{color:kritikStok.length>0?C.red:C.green}]}>{kritikStok.length}</Text>
        </View>
      </View>
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.green}]}/>
          <Text style={s.kpiLbl}>Stok Degeri</Text>
          <Text style={[s.kpiVal,{fontSize:13}]}>{tl(toplamDeger)}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.amber}]}/>
          <Text style={s.kpiLbl}>Bugun Hareket</Text>
          <Text style={s.kpiVal}>{hareketler.filter((h:any)=>h.tarih===new Date().toLocaleDateString('tr-TR')).length}</Text>
        </View>
      </View>

      {/* Kritik stok uyarısı */}
      {kritikStok.length>0 && (
        <View style={[s.warnBox,{borderColor:'rgba(239,68,68,0.3)',marginBottom:12}]}>
          <Text style={{color:C.red,fontWeight:'700',fontSize:13,marginBottom:4}}>
            {kritikStok.length} malzeme kritik seviyede!
          </Text>
          {kritikStok.slice(0,3).map((k:any,i:number)=>(
            <Text key={i} style={{color:C.t2,fontSize:12}}>• {k.ad}: {k.miktar} {k.birim} kaldi</Text>
          ))}
        </View>
      )}

      {/* TAB */}
      <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
        {(['stok','hareket','rapor'] as const).map(t=>(
          <TouchableOpacity key={t} onPress={()=>setTab(t)}
            style={{flex:1,paddingVertical:9,borderRadius:8,alignItems:'center',borderWidth:1,
              backgroundColor:tab===t?C.blue:C.bg3,borderColor:tab===t?C.blue:C.border}}>
            <Text style={{color:tab===t?'#fff':C.t2,fontSize:12,fontWeight:'600'}}>
              {t==='stok'?'Stok':t==='hareket'?'Hareketler':'Rapor'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* STOK TAB */}
      {tab==='stok' && (
        <View>
          <View style={{flexDirection:'row',gap:8,marginBottom:10}}>
            <TouchableOpacity onPress={()=>setAddStok(true)} style={[s.addBtn,{flex:1}]}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Malzeme Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>exportExcel(stok.map((s:any)=>({
              'Malzeme':s.ad,'Kategori':s.kategori,'Birim':s.birim,
              'Miktar':s.miktar,'Min Miktar':s.minMiktar,
              'Birim Fiyat':s.birimFiyat,'Toplam Deger':(s.miktar||0)*(s.birimFiyat||0),
              'Tedarikci':s.tedarikci
            })),'stok-listesi')} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
            </TouchableOpacity>
          </View>

          {/* Arama */}
          <TextInput style={[s.inp,{marginBottom:10}]} value={filtre} onChangeText={setFiltre}
            placeholder="Malzeme ara..." placeholderTextColor={C.t3}/>

          {/* Kategori filtresi */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            <View style={{flexDirection:'row',gap:6,paddingBottom:4}}>
              {['Tumu',...KATEGORILER].map(k=>(
                <TouchableOpacity key={k} onPress={()=>setSelKategori(k)}
                  style={{paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,
                    backgroundColor:selKategori===k?C.blue:C.bg3,borderColor:selKategori===k?C.blue:C.border}}>
                  <Text style={{color:selKategori===k?'#fff':C.t2,fontSize:12}}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Stok listesi */}
          {filtreliStok.map((item:any,i:number)=>{
            const kritik = (item.miktar||0)<=(item.minMiktar||0);
            const deger = (item.miktar||0)*(item.birimFiyat||0);
            const doluluk = item.minMiktar ? Math.min((item.miktar/item.minMiktar)*50,100) : 100;
            return (
              <View key={i} style={[s.listCard,{marginBottom:8,borderColor:kritik?'rgba(239,68,68,0.3)':C.border}]}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                  <View style={{flex:1}}>
                    <Text style={{color:C.t1,fontWeight:'700',fontSize:13}}>{item.ad}</Text>
                    <Text style={{color:C.t3,fontSize:11}}>{item.kategori} • {item.tedarikci}</Text>
                  </View>
                  {kritik && (
                    <View style={{backgroundColor:'rgba(239,68,68,0.15)',borderRadius:6,
                      paddingHorizontal:8,paddingVertical:3,alignSelf:'flex-start'}}>
                      <Text style={{color:C.red,fontSize:11,fontWeight:'700'}}>KRİTİK</Text>
                    </View>
                  )}
                </View>
                <View style={{height:4,backgroundColor:C.bg3,borderRadius:2,overflow:'hidden',marginBottom:8}}>
                  <View style={{height:'100%',width:(doluluk+'%') as any,
                    backgroundColor:kritik?C.red:doluluk<60?C.amber:C.green,borderRadius:2}}/>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <View>
                    <Text style={{color:kritik?C.red:C.green,fontWeight:'800',fontSize:16}}>
                      {item.miktar} <Text style={{fontSize:12,fontWeight:'400',color:C.t3}}>{item.birim}</Text>
                    </Text>
                    <Text style={{color:C.t3,fontSize:11}}>Min: {item.minMiktar} {item.birim}</Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={{color:C.t2,fontSize:12}}>{tl(item.birimFiyat)}/{item.birim}</Text>
                    <Text style={{color:C.amber,fontSize:12,fontWeight:'600'}}>{tl(deger)}</Text>
                  </View>
                  <View style={{flexDirection:'row',gap:6}}>
                    <TouchableOpacity onPress={()=>{setSelStok(item);setHarTip('giris');setHareketModal(true);}}
                      style={{paddingHorizontal:10,paddingVertical:6,borderRadius:7,borderWidth:1,
                        borderColor:'rgba(34,197,94,0.3)',backgroundColor:'rgba(34,197,94,0.08)'}}>
                      <Text style={{color:C.green,fontSize:11,fontWeight:'700'}}>Giris</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>{setSelStok(item);setHarTip('cikis');setHareketModal(true);}}
                      style={{paddingHorizontal:10,paddingVertical:6,borderRadius:7,borderWidth:1,
                        borderColor:'rgba(245,158,11,0.3)',backgroundColor:'rgba(245,158,11,0.08)'}}>
                      <Text style={{color:C.amber,fontSize:11,fontWeight:'700'}}>Cikis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>{console.log('Sil tiklandi:',item.id); stokSil(item.id);}}
                      style={{paddingHorizontal:8,paddingVertical:6,borderRadius:7,borderWidth:1,
                        borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'}}>
                      <Text style={{color:C.red,fontSize:11}}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* HAREKET TAB */}
      {tab==='hareket' && (
        <View>
          <TouchableOpacity onPress={()=>exportExcel(hareketler.map((h:any)=>({
            'Tarih':h.tarih,'Saat':h.saat,'Malzeme':h.stokAd,
            'Tip':h.tip,'Miktar':h.miktar,'Birim':h.birim,
            'Blok':h.blok,'Not':h.not
          })),'stok-hareketleri')} style={[s.addBtn,{backgroundColor:C.green,marginBottom:12}]}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel Indir</Text>
          </TouchableOpacity>
          {hareketler.length===0 ? (
            <View style={[s.sec,{alignItems:'center',padding:30}]}>
              <Text style={{color:C.t3,fontSize:14}}>Henuz hareket yok</Text>
              <Text style={{color:C.t3,fontSize:12,marginTop:6}}>Stok sekmesinden giris/cikis yapın</Text>
            </View>
          ) : (
            [...hareketler].reverse().map((h:any,i:number)=>(
              <View key={i} style={[s.listCard,{marginBottom:8,flexDirection:'row',alignItems:'center',gap:12}]}>
                <View style={{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',
                  backgroundColor:h.tip==='giris'?'rgba(34,197,94,0.15)':'rgba(245,158,11,0.15)'}}>
                  <Text style={{fontSize:18}}>{h.tip==='giris'?'↓':'↑'}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{h.stokAd}</Text>
                  <Text style={{color:C.t3,fontSize:11}}>{h.tarih} {h.saat}{h.blok?' • '+h.blok:''}</Text>
                  {h.not ? <Text style={{color:C.t3,fontSize:11,fontStyle:'italic'}}>{h.not}</Text> : null}
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={{color:h.tip==='giris'?C.green:C.amber,fontWeight:'800',fontSize:14}}>
                    {h.tip==='giris'?'+':'-'}{h.miktar}
                  </Text>
                  <Text style={{color:C.t3,fontSize:11}}>{h.birim}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* RAPOR TAB */}
      {tab==='rapor' && (
        <View>
          <View style={s.sec}>
            <Text style={s.secT}>Kategori Dagilimi</Text>
            {KATEGORILER.map((k,i)=>{
              const katStok = stok.filter((s:any)=>s.kategori===k);
              const katDeger = katStok.reduce((t:number,s:any)=>t+(s.miktar||0)*(s.birimFiyat||0),0);
              if(katDeger===0) return null;
              const pct = Math.round(katDeger/toplamDeger*100);
              return (
                <View key={i} style={{marginBottom:10}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:3}}>
                    <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>{k}</Text>
                    <Text style={{color:C.t2,fontSize:12}}>%{pct} • {tl(katDeger)}</Text>
                  </View>
                  <View style={{height:5,backgroundColor:C.bg3,borderRadius:3,overflow:'hidden'}}>
                    <View style={{height:'100%',width:(pct+'%') as any,backgroundColor:C.blue,borderRadius:3}}/>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={s.sec}>
            <Text style={s.secT}>Kritik Stok Listesi</Text>
            {kritikStok.length===0 ? (
              <Text style={{color:C.green,textAlign:'center',padding:10}}>Tum stoklar yeterli seviyede</Text>
            ) : (
              kritikStok.map((k:any,i:number)=>(
                <View key={i} style={{flexDirection:'row',justifyContent:'space-between',
                  paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <Text style={{color:C.t1,fontSize:12,flex:1}}>{k.ad}</Text>
                  <Text style={{color:C.red,fontWeight:'700',fontSize:12}}>
                    {k.miktar}/{k.minMiktar} {k.birim}
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity onPress={()=>exportExcel(stok.map((s:any)=>({
            'Malzeme':s.ad,'Kategori':s.kategori,'Birim':s.birim,
            'Mevcut Miktar':s.miktar,'Min Miktar':s.minMiktar,
            'Durum':(s.miktar||0)<=(s.minMiktar||0)?'KRITiK':'Normal',
            'Birim Fiyat':s.birimFiyat,
            'Toplam Deger':(s.miktar||0)*(s.birimFiyat||0),
            'Tedarikci':s.tedarikci
          })),'stok-raporu')} style={[s.addBtn,{backgroundColor:C.green,marginBottom:10}]}>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:14}}>Tam Stok Raporu Excel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MALZEME EKLE MODAL */}
      <Modal visible={addStokModal} transparent animationType="fade" onRequestClose={()=>setAddStok(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.t1}}>Yeni Malzeme Ekle</Text>
              <TouchableOpacity onPress={()=>setAddStok(false)}><Text style={{color:C.t3,fontSize:22}}>X</Text></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight:420}}>
              <Text style={s.lbl}>Malzeme Adi</Text>
              <TextInput style={s.inp} value={newAd} onChangeText={setNewAd} placeholder="C30 Beton..." placeholderTextColor={C.t3}/>
              <Text style={s.lbl}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
                <View style={{flexDirection:'row',gap:6}}>
                  {KATEGORILER.map(k=>(
                    <TouchableOpacity key={k} onPress={()=>setNewKategori(k)}
                      style={{paddingHorizontal:10,paddingVertical:6,borderRadius:7,borderWidth:1,
                        backgroundColor:newKategori===k?C.blue:C.bg3,borderColor:newKategori===k?C.blue:C.border}}>
                      <Text style={{color:newKategori===k?'#fff':C.t2,fontSize:11}}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={s.lbl}>Birim</Text>
              <View style={{flexDirection:'row',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                {['adet','m','m2','m3','kg','ton','canta','litre'].map(b=>(
                  <TouchableOpacity key={b} onPress={()=>setNewBirim(b)}
                    style={{paddingHorizontal:12,paddingVertical:6,borderRadius:7,borderWidth:1,
                      backgroundColor:newBirim===b?C.blue:C.bg3,borderColor:newBirim===b?C.blue:C.border}}>
                    <Text style={{color:newBirim===b?'#fff':C.t2,fontSize:12}}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{flexDirection:'row',gap:10}}>
                <View style={{flex:1}}>
                  <Text style={s.lbl}>Baslangic Miktar</Text>
                  <TextInput style={s.inp} value={newMiktar} onChangeText={setNewMiktar} placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>
                </View>
                <View style={{flex:1}}>
                  <Text style={s.lbl}>Min Miktar (Kritik)</Text>
                  <TextInput style={s.inp} value={newMin} onChangeText={setNewMin} placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>
                </View>
              </View>
              <Text style={s.lbl}>Birim Fiyat (TL)</Text>
              <TextInput style={s.inp} value={newFiyat} onChangeText={setNewFiyat} placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>
              <Text style={s.lbl}>Tedarikci</Text>
              <TextInput style={s.inp} value={newTedarikci} onChangeText={setNewTedarikci} placeholder="Firma adi" placeholderTextColor={C.t3}/>
            </ScrollView>
            <View style={{flexDirection:'row',gap:10,marginTop:14}}>
              <TouchableOpacity onPress={()=>setAddStok(false)} style={s.modalCancel}>
                <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stokEkle} style={s.modalSave}>
                <Text style={{color:'#fff',fontWeight:'800'}}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HAREKET MODAL */}
      <Modal visible={hareketModal} transparent animationType="fade" onRequestClose={()=>setHareketModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <View>
                <Text style={{fontSize:15,fontWeight:'700',color:C.t1}}>{selStok?.ad}</Text>
                <Text style={{color:C.t3,fontSize:12}}>Mevcut: {selStok?.miktar} {selStok?.birim}</Text>
              </View>
              <TouchableOpacity onPress={()=>setHareketModal(false)}><Text style={{color:C.t3,fontSize:22}}>X</Text></TouchableOpacity>
            </View>

            {/* Giriş / Çıkış seçimi */}
            <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
              <TouchableOpacity onPress={()=>setHarTip('giris')}
                style={{flex:1,paddingVertical:12,borderRadius:8,alignItems:'center',borderWidth:1,
                  backgroundColor:harTip==='giris'?'rgba(34,197,94,0.15)':C.bg3,
                  borderColor:harTip==='giris'?C.green:C.border}}>
                <Text style={{color:harTip==='giris'?C.green:C.t2,fontWeight:'700',fontSize:14}}>↓ Giris</Text>
                <Text style={{color:C.t3,fontSize:11}}>Ambara giris</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setHarTip('cikis')}
                style={{flex:1,paddingVertical:12,borderRadius:8,alignItems:'center',borderWidth:1,
                  backgroundColor:harTip==='cikis'?'rgba(245,158,11,0.15)':C.bg3,
                  borderColor:harTip==='cikis'?C.amber:C.border}}>
                <Text style={{color:harTip==='cikis'?C.amber:C.t2,fontWeight:'700',fontSize:14}}>↑ Cikis</Text>
                <Text style={{color:C.t3,fontSize:11}}>Sahaya cikis</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.lbl}>Miktar ({selStok?.birim})</Text>
            <TextInput style={s.inp} value={harMiktar} onChangeText={setHarMiktar}
              placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>

            <Text style={s.lbl}>Blok / Alan</Text>
            <TextInput style={s.inp} value={harBlok} onChangeText={setHarBlok}
              placeholder="Blok A, Zemin Kat..." placeholderTextColor={C.t3}/>

            <Text style={s.lbl}>Not (Opsiyonel)</Text>
            <TextInput style={s.inp} value={harNot} onChangeText={setHarNot}
              placeholder="Aciklama..." placeholderTextColor={C.t3}/>

            {/* Canlı hesaplama */}
            {harMiktar && (
              <View style={{backgroundColor:C.bg3,borderRadius:8,padding:12,marginBottom:14}}>
                <Text style={{color:C.t3,fontSize:11,marginBottom:4}}>Islemden sonra:</Text>
                <Text style={{
                  color:harTip==='giris'?C.green:C.amber,
                  fontSize:20,fontWeight:'800'
                }}>
                  {harTip==='giris'
                    ? (selStok?.miktar||0)+(parseFloat(harMiktar)||0)
                    : Math.max(0,(selStok?.miktar||0)-(parseFloat(harMiktar)||0))
                  } {selStok?.birim}
                </Text>
              </View>
            )}

            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity onPress={()=>setHareketModal(false)} style={s.modalCancel}>
                <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={hareketKaydet} style={[s.modalSave,
                {backgroundColor:harTip==='giris'?C.green:C.amber}]}>
                <Text style={{color:'#fff',fontWeight:'800'}}>{harTip==='giris'?'Giris Kaydet':'Cikis Kaydet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  row:        {flexDirection:'row',marginHorizontal:-4,marginBottom:12},
  kpi:        {backgroundColor:'#111827',borderRadius:10,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',overflow:'hidden'},
  kpiAcc:     {position:'absolute',top:0,left:0,right:0,height:3},
  kpiLbl:     {fontSize:10,fontWeight:'700',color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7,marginTop:4},
  kpiVal:     {fontSize:20,fontWeight:'800',color:'#f1f5f9'},
  sec:        {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  secT:       {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:14},
  listCard:   {backgroundColor:'#1a2236',borderRadius:10,padding:12,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  warnBox:    {backgroundColor:'rgba(245,158,11,0.08)',borderWidth:1,borderColor:'rgba(245,158,11,0.25)',borderRadius:9,padding:13,marginBottom:12},
  addBtn:     {backgroundColor:'#3b82f6',borderRadius:9,padding:12,alignItems:'center',marginBottom:0},
  lbl:        {fontSize:12,color:'#475569',marginBottom:6,fontWeight:'600'},
  inp:        {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:11,color:'#f1f5f9',fontSize:14,marginBottom:14},
  modalBg:    {flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},
  modalBox:   {backgroundColor:'#0f1320',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  modalCancel:{flex:1,padding:12,borderRadius:8,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',alignItems:'center'},
  modalSave:  {flex:1,padding:12,borderRadius:8,backgroundColor:'#3b82f6',alignItems:'center'},
});
