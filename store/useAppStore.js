import { create } from 'zustand';

const useAppStore = create((set) => ({
  // i18n
  language: 'en',
  setLanguage: (language) => set({ language }),

  // character creation flow
  selectedCharacter: null,
  customName: '',
  hobbies: [],
  interests: [],
  setCharacter: (selectedCharacter) => set({ selectedCharacter }),
  setCustomName: (customName) => set({ customName }),
  setHobbies: (hobbies) => set({ hobbies }),
  setInterests: (interests) => set({ interests }),

  // auth
  user: null,
  setUser: (user) => set({ user }),

  // subscription
  isPremium: false,
  setIsPremium: (isPremium) => set({ isPremium }),

  // active chat
  activeCompanionId: null,
  messageCount: 0,
  setActiveCompanion: (activeCompanionId) => set({ activeCompanionId, messageCount: 0 }),
  incrementMessageCount: () => set((s) => ({ messageCount: s.messageCount + 1 })),
  resetMessageCount: () => set({ messageCount: 0 }),

  // reset character flow (used by "+ Select New Girlfriend")
  resetCharacterFlow: () =>
    set({
      selectedCharacter: null,
      customName: '',
      hobbies: [],
      interests: [],
      activeCompanionId: null,
      messageCount: 0,
    }),
}));

export default useAppStore;
