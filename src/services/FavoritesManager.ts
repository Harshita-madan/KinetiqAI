import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';

export class FavoritesManager {
  static async getFavorites(): Promise<string[]> {
    try {
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  static async saveFavorites(favorites: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  static async addFavorite(exerciseId: string): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.includes(exerciseId)) {
      favorites.push(exerciseId);
      await this.saveFavorites(favorites);
    }
  }

  static async removeFavorite(exerciseId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const updatedFavorites = favorites.filter(id => id !== exerciseId);
    await this.saveFavorites(updatedFavorites);
  }

  static async toggleFavorite(exerciseId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    const isFavorite = favorites.includes(exerciseId);
    if (isFavorite) {
      await this.removeFavorite(exerciseId);
    } else {
      await this.addFavorite(exerciseId);
    }
    return !isFavorite; // Return new state
  }
}
