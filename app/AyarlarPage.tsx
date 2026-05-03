// app/AyarlarPage.tsx
import { db } from '../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert
} from 'react-native';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569', t4:'#334155',
  border:'rgba(255,255,255,0.08)',
};

const DEFAULT_AYARLAR = {
  projeAdi: 'Konya 906 Konut - 1. Etap',
  sehir: 'Konya',
  ilce: 'Selcuklu',
  mahalle: 'Ardicli',
  ihaleBedeli: '2149000000',
  isSuresi: '600',
  baslangicTarihi: '01.01.2025',
  bitisTarihi: '01.09.2026',
  muteahhit: 'KARMA GLOBAL INSAAT & ARTER TAAHHUT IS ORTAKLIGI',
  musavir: 'UCER MUSAVIR MUHENDISLIK A.S.',
  idare: 'TOKi',
  santiyeSefi: 'Ahmet Kaya',
  toplamKonut: '906',
  toplamBlok: '77',
  kazasizGun: '34',
  versiyon: '1.0.0',
};

const tl = (n:any) => 'TL '+new Intl.NumberFormat('tr-TR').format(Math.round(Number(n)||0));

interface Props {
  mevcutKullanici?: any;
}

export default function AyarlarPage({ mevcutKullanici }: Props) {
  const [ayarlar, setAyarlar] = useState(DEFAULT_AYARLAR as any);
  const [editMode, setEditMode] = useState(false);
  const [tempAyarlar, setTempAyarlar] = useState(DEFAULT_AYARLAR as any);

  const isAdmin = mevcutKullanici?.rol === 'admin';

  useEffect(()=>{
    onValue(ref(db,'ayarlar'),(snap)=>{
      const d=snap.val();
      if(d) { setAyarlar(d); setTempAyarlar(d); }
      else set(ref(db,'ayarlar'),DEFAULT_AYARLAR);
    });
  },[]);

  const kaydet = () => {
    set(ref(db,'ayarlar'),tempAyarlar);
    setAyarlar(tempAyarlar);
    setEditMode(false);
    Alert.alert('Kaydedildi','Proje ayarlari guncellendi');
  };

  const iptal = () => {
    setTempAyarlar(ayarlar);
    setEditMode(false);
  };

  const Field = ({label, field, keyboardType='default'}:any) => (
    <View style={{marginBottom:14}}>
      <Text style={s.lbl}>{label}</Text>
      {editMode ? (
        <TextInput
          style={s.inp}
          value={tempAyarlar[field]||''}
          onChangeText={(t)=>setTempAyarlar((prev:any)=>({...prev,[field]:t}))}
          keyboardType={keyboardType}
          placeholderTextColor={C.t3}
        />
      ) : (
        <View style={s.displayField}>
          <Text style={{color:C.t1,fontSize:14}}>{ayarlar[field]||'-'}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View>
      {/* Proje Kimlik Kartı */}
      <View style={[s.sec,{borderColor:'rgba(59,130,246,0.3)',borderWidth:2}]}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
          <View style={{flex:1}}>
            <Text style={{color:C.blue,fontSize:11,fontWeight:'700',marginBottom:4}}>AKTiF PROJE</Text>
            <Text style={{color:C.t1,fontSize:17,fontWeight:'800',marginBottom:4}}>{ayarlar.projeAdi}</Text>
            <Text style={{color:C.t3,fontSize:12}}>{ayarlar.sehir} / {ayarlar.ilce} / {ayarlar.mahalle}</Text>
          </View>
          <View style={{backgroundColor:'rgba(59,130,246,0.15)',borderRadius:8,padding:10,borderWidth:1,borderColor:C.blue}}>
            <Text style={{color:C.blue,fontSize:10,fontWeight:'700'}}>v{ayarlar.versiyon}</Text>
          </View>
        </View>

        <View style={{flexDirection:'row',gap:8,marginTop:14,flexWrap:'wrap'}}>
          {[
            ['Ihale Bedeli', tl(ayarlar.ihaleBedeli), C.green],
            ['Is Suresi', ayarlar.isSuresi+' gun', C.amber],
            ['Toplam Konut', ayarlar.toplamKonut+' adet', C.purple],
            ['Toplam Blok', ayarlar.toplamBlok+' blok', C.cyan],
            ['Kazasiz Gun', ayarlar.kazasizGun+' gun', C.green],
          ].map(([l,v,c]:any,i)=>(
            <View key={i} style={{backgroundColor:c+'15',borderRadius:8,padding:10,
              borderWidth:1,borderColor:c+'44',minWidth:120,flex:1}}>
              <Text style={{color:c,fontSize:10,fontWeight:'700',marginBottom:2}}>{l}</Text>
              <Text style={{color:C.t1,fontSize:13,fontWeight:'700'}}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Düzenle / Kaydet butonları */}
      {isAdmin && (
        <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
          {!editMode ? (
            <TouchableOpacity onPress={()=>setEditMode(true)} style={[s.addBtn,{backgroundColor:C.blue}]}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Proje Bilgilerini Duzenle</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={iptal} style={[s.addBtn,{backgroundColor:C.bg3,borderWidth:1,borderColor:C.border}]}>
                <Text style={{color:C.t2,fontWeight:'700',fontSize:13}}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={kaydet} style={[s.addBtn,{backgroundColor:C.green}]}>
                <Text style={{color:'#fff',fontWeight:'700',fontSize:13}}>Kaydet</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Proje Bilgileri */}
      <View style={s.sec}>
        <Text style={s.secT}>Proje Bilgileri</Text>
        <Field label="Proje Adi" field="projeAdi"/>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><Field label="Sehir" field="sehir"/></View>
          <View style={{flex:1}}><Field label="Ilce" field="ilce"/></View>
        </View>
        <Field label="Mahalle" field="mahalle"/>
        <Field label="Ihale Bedeli (TL)" field="ihaleBedeli" keyboardType="numeric"/>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><Field label="Is Suresi (Gun)" field="isSuresi" keyboardType="numeric"/></View>
          <View style={{flex:1}}><Field label="Toplam Konut" field="toplamKonut" keyboardType="numeric"/></View>
        </View>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><Field label="Baslangic Tarihi" field="baslangicTarihi"/></View>
          <View style={{flex:1}}><Field label="Bitis Tarihi" field="bitisTarihi"/></View>
        </View>
      </View>

      {/* Taraflar */}
      <View style={s.sec}>
        <Text style={s.secT}>Sozlesme Taraflari</Text>
        <Field label="Muteahhit" field="muteahhit"/>
        <Field label="Musavir" field="musavir"/>
        <Field label="Idare" field="idare"/>
      </View>

      {/* Santiye */}
      <View style={s.sec}>
        <Text style={s.secT}>Santiye Bilgileri</Text>
        <Field label="Santiye Sefi" field="santiyeSefi"/>
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}><Field label="Toplam Blok" field="toplamBlok" keyboardType="numeric"/></View>
          <View style={{flex:1}}><Field label="Kazasiz Gun" field="kazasizGun" keyboardType="numeric"/></View>
        </View>
      </View>

      {/* Uygulama Bilgisi */}
      <View style={[s.sec,{backgroundColor:C.bg3}]}>
        <Text style={s.secT}>Uygulama Hakkinda</Text>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
          borderBottomWidth:1,borderBottomColor:C.border}}>
          <Text style={{color:C.t3,fontSize:12}}>Uygulama Adi</Text>
          <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>Santiye Planlama ERP</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
          borderBottomWidth:1,borderBottomColor:C.border}}>
          <Text style={{color:C.t3,fontSize:12}}>Gelistirici</Text>
          <Text style={{color:C.blue,fontSize:12,fontWeight:'700'}}>byndrtl & Claude</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
          borderBottomWidth:1,borderBottomColor:C.border}}>
          <Text style={{color:C.t3,fontSize:12}}>Versiyon</Text>
          <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>v{ayarlar.versiyon}</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
          borderBottomWidth:1,borderBottomColor:C.border}}>
          <Text style={{color:C.t3,fontSize:12}}>Platform</Text>
          <Text style={{color:C.t1,fontSize:12,fontWeight:'600'}}>React Native + Expo + Firebase</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8}}>
          <Text style={{color:C.t3,fontSize:12}}>GitHub</Text>
          <Text style={{color:C.cyan,fontSize:12}}>github.com/bwqvj9zkw7-svg</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sec:          {backgroundColor:'#111827',borderRadius:10,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  secT:         {fontSize:14,fontWeight:'600',color:'#f1f5f9',marginBottom:14},
  lbl:          {fontSize:12,color:'#475569',marginBottom:6,fontWeight:'600'},
  inp:          {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:11,color:'#f1f5f9',fontSize:14,marginBottom:0},
  displayField: {backgroundColor:'#151b2e',borderRadius:8,padding:11,borderWidth:1,borderColor:'rgba(255,255,255,0.05)'},
  addBtn:       {backgroundColor:'#3b82f6',borderRadius:9,padding:12,alignItems:'center',flex:1},
});
