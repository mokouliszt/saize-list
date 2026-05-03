import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonNote, IonSpinner,
  IonButtons, IonBackButton, IonToast, IonAlert,
} from '@ionic/react';
import {
  pricetagsOutline, informationCircleOutline, chevronForwardOutline,
  documentTextOutline, cloudDownloadOutline, trashOutline,
} from 'ionicons/icons';
import { useMenuStore } from '../../store/menuStore';

const Settings: React.FC = () => {
  const { dataVersion, toast, clearToast, checkRemoteUpdate, resetUserData } = useMenuStore();
  const [isChecking, setIsChecking] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    await checkRemoteUpdate();
    setIsChecking(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/home" text="戻る" /></IonButtons>
          <IonTitle>設定</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* データ管理 */}
        <div style={styles.sectionHeader}>データ</div>
        <IonList inset>
          <IonItem button routerLink="/tags">
            <IonIcon icon={pricetagsOutline} slot="start" color="primary" />
            <IonLabel><h2>ジャンルを管理する</h2></IonLabel>
            <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
          </IonItem>

          <IonItem button onClick={handleCheckUpdate} disabled={isChecking}>
            <IonIcon icon={cloudDownloadOutline} slot="start" color="primary" />
            <IonLabel>
              <h2>メニューの更新を確認</h2>
              <p>最新のメニューデータを GitHub から取得します</p>
            </IonLabel>
            {isChecking
              ? <IonSpinner slot="end" name="crescent" color="primary" />
              : <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            }
          </IonItem>
        </IonList>

        {/* カスタムデータ */}
        <div style={styles.sectionHeader}>カスタムデータ</div>
        <IonList inset>
          <IonItem button onClick={() => setShowResetAlert(true)}>
            <IonIcon icon={trashOutline} slot="start" color="danger" />
            <IonLabel color="danger">
              <h2>カスタム設定をリセット</h2>
              <p>追加したジャンル・メニューをすべて削除します</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonAlert
          isOpen={showResetAlert}
          onDidDismiss={() => setShowResetAlert(false)}
          header="カスタム設定をリセット"
          message="自分で追加したジャンルとメニューがすべて削除されます。この操作は元に戻せません。"
          buttons={[
            { text: 'キャンセル', role: 'cancel' },
            {
              text: '削除する',
              role: 'destructive',
              handler: () => resetUserData(),
            },
          ]}
        />

        {/* このアプリについて */}
        <div style={styles.sectionHeader}>このアプリについて</div>
        <IonList inset>
          <IonItem>
            <IonIcon icon={documentTextOutline} slot="start" color="medium" />
            <IonLabel class="ion-text-wrap">
              <h2>メニューデータバージョン</h2>
              <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>{dataVersion}</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonIcon icon={informationCircleOutline} slot="start" color="medium" />
            <IonLabel class="ion-text-wrap">
              <h2>データソース</h2>
              <IonNote>ryohidaka/saizeriya-menus (MIT License)</IonNote>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel class="ion-text-wrap">
              <h2>免責事項</h2>
              <IonNote>
                本アプリは非公式です。サイゼリヤ株式会社の公式サービスとは無関係です。
                価格・メニュー内容は変更される場合があります。
                最新情報は公式サイトをご確認ください。
              </IonNote>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>

      <IonToast isOpen={!!toast} message={toast?.message} color={toast?.color} duration={2500} onDidDismiss={clearToast} />
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    fontSize: '12px', fontWeight: 600, color: '#888',
    padding: '16px 20px 4px', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
};

export default Settings;
