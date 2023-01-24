document.querySelectorAll('.prototype')
    .forEach((element) => {
        element.addEventListener('dragstart', pickup);
    });

const tabletop = document.getElementById('tabletop');
tabletop.addEventListener('dragenter', onDragEnter);
tabletop.addEventListener('dragover', onDragEnter);

tabletop.addEventListener('drop', onDrop, {capture: true});
loadTokens();

let syncInterval = setInterval(syncDirtyTokens, 1);

openWebSocket((body) => {
  body.updates.forEach(tokenFromProperties);
  body.deletes.forEach((id) => {
    const element = document.getElementById(id);
    element.parentElement.removeChild(element);
  });
});
