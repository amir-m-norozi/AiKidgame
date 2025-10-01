import React from 'react';
import './LoginPage.css';
import './IranianTheme.css';

interface LoginPageProps {
  onStartGame: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onStartGame }) => {
  return (
    <div className="login-page bg-gradient-persian-gulf rtl-support">
      <div className="login-container game-card-iranian persian-border start-card">
        {/* تزئین بادکنک‌ها */}
        <div className="balloons-decor" aria-hidden="true">
          <span className="balloon balloon-left">🎈</span>
          <span className="balloon balloon-right">🎈</span>
        </div>

        {/* متن شروع بازی مطابق دستور */}
        <div className="start-message">
          <p className="font-kids-title start-line">سلام دوست من</p>
          <p className="font-kids-body start-line">
            قراره ما شکلات هایی رو که برای جشن مدرسه و جشن تولد سفارش میدن بسته بندی و رنگ کنیم
          </p>
          <p className="font-kids-body start-line">خب آماده ای؟</p>
        </div>

        {/* دکمه شروع بازی */}
        <button className="kids-button-persian accessible-button start-button" onClick={onStartGame}>
          بریم سرکار
        </button>
      </div>
    </div>
  );
};

export default LoginPage;