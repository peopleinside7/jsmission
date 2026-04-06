import bcryptjs from 'bcryptjs';

export function seedDatabase(db: any) {
  // Check if already seeded
  const adminExists = db.prepare('SELECT id FROM users WHERE phone = ?').get('010-0000-0000');
  if (adminExists) return;

  console.log('🌱 Seeding database...');

  // Admin user (auto-approved)
  const adminHash = bcryptjs.hashSync('admin1234', 10);
  db.prepare(`
    INSERT INTO users (name, phone, password_hash, role, department, is_approved, referral_source)
    VALUES (?, ?, ?, 'ADMIN', '관리부', 1, '시스템관리자')
  `).run('관리자', '010-0000-0000', adminHash);

  // Demo users (approved)
  const demoHash = bcryptjs.hashSync('test1234', 10);
  const demoUsers = [
    { name: '김성도', phone: '010-1111-1111', dept: '청년부', ref: '교회 소개' },
    { name: '이은혜', phone: '010-2222-2222', dept: '대학부', ref: '지인 소개' },
    { name: '박믿음', phone: '010-3333-3333', dept: '청년부', ref: '인스타그램' },
    { name: '최소망', phone: '010-4444-4444', dept: '대학부', ref: '교회 홈페이지' },
    { name: '정사랑', phone: '010-5555-5555', dept: '청년부', ref: '전단지' },
  ];
  const insertUser = db.prepare(`
    INSERT INTO users (name, phone, password_hash, department, is_approved, referral_source) VALUES (?, ?, ?, ?, 1, ?)
  `);
  for (const u of demoUsers) {
    insertUser.run(u.name, u.phone, demoHash, u.dept, u.ref);
  }

  // 8 Clubs
  const clubs = [
    {
      name: '오물오물 잉글리시', icon: '🗣️', icon_color: '#E8EAF6',
      slogan: '시험이 아닌 언어로서의 영어 공부 총집약',
      category: '교육', target_age: '누구나', target_gender: '무관',
      schedule_text: '매주 토요일 10:00', fee_text: '10,000원',
      max_members: 8, total_sessions: 6,
      instructor_info: '무역회사 해외영업 11년, 40여개국 바이어 상담',
      curriculum: JSON.stringify(['영어 성경 낭독', '발음·억양 훈련', '문장 구조 이해', '작문·영어 일기', '복습', '마무리']),
      location: '추후 공지', recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_english.jpg'
    },
    {
      name: '일본어 회화 오니기리', icon: '🍙', icon_color: '#EFEBE9',
      slogan: '바로 써먹는 일본어 회화 입문',
      category: '교육', target_age: '대학생~20대후반', target_gender: '무관',
      schedule_text: '격주 토요일 15:00', fee_text: '20,000원',
      max_members: 20, total_sessions: 8,
      instructor_info: 'JLPT 2급, 일본 거주 3년, 투어 가이드',
      curriculum: JSON.stringify(['히라가나·가타카나', '취미 표현', '일상 표현', '음식·주문', '여행①', '여행②', '감정·근황', '자유 회화']),
      location: '추후 공지', recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_onigiri.jpg'
    },
    {
      name: 'POWER F.C', icon: '⚽', icon_color: '#E3F2FD',
      slogan: '축구 팀원 모집',
      category: '스포츠', target_age: '10~30대', target_gender: '남성',
      schedule_text: '매주 일요일 15:00~17:00', fee_text: '별도',
      max_members: null, total_sessions: null,
      instructor_info: null, curriculum: null,
      location: '초지고', recruitment_status: 'OPEN',
      external_link: '당근마켓 파워FC',
      poster_image: '/clubs/poster_powerfc.jpg'
    },
    {
      name: '여자 플로우 러닝크루', icon: '🏃‍♀️', icon_color: '#E3F2FD',
      slogan: '함께 해요, 함께 뛰어요!',
      category: '스포츠', target_age: '20~30세', target_gender: '여성',
      schedule_text: '매주 화,목 19:30', fee_text: '10,000원(첫회만)',
      max_members: null, total_sessions: null,
      instructor_info: null, curriculum: null,
      location: '호수공원 수변로 or 와스타디움', recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_running.jpg'
    },
    {
      name: 'RUN&GLOW 러닝크루', icon: '✨', icon_color: '#FFF9C4',
      slogan: '나이 들수록 빛나는 우리, 함께 해요',
      category: '스포츠', target_age: '30~40대', target_gender: '미혼 여성',
      schedule_text: '매주 일요일 오후', fee_text: '별도',
      max_members: null, total_sessions: null,
      instructor_info: null, curriculum: null,
      location: '안산 및 근교', recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_runglow.jpg'
    },
    {
      name: '디어댄스', icon: '💃', icon_color: '#FCE4EC',
      slogan: '오늘은 내가 아이돌',
      category: '문화', target_age: '1020', target_gender: '여성',
      schedule_text: '매주 토요일 16:00~18:00', fee_text: '20,000원',
      max_members: null, total_sessions: 4,
      instructor_info: '댄스강사 3년+, 릴스 1만회+, 커버댄스 디렉팅',
      curriculum: JSON.stringify(['기본기', '안무①', '안무②', '완성촬영']),
      location: '안산 내 연습실', recruitment_status: 'CLOSED',
      poster_image: '/clubs/poster_deardance.jpg'
    },
    {
      name: '캠퍼스 나침반', icon: '🧭', icon_color: '#E8F5E9',
      slogan: '나랑 맞는 동아리가 어디게~',
      category: '대학사역', target_age: '대학 새내기', target_gender: null,
      schedule_text: '상시', fee_text: '무료',
      max_members: null, total_sessions: null,
      instructor_info: null, curriculum: null,
      location: null, recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_campus.jpg'
    },
    {
      name: 'JS 하모닉스', icon: '🎵', icon_color: '#EDE7F6',
      slogan: '주성령 ♡ 하나된 하모니로',
      category: '찬양', target_age: '음악 관심자', target_gender: null,
      schedule_text: '주 1회', fee_text: '별도',
      max_members: null, total_sessions: null,
      instructor_info: null, curriculum: null,
      location: null, recruitment_status: 'OPEN',
      poster_image: '/clubs/poster_harmonics.jpg'
    }
  ];

  const insertClub = db.prepare(`
    INSERT INTO clubs (name, icon, icon_color, slogan, category, target_age, target_gender,
      schedule_text, fee_text, max_members, total_sessions, instructor_info, curriculum,
      location, recruitment_status, external_link, poster_image, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  clubs.forEach((c, i) => {
    insertClub.run(
      c.name, c.icon, c.icon_color, c.slogan, c.category, c.target_age, c.target_gender || null,
      c.schedule_text, c.fee_text, c.max_members || null, c.total_sessions || null,
      c.instructor_info || null, c.curriculum || null,
      c.location || null, c.recruitment_status, (c as any).external_link || null,
      (c as any).poster_image || null, i + 1
    );
  });

  // Add some club members (demo users join clubs)
  const insertMember = db.prepare(`INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)`);
  insertMember.run(1, 2, 'ADMIN');
  insertMember.run(1, 3, 'MEMBER');
  insertMember.run(2, 4, 'ADMIN');
  insertMember.run(3, 5, 'ADMIN');
  insertMember.run(4, 6, 'ADMIN');

  // Demo newcomers
  const insertNewcomer = db.prepare(`
    INSERT INTO newcomers (club_id, registered_by, name, phone, age_group, gender, introduction, how_met, status, prayer_request, last_contact_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
  `);
  insertNewcomer.run(1, 2, '홍길동', '010-1234-5678', '20대', '남성', '영어 배우고 싶어요', '전단지', 'ATTEMPT', '믿음이 자라기를');
  insertNewcomer.run(1, 2, '김미영', '010-2345-6789', '30대', '여성', '직장인 영어회화', '지인소개', 'PRELIM', '건강 회복');
  insertNewcomer.run(1, 3, '이준호', '010-3456-7890', '20대', '남성', '해외여행 준비', '노방', 'GOSPEL', '가족 구원');
  insertNewcomer.run(2, 4, '박소연', '010-4567-8901', '20대', '여성', '일본 여행 준비', '설문', 'ATTEMPT', '학업 축복');
  insertNewcomer.run(3, 5, '최강민', '010-5678-9012', '20대', '남성', '축구 좋아해요', '노방', 'WORSHIP', '직장 안정');

  // Demo activity logs
  const insertLog = db.prepare(`INSERT INTO activity_logs (newcomer_id, author_id, content, activity_type) VALUES (?, ?, ?, ?)`);
  insertLog.run(1, 2, '전단지 배포 시 만남. 영어에 관심 보임', 'ATTEMPT');
  insertLog.run(2, 2, '커피숍에서 첫 만남. 직장 스트레스 이야기 나눔', 'PRELIM');
  insertLog.run(3, 3, '성경 말씀 나누기 시작. 요한복음 읽기 시작', 'GOSPEL');

  // Demo posts
  const insertPost = db.prepare(`
    INSERT INTO posts (board_type, author_id, title, content) VALUES (?, ?, ?, ?)
  `);
  insertPost.run('NOTICE', 1, 'JS MISSION 앱 오픈!', '안녕하세요! JS MISSION 앱이 오픈되었습니다. 동아리 활동과 선교에 적극 활용해주세요.');
  insertPost.run('NOTICE', 1, '2026년 상반기 동아리 모집', '상반기 동아리 모집이 시작됩니다. 많은 관심 부탁드립니다.');
  insertPost.run('SERMON', 1, '오늘의 말씀 - 마태복음 28:19-20', '그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고...');
  insertPost.run('FREE', 2, '축구 동아리 후기!', '지난 주일 POWER FC에서 첫 경기를 했습니다. 너무 재미있었어요!');

  // Family sites
  const insertSite = db.prepare(`INSERT INTO family_sites (title, url, icon, display_order) VALUES (?, ?, ?, ?)`);
  insertSite.run('안산주성령교회', 'https://www.example.com', '⛪', 1);
  insertSite.run('교회 유튜브', 'https://www.youtube.com', '📺', 2);
  insertSite.run('교회 인스타그램', 'https://www.instagram.com', '📸', 3);

  console.log('✅ Seed data inserted successfully!');
}
