import React from 'react';
import { IonProgressBar } from '@ionic/react';
import iconUrl from '../../resources/icon.png';

interface Props {
  status: string;
}

const SplashScreen: React.FC<Props> = ({ status }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'var(--ion-color-primary)',
    display: 'flex', flexDirection: 'column',
  }}>
    {/* 中央: アプリ名 */}
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', color: 'white',
    }}>
      <img src={iconUrl} alt="" style={{ width: '96px', height: '96px', borderRadius: '22px', margin: '0 0 12px' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
        サイゼリスト
      </h1>
    </div>

    {/* 下部: プログレスバー + ステータス */}
    <div style={{ paddingBottom: '48px' }}>
      <IonProgressBar
        type="indeterminate"
        style={{
          '--background': 'rgba(255,255,255,0.25)',
          '--progress-background': 'white',
          height: '3px',
        } as React.CSSProperties}
      />
      <p style={{
        color: 'white', textAlign: 'center',
        fontSize: '13px', margin: '10px 0 0',
        opacity: 0.85, letterSpacing: '0.01em',
      }}>
        {status || 'メニューバージョン確認中...'}
      </p>
    </div>
  </div>
);

export default SplashScreen;
