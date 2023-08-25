let df;
let headers;
let datos;
async function fetchDataframe() {
  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbyOXZ294HqsNbJs2EDJDyGDn8oBQp1mRB3bAaq-IY9d8ymnEzzRx84PJrnxVLEimw-mgA/exec"
  );
  const dat = await res.json();
  return dat.datos;
}
async function initializeDf() {
  datos = await fetchDataframe();
  df = new dfd.DataFrame(datos);
  headers = df.columns;
}
const tableContainer = document.querySelector(".table-container");
const table = document.getElementById("main-table");
const tableHead = document.querySelector(".table-head");
const btnGrafico = document.getElementById("graficar");
// const button = document.querySelector(".main-button");
const optionsForm = document.getElementById("options-form");
const rowSelect = document.getElementById("rows-select");
const colSelect = document.getElementById("col-select");
const valSelect = document.getElementById("val-select");
const funSelect = document.getElementById("fun-select");

function setTable() {
  table.innerHTML = "";
  table.innerHTML = '<thead class="table-head"></thead>';
  const tableHead = document.querySelector(".table-head");
  const rowHeaders = document.createElement("tr");
  rowHeaders.innerHTML = `${headers.map((h) => `<th>${h}</th>`).join("")}`;
  tableHead.appendChild(rowHeaders);
  datos.forEach((d) => {
    // Cambio el formato de la fecha
    const fechaISO = d.FECHA;
    const fechaObj = new Date(fechaISO);
    const year = fechaObj.getUTCFullYear();
    const month = fechaObj.getUTCMonth() + 1;
    const day = fechaObj.getUTCDate();

    const nuevaFecha = `${year}-${month < 10 ? "0" : ""}${month}-${
      day < 10 ? "0" : ""
    }${day}`;

    d.FECHA = nuevaFecha;
    // --------------------
    const newRow = document.createElement("tr");
    newRow.innerHTML = headers.map((h) => `<td>${d[h]}</td>`).join("");
    table.appendChild(newRow);
  });
}
function setOptions() {
  const options = headers.map((h) => `<option>${h}</option>`);
  options.unshift(`<option value="nada">---</option>`);
  rowSelect.innerHTML = options;
  colSelect.innerHTML = options;
  valSelect.innerHTML = options;
}

