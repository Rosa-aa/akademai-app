#!/usr/bin/env python3
"""Generates the 5 Azerbaijani SAMPLE course-material PDFs into public/sample-materials/.
Requires: pip install reportlab   (uses the DejaVu Sans font, which covers ə ı ş ç ğ ö ü).
Run:      python3 scripts/generate-sample-pdfs.py
"""
import os, sys
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                KeepTogether, PageBreak, Preformatted)

FONT_DIRS = ['/usr/share/fonts/truetype/dejavu', '/usr/share/fonts/dejavu', '/Library/Fonts', os.path.expanduser('~/.fonts'), 'C:/Windows/Fonts']
def font(name):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p): return p
    sys.exit(f'Font {name} not found. Install DejaVu fonts (fonts-dejavu-core) and retry.')
pdfmetrics.registerFont(TTFont('DV', font('DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DV-B', font('DejaVuSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('DV-I', font('DejaVuSans-Oblique.ttf')))
pdfmetrics.registerFont(TTFont('DV-M', font('DejaVuSansMono.ttf')))
pdfmetrics.registerFontFamily('DV', normal='DV', bold='DV-B', italic='DV-I', boldItalic='DV-B')

NAVY, BLUE, GRAY, LBLUE, LINE, TEXT = colors.HexColor('#142B49'), colors.HexColor('#24466B'), colors.HexColor('#F1F4F8'), colors.HexColor('#DCE7F2'), colors.HexColor('#C9D3E0'), colors.HexColor('#263445')
W, H = A4
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sample-materials')
os.makedirs(OUT, exist_ok=True)

S = {
 'body': ParagraphStyle('body', fontName='DV', fontSize=10, leading=15.5, textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=6),
 'h1': ParagraphStyle('h1', fontName='DV-B', fontSize=13.5, leading=18, textColor=NAVY, spaceBefore=14, spaceAfter=6, keepWithNext=1),
 'h2': ParagraphStyle('h2', fontName='DV-B', fontSize=11, leading=15, textColor=BLUE, spaceBefore=9, spaceAfter=4, keepWithNext=1),
 'li': ParagraphStyle('li', fontName='DV', fontSize=10, leading=15, textColor=TEXT, leftIndent=16, bulletIndent=4, spaceAfter=2.5, alignment=TA_LEFT),
 'cell': ParagraphStyle('cell', fontName='DV', fontSize=9, leading=12.5, textColor=TEXT, alignment=TA_LEFT),
 'cellb': ParagraphStyle('cellb', fontName='DV-B', fontSize=9, leading=12.5, textColor=colors.white, alignment=TA_LEFT),
 'title': ParagraphStyle('title', fontName='DV-B', fontSize=21, leading=27, textColor=NAVY, spaceAfter=4),
 'sub': ParagraphStyle('sub', fontName='DV', fontSize=11.5, leading=16, textColor=BLUE, spaceAfter=10),
 'note': ParagraphStyle('note', fontName='DV', fontSize=9, leading=13, textColor=NAVY),
 'code': ParagraphStyle('code', fontName='DV-M', fontSize=8.6, leading=12, textColor=colors.HexColor('#142B49')),
}
P = lambda t, s='body': Paragraph(t, S[s])
def bullets(items): return [Paragraph(i, S['li'], bulletText='•') for i in items]
def numbered(items): return [Paragraph(i, S['li'], bulletText=f'{n}.') for n, i in enumerate(items, 1)]
def table(rows, widths, head=True):
    data = [[Paragraph(c, S['cellb'] if (head and r == 0) else S['cell']) for c in row] for r, row in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1 if head else 0)
    st = [('GRID', (0, 0), (-1, -1), .5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]
    if head: st += [('BACKGROUND', (0, 0), (-1, 0), NAVY)] + [('BACKGROUND', (0, i), (-1, i), GRAY) for i in range(2, len(rows), 2)]
    t.setStyle(TableStyle(st)); return t
def box(text, bg=LBLUE):
    t = Table([[Paragraph(text, S['note'])]], colWidths=[W - 40 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('BOX', (0, 0), (-1, -1), .6, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    return t
def code(txt):
    t = Table([[Preformatted(txt.strip('\n'), S['code'])]], colWidths=[W - 40 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), GRAY), ('BOX', (0, 0), (-1, -1), .6, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 9), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    return t

class Numbered(rl_canvas.Canvas):
    """Two-pass canvas: lets the footer print 'Səhifə X / Y'."""
    def __init__(self, *a, **k): super().__init__(*a, **k); self._saved = []
    def showPage(self): self._saved.append(dict(self.__dict__)); self._startPage()
    def save(self):
        n = len(self._saved)
        for st in self._saved:
            self.__dict__.update(st); self.footer(n); super().showPage()
        super().save()
    def footer(self, n):
        self.setStrokeColor(LINE); self.setLineWidth(.6); self.line(20 * mm, 17 * mm, W - 20 * mm, 17 * mm)
        self.setFont('DV', 8); self.setFillColor(colors.HexColor('#5F6F82'))
        self.drawString(20 * mm, 11.5 * mm, 'AkademAI · NÜMUNƏ MATERİAL (SAMPLE MATERIAL) · Real tədris sənədi deyil')
        self.drawRightString(W - 20 * mm, 11.5 * mm, f'Səhifə {self._pageNumber} / {n}')

def build(filename, short_title, story):
    def on_page(c, doc):
        c.saveState()
        c.setFillColor(NAVY); c.rect(0, H - 13 * mm, W, 13 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont('DV-B', 9)
        c.drawString(20 * mm, H - 8.2 * mm, 'NÜMUNƏ MATERİAL  ·  SAMPLE MATERIAL')
        c.setFont('DV', 8.5); c.drawRightString(W - 20 * mm, H - 8.2 * mm, short_title)
        c.restoreState()
    doc = BaseDocTemplate(os.path.join(OUT, filename), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=22 * mm, bottomMargin=24 * mm,
                          title=short_title, author='AkademAI (nümunə material)', subject='Verilənlər bazası sistemləri — NÜMUNƏ MATERİAL / SAMPLE MATERIAL')
    doc.addPageTemplates([PageTemplate(id='p', frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')], onPage=on_page)])
    doc.build(story, canvasmaker=Numbered)
    print('wrote', filename)

NOTICE = ('<b>NÜMUNƏ MATERİAL / SAMPLE MATERIAL.</b> Bu sənəd AkademAI platformasının funksiyalarını nümayiş etdirmək üçün hazırlanmış '
          'nümunə tədris materialıdır. Real universitet sənədi deyil və rəsmi tədris tələblərini əvəz etmir.')
def cover(title, subtitle, rows):
    return [Spacer(1, 4 * mm), P(title, 'title'), P(subtitle, 'sub'), box(NOTICE), Spacer(1, 4 * mm),
            table(rows, [48 * mm, W - 40 * mm - 48 * mm], head=False), Spacer(1, 3 * mm)]
META = lambda extra=None: [['Fənn', 'Verilənlər bazası sistemləri (DBS-301)'], ['Fakültə', 'Tətbiqi Riyaziyyat və İnformatika fakültəsi'],
    ['Kafedra', 'Kompüter elmləri kafedrası'], ['Müəllim', 'Kamran İsmayılov'], ['Qrup / tədris ili', 'AM-32 · 2026/2027, payız semestri']] + (extra or [])

# ---------------------------------------------------------------- 1. Syllabus
def syllabus():
    s = cover('Fənn proqramı (Sillabus)', 'Verilənlər bazası sistemləri', META([['Kredit / saat', '5 kredit · 60 saat (30 mühazirə, 15 seminar, 15 laboratoriya)']]))
    s += [P('1. Fənn haqqında', 'h1'),
      P('Fənn verilənlərin saxlanması, təşkili və emalı üsullarını öyrədir. Tələbələr relyasiya modelini, SQL dilini, verilənlər bazasının layihələndirilməsini '
        'və tranzaksiyaların əsaslarını mənimsəyir. Kurs nəzəri mühazirələr, seminarlar və kompüter laboratoriyasında praktiki işlərdən ibarətdir.'),
      P('2. Fənnin məqsədi', 'h1'),
      P('Tələbələrdə informasiya sistemləri üçün verilənlər bazası layihələndirmək, onu SQL vasitəsilə idarə etmək və nəticələrin düzgünlüyünü yoxlamaq bacarığı formalaşdırmaq.'),
      P('3. Öyrənmə nəticələri', 'h1'), P('Kursu uğurla başa vuran tələbə:')]
    s += bullets(['verilənlər bazası idarəetmə sisteminin (VBİS) funksiyalarını və arxitekturasını izah edir;',
      'relyasiya modelinin əsas anlayışlarını (relyasiya, açar, bütövlük məhdudiyyətləri) düzgün tətbiq edir;',
      'konseptual modeli (ER diaqramı) qurur və onu relyasiya sxeminə çevirir;',
      'cədvəlləri 3NF-ə qədər normallaşdırır;',
      'SQL ilə cədvəl yaradır, verilənləri əlavə edir, sorğu yazır və birləşdirmələrdən istifadə edir;',
      'tranzaksiyaların ACID xassələrini izah edir və sadə hallarda onları tətbiq edir.'])
    s += [P('4. İlkin biliklər', 'h1'), P('Diskret riyaziyyatın əsasları (çoxluqlar, məntiq), proqramlaşdırmanın əsasları. Əvvəlcədən verilənlər bazası biliyi tələb olunmur.'),
      P('5. Həftəlik tədris planı', 'h1')]
    plan = [['Həftə', 'Mövzu', 'Forma'], ['1', 'Giriş: verilənlər, VBİS, əsas anlayışlar', 'Mühazirə 1'], ['2', 'Verilənlər modelləri və VB arxitekturası', 'Mühazirə 2'],
      ['3', 'Relyasiya modeli, açarlar, bütövlük', 'Mühazirə 3 · Seminar'], ['4', 'Relyasiya cəbri', 'Mühazirə 4 · Seminar'], ['5', 'ER modeli və konseptual layihələndirmə', 'Mühazirə 5 · Lab 1'],
      ['6', 'SQL: DDL — cədvəllərin yaradılması', 'Lab 2'], ['7', 'SQL: DML — əlavə etmə, yeniləmə, silmə', 'Lab 3'], ['8', 'Kollokvium (1-ci mərhələ)', 'Yazılı + praktik'],
      ['9', 'SQL: SELECT, filtrləmə, çeşidləmə', 'Mühazirə 6 · Lab 4'], ['10', 'SQL: birləşmələr və alt sorğular', 'Lab 5'], ['11', 'Qruplaşdırma və aqreqat funksiyalar', 'Lab 6'],
      ['12', 'Normallaşdırma (1NF–BCNF)', 'Mühazirə 7 · Seminar'], ['13', 'İndekslər və sorğuların sürətləndirilməsi', 'Mühazirə 8'], ['14', 'Tranzaksiyalar və ACID', 'Mühazirə 9 · Lab 7'],
      ['15', 'Təkrar və imtahana hazırlıq', 'Seminar']]
    s.append(table(plan, [16 * mm, 106 * mm, W - 40 * mm - 122 * mm]))
    s += [P('6. Qiymətləndirmə', 'h1'), table([['Komponent', 'Bal', 'Qeyd'], ['Davamiyyət', '10', 'Mühazirə və seminarlarda iştirak'], ['Kollokvium', '20', '8-ci həftə'],
      ['Laboratoriya işləri', '15', '7 iş, hər biri müdafiə ilə'], ['Sərbəst iş', '5', 'Verilənlər bazası layihəsi'], ['Semestr ərzində cəmi', '50', ''], ['İmtahan', '50', 'Yazılı və praktik hissə'], ['Yekun', '100', '']],
      [52 * mm, 20 * mm, W - 40 * mm - 72 * mm]),
      P('7. Ədəbiyyat', 'h1')]
    s += numbered(['C. J. Date. <i>An Introduction to Database Systems</i>. Pearson.', 'A. Silberschatz, H. Korth, S. Sudarshan. <i>Database System Concepts</i>. McGraw-Hill.',
      'R. Elmasri, S. Navathe. <i>Fundamentals of Database Systems</i>. Pearson.', 'Kursun mühazirə slaydları və laboratoriya tapşırıqları AkademAI platformasının «Dərs Materialları» bölməsində yerləşdirilir.'])
    s += [P('8. Akademik qaydalar', 'h1')]
    s += bullets(['Davamiyyət ümumi dərs saatlarının ən azı 75%-i həcmində tələb olunur.', 'Laboratoriya işləri vaxtında təhvil verilməlidir; gecikmə bal itkisinə səbəb ola bilər.',
      'Başqasının işini öz işi kimi təqdim etmək akademik dürüstlüyün pozulmasıdır.', 'Suallar üçün müəllimlə dərsdən sonra və ya platforma vasitəsilə əlaqə saxlanılır.'])
    build('01-fenn-proqrami-sillabus.pdf', 'Fənn proqramı (Sillabus)', s)

# ---------------------------------------------------------------- 2. Lecture 1
def lecture1():
    s = cover('Mühazirə 1 — Giriş və əsas anlayışlar', 'Verilənlər bazası sistemləri', META([['Mühazirə', '1 / 9 · həftə 1']]))
    s += [P('1.1. Məlumat, informasiya və bilik', 'h1'),
      P('<b>Verilən</b> (məlumat) real dünyanın obyektləri və hadisələri haqqında qeydə alınmış xam faktlardır, məsələn, «Aysel», «19», «AM-32». Verilən kontekstdə şərh olunduqda '
        '<b>informasiya</b>, informasiya təcrübə ilə birləşdikdə isə <b>bilik</b> yaranır. Verilənlər bazasının vəzifəsi verilənləri etibarlı, əlçatan və ardıcıl saxlamaqdır.'),
      P('1.2. Fayl sistemlərinin çatışmazlıqları', 'h1'),
      P('Verilənlər bazaları yaranmazdan əvvəl hər proqram öz fayllarından istifadə edirdi. Bu yanaşma bir sıra problemlər doğururdu:')]
    s += bullets(['<b>Təkrarlanma və uyğunsuzluq:</b> eyni məlumat müxtəlif fayllarda saxlanılır və bir yerdə dəyişdirildikdə digərində köhnə qalır;',
      '<b>Proqramdan asılılıq:</b> faylın formatı dəyişdikdə bütün proqramlar yenidən yazılmalı olur;', '<b>Eyni vaxtda istifadənin çətinliyi:</b> bir neçə istifadəçinin eyni fayla yazması itkilərə gətirib çıxarır;',
      '<b>Təhlükəsizliyin zəifliyi:</b> hüquqların ayrı-ayrı verilənlər üzrə idarə edilməsi çətindir;', '<b>Ehtiyat nüsxə və bərpa:</b> sistem sıradan çıxdıqda ardıcıl vəziyyəti bərpa etmək mümkün olmur.'])
    s += [P('1.3. Verilənlər bazası və VBİS', 'h1'),
      P('<b>Verilənlər bazası (VB)</b> — müəyyən predmet sahəsini təsvir edən, məntiqi əlaqəli və birgə istifadə üçün nəzərdə tutulmuş verilənlər toplusudur. '
        '<b>Verilənlər bazası idarəetmə sistemi (VBİS)</b> isə VB-ni yaratmaq, saxlamaq və ona müraciəti idarə etmək üçün proqram təminatıdır (məsələn, PostgreSQL, MySQL, SQLite, Oracle).'),
      P('VBİS-in əsas funksiyaları:', 'h2')]
    s += bullets(['verilənlərin təsvirini (sxemi) və saxlanmasını təmin etmək;', 'sorğular vasitəsilə verilənləri oxumaq və dəyişdirmək;', 'bütövlük məhdudiyyətlərinin yoxlanmasını təmin etmək;',
      'istifadəçilərin hüquqlarını idarə etmək (təhlükəsizlik);', 'paralel müraciətləri və tranzaksiyaları idarə etmək;', 'ehtiyat nüsxə və bərpa mexanizmlərini təmin etmək.'])
    s += [P('1.4. Üç səviyyəli arxitektura', 'h1'),
      P('ANSI/SPARC arxitekturası verilənlərə baxışı üç səviyyəyə ayırır. Bu bölgü verilənlərin <b>müstəqilliyini</b> təmin edir: bir səviyyədə edilən dəyişiklik digərlərinə minimal təsir göstərir.'),
      table([['Səviyyə', 'Təsvir', 'Kim üçün?'], ['Xarici (istifadəçi)', 'Hər istifadəçi qrupunun gördüyü verilənlər hissəsi (görünüşlər)', 'Tətbiqi proqramçı, son istifadəçi'],
             ['Konseptual (məntiqi)', 'Bütün VB-nin məntiqi quruluşu: cədvəllər, əlaqələr, məhdudiyyətlər', 'VB administratoru, layihəçi'], ['Daxili (fiziki)', 'Verilənlərin diskdə saxlanma qaydası, indekslər', 'Sistem mühəndisi, VBİS']],
             [38 * mm, 82 * mm, W - 40 * mm - 120 * mm]),
      Spacer(1, 3 * mm), P('1.5. Verilənlər modelləri', 'h1'),
      P('Verilənlər modeli verilənlərin necə təsvir olunacağını, əlaqələndiriləcəyini və emal olunacağını müəyyən edir. Ən çox rast gəlinən modellər:')]
    s += bullets(['<b>İyerarxik və şəbəkə modelləri</b> — tarixi əhəmiyyətə malikdir, ağac və ya qraf quruluşuna əsaslanır;', '<b>Relyasiya modeli</b> — verilənlər cədvəllər (relyasiyalar) şəklində təsvir olunur; bu gün ən geniş yayılmış modeldir;',
      '<b>Sənəd yönümlü model</b> (məsələn, JSON sənədləri) — çevik sxem tələb edən tətbiqlərdə istifadə olunur;', '<b>Açar–qiymət</b> və <b>qraf</b> modelləri — xüsusi yük və sorğu növləri üçün.'])
    s += [P('1.6. Əsas terminlər', 'h1'),
      table([['Termin', 'Mənası', 'Nümunə'], ['Cədvəl (relyasiya)', 'Eyni quruluşlu qeydlər toplusu', 'Telebe'], ['Sətir (kortej)', 'Bir obyekt haqqında tam qeyd', 'Bir tələbənin məlumatları'],
             ['Sütun (atribut)', 'Obyektin xassəsi', 'ad, qrup, dogum_ili'], ['İlkin açar', 'Sətri birmənalı müəyyən edən atribut', 'telebe_id'], ['Xarici açar', 'Başqa cədvəlin ilkin açarına istinad', 'Icare.telebe_id'],
             ['Sxem', 'VB-nin quruluşunun təsviri', 'Cədvəllər və əlaqələr']], [36 * mm, 80 * mm, W - 40 * mm - 116 * mm]),
      Spacer(1, 3 * mm), P('1.7. VB ilə işləyən şəxslər', 'h1')]
    s += bullets(['<b>VB administratoru</b> — təhlükəsizlik, performans, ehtiyat nüsxə;', '<b>VB layihəçisi</b> — verilənlərin quruluşunu layihələndirir;', '<b>Tətbiqi proqramçı</b> — VB ilə işləyən proqramlar yazır;', '<b>Son istifadəçi</b> — hazır tətbiq vasitəsilə verilənlərlə işləyir.'])
    s += [box('<b>Əsas fikir.</b> Verilənlər bazası sadəcə fayl toplusu deyil: ardıcıllığı, təhlükəsizliyi və paralel istifadəni təmin edən idarəetmə sistemi ilə birlikdə işləyən təşkil olunmuş verilənlər toplusudur.'),
      P('Nəzarət sualları', 'h1')]
    s += numbered(['Verilən, informasiya və bilik anlayışları arasındakı fərq nədir?', 'Fayl sistemlərinin üç əsas çatışmazlığını göstərin.', 'VBİS-in hansı funksiyalarını bilirsiniz?',
      'Üç səviyyəli arxitekturada «verilənlərin müstəqilliyi» nə deməkdir?', 'İlkin açarla xarici açar arasındakı fərqi izah edin.'])
    build('02-muhazire-1-giris-ve-esas-anlayislar.pdf', 'Mühazirə 1 — Giriş və əsas anlayışlar', s)

# ---------------------------------------------------------------- 3. Lecture 2
def lecture2():
    s = cover('Mühazirə 2 — Nəzəri materiallar', 'Relyasiya modeli, relyasiya cəbri, ER modeli və normallaşdırma', META([['Mühazirə', '2 / 9 · həftə 3–5']]))
    s += [P('2.1. Relyasiya modeli', 'h1'),
      P('Relyasiya modeli 1970-ci ildə E. Codd tərəfindən təklif olunmuşdur. Burada verilənlər <b>relyasiyalar</b> şəklində təsvir olunur. Relyasiya sütunları (atributları) və sətirləri (kortejləri) olan cədvəl kimi təsəvvür edilə bilər, lakin '
        'cədvəldən fərqli olaraq sətirlərin sırası əhəmiyyət daşımır və təkrarlanan sətir ola bilməz.'),
      P('Relyasiya sxemi <b>R(A<sub>1</sub>, A<sub>2</sub>, …, A<sub>n</sub>)</b> kimi yazılır; hər atributun bir <b>domeni</b> (icazə verilən qiymətlər çoxluğu) var. Məsələn: <b>Telebe(telebe_id, ad, soyad, qrup)</b>.'),
      P('2.2. Açarlar', 'h1')]
    s += bullets(['<b>Super açar</b> — sətri birmənalı müəyyən edən atributlar çoxluğu;', '<b>Namizəd açar</b> — minimal super açar (artıq atribut yoxdur);', '<b>İlkin açar</b> — namizəd açarlardan biri, VB-də əsas identifikator kimi seçilir və NULL ola bilməz;',
      '<b>Xarici açar</b> — başqa relyasiyanın ilkin açarına istinad edən atribut, cədvəllər arasında əlaqə yaradır.'])
    s += [P('2.3. Bütövlük məhdudiyyətləri', 'h1')]
    s += bullets(['<b>Varlıq bütövlüyü:</b> ilkin açar NULL ola bilməz və təkrarlanmamalıdır;', '<b>İstinad bütövlüyü:</b> xarici açarın qiyməti ya NULL, ya da istinad olunan cədvəldə mövcud olan açar olmalıdır;',
      '<b>Domen bütövlüyü:</b> atributun qiyməti öz domeninə uyğun olmalıdır (məsələn, qiymət 0–100 arasında).'])
    s += [P('2.4. Relyasiya cəbri', 'h1'), P('Relyasiya cəbri relyasiyalar üzərində əməliyyatlar toplusudur; hər əməliyyatın nəticəsi yenə relyasiya olur. SQL-in nəzəri əsasını bu cəbr təşkil edir.'),
      table([['Əməliyyat', 'Yazılışı', 'Mənası'], ['Seçmə', 'σ<sub>şərt</sub>(R)', 'Şərti ödəyən sətirləri seçir'], ['Proyeksiya', 'π<sub>A1,A2</sub>(R)', 'Yalnız göstərilən sütunları saxlayır'],
             ['Birləşmə (çoxluq)', 'R ∪ S', 'İki uyğun relyasiyanın sətirlərini birləşdirir'], ['Kəsişmə', 'R ∩ S', 'Hər iki relyasiyada olan sətirlər'], ['Fərq', 'R − S', 'R-də olub S-də olmayan sətirlər'],
             ['Dekart hasili', 'R × S', 'Bütün sətir cütlərinin kombinasiyası'], ['Təbii birləşdirmə', 'R ⋈ S', 'Ortaq atributlar üzrə bərabər sətirləri birləşdirir']], [38 * mm, 40 * mm, W - 40 * mm - 78 * mm]),
      Spacer(1, 3 * mm),
      P('<b>Nümunə.</b> «AM-32 qrupunun tələbələrinin adlarını tap» sorğusu relyasiya cəbrində π<sub>ad</sub>(σ<sub>qrup=\'AM-32\'</sub>(Telebe)) kimi yazılır. SQL-də isə:'),
      code("SELECT ad FROM Telebe WHERE qrup = 'AM-32';"), Spacer(1, 3 * mm),
      P('2.5. ER (Varlıq–Əlaqə) modeli', 'h1'),
      P('ER modeli konseptual layihələndirmə üçün istifadə olunur. Əsas elementlər: <b>varlıq</b> (məsələn, Telebe, Fenn), <b>atribut</b> (varlığın xassəsi) və <b>əlaqə</b> (varlıqlar arasındakı rabitə, məsələn, «Telebe fənni seçir»). '
        'Əlaqənin <b>kardinallığı</b> iki varlığın necə uyğunlaşdığını göstərir:')]
    s += bullets(['<b>1:1</b> — bir sətir digər cədvəlin ən çoxu bir sətri ilə əlaqəlidir;', '<b>1:N</b> — bir qrupda çox tələbə (xarici açar «çox» tərəfdə yerləşir);', '<b>M:N</b> — tələbə və fənn: relyasiya sxemində ayrıca <i>əlaqə cədvəli</i> (məsələn, Qeydiyyat) yaradılır.'])
    s += [P('2.6. Normallaşdırma', 'h1'),
      P('Normallaşdırma cədvəllərdəki təkrarlanmanı azaltmaq və <b>anomaliyaların</b> (əlavə etmə, yeniləmə, silmə anomaliyaları) qarşısını almaq üçün cədvəlləri daha kiçik cədvəllərə bölmək prosesidir. '
        'Aşağıdakı nümunə cədvəldə tələbə, fənn və müəllim məlumatları bir yerdə saxlanılır:'),
      table([['telebe_id', 'telebe_adi', 'fenn_kodu', 'fenn_adi', 'muellim'], ['1', 'Turan', 'DBS-301', 'Verilənlər bazası', 'K. İsmayılov'], ['1', 'Turan', 'MAT-101', 'Riyazi analiz', 'N. Məmmədova'], ['2', 'Leyla', 'DBS-301', 'Verilənlər bazası', 'K. İsmayılov']],
            [22 * mm, 30 * mm, 28 * mm, 50 * mm, W - 40 * mm - 130 * mm]), Spacer(1, 3 * mm),
      P('Burada «Verilənlər bazası» fənninin adı və müəllimi hər qeydiyyatda təkrarlanır: fənnin müəllimini dəyişsək, bir neçə sətri yeniləməliyik (<i>yeniləmə anomaliyası</i>).')]
    s += [table([['Normal forma', 'Tələb', 'Nə həll edir?'], ['1NF', 'Hər atribut bölünməz (atomar) qiymət saxlayır, təkrarlanan qruplar yoxdur', 'Çoxqiymətli xanalar'],
             ['2NF', '1NF + hər açar olmayan atribut açarın <i>hamısından</i> asılıdır (qismən asılılıq yoxdur)', 'Mürəkkəb açarda qismən asılılıq'],
             ['3NF', '2NF + açar olmayan atributlar bir-birindən asılı deyil (tranzitiv asılılıq yoxdur)', 'Tranzitiv asılılıq'], ['BCNF', 'Hər funksional asılılığın sol tərəfi super açardır', '3NF-in qalıq hallarını']],
            [26 * mm, 100 * mm, W - 40 * mm - 126 * mm]), Spacer(1, 3 * mm),
      P('Yuxarıdakı nümunədə cədvəl üç cədvələ bölünür: <b>Telebe(telebe_id, telebe_adi)</b>, <b>Fenn(fenn_kodu, fenn_adi, muellim)</b> və <b>Qeydiyyat(telebe_id, fenn_kodu)</b>.'),
      P('2.7. Tranzaksiyalar və ACID', 'h1'),
      P('<b>Tranzaksiya</b> — bir məntiqi vahid kimi icra olunan əməliyyatlar ardıcıllığıdır (məsələn, bir hesabdan digərinə pul köçürmə). Etibarlı tranzaksiya ACID xassələrini ödəməlidir:')]
    s += bullets(['<b>Atomarlıq (Atomicity):</b> ya bütün əməliyyatlar icra olunur, ya heç biri;', '<b>Ardıcıllıq (Consistency):</b> tranzaksiya VB-ni bir ardıcıl vəziyyətdən digərinə keçirir;',
      '<b>İzolyasiya (Isolation):</b> paralel tranzaksiyalar bir-birinin aralıq nəticələrini görmür;', '<b>Davamlılıq (Durability):</b> təsdiqlənmiş dəyişikliklər sistem sıradan çıxsa belə itmir.'])
    s += [code("BEGIN;\nUPDATE hesab SET qaliq = qaliq - 100 WHERE id = 1;\nUPDATE hesab SET qaliq = qaliq + 100 WHERE id = 2;\nCOMMIT;   -- xəta olsa: ROLLBACK;"), Spacer(1, 3 * mm), P('Nəzarət sualları', 'h1')]
    s += numbered(['Super açar, namizəd açar və ilkin açar arasındakı fərqi izah edin.', 'İstinad bütövlüyü nə deməkdir? Nümunə göstərin.', 'π<sub>ad</sub>(σ<sub>il&gt;2000</sub>(Kitab)) ifadəsinin SQL ekvivalentini yazın.',
      'M:N əlaqəsi relyasiya sxemində necə təsvir olunur?', '2NF ilə 3NF arasındakı əsas fərq nədir?', 'ACID xassələrini sadalayın və hər birini bir cümlə ilə izah edin.'])
    build('03-muhazire-2-nezeri-materiallar.pdf', 'Mühazirə 2 — Nəzəri materiallar', s)

# ---------------------------------------------------------------- 4. Seminar
def seminar():
    s = cover('Seminar və praktiki məşğələlər', 'SQL və verilənlər bazasının layihələndirilməsi üzrə tapşırıqlar', META([['Seminar', '1–3 · həftə 3–12'], ['Müddət', '90 dəqiqə (hər məşğələ)']]))
    s += [P('Situasiya: universitet kitabxanası', 'h1'),
      P('Universitet kitabxanasının kitab verilişini izləyən verilənlər bazası layihələndirilir. Sxem üç cədvəldən ibarətdir (SQL identifikatorları portativlik üçün ASCII hərflərlə yazılmışdır):'),
      table([['Cədvəl', 'Sütunlar'], ['Kitab', 'kitab_id (ilkin açar), ad, muellif, il, nesriyyat'], ['Oxucu', 'oxucu_id (ilkin açar), ad, soyad, qrup'],
             ['Icare', 'icare_id (ilkin açar), oxucu_id (xarici açar), kitab_id (xarici açar), verilme_tarixi, qaytarma_tarixi']], [28 * mm, W - 40 * mm - 28 * mm]),
      Spacer(1, 3 * mm), P('Tapşırıq 1. Cədvəllərin yaradılması', 'h1'),
      P('Üç cədvəli ilkin və xarici açarlarla yaradın. <i>Kitab.il</i> üçün 1900-dən böyük olma şərtini (CHECK) əlavə edin. Gözlənilən həll:'),
      code("""CREATE TABLE Kitab (
  kitab_id   INTEGER PRIMARY KEY,
  ad         VARCHAR(200) NOT NULL,
  muellif    VARCHAR(120) NOT NULL,
  il         INTEGER CHECK (il > 1900),
  nesriyyat  VARCHAR(120)
);
CREATE TABLE Oxucu (
  oxucu_id   INTEGER PRIMARY KEY,
  ad         VARCHAR(60) NOT NULL,
  soyad      VARCHAR(60) NOT NULL,
  qrup       VARCHAR(20)
);
CREATE TABLE Icare (
  icare_id        INTEGER PRIMARY KEY,
  oxucu_id        INTEGER NOT NULL REFERENCES Oxucu(oxucu_id),
  kitab_id        INTEGER NOT NULL REFERENCES Kitab(kitab_id),
  verilme_tarixi  DATE NOT NULL,
  qaytarma_tarixi DATE
);"""), Spacer(1, 3 * mm),
      P('Tapşırıq 2. Verilənlərin əlavə edilməsi', 'h1'), P('Hər cədvələ ən azı 4 sətir əlavə edin. Bir «Icare» sətrinin qaytarma tarixini boş (NULL) saxlayın. Sonra mövcud olmayan <i>kitab_id</i> ilə əlavə etməyə çalışın və xətanın səbəbini izah edin (istinad bütövlüyü).'),
      code("INSERT INTO Oxucu VALUES (1, 'Turan', 'Qəhrəmanov', 'AM-32');\nINSERT INTO Kitab  VALUES (10, 'Database System Concepts', 'Silberschatz', 2019, 'McGraw-Hill');\nINSERT INTO Icare  VALUES (100, 1, 10, '2026-11-02', NULL);"),
      Spacer(1, 3 * mm), P('Tapşırıq 3. SELECT sorğuları', 'h1'), P('Aşağıdakı sorğuları yazın:')]
    s += numbered(['2015-ci ildən sonra nəşr olunmuş bütün kitabların adları (il üzrə azalan sıra ilə);', 'AM-32 qrupunun oxucularının ad və soyadları;', 'Hələ qaytarılmamış kitabların siyahısı (qaytarma_tarixi IS NULL);',
      'Müəllifi «Date» sözü ilə başlayan kitablar (LIKE);', 'Kitabxanada olan kitabların ümumi sayı (COUNT).'])
    s += [P('Tapşırıq 4. Birləşmələr və qruplaşdırma', 'h1'), P('a) Hər icarə üçün oxucunun soyadını və kitabın adını göstərin. b) Hər oxucunun götürdüyü kitabların sayını tapın və 2-dən çox kitab götürənləri seçin. Nümunə həll (b):'),
      code("""SELECT o.soyad, COUNT(*) AS kitab_sayi
FROM Oxucu o
JOIN Icare i ON i.oxucu_id = o.oxucu_id
GROUP BY o.oxucu_id, o.soyad
HAVING COUNT(*) > 2
ORDER BY kitab_sayi DESC;"""), Spacer(1, 3 * mm),
      P('Tapşırıq 5. Normallaşdırma', 'h1'), P('Aşağıdakı cədvəlin hansı normal formada olduğunu müəyyən edin və 3NF-ə gətirin:'),
      table([['icare_id', 'oxucu_adi', 'oxucu_qrupu', 'kitablar'], ['1', 'Turan', 'AM-32', 'DBS, Riyazi analiz'], ['2', 'Leyla', 'AM-31', 'Fizika']], [24 * mm, 36 * mm, 36 * mm, W - 40 * mm - 96 * mm]),
      Spacer(1, 2 * mm), P('<i>İpucu:</i> «kitablar» sütununda çoxqiymətli xana var (1NF pozulur); həmçinin oxucu_qrupu oxucudan asılıdır.'),
      P('Tapşırıq 6. ER diaqramı', 'h1'),
      P('Universitetdə tələbələr fənləri seçir, hər fənni bir müəllim tədris edir. ER diaqramını çəkin, əlaqələrin kardinallığını göstərin və relyasiya sxeminə çevirin. M:N əlaqəsi üçün əlaqə cədvəlini ayrıca göstərin.'),
      P('Qiymətləndirmə meyarları', 'h1'),
      table([['Tapşırıq', 'Maksimum bal', 'Meyar'], ['1–2', '3', 'Düzgün sintaksis, açarlar və məhdudiyyətlər'], ['3', '3', 'Hər sorğu düzgün nəticə verir'], ['4', '2', 'Birləşmə və qruplaşdırmanın düzgün tətbiqi'], ['5–6', '2', 'Əsaslandırılmış normallaşdırma və diaqram'], ['Cəmi', '10', '']],
            [30 * mm, 36 * mm, W - 40 * mm - 66 * mm]),
      Spacer(1, 3 * mm), box('<b>Təhvil vermə.</b> Həlləri .sql faylı və ya PDF şəklində AkademAI platformasında müvafiq tapşırığa yükləyin. Sorğuları öz verilənləriniz üzərində işlətdiyinizə əmin olun.')]
    build('04-seminar-ve-praktiki-meshgeleler.pdf', 'Seminar və praktiki məşğələlər', s)

# ---------------------------------------------------------------- 5. Midterm prep
def midterm():
    s = cover('Kollokvium hazırlıq materialları', 'Verilənlər bazası sistemləri — 1-ci kollokvium', META([['Kollokvium', '8-ci həftə · 20 bal · 90 dəqiqə']]))
    s += [P('1. Kollokviumun formatı', 'h1'),
      table([['Hissə', 'Tapşırıqlar', 'Bal'], ['A. Test', '10 sual (hər biri 1 bal, bir düzgün cavab)', '10'], ['B. Qısa cavab', '3 sual (nəzəri izah)', '6'], ['C. Praktik', '1 SQL tapşırığı', '4']], [40 * mm, 100 * mm, W - 40 * mm - 140 * mm]),
      P('2. Əhatə olunan mövzular', 'h1')]
    s += bullets(['Mühazirə 1: verilənlər, VBİS, üç səviyyəli arxitektura, verilənlər modelləri;', 'Mühazirə 2: relyasiya modeli, açarlar, bütövlük məhdudiyyətləri;', 'Mühazirə 3–4: relyasiya cəbri, ER modeli;', 'Seminar 1–2: CREATE TABLE, INSERT, sadə SELECT.'])
    s += [P('3. Qısa xülasə', 'h1'),
      table([['Anlayış', 'Yadda saxla'], ['İlkin açar', 'Unikal və NULL olmayan; hər cədvəldə yalnız bir dənə'], ['Xarici açar', 'Başqa cədvəlin açarına istinad; istinad bütövlüyünü təmin edir'], ['σ və π', 'σ — sətirləri seçir (WHERE), π — sütunları seçir (SELECT siyahısı)'],
             ['1:N əlaqə', 'Xarici açar «çox» tərəfdəki cədvəldə yerləşir'], ['M:N əlaqə', 'Əlaqə cədvəli lazımdır, iki xarici açardan ibarət'], ['DDL / DML', 'DDL: CREATE, ALTER, DROP · DML: INSERT, UPDATE, DELETE, SELECT']], [36 * mm, W - 40 * mm - 36 * mm]),
      Spacer(1, 3 * mm), P('4. Nümunə test sualları', 'h1')]
    qs = [('Aşağıdakılardan hansı VBİS-in funksiyası deyil?', ['A) Təhlükəsizliyin idarə edilməsi', 'B) Tranzaksiyaların idarə edilməsi', 'C) Kompüterin operativ yaddaşının istehsalı', 'D) Ehtiyat nüsxə və bərpa']),
          ('Üç səviyyəli arxitekturada verilənlərin diskdə saxlanmasını hansı səviyyə təsvir edir?', ['A) Xarici', 'B) Konseptual', 'C) Daxili', 'D) Məntiqi']),
          ('İlkin açar haqqında hansı fikir doğrudur?', ['A) NULL ola bilər', 'B) Təkrarlana bilər', 'C) Sətri birmənalı müəyyən edir', 'D) Hər cədvəldə bir neçə ilkin açar olur']),
          ('Xarici açar nə üçündür?', ['A) Sütunu şifrələmək', 'B) Cədvəllər arasında əlaqə yaratmaq', 'C) Sətirləri çeşidləmək', 'D) Cədvəlin adını dəyişmək']),
          ('σ<sub>il&gt;2000</sub>(Kitab) əməliyyatı nəyi qaytarır?', ['A) Yalnız il sütununu', 'B) 2000-ci ildən sonrakı kitab sətirlərini', 'C) Bütün kitabların sayını', 'D) Kitab cədvəlini silir']),
          ('M:N əlaqəsi relyasiya sxemində necə təsvir olunur?', ['A) Bir sütun əlavə etməklə', 'B) Əlaqə cədvəli yaratmaqla', 'C) İki cədvəli birləşdirərək', 'D) Təsvir olunmur']),
          ('Hansı SQL əmri cədvəl yaradır?', ['A) INSERT', 'B) SELECT', 'C) CREATE TABLE', 'D) UPDATE']),
          ('İstinad bütövlüyünü hansı hal pozur?', ['A) Mövcud olmayan kitab_id ilə icarə sətri əlavə etmək', 'B) Yeni kitab əlavə etmək', 'C) Sütunun adını oxumaq', 'D) Cədvəli çeşidləmək']),
          ('Aşağıdakılardan hansı sətirləri filtrləyir?', ['A) ORDER BY', 'B) WHERE', 'C) GROUP BY', 'D) CREATE']),
          ('Relyasiyada sətirlərin sırası…', ['A) vacibdir', 'B) əhəmiyyət daşımır', 'C) yalnız indeksdə vacibdir', 'D) əlifba sırası ilə olmalıdır'])]
    for i, (q, opts) in enumerate(qs, 1):
        s.append(KeepTogether([P(f'<b>{i}.</b> {q}', 'li')] + [Paragraph(o, ParagraphStyle('o', parent=S['li'], leftIndent=30), ) for o in opts]))
    s += [P('Düzgün cavablar', 'h2'), P('1-C · 2-C · 3-C · 4-B · 5-B · 6-B · 7-C · 8-A · 9-B · 10-B'),
      P('5. Nümunə açıq suallar', 'h1')]
    s += numbered(['Fayl sistemləri ilə müqayisədə verilənlər bazalarının üstünlüklərini izah edin.', 'Varlıq bütövlüyü ilə istinad bütövlüyü arasındakı fərqi nümunə ilə göstərin.', 'ER modelində 1:N və M:N əlaqələrinin relyasiya sxeminə çevrilməsini izah edin.'])
    s += [P('6. Nümunə praktik tapşırıq', 'h1'), P('Cədvəl: <b>Telebe(telebe_id, ad, soyad, qrup, bal)</b>. Yazın: AM-32 qrupunda balı 70-dən yuxarı olan tələbələrin soyadını və balını bal üzrə azalan sıra ilə çıxaran sorğu.'),
      code("SELECT soyad, bal\nFROM Telebe\nWHERE qrup = 'AM-32' AND bal > 70\nORDER BY bal DESC;"), Spacer(1, 3 * mm),
      P('7. Yeddi günlük hazırlıq planı', 'h1'),
      table([['Gün', 'Fəaliyyət'], ['1–2', 'Mühazirə 1–2 konspektlərini oxu, əsas terminləri öz sözlərinlə yaz'], ['3', 'Relyasiya cəbri nümunələrini həll et, hər ifadənin SQL-ini yaz'], ['4', 'ER diaqramı çək və relyasiya sxeminə çevir'],
             ['5', 'Seminar tapşırıqlarını yenidən, baxmadan həll et'], ['6', 'Nümunə testi 25 dəqiqəyə həll et, səhvləri təhlil et'], ['7', 'Yüngül təkrar, yuxu və vaxtında gəlmək']], [20 * mm, W - 40 * mm - 20 * mm]),
      P('8. Tez-tez edilən səhvlər', 'h1')]
    s += bullets(['İlkin açarla xarici açarı qarışdırmaq;', 'WHERE ilə HAVING-in fərqini unutmaq (HAVING qruplaşdırmadan sonra filtrləyir);', 'M:N əlaqəsini əlaqə cədvəli olmadan modelləşdirməyə çalışmaq;', 'NULL ilə müqayisədə «=» istifadə etmək (düzgün forma: IS NULL);', 'SELECT sorğusunda ORDER BY-ı cümlənin ortasına yazmaq.'])
    s += [Spacer(1, 3 * mm), box('<b>Uğurlar!</b> Bu sənəd nümunə materialdır: real kollokviumun sualları və qaydaları müəllim tərəfindən elan edilir.')]
    build('05-kollokvium-hazirliq-materiallari.pdf', 'Kollokvium hazırlıq materialları', s)

if __name__ == '__main__':
    syllabus(); lecture1(); lecture2(); seminar(); midterm()
