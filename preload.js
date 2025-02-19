const { contextBridge } = require("electron");

const api = {
  async getBybitPrice(symbol) {
    try {
      const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.retCode === 0 && data.result.list.length > 0) {
        return data.result.list[0].lastPrice;
      }
      throw new Error("Dados inválidos na resposta da Bybit");
    } catch (error) {
      console.error(`Erro ao buscar preço da Bybit para ${symbol}:`, error);
      throw error;
    }
  },

  async getCoinExPrice(symbol) {
    try {
      const url = `https://api.coinex.com/v1/market/ticker?market=${symbol}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.ticker) {
        return data.data.ticker.last;
      }
      throw new Error("Dados inválidos na resposta da CoinEx");
    } catch (error) {
      console.error(`Erro ao buscar preço da CoinEx para ${symbol}:`, error);
      throw error;
    }
  },

  async getBybitPairs() {
    try {
      const url = "https://api.bybit.com/v5/market/tickers?category=spot";
      const response = await fetch(url);
      const data = await response.json();
      return data.result.list.map((ticker) => ticker.symbol);
    } catch (error) {
      console.error("Erro ao buscar pares da Bybit:", error);
      throw error;
    }
  },

  async getCoinExPairs() {
    try {
      const url = "https://api.coinex.com/v1/market/list";
      const response = await fetch(url);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Erro ao buscar pares da CoinEx:", error);
      throw error;
    }
  },

  async getCommonPairs() {
    try {
      const [bybitPairs, coinexPairs] = await Promise.all([
        this.getBybitPairs(),
        this.getCoinExPairs(),
      ]);
      return bybitPairs.filter((pair) => coinexPairs.includes(pair));
    } catch (error) {
      console.error("Erro ao buscar pares comuns:", error);
      throw error;
    }
  },
};

contextBridge.exposeInMainWorld("api", api);
