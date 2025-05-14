let currentEditId = null;

function saveQuery(soilType, ph, n, p, k, results) {
  const queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
  const newQuery = {
    id: Date.now(),
    date: new Date().toLocaleString('en-US'),
    soilType,ph,n,p,k,results
  };
  queries.unshift(newQuery);
  localStorage.setItem('cropQueries', JSON.stringify(queries));
  displaySavedQueries();
}

function displaySavedQueries() {
  const queriesList = document.getElementById('savedQueriesList');
  const queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
  queriesList.innerHTML = queries.map(query => `
    <tr class="query-item" data-id="${query.id}">
      <td>${query.date}</td>
      <td>${query.soilType}</td>
      <td>${query.ph}</td>
      <td>${query.n}</td>
      <td>${query.p}</td>
      <td>${query.k}</td>
      <td>${query.results}</td>
      <td>
        <button class="action-btn edit-btn" onclick="enterEditMode(${query.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteQuery(${query.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function deleteQuery(id) {
  if (confirm('Are you sure you want to delete this query?')) {
    const queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
    const updatedQueries = queries.filter(query => query.id !== id);
    localStorage.setItem('cropQueries', JSON.stringify(updatedQueries));
    displaySavedQueries();
    if (currentEditId === id) exitEditMode();
  }
}

function enterEditMode(id) {
  const queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
  const query = queries.find(q => q.id === id);
  if (query) {
    currentEditId = id;
    document.getElementById('soilType').value = query.soilType;
    document.getElementById('ph').value = query.ph;
    document.getElementById('n').value = query.n;
    document.getElementById('p').value = query.p;
    document.getElementById('k').value = query.k;
    document.querySelector('button[type="submit"]').textContent = 'Update Query';
    document.getElementById("resultArea").innerHTML = query.results;
  }
}

function exitEditMode() {
  currentEditId = null;
  document.querySelector('button[type="submit"]').textContent = 'Get Recommendation';
  ['soilType', 'ph', 'n', 'p', 'k'].forEach(id => document.getElementById(id).value = '');
  document.getElementById("resultArea").innerHTML = '';
}

document.addEventListener('DOMContentLoaded', displaySavedQueries);

document.getElementById("recommendForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const soilType = document.getElementById("soilType").value;
  const ph = parseFloat(document.getElementById("ph").value);
  const n = parseFloat(document.getElementById("n").value);
  const p = parseFloat(document.getElementById("p").value);
  const k = parseFloat(document.getElementById("k").value);
  const resultArea = document.getElementById("resultArea");

  if (ph < 0 || ph > 14 || n < 0 || p < 0 || k < 0) {
    resultArea.textContent = "Please check your input values.";
    return;
  }

  try {
    const response = await fetch("./4.json");
    const data = await response.json();
    const crops = data.Crop || [];
    const matchingCrops = crops.filter(crop =>
      crop.SuitableSoilType.toLowerCase() === soilType.toLowerCase()
    );

    const results = matchingCrops.length === 0 ? "No suitable crops found for this soil type.": "<strong>Recommended Crops:</strong><br>" +
        matchingCrops.map(crop => `- ${crop.CropName}`).join("<br>");

    resultArea.innerHTML = results;

    if (currentEditId) {
      const queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
      const queryIndex = queries.findIndex(q => q.id === currentEditId);
      if (queryIndex !== -1) {
        queries[queryIndex] = {
          ...queries[queryIndex],
          soilType, ph, n, p, k, results,
          date: new Date().toLocaleString('en-US')
        };
        localStorage.setItem('cropQueries', JSON.stringify(queries));
        displaySavedQueries();
        exitEditMode();
      }
    } else {
      saveQuery(soilType, ph, n, p, k, results);
    }
  } catch (err) {
    resultArea.textContent = "Error loading crop data.";
  }
});
