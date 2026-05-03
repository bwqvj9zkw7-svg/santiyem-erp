// ─── HAKEDİŞ MODÜLÜ ───────────────────────────────────────
// app/HakedisPage.tsx
// Bu dosyayı app/ klasörüne kopyalayın
// index.tsx'de import edin: import HakedisPage from './HakedisPage';
// PAGES dizisine 'Hakedis' ekleyin
// {page==='Hakedis' && <HakedisPage/>} satırını ekleyin

import { db } from '../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
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

// 77 Blok listesi — projeye göre güncellenebilir
const BLOKLAR = [
  'A1 BLOK','A2 BLOK','A3 BLOK','A4 BLOK','A5 BLOK','A6 BLOK','A7 BLOK',
  'B1 BLOK','B2 BLOK','B3 BLOK','B4 BLOK','B5 BLOK','B6 BLOK','B7 BLOK',
  'C1 BLOK','C2 BLOK','C3 BLOK','C4 BLOK','C5 BLOK','C6 BLOK','C7 BLOK',
  'D1 BLOK','D2 BLOK','D3 BLOK','D4 BLOK','D5 BLOK','D6 BLOK','D7 BLOK',
  'E1 BLOK','E2 BLOK','E3 BLOK','E4 BLOK','E5 BLOK','E6 BLOK','E7 BLOK',
  'F1 BLOK','F2 BLOK','F3 BLOK','F4 BLOK','F5 BLOK','F6 BLOK','F7 BLOK',
  'G1 BLOK','G2 BLOK','G3 BLOK','G4 BLOK','G5 BLOK','G6 BLOK','G7 BLOK',
  'H1 BLOK','H2 BLOK','H3 BLOK','H4 BLOK','H5 BLOK','H6 BLOK','H7 BLOK',
  'I1 BLOK','I2 BLOK','I3 BLOK','I4 BLOK','I5 BLOK','I6 BLOK','I7 BLOK',
  'J1 BLOK','J2 BLOK','J3 BLOK','J4 BLOK','J5 BLOK','J6 BLOK','J7 BLOK',
  'K1 BLOK','K2 BLOK','K3 BLOK','K4 BLOK','K5 BLOK','K6 BLOK','K7 BLOK',
];

const DISIPLINLER = ['Insaat','Elektrik','Mekanik'];

const tl = (n:any) => {
  const num = Number(n) || 0;
  return 'TL ' + new Intl.NumberFormat('tr-TR').format(Math.round(num));
};

const pct = (gerceklesen:number, sozlesme:number) => {
  if (!sozlesme) return 0;
  return Math.round((gerceklesen / sozlesme) * 100 * 100) / 100;
};

const exportExcel = (data:any[], dosyaAdi:string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hakedis');
    const out = XLSX.write(wb, {type:'base64', bookType:'xlsx'});
    const binary = atob(out);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi + '.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) {
    Alert.alert('Hata', 'Excel olusturulamadi');
  }
};

