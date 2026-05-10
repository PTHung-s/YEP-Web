import React, { useState } from 'react';
import { Heart, PlusCircle, Crown, Users2, Camera, ExternalLink, Star, Sparkles, Trophy } from 'lucide-react';
import { cn } from './Layout';

const REGISTRATION_LINK = 'https://forms.gle/example-yep-icon-2026';

const rounds = [
  {
    phase: 'VÒNG 1',
    subtitle: 'Giai đoạn Tuyển chọn',
    period: 'Đầu tháng 05/2026',
    icon: Users2,
    details: [
      'Ban giám khảo: Giáo sư VinUni & SAM',
      'Đánh giá 100% hồ sơ đăng ký và câu chuyện cặp đôi',
      'Chọn Top 8 cặp đôi điểm cao nhất vào vòng trong',
    ],
    criteria: [
      { label: 'Bản sắc cặp đôi', pct: '30%' },
      { label: 'Câu chuyện chia sẻ', pct: '50%' },
      { label: 'Tiềm năng hình ảnh', pct: '20%' },
    ],
  },
  {
    phase: 'VÒNG 2',
    subtitle: 'Chiến dịch Truyền thông',
    period: 'Sau khi có Top 8',
    icon: Camera,
    details: [
      'Top 8 được hỗ trợ bộ ảnh concept "Kaleidoscope" chuyên nghiệp',
      'Bình chọn công khai qua mạng xã hội',
      'Mọi hành vi bot / hack like sẽ bị loại trực tiếp',
    ],
    criteria: [
      { label: '1 Like', pct: '3 điểm' },
      { label: '1 Comment', pct: '1 điểm' },
      { label: '1 Share', pct: '5 điểm' },
    ],
  },
  {
    phase: 'VÒNG 3',
    subtitle: 'Chung kết — Đêm D-Day',
    period: '27/06/2026',
    icon: Crown,
    details: [
      'Top 4 cặp đôi biểu diễn trên sân khấu chính',
      'Bình chọn 100% trực tiếp qua Microsoft Forms',
      'Tiêu chí: Phong thái, tài năng & sự ăn ý',
    ],
    criteria: [
      { label: 'Bình chọn trực tiếp', pct: '100%' },
    ],
  },
];

