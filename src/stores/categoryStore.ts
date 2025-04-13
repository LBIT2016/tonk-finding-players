import { create } from "zustand";
import { sync } from "@tonk/keepsync";
import { useUserStore } from "./userStore";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  createdBy: string;
}

export interface CategoryState {
  categories: Record<string, Category>;
  addCategory: (name: string, color: string, icon?: string | null) => Category;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id" | "createdBy">>) => void;
  deleteCategory: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultCategories: Category[] = [
  {
    id: "free",
    name: "Free",
    color: "#73d56e",
    icon: "map-pin",
    createdBy: "system",
  },
  {
    id: "paid",
    name: "Paid",
    color: "#f4af7d",
    icon: "star",
    createdBy: "system",
  }
];

export const useCategoryStore = create<CategoryState>(
  sync(
    (set, _get) => ({
      categories: defaultCategories.reduce(
        (acc, category) => {
          acc[category.id] = category;
          return acc;
        },
        {} as Record<string, Category>,
      ),

      addCategory: (name, color, icon) => {
        const id = generateId();
        const activeProfileId = useUserStore.getState().activeProfileId;

        if (!activeProfileId) {
          console.error("No active user profile found");
          throw new Error("No active user profile found");
        }

        const newCategory: Category = {
          id,
          name,
          color,
          icon: icon === undefined ? null : icon,
          createdBy: activeProfileId,
        };

        set((state) => ({
          categories: {
            ...state.categories,
            [id]: newCategory,
          },
        }));

        return newCategory;
      },

      updateCategory: (id, updates) => {
        set((state) => {
          if (!state.categories[id]) return state;
          if (state.categories[id].createdBy === "system") {
            console.warn("Cannot modify system categories");
            return state;
          }

          const safeUpdates = { ...updates };
          if ("icon" in safeUpdates && safeUpdates.icon === undefined) {
            safeUpdates.icon = null;
          }

          return {
            categories: {
              ...state.categories,
              [id]: {
                ...state.categories[id],
                ...safeUpdates,
              },
            },
          };
        });
      },

      deleteCategory: (id) => {
        set((state) => {
          if (state.categories[id]?.createdBy === "system") {
            console.warn("Cannot delete system categories");
            return state;
          }

          const newCategories = { ...state.categories };
          delete newCategories[id];
          return { categories: newCategories };
        });
      },
    }),
    {
      docId: "my-world-categories",
      initTimeout: 30000,
      onInitError: (error) => console.error("Category sync initialization error:", error),
    },
  ),
);
