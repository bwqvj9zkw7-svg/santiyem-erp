// app/kullanicilar.ts
// Kullanici rolleri ve yetki sistemi
// Bu dosyayi app/ klasorune kopyalayin

export const ROLLER = {
  ADMIN: 'admin',
  MUHENDIS: 'muhendis', 
  FORMEN: 'formen',
  SAHA_ISCISI: 'saha_iscisi',
  MUHASEBE: 'muhasebe',
};

export const YETKI_HARITASI: {[key:string]: string[]} = {
  admin: [
    'dashboard','saha','program','satin_alma','ik','isg','hakedis','stok','rapor',
    'kullanici_ekle','kullanici_sil','veri_sil','hakedis_onayla','satin_alma_onayla'
  ],
  muhendis: [
    'dashboard','saha','program','satin_alma','isg','hakedis','stok','rapor',
    'satin_alma_onayla'
  ],
  formen: [
    'dashboard','saha','isg','stok',
  ],
  saha_iscisi: [
    'dashboard','saha','isg',
  ],
  muhasebe: [
    'dashboard','hakedis','satin_alma','rapor','stok',
    'satin_alma_onayla','hakedis_onayla'
  ],
};

export const yetkiVar = (rol:string, yetki:string): boolean => {
  const yetkiler = YETKI_HARITASI[rol] || [];
  return yetkiler.includes(yetki);
};

export const ROL_RENKLERI: {[key:string]:string} = {
  admin: '#ef4444',
  muhendis: '#3b82f6',
  formen: '#f59e0b',
  saha_iscisi: '#22c55e',
  muhasebe: '#a855f7',
};

export const ROL_ETIKETLERI: {[key:string]:string} = {
  admin: 'Admin',
  muhendis: 'Muhendis',
  formen: 'Formen',
  saha_iscisi: 'Saha Iscisi',
  muhasebe: 'Muhasebe',
};

export const DEMO_KULLANICILAR = [
  {id:'U001', ad:'Admin', soyad:'Kullanici', kullaniciAdi:'admin', sifre:'1234', rol:'admin', aktif:true},
  {id:'U002', ad:'Ahmet', soyad:'Kaya', kullaniciAdi:'ahmet', sifre:'1234', rol:'muhendis', aktif:true},
  {id:'U003', ad:'Murat', soyad:'Sahin', kullaniciAdi:'murat', sifre:'1234', rol:'formen', aktif:true},
  {id:'U004', ad:'Fatma', soyad:'Yildiz', kullaniciAdi:'fatma', sifre:'1234', rol:'muhasebe', aktif:true},
  {id:'U005', ad:'Kemal', soyad:'Arslan', kullaniciAdi:'kemal', sifre:'1234', rol:'saha_iscisi', aktif:true},
];
export default DEMO_KULLANICILAR;