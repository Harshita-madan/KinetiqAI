import { create } from 'zustand';
import { FavoritesManager } from '../services/FavoritesManager';

interface FavoritesState {
  favorites: string[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (exerciseId: string) => Promise<void>;
  removeFavorite: (exerciseId: string) => Promise<void>;
  toggleFavorite: (exerciseId: string) => Promise<boolean>;
  isFavorite: (exerciseId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    try {
      const favorites = await FavoritesManager.getFavorites();
      set({ favorites, isLoading: false });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ isLoading: false });
    }
  },

  addFavorite: async (exerciseId: string) => {
    const { favorites } = get();
    if (!favorites.includes(exerciseId)) {
      const newFavorites = [...favorites, exerciseId];
      set({ favorites: newFavorites });
      await FavoritesManager.saveFavorites(newFavorites);
    }
  },

  removeFavorite: async (exerciseId: string) => {
    const { favorites } = get();
    const newFavorites = favorites.filter(id => id !== exerciseId);
    set({ favorites: newFavorites });
    await FavoritesManager.saveFavorites(newFavorites);
  },

  toggleFavorite: async (exerciseId: string) => {
    const { favorites } = get();
    const isCurrentlyFavorite = favorites.includes(exerciseId);
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    set({ favorites: newFavorites });
    await FavoritesManager.saveFavorites(newFavorites);
    return !isCurrentlyFavorite;
  },

  isFavorite: (exerciseId: string) => {
    const { favorites } = get();
    return favorites.includes(exerciseId);
  },
}));
