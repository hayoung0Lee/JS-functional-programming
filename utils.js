const drawConsole = (className) => {
    const element = document.getElementsByClassName(className);
    return function draw() {
        Array.prototype.slice.call(arguments).forEach((arg) => {
            const p = document.createElement('p');
            p.innerHTML = arg
            element[0].appendChild(p);
        })
    }
}