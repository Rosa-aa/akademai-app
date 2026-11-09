// "Dərs Materialları" (Course Materials) section texts.
export default {
  nav: { materials: 'Dərs Materialları' },
  materials: {
    subtitle: 'Sillabuslar, mühazirə konspektləri, təqdimatlar və digər tədris materialları. Müəllimlər yükləyir, tələbələr baxır və endirir.',
    upload: 'Material yüklə', retry: 'Yenidən cəhd et', sample: 'NÜMUNƏ', noGroup: 'Qrupsuz',
    setup: {
      title: 'Verilənlər bazası qoşulmayıb',
      text: 'Bu bölmə real fayl yükləmə və saxlama üçün Supabase (verilənlər bazası, fayl saxlancı və giriş) istifadə edir. Qoşulmaq üçün aşağıdakı addımları yerinə yetirin.',
      step1: 'supabase.com saytında layihə yaradın.',
      step2: 'SQL Editor-da supabase/schema.sql faylını işə salın.',
      step3: 'Project Settings → API bölməsindən URL və anon açarı kopyalayın.',
      step4: '.env.local faylına (və ya Vercel-də Environment Variables bölməsinə) aşağıdakı iki dəyişəni əlavə edib tətbiqi yenidən başladın.',
      doc: 'Ətraflı təlimat: SUPABASE_SETUP.md',
    },
    auth: {
      title: 'Daxil olun', text: 'Dərs materiallarına baxmaq üçün hesabınıza daxil olun.', signIn: 'Daxil ol', signUp: 'Qeydiyyat',
      email: 'E-poçt', password: 'Şifrə', fullName: 'Ad və soyad',
      studentNote: 'Yeni hesablar tələbə hüququ ilə yaradılır. Müəllim hüququnu administrator verir.',
      msg: {
        required: 'Bütün sahələri doldurun.', invalid: 'E-poçt və ya şifrə yanlışdır.', exists: 'Bu e-poçt artıq qeydiyyatdan keçib.',
        weak: 'Şifrə çox zəifdir (ən azı 6 simvol olmalıdır).', unconfirmed: 'E-poçt ünvanı hələ təsdiqlənməyib.', network: 'Serverlə əlaqə qurulmadı.',
        generic: 'Əməliyyat alınmadı. Bir az sonra yenidən cəhd edin.', confirm: 'Qeydiyyat tamamlandı. E-poçtunuza göndərilən təsdiq linkinə keçin, sonra daxil olun.',
      },
    },
    noProfile: { title: 'Profil tapılmadı', text: 'Hesabınız üçün profil yaradılmayıb. supabase/schema.sql faylının işə salındığını yoxlayın.' },
    account: { signOut: 'Çıxış' },
    roles: { student: 'Tələbə', teacher: 'Müəllim', admin: 'Administrator' },
    category: { syllabus: 'Sillabus', lecture: 'Mühazirə', presentation: 'Təqdimat', seminar: 'Seminar / praktika', exam_prep: 'İmtahana hazırlıq', other: 'Digər' },
    groupBy: { subject: 'Fənn', faculty: 'Fakültə', department: 'Kafedra', year: 'Tədris ili', group: 'Qrup', teacher: 'Müəllim', none: 'Qruplaşdırma yoxdur' },
    filters: {
      search: 'Axtarış', searchPlaceholder: 'Ad, təsvir, fənn, müəllim və ya fayl adı üzrə axtarış…', all: 'Hamısı', faculty: 'Fakültə', department: 'Kafedra',
      year: 'Tədris ili', group: 'Qrup', subject: 'Fənn', teacher: 'Müəllim', category: 'Növ', groupBy: 'Qruplaşdır', myGroup: 'Yalnız mənim qrupum',
    },
    card: { preview: 'Bax', download: 'Endir', teacher: 'Müəllim', edit: '{name} materialını redaktə et', editShort: 'Redaktə et', delete: '{name} materialını sil' },
    info: { fileName: 'Fayl adı', type: 'Format', size: 'Ölçü', subject: 'Fənn', faculty: 'Fakültə', department: 'Kafedra', year: 'Tədris ili', groups: 'Qruplar', teacher: 'Müəllim', uploaded: 'Yüklənib' },
    empty: {
      title: 'Hələ material yoxdur', student: 'Müəllimlər material yüklədikdən sonra burada görünəcək.',
      teacher: 'İlk materialı yükləyin və ya 5 nümunə PDF materialı (NÜMUNƏ) bir kliklə yükləyin.',
      samples: 'Nümunə materialları yüklə', installing: 'Yüklənir…', noMatch: 'Filtrlərə uyğun material tapılmadı',
    },
    form: {
      titleNew: 'Yeni material yüklə', titleEdit: 'Materialı redaktə et', title: 'Ad', description: 'Təsvir', descriptionHint: 'Materialın məzmunu haqqında qısa məlumat',
      category: 'Növ', year: 'Tədris ili', subject: 'Fənn', chooseSubject: 'Fənni seçin…', groups: 'Qruplar', groupsHint: 'Heç bir qrup seçilməsə, material bütün qruplar üçün nəzərdə tutulur.',
      noGroups: 'Bu fakültə üçün qrup tapılmadı.', file: 'Fayl (PDF, DOCX, PPTX)', replaceFile: 'Faylı əvəz et (könüllü)', current: 'Cari fayl: {name} · {size}',
      selected: 'Seçilib: {name} ({size})', save: 'Yadda saxla', saving: 'Saxlanılır…',
      errTitle: 'Adı daxil edin.', errSubject: 'Fənni seçin.', errFile: 'Fayl seçin.',
    },
    delete: { title: 'Materialı sil', text: '“{name}” materialı və faylı birdəfəlik silinəcək. Davam edilsin?' },
    preview: {
      loading: 'Yüklənir…', error: 'Fayl açıla bilmədi. Əvəzinə endirə bilərsiniz.', prev: 'Əvvəlki səhifə', next: 'Növbəti səhifə', page: 'Səhifə {n} / {total}',
      zoomIn: 'Böyüt', zoomOut: 'Kiçilt', unsupported: '{ext} faylı brauzerdə göstərilmir. Faylı endirib açın.', noText: 'Mətn tapılmadı.',
      slide: 'Slayd {n}', slidesNote: 'Təqdimatın slaydlarından mətn çıxarılıb. Tam görünüş üçün faylı endirin.',
    },
    msg: { created: 'Material yükləndi.', updated: 'Material yeniləndi.', deleted: 'Material silindi.', samples: { one: '{n} nümunə material yükləndi.', other: '{n} nümunə material yükləndi.' } },
    err: {
      generic: 'Əməliyyat alınmadı.', permission: 'Bu əməliyyat üçün icazəniz yoxdur.', network: 'Serverlə əlaqə qurulmadı.', tooLarge: 'Fayl çox böyükdür (ən çox 25 MB).',
      badType: 'Bu fayl formatı dəstəklənmir. PDF, DOCX və ya PPTX yükləyin.', empty: 'Fayl boşdur.', notConfigured: 'Supabase qoşulmayıb.', load: 'Materiallar yüklənmədi.',
      upload: 'Fayl yüklənmədi.', save: 'Material saxlanmadı.', delete: 'Material silinmədi.', download: 'Fayl endirilmədi.', preview: 'Fayl açılmadı.',
      catalogMissing: 'Fakültə, fənn və qrup siyahısı boşdur. supabase/schema.sql faylını işə salın.', sampleMissing: 'Nümunə fayl tapılmadı.',
    },
  },
}
