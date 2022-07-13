async function delayedGreeting(childItm, loadingElement) {
    var i = 0;
    while (i < 10){
    var newProduct = childItm[i].cloneNode(true);
    document.getElementById("ordersContainer").appendChild(newProduct);
    i++; 
    }
    if (childItm.length <= 100) {
        console.log('Cloning finished');
        loadingElement.style.display = 'block';
        await startCloning();
    } else {
        console.log('Cloned all the products');
    }
}

async function startCloning() {
    var itm = document.getElementById("ordersContainer");
    var childItm = itm.getElementsByClassName("a-section a-padding-small js-item");
    var loadingElement = itm.nextSibling.nextSibling;
    loadingElement.style.display = 'block';
    var refreshIntervalId = setTimeout(function(){
        console.log('Cloning started');
        loadingElement.style.display = 'none';
        delayedGreeting(childItm, loadingElement);
    }, 5000);
}

startCloning();