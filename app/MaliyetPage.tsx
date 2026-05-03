// app/MaliyetPage.tsx
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

const tl = (n:any) => 'TL '+new Intl.NumberFormat('tr-TR').format(Math.round(Number(n)||0));
const pct = (g:number,p:number) => p ? Math.round((g/p)*100*10)/10 : 0;
const sapma = (g:number,p:number) => p ? Math.round(((g-p)/p)*100*10)/10 : 0;

const DEMO_BUTCE = [
  {id:'B001', kalem:'Insaat Iscilik', kategori:'Insaat', planlanan:380000000, gerceklesen:412000000},
  {id:'B002', kalem:'Betonarme Malzeme', kategori:'Insaat', planlanan:520000000, gerceklesen:485000000},
  {id:'B003', kalem:'Kalip Iscilik', kategori:'Insaat', planlanan:95000000, gerceklesen:102000000},
  {id:'B004', kalem:'Duvar Orme', kategori:'Insaat', planlanan:145000000, gerceklesen:138000000},
  {id:'B005', kalem:'Siva ve Boya', kategori:'Insaat', planlanan:210000000, gerceklesen:0},
  {id:'B006', kalem:'Seramik Kaplama', kategori:'Insaat', planlanan:180000000, gerceklesen:0},
  {id:'B007', kalem:'Elektrik Tesisat', kategori:'Elektrik', planlanan:320000000, gerceklesen:78000000},
  {id:'B008', kalem:'Elektrik Malzeme', kategori:'Elektrik', planlanan:185000000, gerceklesen:42000000},
  {id:'B009', kalem:'Mekanik Tesisat', kategori:'Mekanik', planlanan:280000000, gerceklesen:52000000},
  {id:'B010', kalem:'Dogalgaz Tesisat', kategori:'Mekanik', planlanan:95000000, gerceklesen:18000000},
  {id:'B011', kalem:'Aluminyum Dograma', kategori:'Mimari', planlanan:165000000, gerceklesen:0},
  {id:'B012', kalem:'Celik Kapi/Pencere', kategori:'Mimari', planlanan:88000000, gerceklesen:0},
  {id:'B013', kalem:'Is Makinesi Kiralama', kategori:'Ekipman', planlanan:75000000, gerceklesen:68000000},
  {id:'B014', kalem:'Vinc Kiralama', kategori:'Ekipman', planlanan:45000000, gerceklesen:52000000},
  {id:'B015', kalem:'Santiye Kurulumu', kategori:'Genel Gider', planlanan:28000000, gerceklesen:31000000},
  {id:'B016', kalem:'ISG Ekipmanlari', kategori:'Genel Gider', planlanan:18000000, gerceklesen:14000000},
  {id:'B017', kalem:'Yonetim Giderleri', kategori:'Genel Gider', planlanan:55000000, gerceklesen:48000000},
];

const KATEGORILER = ['Insaat','Elektrik','Mekanik','Mimari','Ekipman','Genel Gider'];

const exportExcel = (data:any[], dosyaAdi:string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maliyet');
    const out = XLSX.write(wb, {type:'base64', bookType:'xlsx'});
    const binary = atob(out);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=dosyaAdi+'.xlsx'; a.click();
    URL.revokeObjectURL(url);
  } catch(e) { Alert.alert('Hata','Excel olusturulamadi'); }
};

