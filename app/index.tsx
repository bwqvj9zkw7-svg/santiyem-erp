import HakedisPage from './HakedisPage';
import { db } from '../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, Modal, Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as ImagePicker from 'expo-image-picker';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

const MAHAL_LIST = [
  { mahal:'Salon', kalemler:[
    {tip:'Doseme', poz:'OZEL-19A+15.250.1001+15.250.1101+OZEL-16', aciklama:'Ses yalitimi + Tesviye + Sap + Laminat parke'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262', aciklama:'Ic siva + 2 kat yari mat boya'},
    {tip:'Tavan', poz:'15.280.1011/A+15.540.1262', aciklama:'5mm Saten alci + 2 kat tavan boyasi'},
    {tip:'Supergelik', poz:'OZEL-28', aciklama:'10cm ahsap supergelik'},
  ]},
  { mahal:'Yatak Odalari', kalemler:[
    {tip:'Doseme', poz:'OZEL-19A+15.250.1001+15.250.1101+OZEL-16', aciklama:'Ses yalitimi + Tesviye + Sap + Laminat parke'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262', aciklama:'Ic siva + 2 kat yari mat boya'},
    {tip:'Tavan', poz:'15.280.1011/A+15.540.1262', aciklama:'5mm Saten alci + 2 kat tavan boyasi'},
    {tip:'Supergelik', poz:'OZEL-28', aciklama:'10cm ahsap supergelik'},
  ]},
  { mahal:'Koridor / Islik', kalemler:[
    {tip:'Doseme', poz:'OZEL-19A+15.250.1001+15.250.1101+15.385.1028', aciklama:'Ses yalitimi + Tesviye + Sap + 60x60 seramik'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262', aciklama:'Ic siva + 2 kat yari mat boya'},
    {tip:'Tavan', poz:'15.280.1011/A+15.540.1262', aciklama:'5mm Saten alci + 2 kat tavan boyasi'},
  ]},
  { mahal:'Mutfak', kalemler:[
    {tip:'Doseme', poz:'OZEL-19A+15.250.1001+15.250.1101+15.385.1028', aciklama:'Ses yalitimi + Tesviye + Sap + 60x60 seramik'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262+15.380.1056', aciklama:'Ic siva + boya + 30x60 seramik duvar kaplamasi'},
    {tip:'Tavan', poz:'15.280.1011/A+15.540.1262', aciklama:'5mm Saten alci + 2 kat tavan boyasi'},
    {tip:'Mutfak Dolabi', poz:'OZEL-7', aciklama:'Proje detaylarina uygun mutfak dolabi'},
  ]},
  { mahal:'Antre', kalemler:[
    {tip:'Doseme', poz:'OZEL-19A+15.250.1001+15.250.1101+15.385.1028', aciklama:'60x60 seramik'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262', aciklama:'Ic siva + boya'},
    {tip:'Esik', poz:'15.410.1103', aciklama:'3cm renkli mermer esik'},
  ]},
  { mahal:'Banyo ve WC', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.270.1008+15.385.1028', aciklama:'Tesviye + 2mm su yalitimi + 60x60 seramik'},
    {tip:'Duvar', poz:'15.275.1105+15.380.1056', aciklama:'Siva + 30x60 seramik duvar kaplamasi'},
    {tip:'Tavan', poz:'15.535.1030+15.540.1252', aciklama:'30x30 aluminyum asma tavan + kirec badana'},
    {tip:'Esik', poz:'15.410.1103', aciklama:'3cm renkli mermer esik'},
  ]},
  { mahal:'Balkon', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.270.1008+15.385.1028', aciklama:'Tesviye + su yalitimi + 60x60 seramik'},
    {tip:'Duvar', poz:'15.275.1106+OZEL-1A+15.540.1321', aciklama:'Dis siva + Mantolama + Dis cephe boyasi'},
    {tip:'Korkuluk', poz:'OZEL-26', aciklama:'h=110cm balkon korkulugu + 3cm mermer denizlik'},
  ]},
  { mahal:'Merdivenler', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.410.1101', aciklama:'Tesviye + 2cm renkli mermer kaplama'},
    {tip:'Basamak', poz:'15.250.1001+15.410.1303+OZEL-6', aciklama:'Tesviye + Mermer basamak + Kaydirmaz bant'},
    {tip:'Korkuluk', poz:'OZEL-26', aciklama:'h=110cm aluminyum merdiven korkulugu'},
  ]},
  { mahal:'Kat Holu', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.410.1101', aciklama:'Tesviye + 2cm renkli mermer kaplama'},
    {tip:'Duvar', poz:'15.280.1009+15.540.1262', aciklama:'Ic siva + 2 kat yari mat boya'},
    {tip:'Supergelik', poz:'15.410.1103', aciklama:'7cm yuksekliginde mermer supergelik'},
  ]},
  { mahal:'Signak / Teknik Odalar', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.400.1003', aciklama:'Tesviye + Terrazo karo mozaik'},
    {tip:'Duvar', poz:'15.285.1011+15.540.1262', aciklama:'Hazir siva + 2 kat yari mat boya'},
    {tip:'Tavan', poz:'OZEL-5+15.285.1011+15.540.1262', aciklama:'Isi yalitimi + Hazir siva + Tavan boyasi'},
  ]},
  { mahal:'Kazan Dairesi', kalemler:[
    {tip:'Doseme', poz:'15.250.1001+15.400.1003', aciklama:'Tesviye + Terrazo karo mozaik'},
    {tip:'Duvar', poz:'15.285.1011+15.540.1262', aciklama:'Hazir siva + boya'},
    {tip:'Tavan', poz:'OZEL-5A+15.285.1011+15.540.1262', aciklama:'Isi yalitimi + siva + boya'},
  ]},
];

const IMALAT_TIPLERI = [
  'Betonarme','Kalip','Demir Donati','Duvar Orme','Siva','Seramik Doseme',
  'Seramik Duvar','Mermer Kaplama','Boya','Su Yalitimi','Isi Yalitimi',
  'Elektrik Tesisat','Sihhi Tesisat','Dogalgaz Tesisat','Aluminyum Dograma',
  'Celik Kapi','Asma Tavan','Laminat Parke','Mantolama','Cati',
];

