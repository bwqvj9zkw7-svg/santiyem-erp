// app/KullaniciPage.tsx
import { db } from '../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert
} from 'react-native';
import { ROLLER, ROL_RENKLERI, ROL_ETIKETLERI, DEMO_KULLANICILAR, yetkiVar } from './kullanicilar';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

interface Props {
  mevcutKullanici: any;
}

export default function KullaniciPage({ mevcutKullanici }: Props) {
  const [kullanicilar, setKullanicilar] = useState(DEMO_KULLANICILAR as any[]);
  const [addModal, setAddModal]         = useState(false);
  const [newAd, setNewAd]               = useState('');
  const [newSoyad, setNewSoyad]         = useState('');
  const [newKullaniciAdi, setNewKullaniciAdi] = useState('');
  const [newSifre, setNewSifre]         = useState('');
  const [newRol, setNewRol]             = useState('formen');
  const [editModal, setEditModal]       = useState(false);
  const [selKullanici, setSelKullanici] = useState<any>(null);

  const isAdmin = mevcutKullanici?.rol === 'admin';

  useEffect(()=>{
    onValue(ref(db,'kullanicilar'),(snap)=>{
      const d=snap.val();
      if(d) setKullanicilar(Object.values(d));
      else DEMO_KULLANICILAR.forEach((k:any)=>set(ref(db,'kullanicilar/'+k.id),{...k,sifre:'1234'}));
    });
  },[]);

  const kullaniciEkle = () => {
    if(!newAd.trim()||!newKullaniciAdi.trim()||!newSifre.trim()) {
      Alert.alert('Hata','Ad, kullanici adi ve sifre zorunlu');
      return;
    }
    const id='U'+Date.now();
    const k={id,ad:newAd.trim(),soyad:newSoyad.trim(),kullaniciAdi:newKullaniciAdi.trim(),
      sifre:newSifre,rol:newRol,aktif:true};
    set(ref(db,'kullanicilar/'+id),k);
    setNewAd('');setNewSoyad('');setNewKullaniciAdi('');setNewSifre('');
    setAddModal(false);
    Alert.alert('Basarili',newAd+' eklendi');
  };

  const kullaniciSil = (k:any) => {
    if(k.rol==='admin') { Alert.alert('Hata','Admin kullanici silinemez'); return; }
    Alert.alert('Sil',k.ad+' '+k.soyad+' silinsin mi?',[
      {text:'Iptal',style:'cancel'},
      {text:'Sil',style:'destructive',onPress:()=>set(ref(db,'kullanicilar/'+k.id),null)},
    ]);
  };

  const durumDegistir = (k:any) => {
    set(ref(db,'kullanicilar/'+k.id+'/aktif'),!k.aktif);
  };

  const rolDegistir = (k:any, yeniRol:string) => {
    if(k.rol==='admin' && yeniRol!=='admin') {
      Alert.alert('Hata','Admin rolü degistirilemez');
      return;
    }
    set(ref(db,'kullanicilar/'+k.id+'/rol'),yeniRol);
    setEditModal(false);
  };

  const aktifSayisi = kullanicilar.filter((k:any)=>k.aktif).length;

  return (
    <View>
      {/* KPI */}
      <View style={s.row}>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.blue}]}/>
          <Text style={s.kpiLbl}>Toplam Kullanici</Text>
          <Text style={s.kpiVal}>{kullanicilar.length}</Text>
        </View>
        <View style={[s.kpi,{flex:1,marginHorizontal:4}]}>
          <View style={[s.kpiAcc,{backgroundColor:C.green}]}/>
          <Text style={s.kpiLbl}>Aktif</Text>
          <Text style={s.kpiVal}>{aktifSayisi}</Text>
        </View>
      </View>

      {/* Mevcut kullanıcı bilgisi */}
      <View style={[s.sec,{marginBottom:12}]}>
        <Text style={{color:C.t3,fontSize:11,marginBottom:6}}>OTURUM ACIK</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
          <View style={{width:44,height:44,borderRadius:22,backgroundColor:ROL_RENKLERI[mevcutKullanici?.rol]||C.blue,
            alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:16}}>
              {(mevcutKullanici?.ad||'?')[0]}
            </Text>
          </View>
          <View style={{flex:1}}>
            <Text style={{color:C.t1,fontWeight:'700',fontSize:15}}>
              {mevcutKullanici?.ad} {mevcutKullanici?.soyad}
            </Text>
            <Text style={{color:C.t3,fontSize:12}}>@{mevcutKullanici?.kullaniciAdi}</Text>
          </View>
          <View style={{backgroundColor:ROL_RENKLERI[mevcutKullanici?.rol]+'22',borderRadius:8,
            paddingHorizontal:12,paddingVertical:6,borderWidth:1,
            borderColor:ROL_RENKLERI[mevcutKullanici?.rol]}}>
            <Text style={{color:ROL_RENKLERI[mevcutKullanici?.rol],fontWeight:'700',fontSize:12}}>
              {ROL_ETIKETLERI[mevcutKullanici?.rol]||mevcutKullanici?.rol}
            </Text>
          </View>
        </View>

        {/* Yetki listesi */}
        <View style={{marginTop:12}}>
          <Text style={{color:C.t3,fontSize:11,marginBottom:6}}>YETKiLER</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
            {(mevcutKullanici?.rol ? [
              'Dashboard','Saha','Program','Satin Alma','IK','ISG','Hakedis','Stok','Rapor'
            ].filter((_,i)=>{
              const yetkiAdi = ['dashboard','saha','program','satin_alma','ik','isg','hakedis','stok','rapor'][i];
              return yetkiVar(mevcutKullanici.rol, yetkiAdi);
            }) : []).map((y,i)=>(
              <View key={i} style={{backgroundColor:'rgba(34,197,94,0.12)',borderRadius:6,
                paddingHorizontal:8,paddingVertical:4,borderWidth:1,borderColor:'rgba(34,197,94,0.3)'}}>
                <Text style={{color:C.green,fontSize:11}}>{y}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Admin kontrolü */}
      {!isAdmin && (
        <View style={[s.warnBox,{marginBottom:12}]}>
          <Text style={{color:C.amber,fontWeight:'600',fontSize:13}}>
            Kullanici yonetimi sadece Admin tarafindan yapilabilir
          </Text>
        </View>
      )}

      {isAdmin && (
        <TouchableOpacity onPress={()=>setAddModal(true)} style={[s.addBtn,{marginBottom:12}]}>
          <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>+ Yeni Kullanici Ekle</Text>
        </TouchableOpacity>
      )}

      {/* Kullanıcı listesi */}
      <View style={s.sec}>
        <Text style={s.secT}>Kullanicilar</Text>
        {kullanicilar.map((k:any,i:number)=>{
          const rolRenk = ROL_RENKLERI[k.rol]||C.t2;
          return (
            <View key={i} style={[s.kullaniciRow,{opacity:k.aktif?1:0.5}]}>
              <View style={{width:40,height:40,borderRadius:20,backgroundColor:rolRenk+'33',
                alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:rolRenk}}>
                <Text style={{color:rolRenk,fontWeight:'800',fontSize:14}}>
                  {(k.ad||'?')[0]}
                </Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{color:C.t1,fontWeight:'600',fontSize:13}}>{k.ad} {k.soyad}</Text>
                <Text style={{color:C.t3,fontSize:11}}>@{k.kullaniciAdi}</Text>
              </View>
              <View style={{alignItems:'flex-end',gap:4}}>
                <View style={{backgroundColor:rolRenk+'22',borderRadius:6,paddingHorizontal:8,
                  paddingVertical:3,borderWidth:1,borderColor:rolRenk}}>
                  <Text style={{color:rolRenk,fontSize:11,fontWeight:'600'}}>
                    {ROL_ETIKETLERI[k.rol]||k.rol}
                  </Text>
                </View>
                {isAdmin && k.kullaniciAdi!=='admin' && (
                  <View style={{flexDirection:'row',gap:6,marginTop:2}}>
                    <TouchableOpacity onPress={()=>{setSelKullanici(k);setEditModal(true);}}
                      style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                        borderColor:'rgba(59,130,246,0.3)',backgroundColor:'rgba(59,130,246,0.08)'}}>
                      <Text style={{color:C.blue,fontSize:11}}>Rol</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>durumDegistir(k)}
                      style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                        borderColor:k.aktif?'rgba(245,158,11,0.3)':'rgba(34,197,94,0.3)',
                        backgroundColor:k.aktif?'rgba(245,158,11,0.08)':'rgba(34,197,94,0.08)'}}>
                      <Text style={{color:k.aktif?C.amber:C.green,fontSize:11}}>
                        {k.aktif?'Pasif':'Aktif'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>kullaniciSil(k)}
                      style={{paddingHorizontal:8,paddingVertical:4,borderRadius:6,borderWidth:1,
                        borderColor:'rgba(239,68,68,0.3)',backgroundColor:'rgba(239,68,68,0.08)'}}>
                      <Text style={{color:C.red,fontSize:11}}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Rol açıklamaları */}
      <View style={s.sec}>
        <Text style={s.secT}>Rol Yetkileri</Text>
        {Object.entries(ROL_ETIKETLERI).map(([rol,etiket],i)=>{
          const renk = ROL_RENKLERI[rol];
          const yetkiler = ['dashboard','saha','program','satin_alma','ik','isg','hakedis','stok','rapor'];
          const sayfalar = ['Dashboard','Saha','Program','Satin Alma','IK','ISG','Hakedis','Stok','Rapor'];
          return (
            <View key={i} style={{marginBottom:12,paddingBottom:12,borderBottomWidth:1,borderBottomColor:C.border}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
                <View style={{backgroundColor:renk+'22',borderRadius:6,paddingHorizontal:10,
                  paddingVertical:4,borderWidth:1,borderColor:renk}}>
                  <Text style={{color:renk,fontWeight:'700',fontSize:12}}>{etiket}</Text>
                </View>
              </View>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>
                {yetkiler.map((y,j)=>{
                  const var_ = yetkiVar(rol,y);
                  return (
                    <View key={j} style={{backgroundColor:var_?renk+'22':'rgba(100,116,139,0.1)',
                      borderRadius:4,paddingHorizontal:7,paddingVertical:3,borderWidth:1,
                      borderColor:var_?renk:'rgba(100,116,139,0.2)'}}>
                      <Text style={{color:var_?renk:C.t4,fontSize:10}}>{sayfalar[j]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* YENİ KULLANICI MODAL */}
      <Modal visible={addModal} transparent animationType="fade" onRequestClose={()=>setAddModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.t1}}>Yeni Kullanici</Text>
              <TouchableOpacity onPress={()=>setAddModal(false)}><Text style={{color:C.t3,fontSize:22}}>X</Text></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight:400}}>
              <View style={{flexDirection:'row',gap:10}}>
                <View style={{flex:1}}>
                  <Text style={s.lbl}>Ad</Text>
                  <TextInput style={s.inp} value={newAd} onChangeText={setNewAd} placeholder="Ali" placeholderTextColor={C.t3}/>
                </View>
                <View style={{flex:1}}>
                  <Text style={s.lbl}>Soyad</Text>
                  <TextInput style={s.inp} value={newSoyad} onChangeText={setNewSoyad} placeholder="Veli" placeholderTextColor={C.t3}/>
                </View>
              </View>
              <Text style={s.lbl}>Kullanici Adi</Text>
              <TextInput style={s.inp} value={newKullaniciAdi} onChangeText={setNewKullaniciAdi}
                placeholder="aliveli" placeholderTextColor={C.t3} autoCapitalize="none"/>
              <Text style={s.lbl}>Sifre</Text>
              <TextInput style={s.inp} value={newSifre} onChangeText={setNewSifre}
                placeholder="********" placeholderTextColor={C.t3} secureTextEntry/>
              <Text style={s.lbl}>Rol</Text>
              <View style={{flexDirection:'row',gap:6,flexWrap:'wrap',marginBottom:14}}>
                {Object.entries(ROL_ETIKETLERI).filter(([r])=>r!=='admin').map(([rol,etiket])=>{
                  const renk=ROL_RENKLERI[rol];
                  return (
                    <TouchableOpacity key={rol} onPress={()=>setNewRol(rol)}
                      style={{paddingHorizontal:12,paddingVertical:7,borderRadius:8,borderWidth:1,
                        backgroundColor:newRol===rol?renk+'33':C.bg3,
                        borderColor:newRol===rol?renk:C.border}}>
                      <Text style={{color:newRol===rol?renk:C.t2,fontSize:12,fontWeight:'600'}}>{etiket}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={{flexDirection:'row',gap:10,marginTop:14}}>
              <TouchableOpacity onPress={()=>setAddModal(false)} style={s.modalCancel}>
                <Text style={{color:C.t2,fontWeight:'600'}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={kullaniciEkle} style={s.modalSave}>
                <Text style={{color:'#fff',fontWeight:'800'}}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ROL DEĞİŞTİR MODAL */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={()=>setEditModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.t1}}>
                {selKullanici?.ad} - Rol Degistir
              </Text>
              <TouchableOpacity onPress={()=>setEditModal(false)}><Text style={{color:C.t3,fontSize:22}}>X</Text></TouchableOpacity>
            </View>
            <View style={{gap:8}}>
              {Object.entries(ROL_ETIKETLERI).filter(([r])=>r!=='admin').map(([rol,etiket])=>{
                const renk=ROL_RENKLERI[rol];
                const secili = selKullanici?.rol===rol;
                return (
                  <TouchableOpacity key={rol} onPress={()=>rolDegistir(selKullanici,rol)}
                    style={{flexDirection:'row',alignItems:'center',padding:14,borderRadius:10,
                      borderWidth:1,backgroundColor:secili?renk+'22':C.bg3,
                      borderColor:secili?renk:C.border}}>
                    <View style={{width:12,height:12,borderRadius:6,backgroundColor:renk,marginRight:10}}/>
                    <Text style={{color:secili?renk:C.t2,fontWeight:secili?'700':'400',fontSize:14,flex:1}}>{etiket}</Text>
                    {secili && <Text style={{color:renk,fontSize:12}}>Mevcut</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  secT:         {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:14},
  kullaniciRow: {flexDirection:'row',alignItems:'flex-start',gap:10,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.08)'},
  warnBox:      {backgroundColor:'rgba(245,158,11,0.08)',borderWidth:1,borderColor:'rgba(245,158,11,0.25)',borderRadius:9,padding:13},
  addBtn:       {backgroundColor:'#3b82f6',borderRadius:9,padding:12,alignItems:'center'},
  lbl:          {fontSize:12,color:'#475569',marginBottom:6,fontWeight:'600'},
  inp:          {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:11,color:'#f1f5f9',fontSize:14,marginBottom:14},
  modalBg:      {flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},
  modalBox:     {backgroundColor:'#0f1320',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  modalCancel:  {flex:1,padding:12,borderRadius:8,borderWidth:1,borderColor:'rgba(255,255,255,0.08)',alignItems:'center'},
  modalSave:    {flex:1,padding:12,borderRadius:8,backgroundColor:'#3b82f6',alignItems:'center'},
});
