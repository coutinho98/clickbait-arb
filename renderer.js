document.addEventListener("DOMContentLoaded", () => {
  let updateTimer = null;
  const updateInterval = 5000;

  async function updateArbitrageTable() {
    const statusElement = document.getElementById("status");
    const tableBody = document.getElementById("arbitrage-table-body");

    if (!statusElement || !tableBody) {
      console.error("error");
      return;
    }

    try {
      // let it update automatically...
      statusElement.textContent = "Atualizando dados...";
      tableBody.innerHTML = "";

      const commonPairs = await window.api.getCommonPairs();

      for (const pair of commonPairs) {
        const [bybitPrice, coinexPrice] = await Promise.all([
          window.api.getBybitPrice(pair),
          window.api.getCoinExPrice(pair),
        ]);

        const bybitPriceFloat = parseFloat(bybitPrice);
        const coinexPriceFloat = parseFloat(coinexPrice);
        const difference = Math.abs(bybitPriceFloat - coinexPriceFloat);
        const percentDiff =
          (difference / Math.min(bybitPriceFloat, coinexPriceFloat)) * 100;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${pair}</td>
            <td>${bybitPriceFloat.toFixed(8)}</td>
            <td>${coinexPriceFloat.toFixed(8)}</td>
            <td>${difference.toFixed(8)}</td>
            <td>${percentDiff.toFixed(2)}%</td>
            <td>${
              bybitPriceFloat < coinexPriceFloat
                ? "Comprar na Bybit, vender na CoinEx"
                : "Comprar na CoinEx, vender na Bybit"
            }</td>
          `;
        tableBody.appendChild(row);
      }

      statusElement.textContent = `Última atualização: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      console.error("Erro ao atualizar tabela:", error);
      statusElement.textContent = `Erro na atualização: ${error.message}`;
    }
  }

  // initaite att
  updateArbitrageTable();
  updateTimer = setInterval(updateArbitrageTable, updateInterval);

  // toggle button just to test.
  const toggleButton = document.getElementById("toggleUpdates");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
        toggleButton.textContent = "Continuar Atualizações";
      } else {
        updateTimer = setInterval(updateArbitrageTable, updateInterval);
        toggleButton.textContent = "Pausar Atualizações";
        updateArbitrageTable();
      }
    });
  }
});
