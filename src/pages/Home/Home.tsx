import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonFab, IonFabButton, IonIcon, IonList,
  IonToast, IonButton, IonSelect, IonSelectOption,
  IonActionSheet, IonSpinner, IonButtons,
  useIonRouter,
} from '@ionic/react';
import { add, settingsOutline, trashOutline, createOutline, globeOutline } from 'ionicons/icons';
import { useMenuStore } from '../../store/menuStore';
import { SORT_LABELS } from '../../models/types';
import type { MenuItem, Language } from '../../models/types';
import MenuListItem from '../../components/MenuListItem';
import CategoryFilter from '../../components/CategoryFilter';
import './Home.css';

const Home: React.FC = () => {
  const router = useIonRouter();
  const {
    genres, searchQuery, selectedGenreId, sortOrder,
    isLoading, toast, language,
    filteredItems, setSearchQuery, setSelectedGenre, setSortOrder,
    setLanguage, copyOrderNumber, deleteItem, clearToast,
  } = useMenuStore();

  const [longPressItem, setLongPressItem] = useState<MenuItem | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    useMenuStore.getState().init();
  }, []);

  const displayed = filteredItems();
  const genreMap  = new Map(genres.map(g => [g.id, g]));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>サイゼリスト</IonTitle>
          <IonButtons slot="end">
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '4px' }}>
              <IonIcon icon={globeOutline} style={{ color: 'white', fontSize: '18px', flexShrink: 0 }} />
              <IonSelect
                value={language}
                onIonChange={e => setLanguage(e.detail.value as Language)}
                interface="popover"
                aria-label="表示言語"
                style={{ color: 'white', fontSize: '13px', maxWidth: '80px' }}
              >
                <IonSelectOption value="ja">日本語</IonSelectOption>
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="zh">中文</IonSelectOption>
              </IonSelect>
            </div>
            <IonButton fill="clear" color="light" routerLink="/settings">
              <IonIcon icon={settingsOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSearchbar
          value={searchQuery}
          onIonInput={e => setSearchQuery(e.detail.value ?? '')}
          placeholder="メニュー名・番号で検索"
          debounce={200}
          style={{ '--background': '#fff', paddingBottom: 0 }}
        />

        <CategoryFilter genres={genres} selectedId={selectedGenreId} onSelect={setSelectedGenre} />

        <div className="sort-bar">
          <span className="sort-label">並び順:</span>
          <IonSelect
            value={sortOrder}
            onIonChange={e => setSortOrder(e.detail.value)}
            interface="popover"
            style={{ fontSize: '13px', color: 'var(--saize-green)' }}
          >
            {(Object.entries(SORT_LABELS) as [any, string][]).map(([k, v]) => (
              <IonSelectOption key={k} value={k}>{v}</IonSelectOption>
            ))}
          </IonSelect>
          <span className="item-count">{displayed.length} 件</span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', gap: '16px' }}>
            <IonSpinner color="primary" />
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>読み込み中…</p>
          </div>
        ) : (
          <IonList lines="none">
            {displayed.map(item => (
              <MenuListItem
                key={item.id}
                item={item}
                genre={genreMap.get(item.genreId)}
                onCopy={copyOrderNumber}
                onLongPress={setLongPressItem}
              />
            ))}
            {displayed.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#999' }}>
                <p style={{ fontSize: '40px', margin: '0 0 8px' }}>🍽️</p>
                <p>該当するメニューがありません</p>
              </div>
            )}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton color="secondary" routerLink="/add">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonActionSheet
        isOpen={!!longPressItem}
        onDidDismiss={() => setLongPressItem(null)}
        header={`${longPressItem?.icon ?? '🍽️'} ${longPressItem?.name ?? ''}`}
        buttons={[
          ...(longPressItem?.isUserAdded ? [
            { text: '編集', icon: createOutline, handler: () => router.push(`/edit/${longPressItem!.id}`) },
            { text: '削除', icon: trashOutline, role: 'destructive' as const, handler: () => deleteItem(longPressItem!.id) },
          ] : []),
          { text: 'キャンセル', role: 'cancel' },
        ]}
      />

      <IonToast
        isOpen={!!toast} message={toast?.message} color={toast?.color ?? 'dark'}
        duration={2000} onDidDismiss={clearToast} position="bottom"
      />
    </IonPage>
  );
};

export default Home;
