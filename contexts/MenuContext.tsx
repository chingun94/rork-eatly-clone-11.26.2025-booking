import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

export const [MenuContext, useMenu] = createContextHook(() => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return {
    selectedCategory,
    setSelectedCategory,
  };
});
