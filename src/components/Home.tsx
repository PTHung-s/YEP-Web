import React from 'react';
import { Ticket, PartyPopper, Info, Mail, MapPin, Music, Camera, GlassWater, Heart, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const timeline = [
  { time: '17:00 - 18:30', title: 'Check-in & Booth Activities', desc: 'Nhận vòng tay, tham quan gian hàng' },
  { time: '18:30 - 18:40', title: 'Opening Performance', desc: 'Tiết mục mở màn' },
  { time: '18:40 - 18:50', title: 'Opening Remarks', desc: 'Phát biểu khai mạc' },
  { time: '18:45 - 19:05', title: 'Club Awards Ceremony', desc: 'Vinh danh các CLB xuất sắc' },
  { time: '19:05 - 19:15', title: 'Club Performance #2', desc: 'Tiết mục biểu diễn CLB' },
  { time: '19:15 - 19:25', title: 'Artist Performance #1', desc: 'Nghệ sĩ khách mời' },
  { time: '19:20 - 19:30', title: 'Debut: Student Council Gen 6.0', desc: 'Ra mắt Hội đồng Sinh viên nhiệm kỳ mới' },
  { time: '19:30 - 19:45', title: 'YEP ICONS: Introduction & Runway Walk', desc: 'Giới thiệu Top cặp đôi' },
  { time: '19:45 - 20:05', title: 'Club Performance #3', desc: 'Tiết mục biểu diễn CLB' },
  { time: '20:05 - 20:25', title: 'Talent Showcase & Q&A', desc: 'Phần thi tài năng' },
  { time: '20:25 - 20:45', title: 'Artist Performance #2', desc: 'Nghệ sĩ khách mời' },
  { time: '20:45 - 21:15', title: 'Final Scoring & Winner Announcement', desc: 'Công bố YEP ICONS 2026' },
  { time: '21:15 - 21:30', title: 'Closing Remarks', desc: 'Bế mạc chương trình' },
  { time: '21:30 - 21:45', title: 'DJ Session & Late-night Drinks', desc: 'After-party' },
];

const faqs = [
  { q: 'Dresscode là gì?', a: 'Theme Gardenia — dresscode mùa hè. Hãy diện trang phục rực rỡ, thoải mái và đầy sắc màu như khu vườn đang nở rộ.' },
  { q: 'Có cần mang thẻ sinh viên không?', a: 'Có, vui lòng mang thẻ sinh viên để check-in tại cổng.' },
  { q: 'Check-in muộn có được không?', a: 'Flexible! Tuy nhiên BTC khuyến khích bạn đến đúng khung giờ để không bỏ lỡ các hoạt động.' },
  { q: 'Có chụp ảnh / quay phim không?', a: 'BTC có ekip ghi lại khoảnh khắc. Bạn cũng có thể tự do mang thiết bị cá nhân để chụp ảnh.' },
  { q: 'Có được dẫn người ngoài VinUni không?', a: 'Sự kiện chỉ dành cho sinh viên, giảng viên và nhân viên VinUni.' },
];

export function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center px-6 md:px-12 py-12 border-b-2 border-primary overflow-hidden bg-surface">
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full gap-8 lg:gap-12 items-center mx-auto max-w-7xl">
          <div className="lg:col-span-7 z-10 w-full relative">
            <h1 className="font-display text-6xl md:text-8xl lg:text-[9rem] font-bold leading-[0.85] tracking-tighter uppercase mb-6">
              YEP<br />
              <span className="text-secondary">2026</span>
            </h1>
            <div className="flex flex-col xl:flex-row gap-4 mt-8">
              <div className="bg-primary-container p-4 md:p-6 border-2 border-primary neo-shadow max-w-sm">
                <p className="font-display font-bold text-lg md:text-xl uppercase leading-tight">
                  The Kaleido Soul — Born to Bloom Different
                </p>
              </div>
              <div className="flex items-end mt-4 xl:mt-0 xl:ml-6">
                <span className="font-display text-2xl md:text-3xl font-bold uppercase text-tertiary tracking-tighter">
                  JUNE 27 / 2026
                </span>
              </div>
            </div>
            <p className="font-body text-sm md:text-base text-on-surface-variant max-w-lg mt-4 leading-relaxed">
              A night of blooming colors and fearless souls. Amphitheatre — VinUni Campus.
            </p>
          </div>
          <div className="lg:col-span-5 relative w-full aspect-square mt-8 lg:mt-0 max-w-sm mx-auto">
            <div className="absolute inset-0 bg-secondary border-2 border-primary translate-x-4 translate-y-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1540039155732-d6741b687f88?q=80&w=1974&auto=format&fit=crop" 
              alt="Festival Crowd" 
              className="absolute inset-0 w-full h-full object-cover border-2 border-primary grayscale hover:grayscale-0 transition-all duration-500 z-10" 
            />
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="bg-primary text-background py-3 border-b-2 border-primary overflow-hidden relative flex">
        <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">YEP 2026 × THE KALEIDO SOUL × BORN TO BLOOM DIFFERENT × YEP 2026 × THE KALEIDO SOUL × BORN TO BLOOM DIFFERENT ×</span>
        </div>
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-12 items-center py-3">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">YEP 2026 × THE KALEIDO SOUL × BORN TO BLOOM DIFFERENT × YEP 2026 × THE KALEIDO SOUL × BORN TO BLOOM DIFFERENT ×</span>
        </div>
      </div>

      {/* About / The Kaleido Soul */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// THE KALEIDO SOUL</span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">ABOUT</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4 text-on-surface-variant font-medium leading-relaxed">
            <p>
              YEP'26 lấy <strong className="text-primary">Kaleidoscope — Kính Vạn Hoa</strong> làm biểu tượng chủ đề của Year End Party 2026 với key message: <strong className="text-primary">Where Every Flower Has Its Own Land</strong>.
            </p>
            <p>
              YEP'26 tôn vinh sự độc bản và rực rỡ theo cách riêng của từng cá nhân, góp phần làm nên một VinUni thêm phần nở rộ những ngày cuối năm học. Tại The Kaleido Soul, mỗi một dấu ấn cá nhân đều được khắc họa và tôn vinh, nơi không một ai bị bỏ lại phía sau khi những ánh đèn rực rỡ phản chiếu lên tất cả loài hoa tràn ngập sắc màu.
            </p>
            <p>
              Một bữa tiệc rực rỡ sắc màu của sinh viên VinUni, của những cá nhân độc bản, của những thành tựu xuất sắc, và của tuổi trẻ đầy nhiệt huyết chính là cách chúng ta khép lại hành trình của năm học này.
            </p>
          </div>
          <div className="bg-primary-container border-2 border-primary p-6 md:p-8 neo-shadow flex flex-col justify-center">
            <p className="font-display font-black text-3xl md:text-4xl uppercase leading-tight text-center">
              "Where Every Flower Has Its Own Land"
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-background border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// EXPERIENCES</span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">D-DAY HIGHLIGHTS</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-primary">
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-5 hover:bg-primary-container transition-colors">
            <Camera className="w-8 h-8 text-tertiary mb-3" />
            <h4 className="font-display text-xl font-extrabold uppercase tracking-tight mb-2">Photo Station</h4>
            <p className="font-body text-xs text-on-surface-variant font-medium">Photobooth chụp ảnh lấy liền, dịch vụ polaroid và card holder tự decor.</p>
          </div>
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-5 hover:bg-secondary/20 transition-colors">
            <GlassWater className="w-8 h-8 text-secondary mb-3" />
            <h4 className="font-display text-xl font-extrabold uppercase tracking-tight mb-2">Drink Station</h4>
            <p className="font-body text-xs text-on-surface-variant font-medium">Bar chính: tự pha sáng tạo hoặc để BTC pha theo công thức đặc biệt.</p>
          </div>
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-5 hover:bg-primary-container transition-colors">
            <Music className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-display text-xl font-extrabold uppercase tracking-tight mb-2">Live Performances</h4>
            <p className="font-body text-xs text-on-surface-variant font-medium">Biểu diễn nghệ sĩ, tiết mục CLB và DJ Session khuấy động đêm tiệc.</p>
          </div>
          <div className="p-5 hover:bg-secondary/20 transition-colors">
            <Heart className="w-8 h-8 text-secondary mb-3" />
            <h4 className="font-display text-xl font-extrabold uppercase tracking-tight mb-2">Key Moment</h4>
            <p className="font-body text-xs text-on-surface-variant font-medium">Bày tỏ sự trân trọng đến những người bạn yêu quý trước set DJ.</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-bold uppercase mb-4 leading-[0.9] tracking-tighter">
              TIMING IS<br /><span className="text-secondary">EVERYTHING</span>
            </h2>
            <p className="font-body text-base md:text-lg mb-6 font-medium text-on-surface-variant">
              June 27, 2026 — Amphitheatre, VinUni Campus.
            </p>
            <div className="bg-tertiary text-white p-4 md:p-5 border-2 border-primary neo-shadow-blue inline-block w-full md:w-auto">
              <p className="font-display font-black text-xl md:text-2xl uppercase tracking-wider mb-1">MAIN STAGE</p>
              <p className="font-display opacity-90 uppercase tracking-widest text-xs md:text-sm font-bold">THE AMPHITHEATRE</p>
            </div>
          </div>

          <div className="border-2 border-primary bg-background p-5 min-h-[240px] flex flex-col">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-tertiary mb-3">// VENUE MAP</span>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">MAP COMING BACK SOON</h3>
            <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed mb-4">
              Khu vực sơ đồ sự kiện đang được cập nhật. Tạm thời vui lòng theo dõi timeline bên dưới để nắm luồng chương trình.
            </p>
            <div className="mt-auto border-2 border-dashed border-primary p-5 bg-surface text-center">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-primary">AMPHITHEATRE / BOOTH / CHECK-IN / STAGE MAP</p>
            </div>
          </div>

          <div className="flex flex-col gap-0 border-2 border-primary bg-surface">
            {timeline.map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row border-b-2 border-primary hover:bg-surface-container transition-colors cursor-default last:border-b-0">
                <div className="px-3 py-2 md:w-32 border-b-2 md:border-b-0 md:border-r-2 border-primary bg-primary text-background font-display text-base md:text-lg font-bold flex items-center justify-center tracking-tight">
                  {item.time}
                </div>
                <div className="px-3 py-2 md:px-4 md:py-2.5 flex-grow">
                  <div>
                    <h4 className="font-display text-sm md:text-base font-black uppercase tracking-tight mb-0.5">{item.title}</h4>
                    <p className="font-display uppercase text-[10px] md:text-[11px] font-bold text-secondary tracking-widest">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YEP ICONS Preview */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-background border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// THE CONSTELLATIONS</span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">YEP ICONS</h2>
          </div>
          <Link to="/vote" className="inline-block bg-background text-primary border-2 border-primary px-6 py-3 font-display font-bold text-lg uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">
            REGISTER AND VOTE NOW!
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-primary">
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-6">
            <h3 className="font-display text-2xl font-extrabold uppercase mb-3">TỔNG QUAN CUỘC THI</h3>
            <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed">
              YEP ICONS là sân chơi tôn vinh những cặp đôi tỏa sáng của VinUni, tập trung vào tinh thần kết nối, cá tính và dấu ấn sân khấu trong đêm sự kiện.
            </p>
          </div>
          <div className="p-6">
            <h3 className="font-display text-2xl font-extrabold uppercase mb-3">THAM GIA NGAY</h3>
            <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed">
              Chi tiết thể lệ, đăng ký và bình chọn được mở tại trang VOTE. BTC cập nhật thông tin chính thức tại fanpage VinUni Student Council.
            </p>
          </div>
        </div>
      </section>

      {/* Tickets CTA */}
      <section className="py-20 md:py-24 px-6 md:px-12 bg-primary text-background border-t-2 border-primary text-center relative overflow-hidden w-full">
        <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none flex">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-white h-full shrink-0"></div>
          ))}
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h2 className="font-display text-6xl md:text-8xl lg:text-[9rem] font-bold uppercase mb-12 tracking-tighter leading-none">GET YOUR TICKET</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-background p-6 border-2 border-white flex flex-col items-center text-primary transition-transform duration-300 hover:-translate-y-2 relative">
              <span className="absolute -top-3 right-3 bg-secondary text-white px-3 py-1 font-display text-[10px] font-black uppercase tracking-wider border-2 border-primary">EARLY</span>
              <span className="font-display text-lg md:text-xl font-bold uppercase mb-3 tracking-widest">VINUNIANS EARLY</span>
              <span className="font-display text-4xl md:text-5xl font-black mb-2 tracking-tighter">250K</span>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">100 vé</span>
              <Link to="/tickets" className="bg-secondary text-white px-6 py-3 font-display font-bold uppercase hover:bg-primary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">SELECT</Link>
            </div>
            <div className="bg-primary-container p-6 border-2 border-white flex flex-col items-center text-primary neo-shadow-red z-20 md:-mt-4 transition-transform duration-300 hover:-translate-y-2">
              <span className="font-display text-lg md:text-xl font-bold uppercase mb-3 tracking-widest">VINUNIANS REGULAR</span>
              <span className="font-display text-4xl md:text-6xl font-black mb-2 tracking-tighter">300K</span>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">400 vé</span>
              <Link to="/tickets" className="bg-primary text-background px-6 py-3 font-display font-bold uppercase hover:bg-secondary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">SELECT</Link>
            </div>
            <div className="bg-background p-6 border-2 border-white flex flex-col items-center text-primary transition-transform duration-300 hover:-translate-y-2">
              <span className="font-display text-lg md:text-xl font-bold uppercase mb-3 tracking-widest">GUEST</span>
              <span className="font-display text-4xl md:text-5xl font-black mb-2 tracking-tighter">400K</span>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">200 vé</span>
              <Link to="/tickets" className="bg-tertiary text-white px-6 py-3 font-display font-bold uppercase hover:bg-primary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">SELECT</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// FAQ</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">QUESTIONS?</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-2 border-primary bg-surface">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-display font-bold text-primary uppercase tracking-wider text-sm list-none hover:bg-primary-container transition-colors">
                {faq.q}
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 font-body text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center font-body text-xs text-on-surface-variant font-medium">
          Thêm câu hỏi?{' '}
          <a href="mailto:studentcouncil@vinuni.edu.vn" className="text-secondary underline font-bold">studentcouncil@vinuni.edu.vn</a>
          {' '}| Fanpage{' '}
          <a href="https://facebook.com/vinuni.student.council" className="text-secondary underline font-bold">VinUni Student Council</a>
        </p>
      </section>

      {/* Info & Instructions */}
      <section className="py-16 md:py-20 px-6 md:px-12 bg-background max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// EVENT GUIDE</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">HOW IT WORKS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface border-4 border-primary p-6 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-primary-container border-2 border-primary flex items-center justify-center neo-shadow-sm">
              <Ticket className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-black uppercase tracking-tight">BUY TICKETS</h3>
            <p className="font-body text-sm font-medium text-on-surface-variant leading-relaxed">
              Chọn loại vé (VinUnians Early/Regular hoặc Guest), điền thông tin, chọn số lượng vé và merch. Thanh toán để nhận vé điện tử qua email.
            </p>
          </div>
          <div className="bg-surface border-4 border-primary p-6 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-secondary/20 border-2 border-primary flex items-center justify-center neo-shadow-sm">
              <Mail className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="font-display text-xl font-black uppercase tracking-tight">CHECK YOUR EMAIL</h3>
            <p className="font-body text-sm font-medium text-on-surface-variant leading-relaxed">
              Vé điện tử sẽ được gửi về email trong vòng 24 giờ sau khi thanh toán thành công. Kiểm tra cả hộp thư Spam.
            </p>
          </div>
          <div className="bg-surface border-4 border-primary p-6 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-tertiary/20 border-2 border-primary flex items-center justify-center neo-shadow-sm">
              <MapPin className="w-7 h-7 text-tertiary" />
            </div>
            <h3 className="font-display text-xl font-black uppercase tracking-tight">MERCH PICKUP</h3>
            <p className="font-body text-sm font-medium text-on-surface-variant leading-relaxed">
              Nhận merch tại booth của VinUni Student Council hoặc nhận trực tiếp trong sự kiện.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
