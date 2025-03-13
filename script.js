// wait for the DOM to load before running the script
document.addEventListener("DOMContentLoaded", function () {
  function normalRandom() {
    let u1 = 0,
      u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    let r = Math.sqrt(-2.0 * Math.log(u1));
    let theta = 2.0 * Math.PI * u2;
    return r * Math.cos(theta);
  }

  function monteCarloSimulation(
    N_ref,
    CV,
    N_counted,
    N_required,
    num_simulations,
    mu_weight_sample,
    updateProgress
  ) {
    return new Promise((resolve) => {
      const sigma_weight_sample = CV * mu_weight_sample;
      const simulated_counts = new Array(num_simulations);
      let i = 0;

      function simulateChunk() {
        const chunkSize = Math.floor(num_simulations / 100);
        for (let j = 0; j < chunkSize && i < num_simulations; j++, i++) {
          let reference_weights = 0;
          for (let k = 0; k < N_ref; k++) {
            reference_weights +=
              mu_weight_sample + normalRandom() * sigma_weight_sample;
          }

          let counted_weights = 0;
          for (let k = 0; k < N_counted; k++) {
            counted_weights +=
              mu_weight_sample + normalRandom() * sigma_weight_sample;
          }

          if (reference_weights <= 0) {
            simulated_counts[i] = NaN;
          } else {
            simulated_counts[i] = N_ref * (counted_weights / reference_weights);
          }
        }

        updateProgress(
          `Simulating... ${Math.floor((i / num_simulations) * 100)}%`
        );

        if (i < num_simulations) {
          setTimeout(simulateChunk, 0);
        } else {
          // Simulation complete, but still have to process results

          const simulated_counts_valid = simulated_counts.filter(
            Number.isFinite
          );

          let confidence_level = NaN;
          let std_dev_count_estimate = NaN;

          if (simulated_counts_valid.length > 0) {
            const mean =
              simulated_counts_valid.reduce((a, b) => a + b, 0) /
              simulated_counts_valid.length;
            std_dev_count_estimate = Math.sqrt(
              simulated_counts_valid.reduce((sum, val) => {
                return sum + Math.pow(val - mean, 2);
              }, 0) /
                (simulated_counts_valid.length - 1)
            );
            const confidence_level_proportion =
              simulated_counts_valid.filter(
                (count) => count >= N_required - 0.5
              ).length / simulated_counts_valid.length;
            confidence_level = confidence_level_proportion * 100;
          }

          // processing results complete

          resolve({
            confidence_level,
            std_dev_count_estimate,
            simulated_counts_valid,
          });
        }
      }

      simulateChunk();
    });
  }

  function runSimulation() {
    const N_ref_input = parseInt(document.getElementById("N_ref_input").value);
    const CV_input = parseFloat(document.getElementById("CV_input").value);
    const N_counted_input = parseInt(
      document.getElementById("N_counted_input").value
    );
    const N_required_input = parseInt(
      document.getElementById("N_required_input").value
    );
    let num_simulations_input = parseInt(
      document.getElementById("num_simulations_input").value
    );
    const assumed_mean_weight = parseFloat(
      document.getElementById("assumed_mean_weight").value
    );

    if (
      N_ref_input > 0 &&
      CV_input >= 0 &&
      N_counted_input >= 0 &&
      N_required_input >= 0 &&
      num_simulations_input > 0 &&
      assumed_mean_weight > 0
    ) {
      if (num_simulations_input > 100000) {
        alert("Warning: Limiting simulations to 100,000 as maximum allowed.");
        num_simulations_input = 100000;
        document.getElementById("num_simulations_input").value = 100000; // Update input field
      }

      runButton.disabled = true;
      runButton.textContent = "Running... 0%";

      const updateProgress = (message) => {
        runButton.textContent = message;
      };

      monteCarloSimulation(
        N_ref_input,
        CV_input,
        N_counted_input,
        N_required_input,
        num_simulations_input,
        assumed_mean_weight,
        updateProgress
      ).then((results) => {
        displayResults(results, N_counted_input, N_required_input);
        runButton.disabled = false;
        runButton.textContent = "Run Simulation";
      });
    } else {
      alert(
        "Please ensure all input parameters are valid (N_ref, N_counted, N_required, num_simulations >= 0, CV >= 0, assumed_mean_weight > 0)."
      );
    }
  }

  function displayResults(results, N_counted, N_required) {
    const resultsDiv = document.getElementById("results-text");
    resultsDiv.innerHTML = `
      <p><strong>Monte Carlo Simulation Results:</strong></p>
      <p>Number of Simulations: ${
        document.getElementById("num_simulations_input").value
      }</p>
      <p>Input Parameters:</p>
      <p>  N_ref: ${document.getElementById("N_ref_input").value}, CV: ${
      document.getElementById("CV_input").value
    }, N_counted: ${
      document.getElementById("N_counted_input").value
    }, N_required: ${document.getElementById("N_required_input").value}</p>
      <p>Estimated Standard Deviation of Count Estimate: ${
        results.std_dev_count_estimate
          ? results.std_dev_count_estimate.toFixed(4)
          : "NaN"
      }</p>
      <p>Confidence Level (True Count >= N_required): ${
        results.confidence_level
          ? results.confidence_level.toFixed(2) + "%"
          : "NaN%"
      }</p>
  `;

    if (
      results.simulated_counts_valid &&
      results.simulated_counts_valid.length > 0
    ) {
      plotHistogram(results.simulated_counts_valid, N_counted, N_required);
    } else {
      resultsDiv.innerHTML +=
        "<p>Warning: No valid simulated counts generated (W_ref_total was always non-positive).<br>This is highly unusual unless parameters are very extreme.</p>";
      clearPlot(); // Clear any previous plot if no valid data.
    }
  }

  function plotHistogram(sim_counts, N_counted, N_required) {
    const trace = {
      x: sim_counts,
      type: "histogram",
      histnorm: "density",
      marker: {
        color: "green",
        line: {
          color: "darkgreen",
          width: 1,
        },
      },
      opacity: 0.6,
    };

    const layout = {
      title: "Histogram of Monte Carlo Simulated Count Estimates",
      xaxis: { title: "Simulated Count Estimate" },
      yaxis: { title: "Density" },
      shapes: [
        {
          type: "line",
          x0: N_counted,
          x1: N_counted,
          y0: 0,
          y1: 1,
          yref: "y domain",
          line: { color: "red", dash: "dash", width: 1 },
        },
        {
          type: "line",
          x0: N_required - 0.5,
          x1: N_required - 0.5,
          y0: 0,
          y1: 1,
          yref: "y domain",
          line: { color: "blue", dash: "dash", width: 1 },
        },
      ],
      annotations: [
        {
          x: N_counted,
          y: 0.9,
          xref: "x",
          yref: "y domain",
          text: `Displayed Count (${N_counted})`,
          showarrow: false,
          xanchor: "left",
        },
        {
          x: N_required - 0.5,
          y: 0.8,
          xref: "x",
          yref: "y domain",
          text: `N_required Lower Bound (${N_required - 0.5})`,
          showarrow: false,
          xanchor: "left",
        },
      ],
      bargap: 0.1,
      yaxis: { gridcolor: "#ddd" },
    };

    Plotly.newPlot("plot-container", [trace], layout);
  }

  function clearPlot() {
    Plotly.purge("plot-container"); // Clears the plot area
  }

  const runButton = document.getElementById("run");
  runButton.addEventListener("click", runSimulation);
});
