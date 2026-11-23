export function renderTable(
    table: HTMLTableElement,
    headers: string[],
    rows: (string | number)[][],
): void {
    table.replaceChildren();

    const thead = table.createTHead().insertRow();
    for (const header of headers) {
        const th = document.createElement("th");
        th.textContent = header;
        thead.appendChild(th);
    }

    const tbody = table.createTBody();
    for (const row of rows) {
        const tr = tbody.insertRow();
        for (const value of row) {
            tr.insertCell().textContent =
                typeof value === "number" ? value.toLocaleString("fi-FI") : value;
        }
    }
}