let totalCoins = 0;

export const updateTotalCoins = (newTotal: number) => {
    totalCoins = newTotal;
  };
  
  export const getTotalCoins = () => {
    return totalCoins;
  };