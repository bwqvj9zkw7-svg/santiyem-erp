// app/AuthPage.tsx
import { auth, db } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, Alert
} from 'react-native';

const C = {
  bg:'#0a0d14', bg2:'#0f1320', bg3:'#151b2e',
  card:'#111827', card2:'#1a2236',
  blue:'#3b82f6', green:'#22c55e', amber:'#f59e0b',
  red:'#ef4444', purple:'#a855f7', cyan:'#06b6d4',
  t1:'#f1f5f9', t2:'#94a3b8', t3:'#475569',
  border:'rgba(255,255,255,0.08)',
};

export type AuthUser = {
  uid: string;
  email: string;
  orgId: string;
  rol: string;
  ad: string;
  projeAdi: string;
};

interface Props {
  onLogin: (user: AuthUser) => void;
}

export default function AuthPage({ onLogin }: Props) {
  const [mod, setMod]               = useState<'giris'|'kayit'>('giris');
  const [email, setEmail]           = useState('');
  const [sifre, setSifre]           = useState('');
  const [ad, setAd]                 = useState('');
  const [projeAdi, setProjeAdi]     = useState('');
  const [ihaleBedeli, setIhaleBedeli] = useState('');
  const [muteahhit, setMuteahhit]   = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata]             = useState('');

  

  const girisYap = async () => {
    if(!email||!sifre){ setHata('Email ve sifre zorunlu'); return; }
    setYukleniyor(true); setHata('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, sifre);
      const snap = await get(ref(db,'users/'+cred.user.uid));
      if(snap.exists()){
        const data = snap.val();
        onLogin({
          uid: cred.user.uid,
          email: cred.user.email||'',
          orgId: data.orgId,
          rol: data.rol,
          ad: data.ad,
          projeAdi: data.projeAdi||'',
        });
      }
    } catch(e:any) {
      if(e.code==='auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'){
        setHata('Hatali email veya sifre');
      } else {
        setHata('Giris hatasi: '+e.message);
      }
    }
    setYukleniyor(false);
  };

  const kayitOl = async () => {
    if(!email||!sifre||!ad||!projeAdi){ 
      setHata('Tum alanlar zorunlu'); 
      return; 
    }
    if(sifre.length<6){ setHata('Sifre en az 6 karakter olmali'); return; }
    setYukleniyor(true); setHata('');
    try {
      // Firebase Auth ile kullanıcı oluştur
      const cred = await createUserWithEmailAndPassword(auth, email, sifre);
      const uid = cred.user.uid;
      const orgId = 'org_'+uid; // Her kullanıcıya özel org

      // Organizasyon oluştur
      await set(ref(db,'organizations/'+orgId), {
        id: orgId,
        projeAdi: projeAdi.trim(),
        ihaleBedeli: parseFloat(ihaleBedeli)||0,
        muteahhit: muteahhit.trim(),
        adminUid: uid,
        olusturma: new Date().toISOString(),
      });

      // Kullanıcı profili oluştur
      await set(ref(db,'users/'+uid), {
        uid,
        email,
        ad: ad.trim(),
        orgId,
        rol: 'admin',
        projeAdi: projeAdi.trim(),
        olusturma: new Date().toISOString(),
      });

      // Organizasyona üye ekle
      await set(ref(db,'organizations/'+orgId+'/members/'+uid), {
        uid,
        rol: 'admin',
        ad: ad.trim(),
      });

      onLogin({
        uid,
        email,
        orgId,
        rol: 'admin',
        ad: ad.trim(),
        projeAdi: projeAdi.trim(),
      });

    } catch(e:any) {
      if(e.code==='auth/email-already-in-use'){
        setHata('Bu email zaten kullaniliyor');
      } else {
        setHata('Kayit hatasi: '+e.message);
      }
    }
    setYukleniyor(false);
  };

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={s.inner}>
        {/* Logo */}
        <Text style={s.logo}>Santiye <Text style={{color:C.blue}}>Planlama</Text></Text>
        <Text style={s.sub}>ERP & Yönetim Sistemi</Text>
        <Text style={s.sub2}>by ndrtl</Text>

        {/* Tab */}
        <View style={s.tabRow}>
          <TouchableOpacity onPress={()=>{setMod('giris');setHata('');}}
            style={[s.tab, mod==='giris'&&s.tabActive]}>
            <Text style={[s.tabT, mod==='giris'&&{color:C.blue}]}>Giris Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setMod('kayit');setHata('');}}
            style={[s.tab, mod==='kayit'&&s.tabActive]}>
            <Text style={[s.tabT, mod==='kayit'&&{color:C.blue}]}>Yeni Santiye</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          {mod==='giris' ? (
            <>
              <Text style={s.cardTitle}>Hosgeldiniz</Text>
              <Text style={s.lbl}>Email</Text>
              <TextInput style={s.inp} value={email} onChangeText={t=>{setEmail(t);setHata('');}}
                placeholder="email@ornek.com" placeholderTextColor={C.t3}
                autoCapitalize="none" keyboardType="email-address"/>
              <Text style={s.lbl}>Sifre</Text>
              <TextInput style={s.inp} value={sifre} onChangeText={t=>{setSifre(t);setHata('');}}
                placeholder="••••••" placeholderTextColor={C.t3}
                secureTextEntry onSubmitEditing={girisYap}/>
              {hata ? <Text style={s.hata}>{hata}</Text> : null}
              <TouchableOpacity style={[s.btn, yukleniyor&&{opacity:0.6}]} onPress={girisYap} disabled={yukleniyor}>
                <Text style={s.btnT}>{yukleniyor?'Giris yapiliyor...':'Giris Yap'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setMod('kayit')} style={{marginTop:16,alignItems:'center'}}>
                <Text style={{color:C.t3,fontSize:13}}>Hesabiniz yok mu? <Text style={{color:C.blue}}>Yeni Santiye Olustur</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>Yeni Santiye Olustur</Text>
              <Text style={{color:C.t3,fontSize:12,marginBottom:16}}>
                Her santiye icin ayri bir hesap olusturulur. Verileriniz tamamen size ozgudur.
              </Text>

              <Text style={s.lbl}>Adiniz Soyadiniz</Text>
              <TextInput style={s.inp} value={ad} onChangeText={t=>{setAd(t);setHata('');}}
                placeholder="Ahmet Yilmaz" placeholderTextColor={C.t3}/>

              <Text style={s.lbl}>Email</Text>
              <TextInput style={s.inp} value={email} onChangeText={t=>{setEmail(t);setHata('');}}
                placeholder="email@ornek.com" placeholderTextColor={C.t3}
                autoCapitalize="none" keyboardType="email-address"/>

              <Text style={s.lbl}>Sifre (min 6 karakter)</Text>
              <TextInput style={s.inp} value={sifre} onChangeText={t=>{setSifre(t);setHata('');}}
                placeholder="••••••" placeholderTextColor={C.t3} secureTextEntry/>

              <Text style={s.lbl}>Proje / Santiye Adi</Text>
              <TextInput style={s.inp} value={projeAdi} onChangeText={t=>{setProjeAdi(t);setHata('');}}
                placeholder="Konya 906 Konut Projesi" placeholderTextColor={C.t3}/>

              <Text style={s.lbl}>Ihale Bedeli (TL) - Opsiyonel</Text>
              <TextInput style={s.inp} value={ihaleBedeli} onChangeText={t=>{setIhaleBedeli(t);setHata('');}}
                placeholder="0" placeholderTextColor={C.t3} keyboardType="numeric"/>

              <Text style={s.lbl}>Muteahhit - Opsiyonel</Text>
              <TextInput style={s.inp} value={muteahhit} onChangeText={t=>{setMuteahhit(t);setHata('');}}
                placeholder="Firma Adi" placeholderTextColor={C.t3}/>

              {hata ? <Text style={s.hata}>{hata}</Text> : null}

              <TouchableOpacity style={[s.btn,{backgroundColor:C.green},yukleniyor&&{opacity:0.6}]} 
                onPress={kayitOl} disabled={yukleniyor}>
                <Text style={s.btnT}>{yukleniyor?'Olusturuluyor...':'Santiye Olustur'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={()=>setMod('giris')} style={{marginTop:16,alignItems:'center'}}>
                <Text style={{color:C.t3,fontSize:13}}>Hesabiniz var mi? <Text style={{color:C.blue}}>Giris Yapin</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={{color:C.t4,fontSize:11,textAlign:'center',marginTop:24}}>
          Santiye Planlama ERP v1.0 • byndrtl
        </Text>
      </ScrollView>
    </View>
  );
}

export { signOut };

const s = StyleSheet.create({
  wrap:      {flex:1,backgroundColor:'#0a0d14'},
  inner:     {flexGrow:1,justifyContent:'center',padding:24,paddingVertical:40},
  logo:      {fontSize:28,fontWeight:'800',color:'#f1f5f9',textAlign:'center',marginBottom:6},
  sub:       {fontSize:14,color:'#94a3b8',textAlign:'center',marginBottom:4},
  sub2:      {fontSize:12,color:'#475569',textAlign:'center',marginBottom:32},
  tabRow:    {flexDirection:'row',backgroundColor:'#111827',borderRadius:10,padding:4,marginBottom:20},
  tab:       {flex:1,paddingVertical:10,alignItems:'center',borderRadius:8},
  tabActive: {backgroundColor:'#0f1320',borderWidth:1,borderColor:'rgba(59,130,246,0.3)'},
  tabT:      {fontSize:13,fontWeight:'600',color:'#475569'},
  card:      {backgroundColor:'#111827',borderRadius:14,padding:22,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  cardTitle: {fontSize:18,fontWeight:'700',color:'#f1f5f9',marginBottom:20},
  lbl:       {fontSize:12,color:'#475569',marginBottom:6,fontWeight:'600'},
  inp:       {backgroundColor:'#151b2e',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:8,padding:12,color:'#f1f5f9',fontSize:14,marginBottom:14},
  btn:       {backgroundColor:'#3b82f6',borderRadius:10,padding:14,alignItems:'center',marginTop:4},
  btnT:      {color:'#fff',fontWeight:'700',fontSize:15},
  hata:      {color:'#ef4444',fontSize:13,marginBottom:12,textAlign:'center'},
});