function updateTable() {
  const rowOption = rowSelect.value;
  const colOption = colSelect.value;
  const valOption = valSelect.value;
  const funOption = funSelect.value;

  // Creación de variables
  let newColumns;
  let groupedData;
  let newTableHead;
  let tableHeaders;

  if (rowOption !== "nada" && colOption !== "nada") {
    btnGrafico.style.display = "block";
    groupedData = df
      .groupby([rowOption, colOption])
      .agg({ [valOption]: funOption }).values;

    //Utilizamos Set para eliminar valores repetidos
    newColumns = [...new Set(datos.map((item) => item[colOption]))];

    // Eliminamos el contenido anterior
    table.innerHTML = "";
    newTableHead = document.createElement("thead");
    newTableHead.classList.add("table-head", "dynamic");
    tableHeaders = document.createElement("tr");
    tableHeaders.innerHTML = `<th>${funOption.toUpperCase()} DE ${valOption}</th><th colspan=${
      newColumns.length
    }>${colOption}</th>`;
    newTableHead.appendChild(tableHeaders);
    table.appendChild(newTableHead);

    // Construimos las columnas
    const columnHead = document.createElement("thead");
    columnHead.classList.add("table-head");
    const columnHeaders = document.createElement("tr");
    columnHeaders.innerHTML = `<th>${rowOption}</th>${newColumns
      .map((col) => `<th>${col}</th>`)
      .join("")}`;
    columnHead.appendChild(columnHeaders);
    table.appendChild(columnHead);

    //Utilizamos Set para eliminar valores repetidos
    const uniqueRows = new Set(datos.map((item) => item[rowOption]));
    const uniqueCols = new Set(datos.map((item) => item[colOption]));

    // var miArray = Array.from(uniqueRows);
    // console.log(miArray)

    // var miArrayCol = Array.from(uniqueCols);
    // console.log(miArrayCol)

    // console.log(groupedData)
    // // var miArray2 =  [];

    // Construimos el resto de las filas
    uniqueRows.forEach((newRow) => {
      const row = document.createElement("tr");
      row.innerHTML =
        `<td>${newRow}</td>` +
        newColumns
          .map((newCol) => {
            // Este Find() lo que hace es evaluar cada fila del Dataframe agrupado, como cada fila es un Array,
            // podemos consultar si la primera (valor a agrupar por fila) y segunda posicion (valor a agrupar por columna)
            // se encuentran dentro del Dataframe agrupado.
            const count = groupedData.find(
              (group) => group[0] === newRow && group[1] === newCol
            );
            // luego el valor en la posicion 2 nos da la cantidad que contamos en la linea 32
            return `<td>${count ? count[2].toFixed(1) : 0}</td>`;
          })
          .join("");
      table.appendChild(row);
    });

    //--------------------------------------------------------------

    // Obtener las categorías únicas para filas y columnas
    const uniqueRows1 = [...new Set(groupedData.map((item) => item[0]))];
    const uniqueCols1 = [...new Set(groupedData.map((item) => item[1]))];

    // Crear un objeto para organizar los datos en un formato para el gráfico
    const dataObj = {};
    uniqueCols1.forEach((col) => {
      dataObj[col] = uniqueRows1.map((row) => {
        const foundItem = groupedData.find(
          (item) => item[0] === row && item[1] === col
        );
        return foundItem ? foundItem[2] : 0;
      });
    });

    // Convertir el objeto en el formato esperado por Chart.js
    const datasets = Object.keys(dataObj).map((key) => ({
      label: key,
      data: dataObj[key],
    }));
    const ctx = document.getElementById("myChart");
    if (ctx) {
      ctx.remove();
    }
    const modalContenido =
      document.getElementsByClassName("modal-contenido")[0];
    const newChartCanvas = document.createElement("canvas");
    newChartCanvas.id = "myChart";
    modalContenido.appendChild(newChartCanvas);
    // Crear el gráfico de barras apiladas
    new Chart(document.getElementById("myChart"), {
      type: "bar",
      data: {
        labels: uniqueRows1,
        datasets: datasets,
      },
      options: {
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
    });

    //--------------------------------------------------------------
  } else if (colOption == "nada" && rowOption !== "nada") {
    btnGrafico.style.display = "block";
    groupedData = df
      .groupby([rowOption, colOption])
      .agg({ [valOption]: funOption }).values;

    // Utilizamos Set para eliminar valores repetidos
    const uniqueRows = new Set(datos.map((item) => item[rowOption]));
    const uniqueCols = new Set(datos.map((item) => item[colOption]));

    var miArray = Array.from(uniqueRows);
    var miArray2 = [];

    // Eliminamos el contenido anterior
    table.innerHTML = "";

    // Agregar la fila inicial con el nombre de la dimensión
    const dimensionRow = document.createElement("tr");
    dimensionRow.classList.add("table-head");

    dimensionRow.innerHTML = `<th>${rowOption}</th>${[...uniqueCols]
      .map((col) => `<th>${funOption.toUpperCase()} DE ${valOption}</th>`)
      .join("")}`;
    table.appendChild(dimensionRow);

    // Construimos las filas con los valores
    uniqueRows.forEach((newRow) => {
      const row = document.createElement("tr");
      row.innerHTML =
        `<td>${newRow}</td>` +
        [...uniqueCols]
          .map((newCol) => {
            const count = groupedData.find(
              (group) => group[0] === newRow && group[1] === newCol
            );
            miArray2.push(count[2].toFixed(1));
            return `<td>${count ? count[2].toFixed(1) : 0}</td>`;
          })
          .join("");

      table.appendChild(row);
    });

    createChart(miArray, miArray2, rowOption); //se crea el grafico
  } else if (colOption !== "nada" && rowOption == "nada") {
    btnGrafico.style.display = "block";
    groupedData = df
      .groupby([rowOption, colOption])
      .agg({ [valOption]: funOption }).values;
    const uniqueRows = new Set(datos.map((item) => item[rowOption]));
    const uniqueCols = new Set(datos.map((item) => item[colOption]));

    // Utilizamos Set para eliminar valores repetidos
    const newColumns = [...new Set(datos.map((item) => item[colOption]))];

    // Eliminamos el contenido anterior
    table.innerHTML = "";
    const newTableHead = document.createElement("thead");
    newTableHead.classList.add("table-head", "dynamic");
    const tableHeaders = document.createElement("tr");
    tableHeaders.innerHTML = `<th></th><th colspan=${newColumns.length}>${colOption}</th>`;
    newTableHead.appendChild(tableHeaders);
    table.appendChild(newTableHead);

    // Construimos las columnas
    const columnHead = document.createElement("thead");
    columnHead.classList.add("table-head");
    const nowColumns = ["", ...newColumns];
    const columnHeaders = document.createElement("tr");
    columnHeaders.innerHTML = `${nowColumns
      .map((col) => `<th>${col}</th>`)
      .join("")}`;
    columnHead.appendChild(columnHeaders);
    table.appendChild(columnHead);

    // Construimos las filas con los valores
    // uniqueRows[0] = `${funOption.toUpperCase()} DE ${valOption}`
    uniqueRows.forEach((newRow) => {
      console.log(newRow);
      const row = document.createElement("tr");
      row.innerHTML =
        `<td>${funOption.toUpperCase()} DE ${valOption}</td>` +
        [...uniqueCols]
          .map((newCol) => {
            const count = groupedData.find(
              (group) => group[0] === newRow && group[1] === newCol
            );
            return `<td>${count ? count[2].toFixed(1) : 0}</td>`;
          })
          .join("");
      // `<td>${funOption.toUpperCase()} DE ${valOption}</td>`
      table.appendChild(row);
      // console.log(uniqueRows)
    });

    //------------------------------------------------------
  }
}

// button.addEventListener("click", () => {
//   tableContainer.classList.toggle("active");
//   if (tableContainer.className.includes("active")) {
//     button.textContent = "Ocultar tabla";
//   } else {
//     button.textContent = "Mostrar tabla";
//   }
// });
optionsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.submitter.id == "aplicar") {
    updateTable();
  } else if (e.submitter.id == "reiniciar") {
    btnGrafico.style.display = "none";
    setTable();
    setOptions();
  } else if (e.submitter.id == "graficar") {
    const modal = document.querySelector("#modalGrafico");
    modal.style.display = "block";
    console.log("si");
  }
});
function modalOperation() {
  // Modal
  const modal = document.querySelector("#modalGrafico");
  const btnClose = document.getElementsByClassName("close")[0];
  btnClose.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

function createChart(miArray, miArray2, rowOption) {
  const ctx = document.getElementById("myChart");
  if (ctx) {
    ctx.remove();
  }
  const modalContenido = document.getElementsByClassName("modal-contenido")[0];
  const newChartCanvas = document.createElement("canvas");
  newChartCanvas.id = "myChart";
  modalContenido.appendChild(newChartCanvas);
  new Chart(newChartCanvas, {
    type: "bar",
    data: {
      labels: miArray,
      datasets: [
        {
          label: rowOption,
          data: miArray2,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function createStackedBarChart(miArray, miArray2, rowOption) {
  const ctx = document.getElementById("myChart");
  if (ctx) {
    ctx.remove();
  }

  const modalContenido = document.getElementsByClassName("modal-contenido")[0];
  const newChartCanvas = document.createElement("canvas");
  newChartCanvas.id = "myChart";
  modalContenido.appendChild(newChartCanvas);

  new Chart(newChartCanvas, {
    type: "bar",
    data: {
      labels: miArray, //fila
      datasets: [
        {
          label: rowOption,
          data: miArray2,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          stacked: true, // Apilar en el eje X
        },
        y: {
          stacked: true, // Apilar en el eje Y
        },
      },
    },
  });
}

(async function main() {
  await initializeDf();
  setTable();
  setOptions();
  modalOperation();
})();
