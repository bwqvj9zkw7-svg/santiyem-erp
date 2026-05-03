// app/BildirimPage.tsx
import { db } from '../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet
} from 'react-native';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

type Bildirim = {
  id: string;
  tip: 'kritik'|'uyari'|'bilgi'|'basari';
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  kaynak: string;
};

const TIP_RENK:any = {
  kritik: C.red,
  uyari: C.amber,
  bilgi: C.blue,
  basari: C.green,
};

const TIP_ICON:any = {
  kritik: '🔴',
  uyari: '🟡',
  bilgi: '🔵',
  basari: '🟢',
};

export default function BildirimPage() {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [stok, setStok]               = useState<any[]>([]);
  const [safety, setSafety]           = useState<any[]>([]);
  const [purchases, setPurchases]     = useState<any[]>([]);
  const [filtre, setFiltre]           = useState<'hepsi'|'kritik'|'uyari'|'bilgi'|'okunmamis'>('hepsi');

  useEffect(()=>{
    onValue(ref(db,'bildirimler'),(snap)=>{
      const d=snap.val();
      if(d) setBildirimler(Object.values(d));
    });
    onValue(ref(db,'stok'),(snap)=>{
      const d=snap.val();
      if(d) setStok(Object.values(d));
    });
    onValue(ref(db,'safety'),(snap)=>{
      const d=snap.val();
      if(d) setSafety(Object.values(d));
    });
    onValue(ref(db,'purchases'),(snap)=>{
      const d=snap.val();
      if(d) setPurchases(Object.values(d));
    });
  },[]);

  // Otomatik bildirim üret
  useEffect(()=>{
    const yeniBildirimler: Bildirim[] = [];
    const tarih = new Date().toLocaleDateString('tr-TR');

    // Kritik stok bildirimleri
    stok.forEach((s:any)=>{
      if((s.miktar||0)<=(s.minMiktar||0)){
        yeniBildirimler.push({
          id:'STK-'+s.id,
          tip:'kritik',
          baslik:'Kritik Stok: '+s.ad,
          mesaj:`${s.ad} kritik seviyede! Mevcut: ${s.miktar} ${s.birim}, Min: ${s.minMiktar} ${s.birim}. Tedarikci: ${s.tedarikci}`,
          tarih,
          okundu:false,
          kaynak:'Stok & Ambar',
        });
      }
    });

    // Açık ISG bildirimleri
    const acikISG = safety.filter((s:any)=>s.st==='acik');
    if(acikISG.length>0){
      acikISG.forEach((s:any)=>{
        yeniBildirimler.push({
          id:'ISG-'+s.id,
          tip: s.sev==='yuksek'?'kritik':'uyari',
          baslik:'Acik ISG Olayi: '+s.id,
          mesaj:`${s.desc} — Onem: ${s.sev}. Tarih: ${s.tarih}`,
          tarih,
          okundu:false,
          kaynak:'ISG',
        });
      });
    }

    // Bekleyen satın alma
    const bekleyen = purchases.filter((p:any)=>p.st==='bekliyor');
    if(bekleyen.length>0){
      yeniBildirimler.push({
        id:'SPA-BEKLEYEN',
        tip:'uyari',
        baslik:`${bekleyen.length} Satin Alma Talebi Onay Bekliyor`,
        mesaj:`Toplam ${bekleyen.length} talep onay bekliyor: ${bekleyen.map((p:any)=>p.item).join(', ')}`,
        tarih,
        okundu:false,
        kaynak:'Satin Alma',
      });
    }

    // Bildirim yoksa bilgi ekle
    if(yeniBildirimler.length===0){
      yeniBildirimler.push({
        id:'INFO-OK',
        tip:'basari',
        baslik:'Her sey yolunda!',
        mesaj:'Kritik stok, acik ISG olayi veya bekleyen talep yok.',
        tarih,
        okundu:false,
        kaynak:'Sistem',
      });
    }

    // Firebase'den gelen + otomatik üretilen birleştir
    setBildirimler([...yeniBildirimler]);
  },[stok,safety,purchases]);

  const okunduIsaretle = (id:string) => {
    setBildirimler(prev=>prev.map(b=>b.id===id?{...b,okundu:true}:b));
    set(ref(db,'bildirimler/'+id+'/okundu'),true);
  };

  const tumunuOku = () => {
    setBildirimler(prev=>prev.map(b=>({...b,okundu:true})));
  };

  const sil = (id:string) => {
    setBildirimler(prev=>prev.filter(b=>b.id!==id));
    set(ref(db,'bildirimler/'+id),null);
  };

  // Filtrele
 const filtreliB = bildirimler.filter(b=>b&&b.id).filter(b=>{
    if(filtre==='hepsi') return true;
    if(filtre==='okunmamis') return !b.okundu;
    return b.tip===filtre;
  });

  const okunmamisSayi = bildirimler.filter(b=>!b.okundu).length;
  const kritikSayi    = bildirimler.filter(b=>b.tip==='kritik').length;
  const uyariSayi     = bildirimler.filter(b=>b.tip==='uyari').length;

  return (
    <View>
      {/* KPI */}
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.red}]}/>
          <Text style={s.kpiLbl}>Kritik</Text>
          <Text style={[s.kpiVal,{color:kritikSayi>0?C.red:C.green}]}>{kritikSayi}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.amber}]}/>
          <Text style={s.kpiLbl}>Uyari</Text>
          <Text style={[s.kpiVal,{color:uyariSayi>0?C.amber:C.green}]}>{uyariSayi}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.blue}]}/>
          <Text style={s.kpiLbl}>Okunmamis</Text>
          <Text style={[s.kpiVal,{color:okunmamisSayi>0?C.blue:C.green}]}>{okunmamisSayi}</Text>
        </View>
      </View>

      {/* Filtre + Tümünü Oku */}
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1}}>
          <View style={{flexDirection:'row',gap:6,paddingRight:8}}>
            {(['hepsi','okunmamis','kritik','uyari','bilgi'] as const).map(f=>(
              <TouchableOpacity key={f} onPress={()=>setFiltre(f)}
                style={{paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,
                  backgroundColor:filtre===f?C.blue:C.bg3,borderColor:filtre===f?C.blue:C.border}}>
                <Text style={{color:filtre===f?'#fff':C.t2,fontSize:12,textTransform:'capitalize'}}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {okunmamisSayi>0 && (
          <TouchableOpacity onPress={tumunuOku}
            style={{paddingHorizontal:12,paddingVertical:6,borderRadius:8,borderWidth:1,
              borderColor:C.border,backgroundColor:C.bg3,marginLeft:8}}>
            <Text style={{color:C.t2,fontSize:11}}>Tumunu Oku</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bildirim listesi */}
      {filtreliB.length===0 ? (
        <View style={[s.sec,{alignItems:'center',padding:30}]}>
          <Text style={{fontSize:32,marginBottom:10}}>✅</Text>
          <Text style={{color:C.t1,fontSize:16,fontWeight:'700',marginBottom:6}}>Temiz!</Text>
          <Text style={{color:C.t3,fontSize:13,textAlign:'center'}}>Bu filtrede bildirim yok</Text>
        </View>
      ) : (
        filtreliB.map((b,i)=>{
          const renk = TIP_RENK[b.tip]||C.t2;
          return (
            <View key={i} style={[s.bildirimKart,{
              borderLeftColor:renk,
              opacity:b.okundu?0.6:1,
              backgroundColor:b.okundu?C.card:C.card2,
            }]}>
              <View style={{flexDirection:'row',alignItems:'flex-start',gap:10}}>
                <Text style={{fontSize:20,marginTop:2}}>{TIP_ICON[b.tip]}</Text>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                    <Text style={{color:renk,fontWeight:'700',fontSize:13,flex:1}}>{b.baslik}</Text>
                    {!b.okundu && (
                      <View style={{width:8,height:8,borderRadius:4,backgroundColor:renk,marginTop:4,marginLeft:8}}/>
                    )}
                  </View>
                  <Text style={{color:C.t2,fontSize:12,lineHeight:18,marginBottom:6}}>{b.mesaj}</Text>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <View style={{flexDirection:'row',gap:6}}>
                      <View style={{backgroundColor:renk+'22',borderRadius:4,paddingHorizontal:6,paddingVertical:2,borderWidth:1,borderColor:renk+'44'}}>
                        <Text style={{color:renk,fontSize:10,fontWeight:'600'}}>{b.kaynak}</Text>
                      </View>
                      <Text style={{color:C.t4,fontSize:10,marginTop:1}}>{b.tarih}</Text>
                    </View>
                    <View style={{flexDirection:'row',gap:6}}>
                      {!b.okundu && (
                        <TouchableOpacity onPress={()=>okunduIsaretle(b.id)}
                          style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                            borderColor:'rgba(59,130,246,0.3)',backgroundColor:'rgba(59,130,246,0.08)'}}>
                          <Text style={{color:C.blue,fontSize:11}}>Okundu</Text>
                        </TouchableOpacity>
                      )}
                      {b.id && !b.id.startsWith('STK-')&&!b.id.startsWith('ISG-')&&b.id!=='SPA-BEKLEYEN'&&b.id!=='INFO-OK' && (
                        <TouchableOpacity onPress={()=>sil(b.id)}
                          style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                            borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'}}>
                          <Text style={{color:C.red,fontSize:11}}>Sil</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row:          {flexDirection:'row',marginHorizontal:-4,marginBottom:12},
  kpi:          {backgroundColor:'#111827',borderRadius:10,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',overflow:'hidden'},
  kpiAcc:       {position:'absolute',top:0,left:0,right:0,height:3},
  kpiLbl:       {fontSize:10,fontWeight:'700',color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7,marginTop:4},
  kpiVal:       {fontSize:20,fontWeight:'800',color:'#f1f5f9'},
  sec:          {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  bildirimKart: {borderRadius:10,padding:14,marginBottom:8,borderWidth:1,borderLeftWidth:4,borderColor:'rgba(255,255,255,0.08)'},
});
