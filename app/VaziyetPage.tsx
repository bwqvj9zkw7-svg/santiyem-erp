// app/VaziyetPage.tsx
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Dimensions
} from 'react-native';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

// Blok pozisyonları — vaziyet planından alındı
// x, y: grid pozisyonu (0-20 arası), w: genişlik, h: yükseklik
const VAZIYET_BLOKLARI = [
  {id:'A BLOK-01',  tip:'B+Z+4',  x:19.0, y:33.5, w:1.8, h:1.3},
  {id:'A BLOK-02',  tip:'B+Z+4',  x:15.5, y:31.0, w:1.8, h:1.3},
  {id:'A BLOK-03',  tip:'B+Z+4',  x:12.5, y:32.0, w:1.8, h:1.3, not:'Mescitli'},
  {id:'A BLOK-04',  tip:'B+Z+4',  x:14.5, y:27.5, w:1.8, h:1.3},
  {id:'A BLOK-05',  tip:'2B+Z+3',  x:14.0, y:23.5, w:1.8, h:1.3},
  {id:'A BLOK-06',  tip:'B+Z+4',  x:7.0, y:29.5, w:1.8, h:1.3},
  {id:'A BLOK-07',  tip:'B+Z+4',  x:10.0, y:21.0, w:1.8, h:1.3},
  {id:'A BLOK-08',  tip:'B+Z+3',  x:7.5, y:24.5, w:1.8, h:1.3},
  {id:'A BLOK-09',  tip:'2B+Z+3',  x:2.0, y:28.0, w:1.8, h:1.3},
  {id:'A BLOK-10',  tip:'B+Z+4',  x:5.0, y:19.5, w:1.8, h:1.3, not:'Mescitli'},
  {id:'A BLOK-11',  tip:'2B+Z+3',  x:0.0, y:27.0, w:1.8, h:1.3},
  {id:'A BLOK-12',  tip:'B+Z+4',  x:3.5, y:23.0, w:1.8, h:1.3},
  {id:'A BLOK-13',  tip:'2B+Z+3',  x:3.0, y:18.5, w:1.8, h:1.3},
  {id:'A BLOK-14',  tip:'2B+Z+3',  x:15.5, y:18.0, w:1.8, h:1.3},
  {id:'A BLOK-15',  tip:'B+Z+3',  x:17.5, y:17.5, w:1.8, h:1.3},
  {id:'A BLOK-16',  tip:'B+Z+3',  x:24.5, y:14.5, w:1.8, h:1.3, not:'Mescitli'},
  {id:'A BLOK-17',  tip:'B+Z+3',  x:25.0, y:17.0, w:1.8, h:1.3},
  {id:'A BLOK-18',  tip:'2B+Z+3',  x:28.0, y:5.5, w:1.8, h:1.3},
  {id:'A BLOK-19',  tip:'B+Z+4',  x:34.5, y:1.0, w:1.8, h:1.3, not:'Mescitli'},
  {id:'A BLOK-20',  tip:'B+Z+4',  x:35.0, y:4.0, w:1.8, h:1.3},
  {id:'A BLOK-21',  tip:'B+Z+4',  x:34.5, y:21.0, w:1.8, h:1.3, not:'Mescitli'},
  {id:'B BLOK-01',  tip:'B+Z+4',  x:18.5, y:35.0, w:1.8, h:1.3},
  {id:'B BLOK-02',  tip:'B+Z+4',  x:14.0, y:29.0, w:1.8, h:1.3},
  {id:'B BLOK-03',  tip:'2B+Z+3',  x:13.5, y:25.0, w:1.8, h:1.3},
  {id:'B BLOK-04',  tip:'B+Z+3',  x:6.5, y:26.0, w:1.8, h:1.3},
  {id:'B BLOK-05',  tip:'B+Z+4',  x:3.0, y:24.5, w:1.8, h:1.3},
  {id:'B BLOK-06',  tip:'B+Z+3',  x:18.0, y:19.0, w:1.8, h:1.3},
  {id:'B BLOK-07',  tip:'B+Z+4',  x:33.5, y:20.5, w:1.8, h:1.3},
  {id:'C BLOK-01',  tip:'2B+Z+3',  x:20.0, y:31.0, w:1.8, h:1.3},
  {id:'C BLOK-02',  tip:'B+Z+4',  x:21.0, y:28.5, w:1.8, h:1.3},
  {id:'C BLOK-03',  tip:'B+Z+4',  x:21.5, y:26.5, w:1.8, h:1.3},
  {id:'C BLOK-04',  tip:'B+Z+4',  x:17.0, y:33.5, w:1.8, h:1.3},
  {id:'C BLOK-05',  tip:'B+Z+4',  x:19.5, y:26.0, w:1.8, h:1.3},
  {id:'C BLOK-06',  tip:'B+Z+4',  x:14.5, y:33.5, w:1.8, h:1.3},
  {id:'C BLOK-07',  tip:'B+Z+4',  x:17.0, y:27.0, w:1.8, h:1.3},
  {id:'C BLOK-08',  tip:'B+Z+3',  x:4.5, y:29.0, w:1.8, h:1.3},
  {id:'C BLOK-09',  tip:'B+Z+3',  x:7.5, y:21.5, w:1.8, h:1.3},
  {id:'C BLOK-10',  tip:'B+Z+4',  x:1.5, y:20.0, w:1.8, h:1.3},
  {id:'C BLOK-11',  tip:'B+Z+4',  x:21.5, y:18.5, w:1.8, h:1.3},
  {id:'C BLOK-12',  tip:'B+Z+4',  x:23.0, y:16.0, w:1.8, h:1.3},
  {id:'C BLOK-13',  tip:'B+Z+4',  x:24.0, y:19.5, w:1.8, h:1.3},
  {id:'C BLOK-14',  tip:'B+Z+4',  x:27.0, y:11.0, w:1.8, h:1.3},
  {id:'C BLOK-15',  tip:'B+Z+4',  x:26.5, y:7.0, w:1.8, h:1.3},
  {id:'C BLOK-16',  tip:'B+Z+4',  x:28.0, y:8.5, w:1.8, h:1.3},
  {id:'C BLOK-17',  tip:'B+Z+3',  x:30.5, y:2.5, w:1.8, h:1.3},
  {id:'C BLOK-18',  tip:'2B+Z+3',  x:32.5, y:2.5, w:1.8, h:1.3},
  {id:'C BLOK-19',  tip:'2B+Z+3',  x:33.0, y:4.5, w:1.8, h:1.3},
  {id:'C BLOK-20',  tip:'B+Z+3',  x:31.5, y:0.0, w:1.8, h:1.3},
  {id:'C BLOK-21',  tip:'B+Z+4',  x:38.5, y:16.5, w:1.8, h:1.3},
  {id:'C BLOK-22',  tip:'B+Z+4',  x:36.5, y:18.0, w:1.8, h:1.3},
  {id:'C BLOK-23',  tip:'B+Z+4',  x:38.0, y:19.5, w:1.8, h:1.3},
  {id:'C BLOK-24',  tip:'B+Z+4',  x:37.5, y:21.5, w:1.8, h:1.3},
  {id:'D BLOK-01',  tip:'B+Z+4',  x:17.5, y:31.0, w:1.8, h:1.3},
  {id:'D BLOK-02',  tip:'B+Z+4',  x:18.5, y:28.5, w:1.8, h:1.3},
  {id:'D BLOK-03',  tip:'B+Z+4',  x:17.5, y:24.5, w:1.8, h:1.3},
  {id:'D BLOK-04',  tip:'B+Z+4',  x:15.5, y:25.0, w:1.8, h:1.3},
  {id:'D BLOK-05',  tip:'B+Z+4',  x:11.0, y:31.5, w:1.8, h:1.3},
  {id:'D BLOK-06',  tip:'2B+Z+3',  x:12.0, y:29.0, w:1.8, h:1.3},
  {id:'D BLOK-07',  tip:'B+Z+4',  x:8.5, y:27.5, w:1.8, h:1.3},
  {id:'D BLOK-08',  tip:'B+Z+4',  x:9.5, y:24.5, w:1.8, h:1.3},
  {id:'D BLOK-09',  tip:'B+Z+3',  x:5.5, y:28.0, w:1.8, h:1.3},
  {id:'D BLOK-10',  tip:'B+Z+3',  x:7.5, y:20.0, w:1.8, h:1.3},
  {id:'D BLOK-11',  tip:'B+Z+4',  x:5.0, y:25.5, w:1.8, h:1.3},
  {id:'D BLOK-12',  tip:'B+Z+4',  x:5.5, y:23.0, w:1.8, h:1.3},
  {id:'D BLOK-13',  tip:'B+Z+4',  x:0.0, y:24.5, w:1.8, h:1.3},
  {id:'D BLOK-14',  tip:'B+Z+4',  x:1.5, y:23.0, w:1.8, h:1.3},
  {id:'D BLOK-15',  tip:'B+Z+4',  x:19.5, y:18.0, w:1.8, h:1.3},
  {id:'D BLOK-16',  tip:'B+Z+4',  x:20.0, y:20.0, w:1.8, h:1.3},
  {id:'D BLOK-17',  tip:'B+Z+4',  x:22.0, y:21.0, w:1.8, h:1.3},
  {id:'D BLOK-18',  tip:'B+Z+3',  x:26.0, y:12.5, w:1.8, h:1.3},
  {id:'D BLOK-19',  tip:'B+Z+3',  x:25.0, y:10.5, w:1.8, h:1.3},
  {id:'D BLOK-20',  tip:'B+Z+3',  x:29.5, y:3.0, w:1.8, h:1.3},
  {id:'D BLOK-21',  tip:'B+Z+3',  x:30.5, y:0.5, w:1.8, h:1.3},
  {id:'D BLOK-22',  tip:'B+Z+4',  x:40.0, y:12.5, w:1.8, h:1.3},
  {id:'D BLOK-23',  tip:'B+Z+4',  x:40.0, y:14.5, w:1.8, h:1.3},
  {id:'D BLOK-24',  tip:'B+Z+4',  x:37.5, y:16.0, w:1.8, h:1.3},
  {id:'D BLOK-25',  tip:'B+Z+4',  x:35.5, y:17.5, w:1.8, h:1.3},
];


