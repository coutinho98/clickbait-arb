document.addEventListener("DOMContentLoaded", () => {
  let updateTimer = null;
  const updateInterval = 30000;
  const arbPercent = 3;

  const audioAlert = new Audio("./arb.mp3")

  const showPairs = new Map();

  let totalOpportunities = 0;
  let highestDiff = {
    pair: '',
    difference: 0,
  };

  async function updateArbitrageTable() {
    const elements = {
      status: document.getElementById("status"),
      tableBody: document.getElementById("arbitrage-table-body"),
      monitoredPairs: document.getElementById("monitored-pairs"),
      maxDifference: document.getElementById("max-difference"),
      opportunitiesCount: document.getElementById("opportunities-count")
    };

    const missingElements = Object.entries(elements)
      .filter(([_, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      console.error(`Elementos não encontrados: ${missingElements.join(', ')}`);
      return;
    }

    try {
      elements.status.textContent = "Atualizando dados...";
      const commonPairs = await window.api.getCommonPairs();
      let foundNewArbitrage = false;

      elements.monitoredPairs.textContent = commonPairs.length;

      for (const pair of commonPairs) {
        try {
          const [bybitPrice, coinexPrice] = await Promise.all([
            window.api.getBybitPrice(pair),
            window.api.getCoinExPrice(pair),
          ]);

          const bybitPriceFloat = parseFloat(bybitPrice);
          const coinexPriceFloat = parseFloat(coinexPrice);
          const difference = Math.abs(bybitPriceFloat - coinexPriceFloat);
          const percentDiff =
            (difference / Math.min(bybitPriceFloat, coinexPriceFloat)) * 100;

          if (percentDiff > highestDiff.difference) {
            highestDiff = {
              pair: pair,
              difference: percentDiff
            };
            elements.maxDifference.textContent = `${highestDiff.difference.toFixed(2)}% (${highestDiff.pair})`;
          }

          if (percentDiff >= arbPercent) {
            const timeFound = new Date().toLocaleTimeString();
            const key = `${pair}-${timeFound}`;

            if (!showPairs.has(key)) {
              foundNewArbitrage = true;
              totalOpportunities++;
              elements.opportunitiesCount.textContent = totalOpportunities;

              try {
                await audioAlert.play();
              } catch (error) {
                console.error("Erro ao tocar som:", error);
              }

              const row = document.createElement("tr");
              row.innerHTML = `
                  <td>${pair}</td>
                  <td>${bybitPriceFloat.toFixed(8)}</td>
                  <td>${coinexPriceFloat.toFixed(8)}</td>
                  <td>${difference.toFixed(8)}</td>
                  <td>${percentDiff.toFixed(2)}%</td>
                  <td>${bybitPriceFloat < coinexPriceFloat
                  ? "Comprar na Bybit, vender na CoinEx"
                  : "Comprar na CoinEx, vender na Bybit"
                }</td>
              `;

              elements.tableBody.insertBefore(row, elements.tableBody.firstChild);
              showPairs.set(key, true);
            }
          }
        } catch (pairError) {
          console.error(`Erro ao processar par ${pair}:`, pairError);
          continue;
        }
      }

      const timeStr = new Date().toLocaleTimeString();
      if (foundNewArbitrage) {
        elements.status.textContent = `Última atualização: ${timeStr} - Novas oportunidades encontradas!`;
      } else {
        elements.status.textContent = `Última atualização: ${timeStr} - Nenhuma nova oportunidade acima de 3%`;
      }

    } catch (error) {
      console.error("Erro ao atualizar tabela:", error);
      if (elements.status) {
        elements.status.textContent = `Erro na atualização: ${error.message}`;
      }
    }
  }

  updateArbitrageTable();
  updateTimer = setInterval(updateArbitrageTable, updateInterval);
});