export default function MaliyetPage() {
  const [butce, setButce]         = useState(DEMO_BUTCE as any[]);
  const [tab, setTab]             = useState<'ozet'|'detay'|'tahmini'>('ozet');
  const [editModal, setEditModal] = useState(false);
  const [selKalem, setSelKalem]   = useState<any>(null);
  const [yeniGercek, setYeniGercek] = useState('');
  const [yeniPlan, setYeniPlan]   = useState('');
  const [selKat, setSelKat]       = useState('Tumu');

  useEffect(()=>{
    onValue(ref(db,'butce'),(snap)=>{
      const d=snap.val();
      if(d) setButce(Object.values(d));
      else DEMO_BUTCE.forEach((b:any)=>set(ref(db,'butce/'+b.id),b));
    });
  },[]);

  const guncelle = () => {
    if(!selKalem) return;
    const guncellendi = {
      ...selKalem,
      planlanan: parseFloat(yeniPlan)||selKalem.planlanan,
      gerceklesen: parseFloat(yeniGercek)||selKalem.gerceklesen,
    };
    set(ref(db,'butce/'+selKalem.id),guncellendi);
    setEditModal(false);
    setYeniGercek('');setYeniPlan('');
  };

  // Genel hesaplar
  const toplamPlan  = butce.reduce((s:number,b:any)=>s+(b.planlanan||0),0);
  const toplamGer   = butce.reduce((s:number,b:any)=>s+(b.gerceklesen||0),0);
  const toplamKalan = toplamPlan - toplamGer;
  const genelPct    = pct(toplamGer,toplamPlan);
  const genelSapma  = sapma(toplamGer,toplamPlan);

  // Kategori özeti
  const katOzet = KATEGORILER.map(k=>{
    const items = butce.filter((b:any)=>b.kategori===k);
    const plan  = items.reduce((s:number,b:any)=>s+(b.planlanan||0),0);
    const ger   = items.reduce((s:number,b:any)=>s+(b.gerceklesen||0),0);
    const sap   = sapma(ger,plan);
    return {kategori:k, planlanan:plan, gerceklesen:ger, kalan:plan-ger, sapma:sap, pct:pct(ger,plan)};
  }).filter(k=>k.planlanan>0);

  // Sapma rengi
  const sapmRenk = (s:number) => s>10?C.red:s>0?C.amber:s<-5?C.cyan:C.green;
  const sapmYazi = (s:number) => s>0?'+'+s+'% Asim':s<0?s+'% Tasarruf':'Planda';

  // Filtrelenmiş kalemler
  const filtreliButce = selKat==='Tumu' ? butce : butce.filter((b:any)=>b.kategori===selKat);

  // Tahmini tamamlanma maliyeti
  const tahminiToplam = butce.reduce((s:number,b:any)=>{
    if(b.gerceklesen>0 && b.planlanan>0){
      const sapmaOrani = (b.gerceklesen-b.planlanan)/b.planlanan;
      return s + b.planlanan * (1+sapmaOrani);
    }
    return s + (b.planlanan||0);
  },0);
  const tahminiSapma = tahminiToplam - toplamPlan;

  return (
    <View>
      {/* KPI */}
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.blue}]}/>
          <Text style={s.kpiLbl}>Toplam Butce</Text>
          <Text style={[s.kpiVal,{fontSize:12}]}>{tl(toplamPlan)}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.green}]}/>
          <Text style={s.kpiLbl}>Harcanan</Text>
          <Text style={[s.kpiVal,{fontSize:12}]}>{tl(toplamGer)}</Text>
          <Text style={{fontSize:10,color:C.green,marginTop:2}}>%{genelPct}</Text>
        </View>
      </View>
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.amber}]}/>
          <Text style={s.kpiLbl}>Kalan</Text>
          <Text style={[s.kpiVal,{fontSize:12}]}>{tl(toplamKalan)}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:sapmRenk(genelSapma)}]}/>
          <Text style={s.kpiLbl}>Genel Sapma</Text>
          <Text style={[s.kpiVal,{fontSize:14,color:sapmRenk(genelSapma)}]}>{sapmYazi(genelSapma)}</Text>
        </View>
      </View>

      {/* TAB */}
      <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
        {(['ozet','detay','tahmini'] as const).map(t=>(
          <TouchableOpacity key={t} onPress={()=>setTab(t)}
            style={{flex:1,paddingVertical:9,borderRadius:8,alignItems:'center',borderWidth:1,
              backgroundColor:tab===t?C.blue:C.bg3,borderColor:tab===t?C.blue:C.border}}>
            <Text style={{color:tab===t?'#fff':C.t2,fontSize:12,fontWeight:'600'}}>
              {t==='ozet'?'Ozet':t==='detay'?'Detay':'Tahmin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ÖZET TAB */}
      {tab==='ozet' && (
        <View>
          {/* Genel ilerleme */}
          <View style={s.sec}>
            <Text style={s.secT}>Genel Butce Kullanimi</Text>
            <View style={{height:20,backgroundColor:C.bg3,borderRadius:10,overflow:'hidden',marginBottom:8}}>
              <View style={{height:'100%',width:(Math.min(genelPct,100)+'%') as any,
                backgroundColor:genelPct>90?C.red:genelPct>70?C.amber:C.green,borderRadius:10}}/>
            </View>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{color:C.green,fontSize:12}}>Harcanan: %{genelPct}</Text>
              <Text style={{color:C.amber,fontSize:12}}>Kalan: %{Math.round((1-genelPct/100)*1000)/10}</Text>
            </View>
          </View>

          {/* Kategori bazlı */}
          <View style={s.sec}>
            <Text style={s.secT}>Kategori Bazli Analiz</Text>
            {katOzet.map((k,i)=>{
              const sr = sapmRenk(k.sapma);
              const barPct = Math.min(k.pct,100);
              return (
                <View key={i} style={{marginBottom:16}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                    <Text style={{color:C.t1,fontWeight:'700',fontSize:13}}>{k.kategori}</Text>
                    <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                      <Text style={{color:C.t2,fontSize:11}}>%{k.pct}</Text>
                      <View style={{backgroundColor:sr+'22',borderRadius:6,paddingHorizontal:8,
                        paddingVertical:3,borderWidth:1,borderColor:sr}}>
                        <Text style={{color:sr,fontSize:11,fontWeight:'600'}}>{sapmYazi(k.sapma)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{height:8,backgroundColor:C.bg3,borderRadius:4,overflow:'hidden',marginBottom:4}}>
                    <View style={{height:'100%',width:(barPct+'%') as any,
                      backgroundColor:k.sapma>10?C.red:k.sapma>0?C.amber:C.green,borderRadius:4}}/>
                  </View>
                  <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={{color:C.t3,fontSize:11}}>Plan: {tl(k.planlanan)}</Text>
                    <Text style={{color:C.green,fontSize:11}}>Ger: {tl(k.gerceklesen)}</Text>
                    <Text style={{color:C.amber,fontSize:11}}>Kalan: {tl(k.kalan)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* DETAY TAB */}
      {tab==='detay' && (
        <View>
          <View style={{flexDirection:'row',gap:8,marginBottom:10}}>
            <TouchableOpacity onPress={()=>exportExcel(butce.map((b:any)=>({
              'Kalem':b.kalem,'Kategori':b.kategori,
              'Planlanan':b.planlanan,'Gerceklesen':b.gerceklesen,
              'Kalan':(b.planlanan||0)-(b.gerceklesen||0),
              'Sapma (%)':(b.planlanan?Math.round(((b.gerceklesen-b.planlanan)/b.planlanan)*1000)/10:0),
            })),'maliyet-analizi')} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
            </TouchableOpacity>
          </View>

          {/* Kategori filtresi */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            <View style={{flexDirection:'row',gap:6,paddingBottom:4}}>
              {['Tumu',...KATEGORILER].map(k=>(
                <TouchableOpacity key={k} onPress={()=>setSelKat(k)}
                  style={{paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,
                    backgroundColor:selKat===k?C.blue:C.bg3,borderColor:selKat===k?C.blue:C.border}}>
                  <Text style={{color:selKat===k?'#fff':C.t2,fontSize:12}}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filtreliButce.map((b:any,i:number)=>{
            const sap = sapma(b.gerceklesen,b.planlanan);
            const sr  = sapmRenk(sap);
            const barPct = b.planlanan ? Math.min(pct(b.gerceklesen,b.planlanan),100) : 0;
            return (
              <View key={i} style={[s.listCard,{marginBottom:8}]}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                  <View style={{flex:1}}>
                    <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{b.kalem}</Text>
                    <Text style={{color:C.t3,fontSize:11}}>{b.kategori}</Text>
                  </View>
                  <View style={{alignItems:'flex-end',gap:4}}>
                    <View style={{backgroundColor:sr+'22',borderRadius:6,paddingHorizontal:8,
                      paddingVertical:3,borderWidth:1,borderColor:sr}}>
                      <Text style={{color:sr,fontSize:11,fontWeight:'700'}}>{sapmYazi(sap)}</Text>
                    </View>
                    <TouchableOpacity onPress={()=>{
                      setSelKalem(b);
                      setYeniGercek(String(b.gerceklesen||''));
                      setYeniPlan(String(b.planlanan||''));
                      setEditModal(true);
                    }} style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,borderWidth:1,
                      borderColor:'rgba(59,130,246,0.3)',backgroundColor:'rgba(59,130,246,0.08)'}}>
                      <Text style={{color:C.blue,fontSize:11}}>Guncelle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{height:5,backgroundColor:C.bg3,borderRadius:3,overflow:'hidden',marginBottom:6}}>
                  <View style={{height:'100%',width:(barPct+'%') as any,
                    backgroundColor:sap>10?C.red:sap>0?C.amber:C.green,borderRadius:3}}/>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text style={{color:C.t3,fontSize:11}}>Plan: {tl(b.planlanan)}</Text>
                  <Text style={{color:C.green,fontSize:11}}>Ger: {tl(b.gerceklesen)}</Text>
                  <Text style={{color:C.amber,fontSize:11}}>%{pct(b.gerceklesen,b.planlanan)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* TAHMİN TAB */}
      {tab==='tahmini' && (
        <View>
          <View style={[s.sec,{borderColor:tahminiSapma>0?'rgba(239,68,68,0.3)':'rgba(34,197,94,0.3)',borderWidth:2}]}>
            <Text style={{color:C.t3,fontSize:11,marginBottom:8}}>TAHMINi TAMAMLANMA MALIYETi</Text>
            <Text style={{color:tahminiSapma>0?C.red:C.green,fontSize:28,fontWeight:'800',marginBottom:4}}>
              {tl(tahminiToplam)}
            </Text>
            <View style={{flexDirection:'row',gap:10,marginTop:4}}>
              <View>
                <Text style={{color:C.t3,fontSize:11}}>Sozlesme Bedeli</Text>
                <Text style={{color:C.t1,fontSize:14,fontWeight:'700'}}>{tl(toplamPlan)}</Text>
              </View>
              <View>
                <Text style={{color:C.t3,fontSize:11}}>Tahmini Sapma</Text>
                <Text style={{color:tahminiSapma>0?C.red:C.green,fontSize:14,fontWeight:'700'}}>
                  {tahminiSapma>0?'+':''}{tl(tahminiSapma)}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.sec}>
            <Text style={s.secT}>Risk Analizi</Text>
            {katOzet.filter(k=>k.sapma>5).length===0 ? (
              <View style={{alignItems:'center',padding:16}}>
                <Text style={{fontSize:28,marginBottom:8}}>✅</Text>
                <Text style={{color:C.green,fontSize:14,fontWeight:'700'}}>Riskli kalem yok!</Text>
                <Text style={{color:C.t3,fontSize:12,marginTop:4}}>Tum kategoriler butce dahilinde</Text>
              </View>
            ) : (
              katOzet.filter(k=>k.sapma>0).sort((a,b)=>b.sapma-a.sapma).map((k,i)=>(
                <View key={i} style={{flexDirection:'row',justifyContent:'space-between',
                  paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <View>
                    <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{k.kategori}</Text>
                    <Text style={{color:C.t3,fontSize:11}}>Asim: {tl(k.gerceklesen-k.planlanan)}</Text>
                  </View>
                  <View style={{backgroundColor:sapmRenk(k.sapma)+'22',borderRadius:8,
                    paddingHorizontal:12,paddingVertical:6,alignItems:'center',justifyContent:'center',
                    borderWidth:1,borderColor:sapmRenk(k.sapma)}}>
                    <Text style={{color:sapmRenk(k.sapma),fontWeight:'800',fontSize:14}}>+%{k.sapma}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={s.sec}>
            <Text style={s.secT}>Tasarruf Firsetleri</Text>
            {katOzet.filter(k=>k.sapma<0).length===0 ? (
              <Text style={{color:C.t3,textAlign:'center',padding:10}}>Henuz tasarruf edilen kalem yok</Text>
            ) : (
              katOzet.filter(k=>k.sapma<0).map((k,i)=>(
                <View key={i} style={{flexDirection:'row',justifyContent:'space-between',
                  paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <View>
                    <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{k.kategori}</Text>
                    <Text style={{color:C.t3,fontSize:11}}>Tasarruf: {tl(k.planlanan-k.gerceklesen)}</Text>
                  </View>
                  <View style={{backgroundColor:'rgba(34,197,94,0.15)',borderRadius:8,
                    paddingHorizontal:12,paddingVertical:6,alignItems:'center',justifyContent:'center',
                    borderWidth:1,borderColor:C.green}}>
                    <Text style={{color:C.green,fontWeight:'800',fontSize:14}}>{k.sapma}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* GÜNCELLE MODAL */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={()=>setEditModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.t1,flex:1}}>{selKalem?.kalem}</Text>
              <TouchableOpacity onPress={()=>setEditModal(false)}><Text style={{color:C.t3,fontSize:22}}>X</Text></TouchableOpacity>
            </View>

            <Text style={s.lbl}>Planlanan Butce (TL)</Text>
            <TextInput style={s.inp} value={yeniPlan} onChangeText={setYeniPlan}
              placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>

            <Text style={s.lbl}>Gerceklesen Tutar (TL)</Text>
            <TextInput style={s.inp} value={yeniGercek} onChangeText={setYeniGercek}
              placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/>

            {yeniPlan && yeniGercek && (
              <View style={{backgroundColor:C.bg3,borderRadius:8,padding:12,marginBottom:14}}>
                <Text style={{color:C.t3,fontSize:11,marginBottom:6}}>Canli Hesaplama</Text>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text style={{color:C.t2,fontSize:12}}>Kullanim Orani:</Text>
                  <Text style={{color:C.green,fontWeight:'700',fontSize:14}}>
                    %{pct(parseFloat(yeniGercek)||0,parseFloat(yeniPlan)||0)}
                  </Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:4}}>
                  <Text style={{color:C.t2,fontSize:12}}>Sapma:</Text>
                  <Text style={{
                    color:sapmRenk(sapma(parseFloat(yeniGercek)||0,parseFloat(yeniPlan)||0)),
                    fontWeight:'700',fontSize:14
                  }}>
                    {sapmYazi(sapma(parseFloat(yeniGercek)||0,parseFloat(yeniPlan)||0))}
                  </Text>
                </View>
              </View>
            )}

            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity onPress={()=>setEditModal(false)} style={s.modalCancel}>
                <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={guncelle} style={s.modalSave}>
                <Text style={{color:'#fff',fontWeight:'800'}}>Guncelle</Text>
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
  addBtn:     {backgroundColor:'#3b82f6',borderRadius:9,padding:12,alignItems:'center',marginBottom:0},
  lbl:        {fontSize:12,color:'#475569',marginBottom:6,fontWeight:'600'},
  inp:        {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:11,color:'#f1f5f9',fontSize:14,marginBottom:14},
  modalBg:    {flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},
  modalBox:   {backgroundColor:'#0f1320',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  modalCancel:{flex:1,padding:12,borderRadius:8,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',alignItems:'center'},
  modalSave:  {flex:1,padding:12,borderRadius:8,backgroundColor:'#3b82f6',alignItems:'center'},
});
