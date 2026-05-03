import React, { useState } from 'react';
import { IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonChip, IonAlert } from '@ionic/react';
import { copyOutline, trashOutline } from 'ionicons/icons';
import type { MenuItem, Genre } from '../models/types';
import { getDisplayName } from '../models/types';
import { useMenuStore } from '../store/menuStore';

interface Props {
  item: MenuItem;
  genre?: Genre;
  onCopy: (id: number) => void;
  onLongPress?: (item: MenuItem) => void;
}

const MenuListItem: React.FC<Props> = ({ item, genre, onCopy, onLongPress }) => {
  const language   = useMenuStore(s => s.language);
  const genres     = useMenuStore(s => s.genres);
  const deleteItem = useMenuStore(s => s.deleteItem);
  const displayName = getDisplayName(item, language);
  const genre2 = genres.find(g => g.id === item.genreId2);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  return (
    <IonItem
      lines="full"
      onContextMenu={e => { e.preventDefault(); onLongPress?.(item); }}
    >
      {/* 絵文字 + 注文番号 */}
      <div slot="start" style={styles.startArea}>
        <span style={styles.icon}>{item.icon || '🍽️'}</span>
        <span style={styles.idText}>{item.id > 0 ? item.id : '—'}</span>
        {item.isUserAdded && <IonBadge color="warning" style={{ fontSize: '9px' }}>MY</IonBadge>}
        {item.isAlcohol   && <IonBadge color="medium"  style={{ fontSize: '9px' }}>🍺</IonBadge>}
      </div>

      {/* メニュー名 + ジャンルチップ */}
      <IonLabel>
        <h2 style={styles.name}>{displayName}</h2>
        <div style={styles.chipRow}>
          {genre && (
            <IonChip
              style={{
                '--background': genre.isUserCreated ? genre.colorHex + '33' : 'var(--saize-green-bg)',
                '--color':      genre.isUserCreated ? genre.colorHex        : 'var(--saize-green)',
                height: '20px', fontSize: '11px', margin: 0,
              }}
            >
              {genre.name}
            </IonChip>
          )}
          {genre2 && (
            <IonChip
              style={{
                '--background': genre2.isUserCreated ? genre2.colorHex + '33' : 'var(--saize-green-bg)',
                '--color':      genre2.isUserCreated ? genre2.colorHex        : 'var(--saize-green)',
                height: '20px', fontSize: '11px', margin: 0,
              }}
            >
              {genre2.name}
            </IonChip>
          )}
          {item.calorie != null && item.calorie !== 0 && (
            <span style={styles.subInfo}>{item.calorie}kcal</span>
          )}
          {item.salt != null && item.salt !== 0 && (
            <span style={styles.subInfo}>塩{item.salt}g</span>
          )}
        </div>
      </IonLabel>

      {/* 税込価格 + コピーボタン + (ユーザー追加時のみ) ゴミ箱 */}
      <div slot="end" style={styles.endArea}>
        <div style={styles.rightArea}>
          <span style={styles.price}>¥{item.price.toLocaleString()}</span>
          <IonButton
            fill="clear" size="small"
            onClick={() => onCopy(item.id)}
            style={{ '--color': 'var(--saize-green)', '--padding-start': '4px', '--padding-end': '0', fontSize: '11px' }}
          >
            <IonIcon icon={copyOutline} slot="start" style={{ fontSize: '14px' }} />
            番号をコピー
          </IonButton>
        </div>
        {item.isUserAdded && (
          <IonButton
            fill="clear" size="small"
            onClick={e => { e.stopPropagation(); setShowDeleteAlert(true); }}
            style={{
              '--color': 'var(--ion-color-danger)',
              '--padding-start': '0',
              '--padding-end': '0',
              width: '30px',
              height: '30px',
              minHeight: 'unset',
            }}
          >
            <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
          </IonButton>
        )}
      </div>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="メニューを削除"
        message={`「${displayName}」を削除しますか？`}
        buttons={[
          { text: 'キャンセル', role: 'cancel' },
          { text: '削除する', role: 'destructive', handler: () => deleteItem(item.id) },
        ]}
      />
    </IonItem>
  );
};

const styles: Record<string, React.CSSProperties> = {
  startArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '48px', marginRight: '8px', gap: '2px',
  },
  icon:   { fontSize: '20px', lineHeight: 1 },
  idText: { fontSize: '13px', fontWeight: 700, color: 'var(--saize-green)', fontVariantNumeric: 'tabular-nums' },
  name:   { fontSize: '15px', fontWeight: 500, margin: '0 0 4px' },
  chipRow:{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' },
  subInfo:{ fontSize: '11px', color: '#999' },
  endArea:{ display: 'flex', alignItems: 'center', gap: '4px' },
  rightArea: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  price:  { fontSize: '16px', fontWeight: 700, color: 'var(--saize-red)' },
};

export default MenuListItem;