export default function HakedisPage() {
  const [hakedisNo, setHakedisNo]         = useState('3');
  const [hakedisData, setHakedisData]     = useState<{[key:string]:any}>({});
  const [sozlesmeData, setSozlesmeData]   = useState<{[key:string]:number}>({});
  const [detayModal, setDetayModal]       = useState(false);
  const [selBlok, setSelBlok]             = useState('');
  const [selDisiplin, setSelDisiplin]     = useState('Insaat');
  const [sozlesme, setSozlesme]           = useState('');
  const [gerceklesen, setGerceklesen]     = useState('');
  const [filtre, setFiltre]               = useState('');
  const [tab, setTab]                     = useState<'giris'|'ozet'|'rapor'>('ozet');

  useEffect(()=>{
    onValue(ref(db,'hakedis'),(snap)=>{
      const d=snap.val();
      if(d) setHakedisData(d);
    });
    onValue(ref(db,'hakedis_sozlesme'),(snap)=>{
      const d=snap.val();
      if(d) setSozlesmeData(d);
    });
  },[]);

  const kaydet = () => {
    if (!selBlok) return;
    const key = selBlok.replace(/\s+/g,'_')+'_'+selDisiplin+'_HK'+hakedisNo;
    const sozlesmeVal = parseFloat(sozlesme) || 0;
    const gerceklesenVal = parseFloat(gerceklesen) || 0;
    const kalan = sozlesmeVal - gerceklesenVal;
    const pursantaj = pct(gerceklesenVal, sozlesmeVal);

    const kayit = {
      blok: selBlok,
      disiplin: selDisiplin,
      hakedisNo: parseInt(hakedisNo),
      sozlesmeBedeli: sozlesmeVal,
      gerceklesen: gerceklesenVal,
      kalan,
      pursantaj,
      tarih: new Date().toLocaleDateString('tr-TR'),
    };

    set(ref(db,'hakedis/'+key), kayit);
    set(ref(db,'hakedis_sozlesme/'+selBlok.replace(/\s+/g,'_')+'_'+selDisiplin), sozlesmeVal);

    setSozlesme('');
    setGerceklesen('');
    setDetayModal(false);
    Alert.alert('Kaydedildi', selBlok + ' - ' + selDisiplin + ' hakedisi kaydedildi');
  };

  // Özet hesaplamalar
  const tumKayitlar = Object.values(hakedisData) as any[];
  const toplamSozlesme = tumKayitlar.reduce((s,k)=>s+(k.sozlesmeBedeli||0),0);
  const toplamGerceklesen = tumKayitlar.reduce((s,k)=>s+(k.gerceklesen||0),0);
  const toplamKalan = toplamSozlesme - toplamGerceklesen;
  const genelPursantaj = pct(toplamGerceklesen, toplamSozlesme);

  // Disiplin bazlı özet
  const disiplinOzet = DISIPLINLER.map(d => {
    const dis = tumKayitlar.filter((k:any)=>k.disiplin===d);
    const soz = dis.reduce((s:number,k:any)=>s+(k.sozlesmeBedeli||0),0);
    const ger = dis.reduce((s:number,k:any)=>s+(k.gerceklesen||0),0);
    return {disiplin:d, sozlesme:soz, gerceklesen:ger, kalan:soz-ger, pursantaj:pct(ger,soz)};
  });

  // Filtrelenmiş blok listesi
  const filtreliBloklar = BLOKLAR.filter(b =>
    b.toLowerCase().includes(filtre.toLowerCase())
  );

  // Excel export için veri hazırla
  const excelExport = () => {
    const rows = tumKayitlar.map((k:any) => ({
      'Blok': k.blok,
      'Disiplin': k.disiplin,
      'Hakedis No': k.hakedisNo,
      'Sozlesme Bedeli (TL)': k.sozlesmeBedeli,
      'Gerceklesen (TL)': k.gerceklesen,
      'Kalan (TL)': k.kalan,
      'Pursantaj (%)': k.pursantaj,
      'Tarih': k.tarih,
    }));
    exportExcel(rows, 'hakedis-'+hakedisNo+'-nolu');
  };

  return (
    <View>
      {/* BAŞLIK & HAKEDİŞ NO */}
      <View style={[s.sec, {marginBottom:12}]}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Text style={{fontSize:16,fontWeight:'800',color:C.t1}}>Hakedis Modulu</Text>
          <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
            <Text style={{color:C.t3,fontSize:12}}>Hakedis No:</Text>
            <TextInput
              style={{backgroundColor:C.bg3,borderWidth:1,borderColor:C.border,borderRadius:6,
                paddingHorizontal:10,paddingVertical:4,color:C.t1,fontSize:14,width:50,textAlign:'center'}}
              value={hakedisNo}
              onChangeText={setHakedisNo}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ÖZET KPI */}
        <View style={{flexDirection:'row',gap:8,marginBottom:8}}>
          <View style={[s.kpi,{flex:1}]}>
            <View style={[s.kpiAcc,{backgroundColor:C.blue}]}/>
            <Text style={s.kpiLbl}>Toplam Sozlesme</Text>
            <Text style={[s.kpiVal,{fontSize:13}]}>{tl(toplamSozlesme)}</Text>
          </View>
          <View style={[s.kpi,{flex:1}]}>
            <View style={[s.kpiAcc,{backgroundColor:C.green}]}/>
            <Text style={s.kpiLbl}>Gerceklesen</Text>
            <Text style={[s.kpiVal,{fontSize:13}]}>{tl(toplamGerceklesen)}</Text>
          </View>
        </View>
        <View style={{flexDirection:'row',gap:8}}>
          <View style={[s.kpi,{flex:1}]}>
            <View style={[s.kpiAcc,{backgroundColor:C.amber}]}/>
            <Text style={s.kpiLbl}>Kalan</Text>
            <Text style={[s.kpiVal,{fontSize:13}]}>{tl(toplamKalan)}</Text>
          </View>
          <View style={[s.kpi,{flex:1}]}>
            <View style={[s.kpiAcc,{backgroundColor:C.purple}]}/>
            <Text style={s.kpiLbl}>Genel Pursantaj</Text>
            <Text style={[s.kpiVal,{fontSize:16}]}>%{genelPursantaj}</Text>
          </View>
        </View>
      </View>

      {/* TAB */}
      <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
        {(['ozet','giris','rapor'] as const).map(t=>(
          <TouchableOpacity key={t} onPress={()=>setTab(t)}
            style={{flex:1,paddingVertical:9,borderRadius:8,alignItems:'center',borderWidth:1,
              backgroundColor:tab===t?C.blue:C.bg3,
              borderColor:tab===t?C.blue:C.border}}>
            <Text style={{color:tab===t?'#fff':C.t2,fontSize:12,fontWeight:'600',textTransform:'uppercase'}}>
              {t==='ozet'?'Ozet':t==='giris'?'Veri Giris':'Rapor'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ÖZET TAB */}
      {tab==='ozet' && (
        <View>
          <View style={s.sec}>
            <Text style={s.secT}>Disiplin Bazli Ozet</Text>
            {disiplinOzet.map((d,i)=>{
              const barColor = d.disiplin==='Insaat'?C.blue:d.disiplin==='Elektrik'?C.amber:C.cyan;
              const barPct = Math.min(d.pursantaj, 100);
              return (
                <View key={i} style={{marginBottom:14}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                    <Text style={{color:C.t1,fontWeight:'700',fontSize:13}}>{d.disiplin}</Text>
                    <Text style={{color:barColor,fontWeight:'800',fontSize:14}}>%{d.pursantaj}</Text>
                  </View>
                  <View style={{height:6,backgroundColor:C.bg3,borderRadius:3,overflow:'hidden',marginBottom:4}}>
                    <View style={{height:'100%',width:(barPct+'%') as any,backgroundColor:barColor,borderRadius:3}}/>
                  </View>
                  <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={{color:C.t3,fontSize:11}}>Sozlesme: {tl(d.sozlesme)}</Text>
                    <Text style={{color:C.green,fontSize:11}}>Ger: {tl(d.gerceklesen)}</Text>
                    <Text style={{color:C.amber,fontSize:11}}>Kalan: {tl(d.kalan)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Blok bazlı tablo */}
          <View style={s.sec}>
            <Text style={s.secT}>Blok Bazli Durum ({tumKayitlar.length} kayit)</Text>
            {tumKayitlar.length === 0 ? (
              <Text style={{color:C.t3,textAlign:'center',padding:20}}>
                Henuz veri girilmedi. "Veri Giris" sekmesinden baslayın.
              </Text>
            ) : (
              tumKayitlar.slice(0,20).map((k:any,i:number)=>{
                const pBar = Math.min(k.pursantaj||0, 100);
                const c = pBar>=80?C.green:pBar>=50?C.blue:pBar>=20?C.amber:C.red;
                return (
                  <View key={i} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:3}}>
                      <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>{k.blok}</Text>
                      <View style={{flexDirection:'row',gap:6}}>
                        <View style={{backgroundColor:C.bg3,paddingHorizontal:6,paddingVertical:2,borderRadius:4}}>
                          <Text style={{color:C.t2,fontSize:10}}>{k.disiplin}</Text>
                        </View>
                        <Text style={{color:c,fontWeight:'800',fontSize:12}}>%{k.pursantaj}</Text>
                      </View>
                    </View>
                    <View style={{height:4,backgroundColor:C.bg3,borderRadius:2,overflow:'hidden',marginBottom:3}}>
                      <View style={{height:'100%',width:(pBar+'%') as any,backgroundColor:c,borderRadius:2}}/>
                    </View>
                    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                      <Text style={{color:C.t3,fontSize:10}}>{tl(k.gerceklesen)} / {tl(k.sozlesmeBedeli)}</Text>
                      <Text style={{color:C.t3,fontSize:10}}>{k.tarih}</Text>
                    </View>
                  </View>
                );
              })
            )}
            {tumKayitlar.length > 20 && (
              <Text style={{color:C.t3,textAlign:'center',marginTop:8,fontSize:12}}>
                +{tumKayitlar.length-20} kayit daha...
              </Text>
            )}
          </View>
        </View>
      )}

      {/* VERİ GİRİŞ TAB */}
      {tab==='giris' && (
        <View>
          {/* Arama */}
          <View style={{backgroundColor:C.bg3,borderWidth:1,borderColor:C.border,borderRadius:8,
            paddingHorizontal:12,paddingVertical:8,marginBottom:12,flexDirection:'row',alignItems:'center'}}>
            <Text style={{color:C.t3,marginRight:8}}>Ara:</Text>
            <TextInput
              style={{flex:1,color:C.t1,fontSize:14}}
              value={filtre}
              onChangeText={setFiltre}
              placeholder="Blok ara..."
              placeholderTextColor={C.t3}
            />
          </View>

          {/* Blok listesi */}
          {filtreliBloklar.map((blok,i)=>{
            const blokKayitlar = tumKayitlar.filter((k:any)=>k.blok===blok);
            const blokToplam = blokKayitlar.reduce((s:number,k:any)=>s+(k.gerceklesen||0),0);
            const blokSozlesme = blokKayitlar.reduce((s:number,k:any)=>s+(k.sozlesmeBedeli||0),0);
            const blokPct = pct(blokToplam, blokSozlesme);
            const c = blokPct>=80?C.green:blokPct>=50?C.blue:blokPct>=20?C.amber:C.t4;

            return (
              <View key={i} style={[s.listCard,{marginBottom:8}]}>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <Text style={{color:C.t1,fontWeight:'700',fontSize:13}}>{blok}</Text>
                  {blokKayitlar.length > 0 && (
                    <Text style={{color:c,fontWeight:'800',fontSize:14}}>%{blokPct}</Text>
                  )}
                </View>
                <View style={{flexDirection:'row',gap:6}}>
                  {DISIPLINLER.map(dis=>{
                    const kayit = blokKayitlar.find((k:any)=>k.disiplin===dis);
                    const disPct = kayit ? kayit.pursantaj : null;
                    const disColor = dis==='Insaat'?C.blue:dis==='Elektrik'?C.amber:C.cyan;
                    return (
                      <TouchableOpacity key={dis} onPress={()=>{
                        setSelBlok(blok);
                        setSelDisiplin(dis);
                        if(kayit) {
                          setSozlesme(String(kayit.sozlesmeBedeli||''));
                          setGerceklesen(String(kayit.gerceklesen||''));
                        } else {
                          setSozlesme('');
                          setGerceklesen('');
                        }
                        setDetayModal(true);
                      }} style={{flex:1,backgroundColor:kayit?disColor+'22':C.bg3,
                        borderRadius:6,padding:8,borderWidth:1,
                        borderColor:kayit?disColor:C.border,alignItems:'center'}}>
                        <Text style={{color:kayit?disColor:C.t3,fontSize:11,fontWeight:'600'}}>{dis}</Text>
                        {disPct !== null ? (
                          <Text style={{color:kayit?disColor:C.t3,fontSize:13,fontWeight:'800',marginTop:2}}>%{disPct}</Text>
                        ) : (
                          <Text style={{color:C.t4,fontSize:10,marginTop:2}}>Gir</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* RAPOR TAB */}
      {tab==='rapor' && (
        <View>
          <View style={s.sec}>
            <Text style={s.secT}>Hakedis Raporu - No: {hakedisNo}</Text>

            {/* Proje Bilgileri */}
            <View style={{backgroundColor:C.bg3,borderRadius:8,padding:12,marginBottom:14}}>
              <Text style={{color:C.blue,fontWeight:'700',fontSize:13,marginBottom:8}}>Proje Bilgileri</Text>
              {[
                ['Is','Konya 906 Konut'],
                ['Muteahhit','KARMA GLOBAL & ARTER'],
                ['Musavir','UCER MUSAVIR MUH. A.S.'],
                ['Ihale Bedeli','TL 2.149.000.000'],
                ['Is Suresi','600 gun'],
                ['Hakedis No',hakedisNo],
              ].map(([l,v],i)=>(
                <View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,
                  borderBottomWidth:1,borderBottomColor:C.border}}>
                  <Text style={{color:C.t3,fontSize:12}}>{l}</Text>
                  <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>{v}</Text>
                </View>
              ))}
            </View>

            {/* Disiplin özet tablosu */}
            <Text style={{color:C.t1,fontWeight:'700',fontSize:13,marginBottom:8}}>Disiplin Ozeti</Text>
            <View style={{borderRadius:8,overflow:'hidden',borderWidth:1,borderColor:C.border}}>
              {/* Header */}
              <View style={{flexDirection:'row',backgroundColor:C.bg3,padding:8}}>
                {['Disiplin','Sozlesme','Gerceklesen','Kalan','%'].map((h,i)=>(
                  <Text key={i} style={{flex:i===0?2:1,color:C.t3,fontSize:10,fontWeight:'700',textAlign:i>0?'right':'left'}}>{h}</Text>
                ))}
              </View>
              {disiplinOzet.map((d,i)=>{
                const c = d.disiplin==='Insaat'?C.blue:d.disiplin==='Elektrik'?C.amber:C.cyan;
                return (
                  <View key={i} style={{flexDirection:'row',padding:8,borderTopWidth:1,borderTopColor:C.border}}>
                    <Text style={{flex:2,color:c,fontSize:11,fontWeight:'600'}}>{d.disiplin}</Text>
                    <Text style={{flex:1,color:C.t2,fontSize:10,textAlign:'right'}}>{(d.sozlesme/1000000).toFixed(1)}M</Text>
                    <Text style={{flex:1,color:C.green,fontSize:10,textAlign:'right'}}>{(d.gerceklesen/1000000).toFixed(1)}M</Text>
                    <Text style={{flex:1,color:C.amber,fontSize:10,textAlign:'right'}}>{(d.kalan/1000000).toFixed(1)}M</Text>
                    <Text style={{flex:1,color:c,fontSize:11,fontWeight:'800',textAlign:'right'}}>%{d.pursantaj}</Text>
                  </View>
                );
              })}
              {/* Toplam */}
              <View style={{flexDirection:'row',padding:8,borderTopWidth:2,borderTopColor:C.blue,backgroundColor:C.bg3}}>
                <Text style={{flex:2,color:C.t1,fontSize:12,fontWeight:'800'}}>TOPLAM</Text>
                <Text style={{flex:1,color:C.t1,fontSize:10,textAlign:'right',fontWeight:'700'}}>{(toplamSozlesme/1000000).toFixed(1)}M</Text>
                <Text style={{flex:1,color:C.green,fontSize:10,textAlign:'right',fontWeight:'700'}}>{(toplamGerceklesen/1000000).toFixed(1)}M</Text>
                <Text style={{flex:1,color:C.amber,fontSize:10,textAlign:'right',fontWeight:'700'}}>{(toplamKalan/1000000).toFixed(1)}M</Text>
                <Text style={{flex:1,color:C.blue,fontSize:12,textAlign:'right',fontWeight:'800'}}>%{genelPursantaj}</Text>
              </View>
            </View>
          </View>

          {/* Export butonları */}
          <TouchableOpacity onPress={excelExport}
            style={{backgroundColor:C.green,borderRadius:9,padding:14,alignItems:'center',marginBottom:10}}>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:14}}>Excel Indir - Hakedis {hakedisNo}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={()=>{
            const ozet = disiplinOzet.map(d=>({
              Disiplin:d.disiplin,
              'Sozlesme Bedeli':d.sozlesme,
              Gerceklesen:d.gerceklesen,
              Kalan:d.kalan,
              'Pursantaj (%)':d.pursantaj,
            }));
            exportExcel(ozet,'hakedis-ozet-'+hakedisNo);
          }} style={{backgroundColor:C.blue,borderRadius:9,padding:14,alignItems:'center',marginBottom:10}}>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:14}}>Ozet Excel Indir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* VERİ GİRİŞ MODAL */}
      <Modal visible={detayModal} transparent animationType="fade" onRequestClose={()=>setDetayModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <View>
                <Text style={{fontSize:15,fontWeight:'800',color:C.t1}}>{selBlok}</Text>
                <Text style={{fontSize:12,color:C.t3,marginTop:2}}>{selDisiplin} Disiplini - Hakedis {hakedisNo}</Text>
              </View>
              <TouchableOpacity onPress={()=>setDetayModal(false)}>
                <Text style={{color:C.t3,fontSize:22}}>X</Text>
              </TouchableOpacity>
            </View>

            {/* Disiplin seçimi */}
            <Text style={{fontSize:12,color:C.t3,marginBottom:6,fontWeight:'600'}}>Disiplin</Text>
            <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
              {DISIPLINLER.map(d=>(
                <TouchableOpacity key={d} onPress={()=>setSelDisiplin(d)}
                  style={{flex:1,paddingVertical:8,borderRadius:7,alignItems:'center',borderWidth:1,
                    backgroundColor:selDisiplin===d?C.blue:C.bg3,
                    borderColor:selDisiplin===d?C.blue:C.border}}>
                  <Text style={{color:selDisiplin===d?'#fff':C.t2,fontSize:12,fontWeight:'600'}}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sözleşme bedeli */}
            <Text style={{fontSize:12,color:C.t3,marginBottom:6,fontWeight:'600'}}>Sozlesme Bedeli (TL)</Text>
            <TextInput
              style={s.inp}
              value={sozlesme}
              onChangeText={setSozlesme}
              placeholder="0"
              placeholderTextColor={C.t3}
              keyboardType="numeric"
            />

            {/* Gerçekleşen */}
            <Text style={{fontSize:12,color:C.t3,marginBottom:6,fontWeight:'600'}}>Gerceklesen Tutar (TL)</Text>
            <TextInput
              style={s.inp}
              value={gerceklesen}
              onChangeText={setGerceklesen}
              placeholder="0"
              placeholderTextColor={C.t3}
              keyboardType="numeric"
            />

            {/* Canlı hesaplama */}
            {sozlesme && gerceklesen && (
              <View style={{backgroundColor:C.bg3,borderRadius:8,padding:12,marginBottom:16}}>
                <Text style={{color:C.t3,fontSize:11,marginBottom:4}}>Canli Hesaplama</Text>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text style={{color:C.t2,fontSize:12}}>Kalan:</Text>
                  <Text style={{color:C.amber,fontSize:13,fontWeight:'700'}}>
                    {tl((parseFloat(sozlesme)||0)-(parseFloat(gerceklesen)||0))}
                  </Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:4}}>
                  <Text style={{color:C.t2,fontSize:12}}>Pursantaj:</Text>
                  <Text style={{color:C.green,fontSize:16,fontWeight:'800'}}>
                    %{pct(parseFloat(gerceklesen)||0, parseFloat(sozlesme)||0)}
                  </Text>
                </View>
                <View style={{height:6,backgroundColor:C.bg2,borderRadius:3,overflow:'hidden',marginTop:8}}>
                  <View style={{
                    height:'100%',
                    width:(Math.min(pct(parseFloat(gerceklesen)||0, parseFloat(sozlesme)||0),100)+'%') as any,
                    backgroundColor:C.green,
                    borderRadius:3
                  }}/>
                </View>
              </View>
            )}

            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity onPress={()=>setDetayModal(false)} style={s.modalCancel}>
                <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={kaydet} style={s.modalSave}>
                <Text style={{color:'#fff',fontWeight:'800'}}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  sec:        {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  secT:       {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:14},
  kpi:        {backgroundColor:'#111827',borderRadius:10,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',overflow:'hidden'},
  kpiAcc:     {position:'absolute',top:0,left:0,right:0,height:3},
  kpiLbl:     {fontSize:10,fontWeight:'700',color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7,marginTop:4},
  kpiVal:     {fontSize:20,fontWeight:'800',color:'#f1f5f9'},
  listCard:   {backgroundColor:'#1a2236',borderRadius:10,padding:12,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  inp:        {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:11,color:'#f1f5f9',fontSize:14,marginBottom:14},
  modalBg:    {flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},
  modalBox:   {backgroundColor:'#0f1320',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  modalCancel:{flex:1,padding:12,borderRadius:8,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',alignItems:'center'},
  modalSave:  {flex:1,padding:12,borderRadius:8,backgroundColor:'#3b82f6',alignItems:'center'},
});