const DB_DEMO = {
  budget:48500000, spent:31240000, safetyDays:34,
  blocks:[
    {name:'Blok A', floors:10, done:9, prog:1, imalat:'Betonarme', eng:'Ahmet Kaya'},
    {name:'Blok B', floors:10, done:7, prog:2, imalat:'Duvar Orme', eng:'Zeynep Demir'},
    {name:'Blok C', floors:12, done:12, prog:0, imalat:'Siva', eng:'Murat Sahin'},
    {name:'Blok D', floors:8,  done:4, prog:2, imalat:'Elektrik Tesisat', eng:'Fatma Yildiz'},
    {name:'Blok E', floors:8,  done:0, prog:1, imalat:'Betonarme', eng:'Kemal Arslan'},
  ],
  workers:[
    {name:'Ahmet Kaya',  role:'Santiye Muhendisi', dept:'Yapi',   status:'aktif', wage:42000},
    {name:'Zeynep Demir',role:'Mimar',             dept:'Mimari', status:'aktif', wage:38000},
    {name:'Murat Sahin', role:'Saha Sefi',         dept:'Yapi',   status:'aktif', wage:35000},
    {name:'Fatma Yildiz',role:'Elektrik Muh.',     dept:'MEP',    status:'izin',  wage:34000},
    {name:'Kemal Arslan',role:'Formen',            dept:'Yapi',   status:'aktif', wage:28000},
  ],
  purchases:[
    {id:'SPA-041', item:'C30 Beton 200m3', sup:'Hazir Beton AS', amt:420000, st:'bekliyor', tarih:'29.04.2026'},
    {id:'SPA-040', item:'Nervurlu Celik 15t', sup:'Demir Celik Ltd', amt:187500, st:'onaylandi', tarih:'28.04.2026'},
    {id:'SPA-039', item:'Aluminyum Dograma', sup:'Yapi Aluminyum', amt:650000, st:'teslim', tarih:'25.04.2026'},
  ],
  safety:[
    {id:'ISG-021', desc:'Kemer ihlali Blok A 9.Kat', tip:'Ihlal', sev:'yuksek', st:'acik', tarih:'28.04.2026'},
    {id:'ISG-020', desc:'Rampa korkulugu eksik', tip:'Tehlike', sev:'orta', st:'giderildi', tarih:'27.04.2026'},
    {id:'ISG-019', desc:'PPE eksikligi 4 isci', tip:'Ihlal', sev:'dusuk', st:'acik', tarih:'26.04.2026'},
  ],
  schedule:[
    {gorev:'Temel Kazi',    baslangic:0,  sure:4,  dept:'Yapi',   pct:100},
    {gorev:'Bodrum Beton',  baslangic:3,  sure:8,  dept:'Yapi',   pct:100},
    {gorev:'1-4 Kat Kaba',  baslangic:10, sure:12, dept:'Yapi',   pct:95},
    {gorev:'5-8 Kat Kaba',  baslangic:18, sure:12, dept:'Yapi',   pct:70},
    {gorev:'Elektrik Hatti',baslangic:14, sure:20, dept:'MEP',    pct:55},
    {gorev:'Tesisat',       baslangic:16, sure:18, dept:'MEP',    pct:40},
    {gorev:'Dis Cephe',     baslangic:24, sure:14, dept:'Mimari', pct:20},
    {gorev:'Ic Siva',       baslangic:22, sure:16, dept:'Mimari', pct:30},
    {gorev:'Seramik',       baslangic:28, sure:12, dept:'Ic',     pct:15},
    {gorev:'Boya',          baslangic:30, sure:10, dept:'Ic',     pct:10},
    {gorev:'Peyzaj',        baslangic:34, sure:8,  dept:'Dis',    pct:5},
  ],
};

const tl = (n:any) => 'TL '+new Intl.NumberFormat('tr-TR').format(Math.round(Number(n)||0));
const ini = (n:string) => (n||'?').split(' ').map((x:string)=>x[0]).slice(0,2).join('').toUpperCase();