const CELL = 24; // piksel başına grid hücresi

export default function VaziyetPage() {
  const [blocks, setBlocks]     = useState<any[]>([]);
  const [selBlok, setSelBlok]   = useState<any>(null);
  const [detayModal, setDetay]  = useState(false);
  const [filtre, setFiltre]     = useState('Tumu');

  useEffect(()=>{
    onValue(ref(db,'blocks'),(snap)=>{
      const d=snap.val();
      if(d) setBlocks(Object.values(d));
    });
  },[]);

  // Blok durumunu Firebase'den al
  const getBlokDurum = (blokId:string) => {
    const fb = blocks.find((b:any)=>
      b.name&&b.name.toUpperCase().replace(/\s+/g,'').includes(blokId.toUpperCase().replace(/\s+/g,''))
    );
    if(!fb) return {pct:0, durum:'baslanmadi', color:C.t4, imalat:'-', eng:'-'};
    const p = fb.floors ? Math.round(Number(fb.done)/Number(fb.floors)*100) : 0;
    return {
      pct:p,
      durum: p===100?'tamamlandi':p>0?'devam':'baslanmadi',
      color: p===100?C.green:p>60?C.blue:p>0?C.amber:C.t4,
      imalat: fb.imalat||'-',
      eng: fb.eng||'-',
      done: fb.done||0,
      floors: fb.floors||0,
    };
  };

  const blokRenk = (pct:number) => {
    if(pct===100) return C.green;
    if(pct>60) return C.blue;
    if(pct>0) return C.amber;
    return C.t4;
  };

  const tamamSayisi  = VAZIYET_BLOKLARI.filter(b=>getBlokDurum(b.id).pct===100).length;
  const devamSayisi  = VAZIYET_BLOKLARI.filter(b=>{const d=getBlokDurum(b.id); return d.pct>0&&d.pct<100;}).length;
  const baslanmamis  = VAZIYET_BLOKLARI.filter(b=>getBlokDurum(b.id).pct===0).length;

  // Grid boyutları
  const maxX = Math.max(...VAZIYET_BLOKLARI.map(b=>b.x+b.w)) + 1;
  const maxY = Math.max(...VAZIYET_BLOKLARI.map(b=>b.y+b.h)) + 1;

  return (
    <View>
      {/* KPI */}
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.green}]}/>
          <Text style={s.kpiLbl}>Tamamlanan</Text>
          <Text style={[s.kpiVal,{color:C.green}]}>{tamamSayisi}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.amber}]}/>
          <Text style={s.kpiLbl}>Devam Eden</Text>
          <Text style={[s.kpiVal,{color:C.amber}]}>{devamSayisi}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.t4}]}/>
          <Text style={s.kpiLbl}>Baslanmamis</Text>
          <Text style={[s.kpiVal,{color:C.t3}]}>{baslanmamis}</Text>
        </View>
      </View>

      {/* Filtre */}
      <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
        {['Tumu','A Blok','B Blok','C Blok','D Blok'].map(f=>(
          <TouchableOpacity key={f} onPress={()=>setFiltre(f)}
            style={{paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,flex:1,alignItems:'center',
              backgroundColor:filtre===f?C.blue:C.bg3,borderColor:filtre===f?C.blue:C.border}}>
            <Text style={{color:filtre===f?'#fff':C.t2,fontSize:11,fontWeight:'600'}}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lejant */}
      <View style={{flexDirection:'row',gap:12,marginBottom:12,flexWrap:'wrap'}}>
        {[
          [C.green,'Tamamlandi (%100)'],
          [C.blue,'Ilerledi (>%60)'],
          [C.amber,'Baslandi (>%0)'],
          [C.t4,'Baslanmadi'],
        ].map(([c,l]:any,i)=>(
          <View key={i} style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={{width:12,height:12,borderRadius:3,backgroundColor:c}}/>
            <Text style={{color:C.t3,fontSize:11}}>{l}</Text>
          </View>
        ))}
      </View>

      {/* VAZİYET PLANI */}
      <View style={[s.sec,{padding:8}]}>
        <Text style={[s.secT,{marginBottom:8}]}>Vaziyet Plani — Konya 906 Konut</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <ScrollView showsVerticalScrollIndicator={true} style={{maxHeight:600}}>
            <View style={{width:maxX*CELL, height:maxY*CELL, backgroundColor:C.bg3, borderRadius:8, position:'relative'}}>
              
              {/* Grid çizgileri */}
              {Array.from({length:Math.ceil(maxX/3)},(_,i)=>(
                <View key={'vg'+i} style={{position:'absolute',left:i*3*CELL,top:0,width:1,
                  height:maxY*CELL,backgroundColor:'rgba(255,255,255,0.03)'}}/>
              ))}
              {Array.from({length:Math.ceil(maxY/3)},(_,i)=>(
                <View key={'hg'+i} style={{position:'absolute',top:i*3*CELL,left:0,height:1,
                  width:maxX*CELL,backgroundColor:'rgba(255,255,255,0.03)'}}/>
              ))}

              {/* Bloklar */}
              {VAZIYET_BLOKLARI
                .filter(b=>filtre==='Tumu'||b.id.startsWith(filtre.split(' ')[0]))
                .map((blok,i)=>{
                  const durum = getBlokDurum(blok.id);
                  const renk  = blokRenk(durum.pct);
                  const kisaAd = blok.id.replace(' BLOK-','').replace(' ','');
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={()=>{setSelBlok({...blok,...durum});setDetay(true);}}
                      style={{
                        position:'absolute',
                        left:blok.x*CELL,
                        top:blok.y*CELL,
                        width:blok.w*CELL-2,
                        height:blok.h*CELL-2,
                        backgroundColor:renk+'33',
                        borderWidth:1.5,
                        borderColor:renk,
                        borderRadius:4,
                        alignItems:'center',
                        justifyContent:'center',
                        padding:2,
                      }}
                    >
                      <Text style={{color:renk,fontSize:8,fontWeight:'800',textAlign:'center'}}>{kisaAd}</Text>
                      {durum.pct>0 && (
                        <Text style={{color:renk,fontSize:7,textAlign:'center'}}>%{durum.pct}</Text>
                      )}
                      {blok.not && (
                        <View style={{width:6,height:6,borderRadius:3,backgroundColor:C.purple,
                          position:'absolute',top:2,right:2}}/>
                      )}
                    </TouchableOpacity>
                  );
              })}

              {/* Bölge etiketleri */}
              {[
                {label:'A BLOK',x:1,y:0,color:C.blue},
                {label:'A BLOK',x:4,y:0,color:C.blue},
                {label:'B BLOK',x:7,y:0,color:C.green},
                {label:'C BLOK',x:10,y:0,color:C.amber},
                {label:'C BLOK',x:13,y:0,color:C.amber},
                {label:'D BLOK',x:16,y:0,color:C.red},
                {label:'D BLOK',x:19,y:0,color:C.red},
                {label:'D BLOK',x:22,y:0,color:C.red},
              ].map((e,i)=>(
                <Text key={i} style={{
                  position:'absolute',
                  left:e.x*CELL,
                  top:0,
                  color:e.color,
                  fontSize:8,
                  fontWeight:'800',
                  opacity:0.7,
                }}>{e.label}</Text>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* Detay Modal */}
      <Modal visible={detayModal} transparent animationType="fade" onRequestClose={()=>setDetay(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <View>
                <Text style={{color:C.t1,fontSize:18,fontWeight:'800'}}>{selBlok?.id}</Text>
                <Text style={{color:C.t3,fontSize:12,marginTop:2}}>{selBlok?.tip}</Text>
              </View>
              <TouchableOpacity onPress={()=>setDetay(false)}>
                <Text style={{color:C.t3,fontSize:24}}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* İlerleme */}
            <View style={{backgroundColor:C.bg3,borderRadius:10,padding:16,marginBottom:14}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                <Text style={{color:C.t3,fontSize:12}}>Ilerleme</Text>
                <Text style={{color:blokRenk(selBlok?.pct||0),fontSize:20,fontWeight:'800'}}>
                  %{selBlok?.pct||0}
                </Text>
              </View>
              <View style={{height:10,backgroundColor:C.bg2,borderRadius:5,overflow:'hidden'}}>
                <View style={{
                  height:'100%',
                  width:((selBlok?.pct||0)+'%') as any,
                  backgroundColor:blokRenk(selBlok?.pct||0),
                  borderRadius:5
                }}/>
              </View>
              {selBlok?.done!==undefined && (
                <Text style={{color:C.t3,fontSize:12,marginTop:6}}>
                  {selBlok.done} / {selBlok.floors} kat tamamlandi
                </Text>
              )}
            </View>

            {/* Bilgiler */}
            {[
              ['Blok Tipi', selBlok?.tip],
              ['Aktif İmalat', selBlok?.imalat],
              ['Sorumlu Müh.', selBlok?.eng],
              ['Durum', selBlok?.durum],
            ].map(([l,v]:any,i)=>(
              <View key={i} style={{flexDirection:'row',justifyContent:'space-between',
                paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}>
                <Text style={{color:C.t3,fontSize:12}}>{l}</Text>
                <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>{v||'-'}</Text>
              </View>
            ))}

            {selBlok?.not && (
              <View style={{backgroundColor:'rgba(168,85,247,0.1)',borderRadius:8,padding:10,
                marginTop:12,borderWidth:1,borderColor:'rgba(168,85,247,0.3)'}}>
                <Text style={{color:C.purple,fontSize:12,fontWeight:'600'}}>Not: {selBlok.not}</Text>
              </View>
            )}

            <TouchableOpacity onPress={()=>setDetay(false)}
              style={{backgroundColor:C.blue,borderRadius:10,padding:14,alignItems:'center',marginTop:16}}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:14}}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  row:      {flexDirection:'row',marginHorizontal:-4,marginBottom:12},
  kpi:      {backgroundColor:'#111827',borderRadius:10,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',overflow:'hidden'},
  kpiAcc:   {position:'absolute',top:0,left:0,right:0,height:3},
  kpiLbl:   {fontSize:10,fontWeight:'700',color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7,marginTop:4},
  kpiVal:   {fontSize:20,fontWeight:'800',color:'#f1f5f9'},
  sec:      {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  secT:     {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:14},
  modalBg:  {flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},
  modalBox: {backgroundColor:'#0f1320',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
});
