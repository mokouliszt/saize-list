import React from 'react';
import { IonChip, IonLabel } from '@ionic/react';
import type { Genre } from '../models/types';

interface Props {
  genres: Genre[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

const CategoryFilter: React.FC<Props> = ({ genres, selectedId, onSelect }) => {
  return (
    <div style={styles.container}>
      <IonChip
        onClick={() => onSelect(null)}
        style={{
          ...styles.chip,
          '--background': selectedId === null ? 'var(--saize-green)' : 'var(--saize-green-bg)',
          '--color':      selectedId === null ? '#fff' : 'var(--saize-green)',
          fontWeight:     selectedId === null ? 700 : 400,
        }}
      >
        <IonLabel>すべて</IonLabel>
      </IonChip>

      {genres.map(g => {
        const isSel = selectedId === g.id;
        return (
          <IonChip
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={{
              ...styles.chip,
              '--background': isSel
                ? (g.isUserCreated ? g.colorHex : 'var(--saize-green)')
                : (g.isUserCreated ? g.colorHex + '22' : 'var(--saize-green-bg)'),
              '--color': isSel ? '#fff' : (g.isUserCreated ? g.colorHex : 'var(--saize-green)'),
              fontWeight: isSel ? 700 : 400,
            }}
          >
            <IonLabel>{g.name}</IonLabel>
          </IonChip>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', overflowX: 'auto',
    padding: '6px 12px', gap: '6px',
    scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
  },
  chip: { flexShrink: 0, margin: 0, cursor: 'pointer', transition: 'background 0.15s' },
};

export default CategoryFilter;
