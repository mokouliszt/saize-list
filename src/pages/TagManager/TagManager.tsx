import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge,
  IonButtons, IonBackButton, IonAlert, IonInput, IonToast,
} from '@ionic/react';
import { addOutline, trashOutline, lockClosedOutline } from 'ionicons/icons';
import { useMenuStore } from '../../store/menuStore';
import type { Genre } from '../../models/types';

// ユーザー作成タグ用のカラーパレット
const COLOR_PALETTE = [
  '#FF6B35', '#E63946', '#2A9D8F', '#E9C46A',
  '#F4A261', '#264653', '#6A4C93', '#1982C4',
  '#8AC926', '#FF595E', '#6A994E', '#BC6C25',
];

const TagManager: React.FC = () => {
  const { genres, items, addGenre, deleteGenre, toast, clearToast } = useMenuStore();

  const [showAddDialog, setShowAddDialog]     = useState(false);
  const [newTagName,    setNewTagName]         = useState('');
  const [selectedColor, setSelectedColor]      = useState(COLOR_PALETTE[0]);
  const [deleteTarget,  setDeleteTarget]       = useState<Genre | null>(null);
  const [nameError,     setNameError]          = useState('');

  // ジャンルごとのメニュー件数
  const countMap = new Map<number, number>();
  items.forEach(i => countMap.set(i.genreId, (countMap.get(i.genreId) ?? 0) + 1));

  const ossGenres  = genres.filter(g => !g.isUserCreated);
  const userGenres = genres.filter(g =>  g.isUserCreated);

  const handleAdd = async () => {
    const name = newTagName.trim();
    if (!name) { setNameError('ジャンル名を入力してください'); return; }
    if (genres.find(g => g.name === name)) { setNameError('同じ名前のジャンルが既に存在します'); return; }
    await addGenre(name, selectedColor);
    setNewTagName('');
    setSelectedColor(COLOR_PALETTE[0]);
    setShowAddDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteGenre(deleteTarget.id);
    setDeleteTarget(null);
  };

  const affectedCount = deleteTarget ? (countMap.get(deleteTarget.id) ?? 0) : 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/settings" text="戻る" /></IonButtons>
          <IonTitle>ジャンル管理</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="light" onClick={() => { setNameError(''); setShowAddDialog(true); }}>
              <IonIcon icon={addOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* OSSジャンル (編集不可) */}
        {ossGenres.length > 0 && (
          <>
            <div style={styles.sectionHeader}>
              <IonIcon icon={lockClosedOutline} style={{ marginRight: '4px', fontSize: '12px' }} />
              公式ジャンル (編集不可)
            </div>
            <IonList>
              {ossGenres.map(g => (
                <IonItem key={g.id}>
                  <div slot="start" style={{ ...styles.colorDot, backgroundColor: 'var(--saize-green)' }} />
                  <IonLabel>
                    <h2>{g.name}</h2>
                  </IonLabel>
                  <IonBadge slot="end" color="medium">
                    {countMap.get(g.id) ?? 0} 件
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {/* ユーザー作成ジャンル (左スワイプで削除) */}
        <div style={styles.sectionHeader}>
          ユーザー作成ジャンル
          {userGenres.length === 0 && (
            <span style={{ fontWeight: 400, marginLeft: '8px', color: '#bbb' }}>
              右上の + から追加
            </span>
          )}
        </div>
        <IonList>
          {userGenres.map(g => (
            <IonItem key={g.id}>
              <div slot="start" style={{ ...styles.colorDot, backgroundColor: g.colorHex }} />
              <IonLabel>
                <h2>{g.name}</h2>
              </IonLabel>
              <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IonBadge style={{ '--background': g.colorHex + '33', '--color': g.colorHex }}>
                  {countMap.get(g.id) ?? 0} 件
                </IonBadge>
                <IonButton
                  fill="clear" size="small"
                  onClick={() => setDeleteTarget(g)}
                  style={{
                    '--color': 'var(--ion-color-danger)',
                    '--padding-start': '0',
                    '--padding-end': '0',
                    width: '30px', height: '30px', minHeight: 'unset',
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
                </IonButton>
              </div>
            </IonItem>
          ))}
        </IonList>

        {/* 追加ボタン (フローティング代替) */}
        <div style={{ padding: '16px' }}>
          <IonButton expand="block" color="primary" onClick={() => { setNameError(''); setShowAddDialog(true); }}>
            <IonIcon icon={addOutline} slot="start" />
            ジャンルを追加する
          </IonButton>
        </div>
      </IonContent>

      {/* カラー選択付き追加モーダル */}
      {showAddDialog && (
        <div style={styles.colorPickerOverlay} onClick={() => setShowAddDialog(false)}>
          <div style={styles.colorPickerCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>ジャンルを追加</h3>

            <IonInput
              value={newTagName}
              onIonInput={e => { setNewTagName(e.detail.value ?? ''); setNameError(''); }}
              placeholder="ジャンル名 (例: おすすめ)"
              style={{ '--background': '#f5f5f5', '--border-radius': '8px', marginBottom: '12px' }}
              autofocus
            />
            {nameError && <p style={{ color: 'var(--saize-red)', fontSize: '13px', margin: '0 0 8px' }}>{nameError}</p>}

            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>タグカラー:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c,
                    border: selectedColor === c ? '3px solid #333' : '2px solid transparent',
                    cursor: 'pointer', outline: 'none',
                  }}
                />
              ))}
            </div>

            {/* プレビュー */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                backgroundColor: selectedColor + '33', color: selectedColor,
                borderRadius: '12px', padding: '4px 12px', fontSize: '13px', fontWeight: 600,
              }}>
                {newTagName || 'プレビュー'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <IonButton expand="block" fill="outline" color="medium" style={{ flex: 1 }}
                onClick={() => { setShowAddDialog(false); setNewTagName(''); setNameError(''); }}>
                キャンセル
              </IonButton>
              <IonButton expand="block" color="primary" style={{ flex: 1 }} onClick={handleAdd}
                disabled={!newTagName.trim()}>
                追加する
              </IonButton>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      <IonAlert
        isOpen={!!deleteTarget}
        header="ジャンルを削除"
        message={
          affectedCount > 0
            ? `「${deleteTarget?.name}」を削除します。このジャンルが付いている ${affectedCount} 件のメニューからジャンルが外れます。`
            : `「${deleteTarget?.name}」を削除しますか？`
        }
        buttons={[
          { text: 'キャンセル', role: 'cancel', handler: () => setDeleteTarget(null) },
          { text: '削除する', role: 'destructive', handler: handleDeleteConfirm },
        ]}
        onDidDismiss={() => setDeleteTarget(null)}
      />

      <IonToast isOpen={!!toast} message={toast?.message} color={toast?.color} duration={2000} onDidDismiss={clearToast} />
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    display: 'flex', alignItems: 'center',
    fontSize: '12px', fontWeight: 600, color: '#888',
    padding: '16px 16px 4px', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  colorDot: {
    width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
  },
  colorPickerOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px',
  },
  colorPickerCard: {
    backgroundColor: '#fff', borderRadius: '16px',
    padding: '20px', width: '100%', maxWidth: '360px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
};

export default TagManager;
