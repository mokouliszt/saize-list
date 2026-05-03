import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonInput, IonButton, IonToggle,
  IonIcon, IonButtons, IonBackButton, IonNote, IonSelect,
  IonSelectOption, IonToast,
  useIonRouter,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useMenuStore } from '../../store/menuStore';

const EMOJI_OPTIONS = ['🍽️','🥗','🍝','🍕','🍚','🍲','🥩','🍗','🦐','🐟','🍷','🍺','🧃','🍰','🍮'];

const AddItem: React.FC = () => {
  const router = useIonRouter();
  const { items, genres, addItem, addGenre, toast, clearToast } = useMenuStore();

  const [name,            setName]            = useState('');
  const [price,           setPrice]           = useState('');
  const [menuNumber,      setMenuNumber]       = useState('');
  const [sortKana,        setSortKana]        = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
  const [icon,            setIcon]            = useState('🍽️');
  const [isAlcohol,       setIsAlcohol]       = useState(false);
  const [newTagName,      setNewTagName]      = useState('');
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim())                                          e.name  = 'メニュー名は必須です';
    if (!price || isNaN(Number(price)) || Number(price) < 0)  e.price = '有効な価格を入力してください';
    if (menuNumber.trim()) {
      const n = Number(menuNumber);
      if (!Number.isInteger(n) || n <= 0)                     e.menuNumber = '正の整数で入力してください';
      else if (items.some(i => i.id === n))                   e.menuNumber = 'この番号はすでに使われています';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const customId = menuNumber.trim() ? Number(menuNumber) : undefined;
    await addItem({
      name:     name.trim(),
      price:    Number(price),
      genreId:  selectedGenreId,
      calorie:  undefined,
      salt:     undefined,
      icon,
      isAlcohol,
      sortKana: sortKana.trim() || name.trim(),
      note:     '',
    }, customId);
    router.goBack();
  };

  const handleAddNewTag = async () => {
    const n = newTagName.trim();
    if (!n) return;
    await addGenre(n);
    setNewTagName('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="戻る" />
          </IonButtons>
          <IonTitle>ユーザーメニューを追加</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {/* アイコン選択 */}
          <IonItem>
            <IonLabel position="stacked">アイコン</IonLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 0 8px 2px' }}>
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  style={{
                    fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px', borderRadius: '8px',
                    outline: icon === e ? '2px solid var(--saize-green)' : 'none',
                    backgroundColor: icon === e ? 'var(--saize-green-bg)' : 'transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </IonItem>

          {/* メニュー名 */}
          <IonItem>
            <IonLabel position="stacked">
              メニュー名 <span style={{ color: 'var(--saize-red)' }}>*</span>
            </IonLabel>
            <IonInput
              value={name}
              onIonInput={e => setName(e.detail.value ?? '')}
              placeholder="例: 特製アレンジドリア"
              clearInput
            />
            {errors.name && <IonNote slot="error" color="danger">{errors.name}</IonNote>}
          </IonItem>

          {/* 価格 */}
          <IonItem>
            <IonLabel position="stacked">
              価格 (税込・円) <span style={{ color: 'var(--saize-red)' }}>*</span>
            </IonLabel>
            <IonInput
              type="number"
              inputmode="numeric"
              value={price}
              onIonInput={e => setPrice(e.detail.value ?? '')}
              placeholder="例: 350"
            />
            {errors.price && <IonNote slot="error" color="danger">{errors.price}</IonNote>}
          </IonItem>

          {/* 読み仮名 */}
          <IonItem>
            <IonLabel position="stacked">読み仮名 (五十音ソート用)</IonLabel>
            <IonInput
              value={sortKana}
              onIonInput={e => setSortKana(e.detail.value ?? '')}
              placeholder="例: とくせいあれんじどりあ"
            />
            <IonNote slot="helper">未入力の場合はメニュー名をそのまま使用します</IonNote>
          </IonItem>

          {/* ジャンル */}
          <IonItem>
            <IonLabel position="stacked">ジャンル</IonLabel>
            <IonSelect
              value={selectedGenreId}
              onIonChange={e => setSelectedGenreId(Number(e.detail.value))}
              placeholder="選択してください"
              interface="action-sheet"
            >
              <IonSelectOption value={0}>未分類</IonSelectOption>
              {genres.map(g => (
                <IonSelectOption key={g.id} value={g.id}>{g.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* メニュー番号 */}
          <IonItem>
            <IonLabel position="stacked">メニュー番号 (省略可)</IonLabel>
            <IonInput
              type="number"
              inputmode="numeric"
              value={menuNumber}
              onIonInput={e => setMenuNumber(e.detail.value ?? '')}
              placeholder="例: 399"
            />
            <IonNote slot="helper">省略した場合は番号なしで登録されます</IonNote>
            {errors.menuNumber && <IonNote slot="error" color="danger">{errors.menuNumber}</IonNote>}
          </IonItem>

          {/* アルコール */}
          <IonItem>
            <IonLabel>アルコール 🍺</IonLabel>
            <IonToggle
              slot="end"
              checked={isAlcohol}
              onIonChange={e => setIsAlcohol(e.detail.checked)}
              color="primary"
            />
          </IonItem>
        </IonList>

        {/* 新規タグ作成 */}
        <div style={{ padding: '12px 16px' }}>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>
            ジャンルを新規作成する場合:
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <IonInput
              value={newTagName}
              onIonInput={e => setNewTagName(e.detail.value ?? '')}
              placeholder="新規ジャンル名"
              style={{ '--background': '#f5f5f5', '--border-radius': '8px', flex: 1 }}
            />
            <IonButton size="small" color="primary" onClick={handleAddNewTag} disabled={!newTagName.trim()}>
              <IonIcon icon={add} slot="start" />
              作成
            </IonButton>
          </div>
        </div>

        {/* 保存ボタン */}
        <div style={{ padding: '16px' }}>
          <IonButton expand="block" color="primary" onClick={handleSave}>
            保存する
          </IonButton>
        </div>
      </IonContent>

      <IonToast
        isOpen={!!toast}
        message={toast?.message}
        color={toast?.color}
        duration={2000}
        onDidDismiss={clearToast}
      />
    </IonPage>
  );
};

export default AddItem;
