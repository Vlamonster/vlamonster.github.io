document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const machineSelect = document.getElementById('machine-select');
    const powerSelect = document.getElementById('power-select');
    const coil = document.getElementById('coil');
    const coilSelect = document.getElementById('coil-select')

    const speedModifier = document.getElementById('speed-modifier');
    const energyModifier = document.getElementById('energy-modifier');

    const powerTier = document.getElementById('power-tier');
    const parallelsPerTier = document.getElementById('parallels-per-tier');
    const parallelOffset = document.getElementById('parallel-offset');
    const maxParallels = document.getElementById('max-parallels');

    const recipeSearch = document.getElementById('recipe-search');
    const recipeSelect = document.getElementById('recipe-select');
    const eu = document.getElementById('eu');
    const time = document.getElementById('time');
    const totalEU = document.getElementById('total-eu');

    const discountedEU = document.getElementById('discounted-eu');
    const totalDiscountedEU = document.getElementById('total-discounted-eu');
    const effectiveProcessingTime = document.getElementById('effective-processing-time');
    const achievedParallels = document.getElementById('achieved-parallels');
    const overclocks = document.getElementById('overclocks');
    const perfectOverclocks = document.getElementById('perfect-overclocks');
    const regularOverclocks = document.getElementById('regular-overclocks');
    const overclockedProcessingTime = document.getElementById('overclocked-processing-time');
    const subTickParallels = document.getElementById('sub-tick-parallels');
    const advisedBatch = document.getElementById('advised-batch');

    let parameters = {};

    // Fetch machine data and initialize dropdowns
    fetch('machines.json')
        .then(response => response.json())
        .then(data => {
            populateMachineDropdown(data);
            populatePowerDropdown();
            populateCoilDropdown();

            // Listen for change in machine selection
            machineSelect.addEventListener('change', ({ target: { value: machine } }) => {
                // Allow coil selection for these machines
                if (machine === "Volcanus" || machine === "Mega Oil Cracker") {
                    coil.style.display = null;
                } else {
                    coil.style.display = 'none';
                }

                parameters.machine = machine;
                parameters.power = localStorage.getItem(`${machine}-power`) || '';
                parameters.coil = localStorage.getItem(`${machine}-coil`) || '';
                powerSelect.value = parameters.power;
                coilSelect.value = parameters.coil;
                displayMachineDetails(parameters, data);
                populateRecipeDropdown(parameters, data);
                renderRecipeDetails(parameters.recipe, data);
            });

            // Listen for change in power selection
            powerSelect.addEventListener('change', ({ target: { value: power } }) => {
                parameters.power = power;
                if (parameters.machine) {
                    localStorage.setItem(`${parameters.machine}-power`, power);
                }
                displayMachineDetails(parameters, data);
                renderRecipeDetails(parameters.recipe, data);
            });

            // Listen for change in coil selection
            coilSelect.addEventListener('change', ({ target: { value: coil } }) => {
                parameters.coil = coil;
                if (parameters.machine) {
                    localStorage.setItem(`${parameters.machine}-coil`, coil);
                }
                displayMachineDetails(parameters, data);
                renderRecipeDetails(parameters.recipe, data);
            });


            // Listen for change in recipe selection
            recipeSearch.addEventListener('change', ({ target: { value } }) => {
                const recipe = data[parameters.machine].recipes[value];
                parameters.recipe = recipe;
                renderRecipeDetails(recipe, data);
            });
        })
        .catch(console.error);

    // Populate the machine dropdown
    function populateMachineDropdown(data) {
        Object.keys(data).sort().forEach(machine => {
            machineSelect.appendChild(createOption(machine, machine));
        });
    }

    // Populate the power dropdown
    function populatePowerDropdown() {
        const powerValues = [8, 32, 128, 512, 2048, 8192, 32768, 131072, 524288, 2097152, 8388608, 33554432, 134217728, 536870912, 2147483648, 8589934592, 34359738368, 137438953472, 549755813888];

        powerValues.forEach(power => {
            powerSelect.appendChild(createOption(power, power.toLocaleString()));
        });
    }

    // Populate the coil dropdown
    function populateCoilDropdown() {
        const coilValues = [1801, 2701, 3601, 4501, 5401, 6301, 7201, 8101, 9001, 9901, 10801, 11701, 12601, 13501];

        coilValues.forEach(coil => {
            coilSelect.appendChild(createOption(coil, coil.toLocaleString()));
        });
    }

    // Helper function to create options
    function createOption(value, textContent, disabled = false, selected = false) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = textContent;
        option.disabled = disabled;
        option.selected = selected;
        return option;
    }

    // Display machine details.
    function displayMachineDetails(parameters, data) {
        const {speed_modifier, energy_modifier, parallels_per_tier, parallels_offset} = data[parameters.machine] || {};

        speedModifier.textContent = speed_modifier.toFixed(2);
        energyModifier.textContent = energy_modifier.toFixed(2);
        const tier = Math.floor(Math.log(parameters.power / 8) / Math.log(4))
        powerTier.textContent = `${tier}`;
        parallelsPerTier.textContent = parallels_per_tier;
        parallelOffset.textContent = parallels_offset;
        maxParallels.textContent = parallels_offset + tier * parallels_per_tier;
    }

    function populateRecipeDropdown(parameters, data) {
        recipeSelect.innerHTML = '';
        const recipes = Object.keys(data[parameters.machine]?.recipes || []);

        // Populate recipes
        recipes.forEach(recipe => recipeSelect.appendChild(createOption(recipe, recipe)));

        // Handle filtering based on user input
        recipeSearch.addEventListener('input', ({ target: { value } }) => {
            const filteredRecipes = recipes.filter(recipe =>
                recipe.toLowerCase().includes(value.toLowerCase())
            );
            recipeSelect.innerHTML = '';
            filteredRecipes.forEach(recipe => recipeSelect.appendChild(createOption(recipe, recipe)));
        });
    }

    function renderRecipeDetails(recipe, data) {
        if (recipe == null) {
            return
        }

        const {speed_modifier, energy_modifier, parallels_per_tier, parallels_offset, perfect_overclock} = data[parameters.machine] || {};

        // TODO: Maybe add another field or update the energy modifier field
        const machineModifiers = {
            "Volcanus": {
                energyModifier: () => 0.95 ** Math.floor((parameters.coil - recipe.heat) / 900),
                perfectOverclocks: (overclocks) => Math.min(overclocks, Math.max(Math.floor((parameters.coil - recipe.heat) / 1800), 0))
            },
            "Mega Oil Cracker": {
                energyModifier: () => Math.max(0.50, 1 - 0.10 * Math.floor((parameters.coil - 901) / 900)),
                perfectOverclocks: () => 0,
            }
        };

        const modifiers = machineModifiers[parameters.machine] || {
            energyModifier: () => energy_modifier,
            perfectOverclocks: () => 0,
        }

        const _tier = Math.floor(Math.log(parameters.power / 8) / Math.log(4))
        const _maxParallels = parallels_offset + _tier * parallels_per_tier
        const _totalEU = recipe.eu * recipe.time * 20;
        const _discountedEU = Math.floor(recipe.eu * modifiers.energyModifier());
        const _totalDiscountedEU = _discountedEU * recipe.time * 20;
        const _effectiveProcessingTimeTicks = Math.floor(recipe.time * 20 / speed_modifier);
        const _effectiveProcessingTime = _effectiveProcessingTimeTicks / 20;
        const _achievedParallels = Math.min(Math.floor(parameters.power / _discountedEU), _maxParallels);
        const _overclocks = Math.floor(Math.log(parameters.power / (_achievedParallels * _discountedEU)) / Math.log(4));
        const _perfectOverclocks = modifiers.perfectOverclocks(_overclocks);
        const _regularOverclocks = _overclocks - _perfectOverclocks;
        const _overclockedProcessingTimeTicks = recipe.time * 20 / speed_modifier / 2 ** _regularOverclocks / 4 ** _perfectOverclocks;
        const _overclockedProcessingTime = _overclockedProcessingTimeTicks / 20;
        const _subTickParallels = _overclockedProcessingTimeTicks < 1 ? Math.floor(_maxParallels / _overclockedProcessingTimeTicks) : 0;
        const _correctedProccesingTimeTicks = _overclockedProcessingTimeTicks < 1 ? 1 : Math.floor(_overclockedProcessingTimeTicks);
        const _advicedBatch = _correctedProccesingTimeTicks <= 20 ? Math.floor(Math.max(_achievedParallels, _subTickParallels) * 20.99 / _correctedProccesingTimeTicks) : _achievedParallels;

        // Before horizontal rule
        eu.textContent = recipe.eu.toLocaleString();
        time.textContent = recipe.time.toFixed(2);
        totalEU.textContent = _totalEU.toLocaleString();

        // After horizontal rule
        discountedEU.textContent = _discountedEU.toLocaleString();
        totalDiscountedEU.textContent = _totalDiscountedEU.toLocaleString();
        effectiveProcessingTime.textContent = _effectiveProcessingTime.toFixed(2);
        achievedParallels.textContent = _achievedParallels.toLocaleString();
        overclocks.textContent = _overclocks.toLocaleString();
        perfectOverclocks.textContent = _perfectOverclocks.toLocaleString();
        regularOverclocks.textContent = _regularOverclocks.toLocaleString();
        overclockedProcessingTime.textContent = _overclockedProcessingTime.toFixed(5);
        subTickParallels.textContent = _subTickParallels.toLocaleString();
        advisedBatch.textContent = _advicedBatch.toLocaleString();

        if (!perfect_overclock) {
            perfectOverclocks.style.backgroundColor = "#202325";
            perfectOverclocks.textContent = "-";
        } else {
            perfectOverclocks.style.backgroundColor = null;
        }
    }
});