const exportExcel = (data:any[], dosyaAdi:string, sutunlar:string[]) => {
  try {
    const rows = data.map((d:any) => {
      const row:any = {};
      sutunlar.forEach((s:string) => { row[s] = d[s] ?? ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Veri');
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
    console.error('Excel error:', e);
  }
};

const pickImage = async (cb:(uri:string)=>void) => {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin gerekli', 'Fotograf erisimi verin'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ImagePicker.MediaTypeOptions.Images, quality:0.7});
    if (!result.canceled && result.assets[0]) cb(result.assets[0].uri);
  } catch(e) {
    Alert.alert('Hata', 'Fotograf secilemiyor');
  }
};

const PAGES = ['Dashboard','Saha','Program','Satin Alma','IK','ISG','Hakedis'];
const ICONS  = ['*','[]','O','#','+','!'];

export default function App() {
  const [page, setPage]      = useState('Dashboard');
  const [menuOpen, setMenu]  = useState(false);
  const [loggedIn, setLogin] = useState(false);
  const [user, setUser]      = useState('admin');
  const [pass, setPass]      = useState('1234');
  const [loginErr, setErr]   = useState(false);

  const doLogin = () => {
    if (user==='admin' && pass==='1234') setLogin(true);
    else setErr(true);
  };

  if (!loggedIn) return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <View style={s.loginWrap}>
        <Text style={s.loginLogo}>Santiye <Text style={{color:C.blue}}>Planlama</Text></Text>
        <Text style={s.loginSub}>by ndrtl</Text>
        <View style={s.loginCard}>
          <Text style={s.lbl}>Kullanici Adi</Text>
          <TextInput style={s.inp} value={user} onChangeText={t=>{setUser(t);setErr(false);}} placeholder="kullanici adi" placeholderTextColor={C.t3} autoCapitalize="none"/>
          <Text style={s.lbl}>Sifre</Text>
          <TextInput style={s.inp} value={pass} onChangeText={t=>{setPass(t);setErr(false);}} placeholder="sifre" placeholderTextColor={C.t3} secureTextEntry onSubmitEditing={doLogin}/>
          {loginErr && <Text style={{color:C.red,fontSize:13,marginBottom:12,textAlign:'center'}}>Hatali kullanici adi veya sifre</Text>}
          <TouchableOpacity style={s.loginBtn} onPress={doLogin}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>Giris Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.loginBtn,{backgroundColor:C.bg3,marginTop:8}]} onPress={()=>setLogin(true)}>
            <Text style={{color:C.t2,fontWeight:'600',fontSize:14}}>Demo Girisi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg2}/>
      <View style={s.topbar}>
        <TouchableOpacity onPress={()=>setMenu(true)} style={{marginRight:12,padding:4}}>
          <Text style={{color:C.t2,fontSize:18}}>|||</Text>
        </TouchableOpacity>
        <Text style={s.topLogo}>Santiye <Text style={{color:C.blue}}>Planlama</Text></Text>
        <TouchableOpacity onPress={()=>setLogin(false)} style={s.logoutBtn}>
          <Text style={{color:C.red,fontSize:12,fontWeight:'600'}}>Cikis</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={()=>setMenu(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={()=>setMenu(false)}>
          <View style={s.sidebar}>
            <Text style={s.sideTitle}>Santiye <Text style={{color:C.blue}}>Planlama</Text></Text>
            <Text style={{fontSize:11,color:C.t3,marginBottom:4}}>by ndrtl</Text>
            <Text style={{fontSize:12,color:C.t3,marginBottom:20}}>Marmara Konutlari Faz 2</Text>
            {PAGES.map((p,i)=>(
              <TouchableOpacity key={p} style={[s.navItem,page===p&&s.navActive]} onPress={()=>{setPage(p);setMenu(false);}}>
                <Text style={{fontSize:14,width:24,color:page===p?C.blue:C.t2}}>{ICONS[i]}</Text>
                <Text style={[s.navText,page===p&&{color:C.blue}]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{page}</Text>
        <Text style={{fontSize:12,color:C.t3,marginTop:2}}>Marmara Konutlari Faz 2</Text>
      </View>

      <ScrollView style={{flex:1}} contentContainerStyle={{padding:16,paddingBottom:50}}>
        {page==='Dashboard'   && <DashboardPage/>}
        {page==='Saha'        && <SahaPage/>}
        {page==='Program'     && <ProgramPage/>}
        {page==='Satin Alma'  && <SatinAlmaPage/>}
        {page==='IK'          && <IKPage/>}
        {page==='ISG'         && <ISGPage/>}
        {page==='Hakedis' && <HakedisPage/>}
      </ScrollView>

      <View style={s.bottomNav}>
        {PAGES.map((p,i)=>(
          <TouchableOpacity key={p} style={s.bottomItem} onPress={()=>setPage(p)}>
            <Text style={[s.bottomIcon,page===p&&{color:C.blue}]}>{ICONS[i]}</Text>
            <Text style={[s.bottomLabel,page===p&&{color:C.blue}]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Kpi({label,val,color,sub}:any) {
  return (
    <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
      <View style={[s.kpiAcc,{backgroundColor:color}]}/>
      <Text style={s.kpiLbl}>{label}</Text>
      <Text style={s.kpiVal}>{val}</Text>
      {sub && <Text style={s.kpiSub}>{sub}</Text>}
    </View>
  );
}
function Bdg({label,color,bg}:any) {
  return <View style={[s.badge,{backgroundColor:bg}]}><Text style={[s.badgeT,{color}]}>{label}</Text></View>;
}
function PBar({label,pct,color}:any) {
  return (
    <View style={s.prRow}>
      <Text style={s.prLbl}>{label}</Text>
      <View style={s.prBar}><View style={[s.prFill,{width:(pct+'%') as any,backgroundColor:color}]}/></View>
      <Text style={s.prPct}>%{pct}</Text>
    </View>
  );
}
function FG({label,children}:any) {
  return <View style={{marginBottom:13}}><Text style={s.lbl}>{label}</Text>{children}</View>;
}
function MWrap({visible,onClose,title,children,onSave,saveLabel}:any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBg}>
        <View style={s.modalBox}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.t1}}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={{color:C.t3,fontSize:20}}>X</Text></TouchableOpacity>
          </View>
          <ScrollView style={{maxHeight:420}}>{children}</ScrollView>
          <View style={{flexDirection:'row',gap:10,marginTop:14}}>
            <TouchableOpacity onPress={onClose} style={s.modalCancel}>
              <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={s.modalSave}>
              <Text style={{color:'#fff',fontWeight:'700'}}>{saveLabel||'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DashboardPage() {
  const [blocks,setBlocks]   = useState(DB_DEMO.blocks as any[]);
  const [workers,setWorkers] = useState(DB_DEMO.workers as any[]);

  useEffect(()=>{
    onValue(ref(db,'blocks'),(snap)=>{ const d=snap.val(); if(d) setBlocks(Object.values(d)); });
    onValue(ref(db,'workers'),(snap)=>{ const d=snap.val(); if(d) setWorkers(Object.values(d)); });
  },[]);

  const totalF = blocks.reduce((s:number,b:any)=>s+Number(b.floors),0);
  const doneF  = blocks.reduce((s:number,b:any)=>s+Number(b.done),0);
  const pct    = totalF ? Math.round(doneF/totalF*100) : 0;
  const aktif  = workers.filter((w:any)=>w.status==='aktif').length;

  return (
    <View>
      <View style={s.row}>
        <Kpi label="Toplam Butce" val={tl(DB_DEMO.budget)} color={C.blue} sub={'Harcanan: '+tl(DB_DEMO.spent)}/>
        <Kpi label="Ilerleme" val={'%'+pct} color={C.green}/>
      </View>
      <View style={s.row}>
        <Kpi label="Aktif Personel" val={aktif} color={C.purple} sub={'Toplam: '+workers.length}/>
        <Kpi label="Kazasiz Gun" val={DB_DEMO.safetyDays} color={C.amber}/>
      </View>
      <View style={s.sec}>
        <Text style={s.secT}>Blok Ilerleme</Text>
        {blocks.map((b:any)=>{
          const p = b.floors ? Math.round(Number(b.done)/Number(b.floors)*100) : 0;
          const c = p===100?C.green:p>60?C.blue:p>30?C.amber:C.red;
          return <PBar key={b.name} label={b.name} pct={p} color={c}/>;
        })}
      </View>
      <View style={s.sec}>
        <Text style={s.secT}>Butce Dagilimi</Text>
        {[['Iscilik',C.blue,38],['Malzeme',C.amber,29],['Ekipman',C.purple,14],['Taseronlar',C.green,12],['Diger',C.t3,7]]
          .map(([l,c,p]:any)=><PBar key={l} label={l} pct={p*2.5} color={c}/>)}
      </View>
    </View>
  );
}

function SahaPage() {
  const [blocks,setBlocks]         = useState(DB_DEMO.blocks as any[]);
  const [addModal,setAddModal]     = useState(false);
  const [mahalModal,setMahalModal] = useState(false);
  const [mahalData,setMahalData]   = useState<{[key:string]:any}>({});
  const [sahaPhotos,setSahaPhotos] = useState<{[key:string]:string}>({});
  const [selBlock,setSelBlock]     = useState<any>(null);
  const [newName,setNewName]       = useState('');
  const [newFloors,setNewFloors]   = useState('8');
  const [newImalat,setNewImalat]   = useState('Betonarme');
  const [newEng,setNewEng]         = useState('');

  useEffect(()=>{
    onValue(ref(db,'blocks'),(snap)=>{
      const d=snap.val();
      if(d) setBlocks(Object.values(d));
      else DB_DEMO.blocks.forEach((b:any)=>set(ref(db,'blocks/'+b.name),b));
    });
    onValue(ref(db,'mahalData'),(snap)=>{const d=snap.val();if(d) setMahalData(d);});
    onValue(ref(db,'sahaPhotos'),(snap)=>{const d=snap.val();if(d) setSahaPhotos(d);});
  },[]);

  const updateFloor=(blockName:string, fi:number, status:string)=>{
    const block = blocks.find((b:any)=>b.name===blockName);
    if(!block) return;
    const n = Number(block.floors);
    const arr = Array.from({length:n},(_,i)=>{
      if(i<Number(block.done)) return 'done';
      if(i<Number(block.done)+Number(block.prog)) return 'prog';
      return 'none';
    });
    arr[fi]=status;
    const updated={...block, done:arr.filter((x:string)=>x==='done').length, prog:arr.filter((x:string)=>x==='prog').length};
    set(ref(db,'blocks/'+blockName),updated);
  };

  const addBlock=()=>{
    if(!newName.trim()||!newEng.trim()){Alert.alert('Hata','Blok adi ve muhendis zorunlu');return;}
    const b={name:newName.trim(),floors:parseInt(newFloors)||8,done:0,prog:0,imalat:newImalat,eng:newEng.trim()};
    set(ref(db,'blocks/'+b.name),b);
    setNewName('');setNewFloors('8');setNewEng('');setAddModal(false);
  };

  const deleteBlock=(name:string)=>Alert.alert('Sil',name+' silinsin mi?',[
    {text:'Iptal',style:'cancel'},
    {text:'Sil',style:'destructive',onPress:()=>set(ref(db,'blocks/'+name),null)},
  ]);

  const exportSaha=()=>exportExcel(blocks,'saha-raporu',['name','floors','done','prog','imalat','eng']);
  const cols:any={Betonarme:C.blue,'Duvar Orme':C.amber,'Siva':C.purple,'Elektrik Tesisat':C.green,'Seramik Doseme':C.cyan};

  return (
    <View>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{flex:1}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Blok Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportSaha} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
        </TouchableOpacity>
      </View>

      {blocks.map((b:any)=>{
        const fl=Number(b.floors),dn=Number(b.done),pg=Number(b.prog);
        const p=fl?Math.round(dn/fl*100):0;
        const c=p===100?C.green:p>60?C.blue:p>30?C.amber:C.red;
        const ic=cols[b.imalat]||C.blue;
        return (
          <View key={b.name} style={s.blockCard}>
            <View style={[s.blockTop,{borderBottomColor:C.border}]}>
              <View style={{flex:1}}>
                <Text style={s.blockName}>{b.name}</Text>
                <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:2}}>
                  <View style={{width:7,height:7,borderRadius:4,backgroundColor:ic}}/>
                  <Text style={{fontSize:12,color:C.t3}}>{b.imalat}</Text>
                </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={{fontSize:22,fontWeight:'800',color:c}}>{p}%</Text>
                  <Text style={{fontSize:11,color:C.t3}}>{dn}/{fl} kat</Text>
                </View>
                <TouchableOpacity onPress={()=>deleteBlock(b.name)} style={s.delBtn}>
                  <Text style={{color:C.red,fontSize:11}}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.progBg}><View style={[s.progFg,{width:(p+'%') as any,backgroundColor:c}]}/></View>
            <View style={s.blockBody}>
              <View style={{flexDirection:'row',gap:6,flexWrap:'wrap',marginBottom:10}}>
                <Bdg label={dn+' bitti'} color={C.green} bg="rgba(34,197,94,0.12)"/>
                <Bdg label={pg+' devam'} color={C.amber} bg="rgba(245,158,11,0.12)"/>
                <Bdg label={b.eng} color={C.t2} bg={C.bg3}/>
              </View>
              <View style={{flexDirection:'row',gap:6,marginBottom:10}}>
                <TouchableOpacity onPress={()=>{setSelBlock(b);setMahalModal(true);}}
                  style={{paddingHorizontal:12,paddingVertical:6,borderRadius:7,borderWidth:1,borderColor:C.blue,backgroundColor:'rgba(59,130,246,0.1)'}}>
                  <Text style={{color:C.blue,fontSize:11,fontWeight:'600'}}>Imalat Listesi</Text>
                </TouchableOpacity>
              </View>
              {Array.from({length:fl},(_,i)=>{
                const fi=fl-1-i;
                const st=fi<dn?'done':fi<dn+pg?'prog':'none';
                const sc=st==='done'?C.green:st==='prog'?C.amber:C.t4;
                return (
                  <View key={fi} style={[s.floorRow,{justifyContent:'space-between'}]}>
                    <View style={[s.floorDot,{backgroundColor:sc}]}/>
                    <Text style={[s.floorName,{flex:1}]}>{fi===0?'Zemin Kat':fi+'. Kat'}</Text>
                    <View style={{flexDirection:'row',gap:4}}>
                      {(['done','prog','none'] as const).map((status)=>(
                        <TouchableOpacity key={status} onPress={()=>updateFloor(b.name,fi,status)}
                          style={{paddingHorizontal:7,paddingVertical:3,borderRadius:5,
                            backgroundColor:st===status?(status==='done'?'rgba(34,197,94,0.2)':status==='prog'?'rgba(245,158,11,0.2)':'rgba(100,116,139,0.2)'):C.bg3,
                            borderWidth:1,borderColor:st===status?(status==='done'?C.green:status==='prog'?C.amber:C.t3):C.border}}>
                          <Text style={{fontSize:10,color:st===status?(status==='done'?C.green:status==='prog'?C.amber:C.t3):C.t3}}>
                            {status==='done'?'Bitti':status==='prog'?'Devam':'Yok'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      <Modal visible={mahalModal} transparent animationType="fade" onRequestClose={()=>setMahalModal(false)}>
        <View style={s.modalBg}>
          <View style={[s.modalBox,{maxHeight:'88%'}]}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.t1}}>{selBlock?.name} - Imalat Listesi</Text>
              <TouchableOpacity onPress={()=>setMahalModal(false)}><Text style={{color:C.t3,fontSize:20}}>X</Text></TouchableOpacity>
            </View>
            <ScrollView>
              {MAHAL_LIST.map((m,mi)=>(
                <View key={mi} style={{marginBottom:14}}>
                  <Text style={{fontSize:13,fontWeight:'700',color:C.blue,marginBottom:6}}>{m.mahal}</Text>
                  {m.kalemler.map((k,ki)=>{
                    const key=(selBlock?.name||'')+'_'+mi+'_'+ki;
                    const durum=mahalData[key]?.durum||'none';
                    const foto=sahaPhotos[key];
                    const dc=durum==='done'?C.green:durum==='prog'?C.amber:C.t4;
                    return (
                      <View key={ki} style={{backgroundColor:C.bg3,borderRadius:7,padding:10,marginBottom:6}}>
                        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:3}}>
                          <Text style={{fontSize:12,fontWeight:'600',color:C.t1}}>{k.tip}</Text>
                          <Text style={{fontSize:10,color:C.t3}}>{k.poz}</Text>
                        </View>
                        <Text style={{fontSize:11,color:C.t2,marginBottom:8}}>{k.aciklama}</Text>
                        <View style={{flexDirection:'row',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                          {['done','prog','none'].map((st)=>(
                            <TouchableOpacity key={st} onPress={()=>{
                              const updated={...mahalData,[key]:{durum:st,blok:selBlock?.name,mahal:m.mahal,imalat:k.tip}};
                              setMahalData(updated);
                              set(ref(db,'mahalData/'+key),{durum:st,blok:selBlock?.name,mahal:m.mahal,imalat:k.tip});
                            }} style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                              backgroundColor:durum===st?(st==='done'?'rgba(34,197,94,0.2)':st==='prog'?'rgba(245,158,11,0.2)':'rgba(100,116,139,0.2)'):C.bg2,
                              borderColor:durum===st?(st==='done'?C.green:st==='prog'?C.amber:C.t3):C.border}}>
                              <Text style={{fontSize:10,color:durum===st?(st==='done'?C.green:st==='prog'?C.amber:C.t3):C.t3}}>
                                {st==='done'?'Bitti':st==='prog'?'Devam':'Yok'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity onPress={()=>pickImage((uri)=>{
                            setSahaPhotos(prev=>({...prev,[key]:uri}));
                            set(ref(db,'sahaPhotos/'+key),uri);
                          })} style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                            borderColor:'rgba(6,182,212,0.3)',backgroundColor:'rgba(6,182,212,0.08)'}}>
                            <Text style={{fontSize:10,color:C.cyan}}>{foto?'Foto Var':'Foto Ekle'}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:6}}>
                          <View style={{width:8,height:8,borderRadius:4,backgroundColor:dc}}/>
                          <Text style={{fontSize:11,color:dc,fontWeight:'600'}}>
                            {durum==='done'?'Tamamlandi':durum==='prog'?'Devam Ediyor':'Baslanmadi'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <MWrap visible={addModal} onClose={()=>setAddModal(false)} title="Yeni Blok Ekle" onSave={addBlock} saveLabel="Ekle">
        <FG label="Blok Adi"><TextInput style={s.inp} value={newName} onChangeText={setNewName} placeholder="Blok F" placeholderTextColor={C.t3}/></FG>
        <FG label="Kat Sayisi"><TextInput style={s.inp} value={newFloors} onChangeText={setNewFloors} keyboardType="numeric" placeholder="8" placeholderTextColor={C.t3}/></FG>
        <FG label="Imalat Turu">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',gap:7,paddingBottom:4}}>
              {IMALAT_TIPLERI.map(im=>(
                <TouchableOpacity key={im} onPress={()=>setNewImalat(im)}
                  style={{paddingHorizontal:11,paddingVertical:6,borderRadius:7,borderWidth:1,
                    backgroundColor:newImalat===im?C.blue:C.bg3,borderColor:newImalat===im?C.blue:C.border}}>
                  <Text style={{color:newImalat===im?'#fff':C.t2,fontSize:12}}>{im}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </FG>
        <FG label="Sorumlu Muhendis"><TextInput style={s.inp} value={newEng} onChangeText={setNewEng} placeholder="Ad Soyad" placeholderTextColor={C.t3}/></FG>
      </MWrap>
    </View>
  );
}

function ProgramPage() {
  const [schedule,setSchedule]         = useState(DB_DEMO.schedule as any[]);
  const [addModal,setAddModal]         = useState(false);
  const [yeniGorev,setYeniGorev]       = useState('');
  const [yeniBaslangic,setYeniBaslangic] = useState('0');
  const [yeniSure,setYeniSure]         = useState('4');
  const [yeniDept,setYeniDept]         = useState('Yapi');
  const [yeniPct,setYeniPct]           = useState('0');

  useEffect(()=>{
    onValue(ref(db,'schedule'),(snap)=>{
      const d=snap.val();
      if(d) setSchedule(Object.values(d));
      else DB_DEMO.schedule.forEach((g:any,i:number)=>set(ref(db,'schedule/g'+i),g));
    });
  },[]);

  const addGorev=()=>{
    if(!yeniGorev.trim()) return;
    const key='g'+Date.now();
    const g={gorev:yeniGorev.trim(),baslangic:parseInt(yeniBaslangic)||0,sure:parseInt(yeniSure)||4,dept:yeniDept,pct:parseInt(yeniPct)||0};
    set(ref(db,'schedule/'+key),g);
    setYeniGorev('');setYeniBaslangic('0');setYeniSure('4');setYeniPct('0');setAddModal(false);
  };

  const deleteGorev=(i:number)=>{
    const updated=schedule.filter((_:any,idx:number)=>idx!==i);
    setSchedule(updated);
    updated.forEach((g:any,idx:number)=>set(ref(db,'schedule/g'+idx),g));
  };

  const deptColors:any={Yapi:C.blue,MEP:C.cyan,Mimari:C.purple,Ic:C.amber,Dis:C.green};
  const TW=42;
  const exportProg=()=>exportExcel(schedule,'is-programi',['gorev','baslangic','sure','dept','pct']);

  return (
    <View>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{flex:1}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Gorev Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportProg} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
        </TouchableOpacity>
      </View>
      <View style={s.sec}>
        <Text style={s.secT}>Gantt Diyagrami ({TW} Hafta)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{minWidth:520}}>
            {schedule.map((g:any,i:number)=>{
              const col=deptColors[g.dept]||C.t3;
              const lp=(g.baslangic/TW)*100;
              const wp=(g.sure/TW)*100;
              return (
                <View key={i} style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
                  <View style={{width:130,paddingRight:8}}>
                    <Text style={{fontSize:11,fontWeight:'600',color:C.t1}} numberOfLines={1}>{g.gorev}</Text>
                    <Text style={{fontSize:9,color:C.t3}}>{g.dept} - %{g.pct}</Text>
                  </View>
                  <View style={{width:360,height:22,backgroundColor:C.bg3,borderRadius:4,overflow:'hidden',position:'relative'}}>
                    <View style={{position:'absolute',left:(lp+'%') as any,width:(wp+'%') as any,height:'100%',backgroundColor:col,opacity:0.22}}/>
                    <View style={{position:'absolute',left:(lp+'%') as any,width:((wp*g.pct/100)+'%') as any,height:'100%',backgroundColor:col}}/>
                  </View>
                  <TouchableOpacity onPress={()=>deleteGorev(i)} style={{marginLeft:8}}>
                    <Text style={{color:C.red,fontSize:11}}>Sil</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <MWrap visible={addModal} onClose={()=>setAddModal(false)} title="Yeni Gorev" onSave={addGorev} saveLabel="Ekle">
        <FG label="Gorev Adi"><TextInput style={s.inp} value={yeniGorev} onChangeText={setYeniGorev} placeholder="Temel Kazi..." placeholderTextColor={C.t3}/></FG>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><FG label="Baslangic (Hafta)"><TextInput style={s.inp} value={yeniBaslangic} onChangeText={setYeniBaslangic} keyboardType="numeric" placeholderTextColor={C.t3}/></FG></View>
          <View style={{flex:1}}><FG label="Sure (Hafta)"><TextInput style={s.inp} value={yeniSure} onChangeText={setYeniSure} keyboardType="numeric" placeholderTextColor={C.t3}/></FG></View>
        </View>
        <FG label="Tamamlanma (%)"><TextInput style={s.inp} value={yeniPct} onChangeText={setYeniPct} keyboardType="numeric" placeholder="0" placeholderTextColor={C.t3}/></FG>
        <FG label="Departman">
          <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>
            {['Yapi','MEP','Mimari','Ic','Dis'].map(d=>(
              <TouchableOpacity key={d} onPress={()=>setYeniDept(d)}
                style={{paddingHorizontal:12,paddingVertical:6,borderRadius:7,borderWidth:1,
                  backgroundColor:yeniDept===d?C.blue:C.bg3,borderColor:yeniDept===d?C.blue:C.border}}>
                <Text style={{color:yeniDept===d?'#fff':C.t2,fontSize:12}}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FG>
      </MWrap>
    </View>
  );
}

function SatinAlmaPage() {
  const [purchases,setPurchases] = useState(DB_DEMO.purchases as any[]);
  const [addModal,setAddModal]   = useState(false);
  const [newItem,setNewItem]     = useState('');
  const [newSup,setNewSup]       = useState('');
  const [newAmt,setNewAmt]       = useState('');
  const [newTarih,setNewTarih]   = useState('');
  const [photos,setPhotos]       = useState<{[key:string]:string}>({});

  useEffect(()=>{
    onValue(ref(db,'purchases'),(snap)=>{const d=snap.val();if(d) setPurchases(Object.values(d));});
    onValue(ref(db,'purchasePhotos'),(snap)=>{const d=snap.val();if(d) setPhotos(d);});
  },[]);

  const onayla=(id:string)=>set(ref(db,'purchases/'+id+'/st'),'onaylandi');
  const teslim=(id:string)=>set(ref(db,'purchases/'+id+'/st'),'teslim');
  const deletePurchase=(id:string)=>Alert.alert('Sil','Silinsin mi?',[
    {text:'Iptal',style:'cancel'},
    {text:'Sil',style:'destructive',onPress:()=>set(ref(db,'purchases/'+id),null)},
  ]);
  const addPurchase=()=>{
    if(!newItem.trim()||!newSup.trim()) return;
    const id='SPA-'+Date.now();
    const p={id,item:newItem.trim(),sup:newSup.trim(),amt:parseFloat(newAmt)||0,st:'bekliyor',tarih:newTarih||new Date().toLocaleDateString('tr-TR')};
    set(ref(db,'purchases/'+id),p);
    setNewItem('');setNewSup('');setNewAmt('');setNewTarih('');setAddModal(false);
  };
  const addPhoto=(id:string)=>pickImage((uri)=>{
    set(ref(db,'purchasePhotos/'+id),uri);
    setPhotos(prev=>({...prev,[id]:uri}));
  });

  const exportData=()=>exportExcel(purchases,'satin-alma',['id','item','sup','amt','st','tarih']);
  const sm:any={bekliyor:[C.amber,'Bekliyor'],onaylandi:[C.green,'Onaylandi'],teslim:[C.blue,'Teslim']};
  const beklCount=purchases.filter((p:any)=>p.st==='bekliyor').length;

  return (
    <View>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{flex:1}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Yeni Talep</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportData} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
        </TouchableOpacity>
      </View>
      {beklCount>0 && <View style={[s.warnBox,{marginBottom:14}]}><Text style={{color:C.amber,fontSize:13,fontWeight:'600'}}>{beklCount} talep onay bekliyor</Text></View>}
      {purchases.map((p:any)=>{
        const [c,l]=sm[p.st]||[C.t2,p.st];
        return (
          <View key={p.id} style={s.listCard}>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
              <Text style={{color:C.t3,fontSize:11}}>{p.id}</Text>
              <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                <Bdg label={l} color={c} bg={c+'22'}/>
                <Text style={{color:C.t3,fontSize:11}}>{p.tarih}</Text>
              </View>
            </View>
            <Text style={{color:C.t1,fontWeight:'600',fontSize:14,marginBottom:3}}>{p.item}</Text>
            <Text style={{color:C.t2,fontSize:12,marginBottom:8}}>{p.sup}</Text>
            {photos[p.id] && <Text style={{color:C.cyan,fontSize:11,marginBottom:6}}>Foto mevcut</Text>}
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
              <Text style={{color:C.t1,fontWeight:'700',fontSize:15}}>{tl(p.amt)}</Text>
              <View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>
                {p.st==='bekliyor' && <TouchableOpacity style={s.actionBtn} onPress={()=>onayla(p.id)}><Text style={{color:C.green,fontSize:11,fontWeight:'600'}}>Onayla</Text></TouchableOpacity>}
                {p.st==='onaylandi' && <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(59,130,246,0.3)',backgroundColor:'rgba(59,130,246,0.08)'}]} onPress={()=>teslim(p.id)}><Text style={{color:C.blue,fontSize:11,fontWeight:'600'}}>Teslim Al</Text></TouchableOpacity>}
                <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(6,182,212,0.3)',backgroundColor:'rgba(6,182,212,0.08)'}]} onPress={()=>addPhoto(p.id)}><Text style={{color:C.cyan,fontSize:11,fontWeight:'600'}}>Foto</Text></TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'}]} onPress={()=>deletePurchase(p.id)}><Text style={{color:C.red,fontSize:11,fontWeight:'600'}}>Sil</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
      <MWrap visible={addModal} onClose={()=>setAddModal(false)} title="Yeni Satin Alma Talebi" onSave={addPurchase} saveLabel="Talep Olustur">
        <FG label="Malzeme / Hizmet"><TextInput style={s.inp} value={newItem} onChangeText={setNewItem} placeholder="C30 Beton 200m3..." placeholderTextColor={C.t3}/></FG>
        <FG label="Tedarikci"><TextInput style={s.inp} value={newSup} onChangeText={setNewSup} placeholder="Firma adi" placeholderTextColor={C.t3}/></FG>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><FG label="Tutar (TL)"><TextInput style={s.inp} value={newAmt} onChangeText={setNewAmt} placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/></FG></View>
          <View style={{flex:1}}><FG label="Tarih"><TextInput style={s.inp} value={newTarih} onChangeText={setNewTarih} placeholder="GG.AA.YYYY" placeholderTextColor={C.t3}/></FG></View>
        </View>
      </MWrap>
    </View>
  );
}

function IKPage() {
  const [workers,setWorkers]   = useState(DB_DEMO.workers as any[]);
  const [addModal,setAddModal] = useState(false);
  const [newName,setNewName]   = useState('');
  const [newRole,setNewRole]   = useState('');
  const [newDept,setNewDept]   = useState('Yapi');
  const [newWage,setNewWage]   = useState('');
  const [newStatus,setStatus]  = useState('aktif');
  const [photos,setPhotos]     = useState<{[key:string]:string}>({});

  useEffect(()=>{
    onValue(ref(db,'workers'),(snap)=>{
      const d=snap.val();
      if(d) setWorkers(Object.values(d));
      else DB_DEMO.workers.forEach((w:any)=>set(ref(db,'workers/'+w.name.replace(/\s+/g,'_')),w));
    });
    onValue(ref(db,'workerPhotos'),(snap)=>{const d=snap.val();if(d) setPhotos(d);});
  },[]);

  const addWorker=()=>{
    if(!newName.trim()) return;
    const key=newName.trim().replace(/\s+/g,'_');
    set(ref(db,'workers/'+key),{name:newName.trim(),role:newRole.trim(),dept:newDept,status:newStatus,wage:parseFloat(newWage)||0});
    setNewName('');setNewRole('');setNewWage('');setAddModal(false);
  };
  const deleteWorker=(name:string)=>{
    const key=name.replace(/\s+/g,'_');
    Alert.alert('Sil',name+' silinsin mi?',[
      {text:'Iptal',style:'cancel'},
      {text:'Sil',style:'destructive',onPress:()=>set(ref(db,'workers/'+key),null)},
    ]);
  };
  const addPhoto=(name:string)=>pickImage((uri)=>{
    const key=name.replace(/\s+/g,'_');
    set(ref(db,'workerPhotos/'+key),uri);
    setPhotos(prev=>({...prev,[key]:uri}));
  });

  const aktif=workers.filter((w:any)=>w.status==='aktif').length;
  const izin=workers.filter((w:any)=>w.status==='izin').length;
  const total=workers.reduce((s:number,w:any)=>s+Number(w.wage),0);
  const exportData=()=>exportExcel(workers,'personel-listesi',['name','role','dept','status','wage']);

  return (
    <View>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{flex:1}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Personel Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportData} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
        </TouchableOpacity>
      </View>
      <View style={s.row}>
        <Kpi label="Toplam" val={workers.length} color={C.blue}/>
        <Kpi label="Aktif" val={aktif} color={C.green}/>
      </View>
      <View style={s.row}>
        <Kpi label="Izinli" val={izin} color={C.amber}/>
        <Kpi label="Aylik Bordro" val={tl(total)} color={C.purple}/>
      </View>
      <View style={s.sec}>
        <Text style={s.secT}>Personel Listesi</Text>
        {workers.map((w:any,i:number)=>{
          const key=(w.name||'').replace(/\s+/g,'_');
          return (
            <View key={i} style={[s.workerRow,{alignItems:'flex-start'}]}>
              <View style={s.workerAva}><Text style={{color:'#fff',fontSize:11,fontWeight:'800'}}>{ini(w.name)}</Text></View>
              <View style={{flex:1}}>
                <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{w.name}</Text>
                <Text style={{color:C.t3,fontSize:11}}>{w.role} - {w.dept}</Text>
                {photos[key] && <Text style={{color:C.cyan,fontSize:10,marginTop:2}}>Foto mevcut</Text>}
              </View>
              <View style={{alignItems:'flex-end',gap:4}}>
                <Bdg label={w.status} color={w.status==='aktif'?C.green:C.amber} bg={w.status==='aktif'?'rgba(34,197,94,0.12)':'rgba(245,158,11,0.12)'}/>
                <Text style={{color:C.t2,fontSize:11}}>{tl(w.wage)}</Text>
                <View style={{flexDirection:'row',gap:8}}>
                  <TouchableOpacity onPress={()=>addPhoto(w.name)}><Text style={{color:C.cyan,fontSize:11}}>Foto</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>deleteWorker(w.name)}><Text style={{color:C.red,fontSize:11}}>Sil</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <MWrap visible={addModal} onClose={()=>setAddModal(false)} title="Personel Ekle" onSave={addWorker} saveLabel="Ekle">
        <FG label="Ad Soyad"><TextInput style={s.inp} value={newName} onChangeText={setNewName} placeholder="Ali Veli" placeholderTextColor={C.t3}/></FG>
        <FG label="Rol"><TextInput style={s.inp} value={newRole} onChangeText={setNewRole} placeholder="Muhendis, Formen..." placeholderTextColor={C.t3}/></FG>
        <FG label="Departman">
          <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>
            {['Yapi','MEP','Mimari','ISG','Yonetim','Elektrik','Mekanik'].map(d=>(
              <TouchableOpacity key={d} onPress={()=>setNewDept(d)}
                style={{paddingHorizontal:10,paddingVertical:6,borderRadius:7,borderWidth:1,
                  backgroundColor:newDept===d?C.blue:C.bg3,borderColor:newDept===d?C.blue:C.border}}>
                <Text style={{color:newDept===d?'#fff':C.t2,fontSize:12}}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FG>
        <FG label="Aylik Ucret (TL)"><TextInput style={s.inp} value={newWage} onChangeText={setNewWage} placeholder="0" keyboardType="numeric" placeholderTextColor={C.t3}/></FG>
        <FG label="Durum">
          <View style={{flexDirection:'row',gap:7}}>
            {['aktif','izin'].map(st=>(
              <TouchableOpacity key={st} onPress={()=>setStatus(st)}
                style={{paddingHorizontal:14,paddingVertical:7,borderRadius:7,borderWidth:1,flex:1,alignItems:'center',
                  backgroundColor:newStatus===st?C.blue:C.bg3,borderColor:newStatus===st?C.blue:C.border}}>
                <Text style={{color:newStatus===st?'#fff':C.t2,fontSize:12}}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FG>
      </MWrap>
    </View>
  );
}

function ISGPage() {
  const [safety,setSafety]     = useState(DB_DEMO.safety as any[]);
  const [addModal,setAddModal] = useState(false);
  const [newDesc,setNewDesc]   = useState('');
  const [newSev,setNewSev]     = useState('orta');
  const [newTip,setNewTip]     = useState('Ihlal');
  const [newTarih,setNewTarih] = useState('');
  const [photos,setPhotos]     = useState<{[key:string]:string}>({});

  useEffect(()=>{
    onValue(ref(db,'safety'),(snap)=>{
      const d=snap.val();
      if(d) setSafety(Object.values(d));
      else DB_DEMO.safety.forEach((s:any)=>set(ref(db,'safety/'+s.id),s));
    });
    onValue(ref(db,'safetyPhotos'),(snap)=>{const d=snap.val();if(d) setPhotos(d);});
  },[]);

  const gider=(id:string)=>set(ref(db,'safety/'+id+'/st'),'giderildi');
  const deleteSafety=(id:string)=>Alert.alert('Sil','Silinsin mi?',[
    {text:'Iptal',style:'cancel'},
    {text:'Sil',style:'destructive',onPress:()=>set(ref(db,'safety/'+id),null)},
  ]);
  const addSafety=()=>{
    if(!newDesc.trim()) return;
    const id='ISG-'+Date.now();
    set(ref(db,'safety/'+id),{id,desc:newDesc.trim(),tip:newTip,sev:newSev,st:'acik',tarih:newTarih||new Date().toLocaleDateString('tr-TR')});
    setNewDesc('');setAddModal(false);
  };
  const addPhoto=(id:string)=>pickImage((uri)=>{
    set(ref(db,'safetyPhotos/'+id),uri);
    setPhotos(prev=>({...prev,[id]:uri}));
  });

  const acik=safety.filter((s:any)=>s.st==='acik').length;
  const exportData=()=>exportExcel(safety,'isg-raporu',['id','desc','tip','sev','st','tarih']);
  const sm:any={acik:[C.red,'Acik'],giderildi:[C.green,'Giderildi']};

  return (
    <View>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{flex:1}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Olay Bildir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportData} style={[s.addBtn,{flex:0,paddingHorizontal:14,backgroundColor:C.green}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Excel</Text>
        </TouchableOpacity>
      </View>
      <View style={s.row}>
        <Kpi label="Kazasiz Gun" val={DB_DEMO.safetyDays} color={C.green}/>
        <Kpi label="Acik Olay" val={acik} color={C.red}/>
      </View>
      <View style={s.row}>
        <Kpi label="Bu Ay" val={safety.length} color={C.blue}/>
        <Kpi label="Giderilen" val={safety.filter((s:any)=>s.st==='giderildi').length} color={C.amber}/>
      </View>
      {acik>0 && (
        <View style={[s.warnBox,{borderColor:'rgba(239,68,68,0.3)',marginBottom:16}]}>
          <Text style={{color:C.red,fontWeight:'700',fontSize:13}}>{acik} acik guvenlik olayi - Acil mudahale!</Text>
        </View>
      )}
      <View style={s.sec}>
        <Text style={s.secT}>Guvenlik Olaylari</Text>
        {safety.map((item:any,i:number)=>{
          const [c,l]=sm[item.st]||[C.t2,item.st];
          const sc=item.sev==='yuksek'?C.red:item.sev==='orta'?C.amber:C.t3;
          return (
            <View key={i} style={[s.listCard,{marginBottom:10}]}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                <Text style={{color:C.t3,fontSize:11}}>{item.id}</Text>
                <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                  <Bdg label={l} color={c} bg={c+'22'}/>
                  <Text style={{color:C.t3,fontSize:11}}>{item.tarih}</Text>
                </View>
              </View>
              <Text style={{color:C.t1,fontSize:13,marginBottom:6}}>{item.desc}</Text>
              {photos[item.id] && <Text style={{color:C.cyan,fontSize:11,marginBottom:6}}>Foto mevcut</Text>}
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
                <View style={{flexDirection:'row',gap:6}}>
                  <Bdg label={item.tip} color={C.blue} bg="rgba(59,130,246,0.12)"/>
                  <Bdg label={item.sev} color={sc} bg={sc+'22'}/>
                </View>
                <View style={{flexDirection:'row',gap:6}}>
                  <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(6,182,212,0.3)',backgroundColor:'rgba(6,182,212,0.08)'}]} onPress={()=>addPhoto(item.id)}>
                    <Text style={{color:C.cyan,fontSize:11,fontWeight:'600'}}>Foto</Text>
                  </TouchableOpacity>
                  {item.st==='acik' && <TouchableOpacity style={s.actionBtn} onPress={()=>gider(item.id)}><Text style={{color:C.green,fontSize:11,fontWeight:'600'}}>Gider</Text></TouchableOpacity>}
                  <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'}]} onPress={()=>deleteSafety(item.id)}><Text style={{color:C.red,fontSize:11,fontWeight:'600'}}>Sil</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <MWrap visible={addModal} onClose={()=>setAddModal(false)} title="Guvenlik Olayi Bildir" onSave={addSafety} saveLabel="Bildir">
        <FG label="Aciklama">
          <TextInput style={[s.inp,{height:80,textAlignVertical:'top'}]} value={newDesc} onChangeText={setNewDesc} placeholder="Olay aciklamasi..." placeholderTextColor={C.t3} multiline/>
        </FG>
        <FG label="Tur">
          <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>
            {['Ihlal','Tehlike','Kaza','Ramak Kala'].map(t=>(
              <TouchableOpacity key={t} onPress={()=>setNewTip(t)}
                style={{paddingHorizontal:11,paddingVertical:6,borderRadius:7,borderWidth:1,
                  backgroundColor:newTip===t?C.blue:C.bg3,borderColor:newTip===t?C.blue:C.border}}>
                <Text style={{color:newTip===t?'#fff':C.t2,fontSize:12}}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FG>
        <FG label="Onem Derecesi">
          <View style={{flexDirection:'row',gap:7}}>
            {['dusuk','orta','yuksek'].map(sv=>(
              <TouchableOpacity key={sv} onPress={()=>setNewSev(sv)}
                style={{paddingHorizontal:12,paddingVertical:7,borderRadius:7,borderWidth:1,flex:1,alignItems:'center',
                  backgroundColor:newSev===sv?(sv==='yuksek'?C.red:sv==='orta'?C.amber:C.green):C.bg3,
                  borderColor:newSev===sv?(sv==='yuksek'?C.red:sv==='orta'?C.amber:C.green):C.border}}>
                <Text style={{color:newSev===sv?'#fff':C.t2,fontSize:12}}>{sv}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FG>
        <FG label="Tarih"><TextInput style={s.inp} value={newTarih} onChangeText={setNewTarih} placeholder="GG.AA.YYYY" placeholderTextColor={C.t3}/></FG>
      </MWrap>
    </View>
  );
}

const s = StyleSheet.create({
  loginWrap:  {flex:1,justifyContent:'center',alignItems:'center',padding:24,backgroundColor:C.bg},
  loginLogo:  {fontSize:26,fontWeight:'800',color:C.t1,textAlign:'center',marginBottom:6},
  loginSub:   {fontSize:14,color:C.t3,textAlign:'center',marginBottom:28},
  loginCard:  {width:'100%',maxWidth:400,backgroundColor:C.card,borderRadius:14,padding:24,borderWidth:1,borderColor:C.border},
  loginBtn:   {backgroundColor:C.blue,borderRadius:8,padding:13,alignItems:'center'},
  lbl:        {fontSize:12,color:C.t3,marginBottom:6,fontWeight:'600'},
  inp:        {backgroundColor:C.bg3,borderWidth:1,borderColor:C.border,borderRadius:8,padding:11,color:C.t1,fontSize:14,marginBottom:14},
  topbar:     {height:52,backgroundColor:C.bg2,flexDirection:'row',alignItems:'center',paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border},
  topLogo:    {fontSize:15,fontWeight:'800',color:C.t1,flex:1},
  logoutBtn:  {padding:6,paddingHorizontal:10,backgroundColor:'rgba(239,68,68,0.1)',borderRadius:7,borderWidth:1,borderColor:'rgba(239,68,68,0.2)'},
  overlay:    {flex:1,backgroundColor:'rgba(0,0,0,0.6)',flexDirection:'row'},
  sidebar:    {width:240,backgroundColor:C.bg2,padding:20,paddingTop:50},
  sideTitle:  {fontSize:16,fontWeight:'800',color:C.t1,marginBottom:4},
  navItem:    {flexDirection:'row',alignItems:'center',padding:12,borderRadius:8,marginBottom:2},
  navActive:  {backgroundColor:'rgba(59,130,246,0.13)'},
  navText:    {fontSize:14,color:C.t2,fontWeight:'500'},
  pageHeader: {paddingHorizontal:16,paddingVertical:12,backgroundColor:C.bg2,borderBottomWidth:1,borderBottomColor:C.border},
  pageTitle:  {fontSize:19,fontWeight:'700',color:C.t1},
  bottomNav:  {flexDirection:'row',backgroundColor:C.bg2,borderTopWidth:1,borderTopColor:C.border,paddingBottom:4},
  bottomItem: {flex:1,alignItems:'center',paddingVertical:8},
  bottomIcon: {fontSize:16,color:C.t3,marginBottom:2},
  bottomLabel:{fontSize:9,color:C.t3,fontWeight:'500'},
  row:        {flexDirection:'row',marginHorizontal:-4,marginBottom:12},
  kpi:        {backgroundColor:C.card,borderRadius:10,padding:14,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  kpiAcc:     {position:'absolute',top:0,left:0,right:0,height:3},
  kpiLbl:     {fontSize:10,fontWeight:'700',color:C.t3,textTransform:'uppercase',letterSpacing:0.5,marginBottom:7,marginTop:4},
  kpiVal:     {fontSize:20,fontWeight:'800',color:C.t1},
  kpiSub:     {fontSize:11,color:C.t3,marginTop:4},
  sec:        {backgroundColor:C.card,borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:C.border},
  secT:       {fontSize:14,fontWeight:'600',color:C.t1,marginBottom:14},
  prRow:      {flexDirection:'row',alignItems:'center',marginBottom:10,gap:8},
  prLbl:      {fontSize:12,color:C.t2,width:70},
  prBar:      {flex:1,height:5,backgroundColor:C.bg3,borderRadius:3,overflow:'hidden'},
  prFill:     {height:'100%',borderRadius:3},
  prPct:      {fontSize:11,color:C.t3,width:28,textAlign:'right'},
  badge:      {paddingHorizontal:8,paddingVertical:3,borderRadius:20},
  badgeT:     {fontSize:11,fontWeight:'600'},
  blockCard:  {backgroundColor:C.card,borderRadius:10,marginBottom:14,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  blockTop:   {flexDirection:'row',justifyContent:'space-between',padding:14,borderBottomWidth:1},
  blockName:  {fontSize:15,fontWeight:'700',color:C.t1},
  progBg:     {height:3,backgroundColor:C.bg3},
  progFg:     {height:'100%'},
  blockBody:  {padding:14},
  floorRow:   {flexDirection:'row',alignItems:'center',gap:8,padding:6,borderRadius:6,backgroundColor:C.bg3,marginBottom:3},
  floorDot:   {width:7,height:7,borderRadius:4,flexShrink:0},
  floorName:  {flex:1,fontSize:12,color:C.t2},
  listCard:   {backgroundColor:C.card2,borderRadius:10,padding:14,marginBottom:12,borderWidth:1,borderColor:C.border},
  workerRow:  {flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border},
  workerAva:  {width:34,height:34,borderRadius:17,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',flexShrink:0},
  warnBox:    {backgroundColor:'rgba(245,158,11,0.08)',borderWidth:1,borderColor:'rgba(245,158,11,0.25)',borderRadius:9,padding:13},
  actionBtn:  {paddingHorizontal:10,paddingVertical:5,borderRadius:7,borderWidth:1,borderColor:'rgba(34,197,94,0.3)',backgroundColor:'rgba(34,197,94,0.08)'},
  addBtn:     {backgroundColor:C.blue,borderRadius:9,padding:12,alignItems:'center',marginBottom:0},
  delBtn:     {paddingHorizontal:10,paddingVertical:5,borderRadius:7,borderWidth:1,borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'},
  modalBg:    {flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:20},
  modalBox:   {backgroundColor:C.bg2,borderRadius:14,padding:22,borderWidth:1,borderColor:C.border},
  modalCancel:{flex:1,padding:12,borderRadius:8,borderWidth:1,borderColor:C.border,alignItems:'center'},
  modalSave:  {flex:1,padding:12,borderRadius:8,backgroundColor:C.blue,alignItems:'center'},
});
