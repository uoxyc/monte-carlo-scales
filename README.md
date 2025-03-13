# Monte Carlo Part Count Confidence

This web application performs a Monte Carlo simulation to estimate the confidence level of part counts based on given parameters. The simulation helps in understanding the variability and confidence in the counted quantities.

## Features

- Input parameters for the simulation including reference count, coefficient of variation, counted quantity, required quantity, and number of simulations.
- Displays the simulation results including the estimated standard deviation of the count estimate and the confidence level.
- Plots a histogram of the simulated count estimates using Plotly.

## Getting Started

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge)

### Running the Application

1. Open the `index.html` file in your web browser.
2. Enter the simulation parameters in the input fields.
3. Click the "Run Simulation" button to start the simulation.
4. View the results and histogram in the results section.

## Simulation Parameters

- **N_ref (Reference Count):** The number of reference parts used in the simulation.
- **CV (Coefficient of Variation):** The coefficient of variation of the part weights.
- **N_counted (Counted Quantity):** The number of parts counted.
- **N_required (Required Quantity):** The required quantity of parts.
- **Number of Simulations:** The number of simulations to run.

## Results

- **Estimated Standard Deviation of Count Estimate:** The standard deviation of the count estimates from the simulation.
- **Confidence Level (True Count >= N_required):** The confidence level that the true count is greater than or equal to the required quantity.

## Plot

The histogram plot shows the distribution of the simulated count estimates. It includes lines indicating the counted quantity and the lower bound of the required quantity.
