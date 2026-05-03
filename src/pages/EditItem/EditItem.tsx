import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonInput, IonButton, IonToggle,
  IonIcon, IonButtons, IonBackButton, IonNote, IonSelect,
  IonSelectOption, IonToast, IonAlert,
  useIonRouter,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useMenuStore } from '../../store/menuStore';

const EMOJI_OPTIONS = ['🍽️','🥗','🍝','🍕','🍚','🍲','🥩','🍗','🦐','🐟','🍷','🍺','🧃','🍰','🍮'];

interface Props {
  match: { params: { id: string } };
}

const EditItem: React.FC<Props> = ({ match }) => {
  const router  = useIonRouter();
  const itemId  = Number(match.params.id);
  const { genres, getItemById, updateItem, deleteItem, toast, clearToast } = useMenuStore();

  const [name,            setName]            = useState('');
  const [price,           setPrice]           = useState('');
  const [sortKana,        setSortKana]        = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
  const [icon,            setIcon]            = useState('🍽️');
  const [isAlcohol,       setIsAlcohol]       = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [notFound,        setNotFound]        = useState(false);

  useEffect(() => {
    const item = getItemById(itemId);
    if (!item || !item.isUserAdded) { setNotFound(true); return; }
    setName(item.name);
    setPrice(String(item.price));
    setSortKana(item.sortKana);

    setSelectedGenreId(item.genreId);
    setIcon(item.icon || '🍽️');
    setIsAlcohol(item.isAlcohol);
  }, [itemId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())                                         e.name  = 'メニュー名は必須です';
    if (!price || isNaN(Number(price)) || Number(price) < 0) e.price = '有効な価格を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await updateItem({
      id: itemId, name: name.trim(), price: Number(price),
      genreId: selectedGenreId, icon, isAlcohol, isUserAdded: true,
      sortKana: sortKana.trim() || name.trim(), note: '',
      calorie: undefined, salt: undefined,
    });
    router.goBack();
  };

  const handleDelete = async () => {
    await deleteItem(itemId);
    router.push('/home', 'back');
  };

  if (notFound) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start"><IonBackButton defaultHref="/home" text="戻る" /></IonButtons>
            <IonTitle>メニューを編集</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#999' }}>
            <p style={{ fontSize: '40px' }}>🚫</p>
            <p>このメニューは編集できません</p>
            <p style={{ fontSize: '13px' }}>ユーザー追加メニューのみ編集可能です</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/home" text="戻る" /></IonButtons>
          <IonTitle>メニューを編集</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="light" onClick={() => setShowDeleteAlert(true)}>
              <IonIcon icon={trashOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel position="stacked">アイコン</IonLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 0 8px 2px' }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setIcon(e)} style={{
                  fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px',
                  outline: icon === e ? '2px solid var(--saize-green)' : 'none',
                  backgroundColor: icon === e ? 'var(--saize-green-bg)' : 'transparent',
                }}>{e}</button>
              ))}
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">メニュー名 <span style={{ color: 'var(--saize-red)' }}>*</span></IonLabel>
            <IonInput value={name} onIonInput={e => setName(e.detail.value ?? '')} clearInput />
            {errors.name && <IonNote slot="error" color="danger">{errors.name}</IonNote>}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">価格 (税込・円) <span style={{ color: 'var(--saize-red)' }}>*</span></IonLabel>
            <IonInput type="number" inputmode="numeric" value={price} onIonInput={e => setPrice(e.detail.value ?? '')} />
            {errors.price && <IonNote slot="error" color="danger">{errors.price}</IonNote>}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">読み仮名 (五十音ソート用)</IonLabel>
            <IonInput value={sortKana} onIonInput={e => setSortKana(e.detail.value ?? '')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">ジャンル</IonLabel>
            <IonSelect value={selectedGenreId} onIonChange={e => setSelectedGenreId(Number(e.detail.value))} interface="action-sheet">
              <IonSelectOption value={0}>未分類</IonSelectOption>
              {genres.map(g => <IonSelectOption key={g.id} value={g.id}>{g.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>アルコール 🍺</IonLabel>
            <IonToggle slot="end" checked={isAlcohol} onIonChange={e => setIsAlcohol(e.detail.checked)} color="primary" />
          </IonItem>


        </IonList>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <IonButton expand="block" color="primary" onClick={handleSave}>保存する</IonButton>
          <IonButton expand="block" fill="outline" color="danger" onClick={() => setShowDeleteAlert(true)}>
            <IonIcon icon={trashOutline} slot="start" />
            このメニューを削除
          </IonButton>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showDeleteAlert}
        header="削除の確認"
        message={`「${name}」を削除しますか？この操作は元に戻せません。`}
        buttons={[
          { text: 'キャンセル', role: 'cancel', handler: () => setShowDeleteAlert(false) },
          { text: '削除する', role: 'destructive', handler: handleDelete },
        ]}
        onDidDismiss={() => setShowDeleteAlert(false)}
      />
      <IonToast isOpen={!!toast} message={toast?.message} color={toast?.color} duration={2000} onDidDismiss={clearToast} />
    </IonPage>
  );
};

export default EditItem;