export function Vote() {
  const [tab, setTab] = useState<'info' | 'prizes'>('info');

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Header */}
      <section className="mb-12 md:mb-16 relative">
        <div className="border-4 border-primary p-6 md:p-10 bg-primary-container neo-shadow relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-5xl md:text-7xl lg:text-[8rem] font-black uppercase leading-[0.8] tracking-tighter text-primary">
              YEP ICONS<br />THE CONSTELLATIONS
            </h2>
            <div className="mt-6 md:mt-8 border-l-8 border-primary pl-4 md:pl-6">
              <p className="font-display text-lg md:text-xl font-bold max-w-2xl text-primary uppercase leading-tight">
                HÀNH TRÌNH TÌM KIẾM CẶP ĐÔI TỎA SÁNG NHẤT VINUNI 2026
              </p>
            </div>
          </div>
          <div className="absolute -right-32 -bottom-32 opacity-10 pointer-events-none">
            <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border-[40px] md:border-[60px] border-primary"></div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-0 mb-12 border-b-4 border-primary">
        <button
          onClick={() => setTab('info')}
          className={cn(
            'relative px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1 transition-colors',
            tab === 'info' ? 'bg-primary text-background' : 'bg-surface text-primary hover:bg-surface-container'
          )}
        >
          COMPETITION
          {tab === 'info' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
          )}
        </button>
        <button
          onClick={() => setTab('prizes')}
          className={cn(
            'relative px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1 transition-colors',
            tab === 'prizes' ? 'bg-primary text-background' : 'bg-surface text-primary hover:bg-surface-container'
          )}
        >
          PRIZES
          {tab === 'prizes' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
          )}
        </button>
      </div>

      {/* Competition Info Tab */}
      {tab === 'info' && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-primary mb-12">
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-6 text-center">
              <span className="text-4xl mb-3 block">👥</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">Tham gia theo cặp</h4>
              <p className="font-body text-xs text-on-surface-variant font-medium">Nam x Nữ, Nữ x Nữ, Nam x Nam — mọi kết hợp đều được chào đón.</p>
            </div>
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-6 text-center">
              <span className="text-4xl mb-3 block">🎯</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">3 Vòng thi</h4>
              <p className="font-body text-xs text-on-surface-variant font-medium">Tuyển chọn → Truyền thông → Chung kết trực tiếp D-Day.</p>
            </div>
            <div className="p-6 text-center">
              <span className="text-4xl mb-3 block">💎</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">Giải thưởng giá trị</h4>
              <p className="font-body text-xs text-on-surface-variant font-medium">Tổng 3.000.000 VND + quà tặng từ Nhà tài trợ.</p>
            </div>
          </div>

          {/* 3 Rounds */}
          <div className="space-y-10 mb-12">
            {rounds.map((r, i) => (
              <div key={i} className="border-4 border-primary bg-surface">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-6 border-b-2 border-primary bg-primary-container">
                  <div className="w-14 h-14 bg-primary text-background flex items-center justify-center shrink-0 border-2 border-primary">
                    <r.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-display text-xs font-bold uppercase tracking-widest text-secondary">{r.period}</span>
                    <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">{r.phase} — {r.subtitle}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-4">
                    {r.details.map((d, j) => (
                      <li key={j} className="font-body text-sm text-on-surface-variant flex items-start gap-2">
                        <Star className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {r.criteria.map((c, k) => (
                      <span key={k} className="bg-primary text-background px-3 py-1 font-display text-xs font-bold uppercase tracking-wider border-2 border-primary">
                        {c.label}: {c.pct}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Prizes Tab */}
      {tab === 'prizes' && (
        <div className="space-y-10">
          <div className="border-4 border-primary bg-surface p-6 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="w-10 h-10 text-secondary" />
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">YEP ICONS — The Constellations</h3>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-primary/60">Quán quân</p>
              </div>
            </div>
            <div className="bg-primary text-background p-6 border-2 border-primary">
              <span className="font-display text-3xl md:text-4xl font-black tracking-tighter">2.000.000 VND</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider ml-3">/ cặp</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['1.000.000 VND / thành viên', 'Kỷ niệm chương "The Constellations"', 'Dải băng (Sash), Bảng giải thưởng & Hoa', 'Quà tặng đặc biệt từ Nhà tài trợ', 'Certificate of Achievement'].map((item, i) => (
                <li key={i} className="font-body text-sm flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-primary bg-surface p-6 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="w-10 h-10 text-tertiary" />
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">Most Inspiring Duo</h3>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-primary/60">Cặp đôi truyền cảm hứng nhất</p>
              </div>
            </div>
            <div className="bg-secondary/20 p-6 border-2 border-primary">
              <span className="font-display text-3xl md:text-4xl font-black tracking-tighter">1.000.000 VND</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider ml-3">/ cặp</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['500.000 VND / thành viên', 'Kỷ niệm chương "Most Inspiring Duo"', 'Bảng giải thưởng, Hoa & Quà tài trợ', 'Certificate of Achievement'].map((item, i) => (
                <li key={i} className="font-body text-sm flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-primary bg-primary-container p-6 text-center">
            <h3 className="font-display text-xl font-extrabold uppercase mb-3">Quyền lợi khác cho Top 8</h3>
            <div className="flex flex-wrap justify-center gap-6 font-body text-sm font-medium text-on-surface-variant">
              <span>📸 Bộ ảnh concept "Kaleidoscope"</span>
              <span>🎤 Sân khấu chính (Top 4)</span>
              <span>📣 Shout-out từ BTC</span>
            </div>
          </div>
        </div>
      )}

      {/* Register CTA */}
      <div className="mt-16 border-t-4 border-primary pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <a
            href={REGISTRATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-background border-4 border-primary px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-background hover:text-primary transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none"
          >
            REGISTER NOW
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
        <div className="text-right">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            📋 Thể lệ chi tiết tại Notion BTC & Fanpage VinUni Student Council
          </p>
        </div>
      </div>
    </div>
  );
}
