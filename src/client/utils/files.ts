export function csvToArray(str: string, delimiter = ",") {
    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        console.log({ values })
        const el = headers.reduce(function (object, header, index) {
            const cleanHeader = header?.replace(/\W/g, '')
            const cleanValue = values[index]?.replace(/\W/g, '');
            if (cleanHeader?.length && cleanValue?.length) {
                console.log({ cleanHeader, cleanValue })
                object[cleanHeader] = cleanValue
            }
            return object;
        }, {});
        return el;
    });

    // return the array
    return arr;
}